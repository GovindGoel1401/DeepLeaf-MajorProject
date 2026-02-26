from __future__ import annotations

from pathlib import Path
from typing import List

from pypdf import PdfReader

from app.services.rag_service import RagDocument, rag_service


def _chunk_text(text: str, chunk_size: int = 900, overlap: int = 120) -> List[str]:
    cleaned = " ".join(text.split())
    if not cleaned:
        return []

    chunks: List[str] = []
    start = 0
    step = max(1, chunk_size - overlap)

    while start < len(cleaned):
        end = min(len(cleaned), start + chunk_size)
        chunks.append(cleaned[start:end])
        if end == len(cleaned):
            break
        start += step

    return chunks


def _extract_pdf_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()


async def index_pdf_document(pdf_path: str, source: str | None = None) -> dict:
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {path}")

    text = _extract_pdf_text(path)
    chunks = _chunk_text(text)
    docs = [
        RagDocument(
            id=f"{path.stem}-chunk-{idx}",
            text=chunk,
            source=source or path.name,
        )
        for idx, chunk in enumerate(chunks, start=1)
    ]

    await rag_service.upsert_documents(docs)

    return {
        "status": "ok",
        "pdf": str(path),
        "chunks_indexed": len(docs),
    }
