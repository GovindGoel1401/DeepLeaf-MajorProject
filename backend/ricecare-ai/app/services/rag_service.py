from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, List, Sequence

import httpx

from app.config import settings


@dataclass(frozen=True)
class RagDocument:
    id: str
    text: str
    source: str | None = None
    score: float | None = None


class RagService:
    def __init__(self) -> None:
        self._pinecone_client = None
        self._pinecone_index = None
        self._chroma_client = None
        self._chroma_collection = None

    async def _embed_text(self, text: str, task_type: str = "RETRIEVAL_QUERY") -> List[float]:
        api_key = settings.gemini_api_key or settings.google_api_key
        if not api_key:
            raise RuntimeError("GEMINI/GOOGLE API key missing for embeddings")

        model_name = settings.gemini_embedding_model or "models/gemini-embedding-001"
        if "/" not in model_name:
            model_name = f"models/{model_name}"

        url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:embedContent"
        payload = {
            "model": model_name,
            "content": {"parts": [{"text": text}]},
            "taskType": task_type,
            "outputDimensionality": settings.pinecone_dimension,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, params={"key": api_key}, json=payload)
            response.raise_for_status()
            data = response.json()

        values = (((data or {}).get("embedding") or {}).get("values")) or []
        return [float(v) for v in values]

    def _ensure_pinecone(self):
        if self._pinecone_index is not None:
            return self._pinecone_index

        if not settings.pinecone_api_key:
            raise RuntimeError("PINECONE_API_KEY is not configured")

        from pinecone import Pinecone

        self._pinecone_client = Pinecone(api_key=settings.pinecone_api_key)
        self._pinecone_index = self._pinecone_client.Index(settings.pinecone_index_name)
        return self._pinecone_index

    def _ensure_chroma(self):
        if self._chroma_collection is not None:
            return self._chroma_collection

        import chromadb

        self._chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        self._chroma_collection = self._chroma_client.get_or_create_collection(name=settings.chroma_collection)
        return self._chroma_collection

    async def upsert_documents(self, docs: Sequence[RagDocument]) -> None:
        backend = settings.vector_db_backend.lower().strip()
        if not docs:
            return

        if backend == "pinecone":
            index = self._ensure_pinecone()
            vectors = []
            for doc in docs:
                emb = await self._embed_text(doc.text, task_type="RETRIEVAL_DOCUMENT")
                vectors.append(
                    {
                        "id": doc.id,
                        "values": emb,
                        "metadata": {"text": doc.text, "source": doc.source or "unknown"},
                    }
                )

            await asyncio.to_thread(
                index.upsert,
                vectors=vectors,
                namespace=settings.pinecone_namespace,
            )
            return

        collection = self._ensure_chroma()
        ids = [d.id for d in docs]
        texts = [d.text for d in docs]
        metas = [{"source": d.source} if d.source else {} for d in docs]
        embeddings = [await self._embed_text(text, task_type="RETRIEVAL_DOCUMENT") for text in texts]
        collection.upsert(ids=ids, documents=texts, metadatas=metas, embeddings=embeddings)

    async def retrieve(self, query: str, k: int = 4) -> List[RagDocument]:
        backend = settings.vector_db_backend.lower().strip()

        if backend == "pinecone":
            index = self._ensure_pinecone()
            query_embedding = await self._embed_text(query, task_type="RETRIEVAL_QUERY")

            def _query():
                return index.query(
                    vector=query_embedding,
                    top_k=k,
                    include_metadata=True,
                    namespace=settings.pinecone_namespace,
                )

            result = await asyncio.to_thread(_query)
            matches = getattr(result, "matches", None) or result.get("matches", [])

            docs: List[RagDocument] = []
            for item in matches:
                metadata = getattr(item, "metadata", None) or item.get("metadata", {}) or {}
                docs.append(
                    RagDocument(
                        id=str(getattr(item, "id", None) or item.get("id", "unknown")),
                        text=str(metadata.get("text", "")),
                        source=str(metadata.get("source", "unknown")),
                        score=float(getattr(item, "score", None) or item.get("score", 0.0)),
                    )
                )
            return docs

        collection = self._ensure_chroma()
        query_embedding = await self._embed_text(query, task_type="RETRIEVAL_QUERY")
        res = collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            include=["documents", "metadatas", "distances"],
        )

        out: List[RagDocument] = []
        ids = (res.get("ids") or [[]])[0]
        documents = (res.get("documents") or [[]])[0]
        metadatas = (res.get("metadatas") or [[]])[0]
        distances = (res.get("distances") or [[]])[0]

        for i, doc_text in enumerate(documents):
            meta = metadatas[i] if i < len(metadatas) and metadatas[i] else {}
            score = float(distances[i]) if i < len(distances) else None
            out.append(
                RagDocument(
                    id=ids[i] if i < len(ids) else f"doc_{i}",
                    text=doc_text,
                    source=meta.get("source"),
                    score=score,
                )
            )

        return out


rag_service = RagService()


def _compact_text(text: str, max_chars: int = 240) -> str:
    clean = " ".join((text or "").split())
    if len(clean) <= max_chars:
        return clean

    # Prefer a sentence-like cutoff.
    cutoff = clean.rfind(".", 0, max_chars)
    if cutoff > 80:
        return clean[: cutoff + 1]
    return clean[:max_chars].rstrip() + "..."


def _is_readable(text: str) -> bool:
    tokens = [t for t in text.split() if t]
    if not tokens:
        return False
    avg_len = sum(len(t) for t in tokens) / len(tokens)
    # Filter out OCR-like noise with extremely long merged tokens.
    return avg_len <= 14


async def retrieve_rag_context(query: str, k: int = 4) -> List[Dict[str, Any]]:
    try:
        docs = await rag_service.retrieve(query=query, k=k)
    except Exception:
        return []

    filtered = [doc for doc in docs if _is_readable(doc.text)]
    selected = filtered[:3] if filtered else docs[:2]

    return [
        {
            "id": doc.id,
            "text": _compact_text(doc.text, max_chars=240),
            "source": doc.source,
            "score": doc.score,
        }
        for doc in selected
    ]
