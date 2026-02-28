from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services.document_ingestion_service import index_pdf_document
from app.services.pipeline_service import pipeline_service
from app.services.rag_service import RagDocument, rag_service, retrieve_rag_context

router = APIRouter()


class IndexDoc(BaseModel):
    id: str
    text: str
    source: str | None = None


class IndexRequest(BaseModel):
    documents: list[IndexDoc] = Field(default_factory=list)


@router.post("/index-docs")
async def index_docs(payload: IndexRequest) -> Dict[str, Any]:
    docs = [RagDocument(id=d.id, text=d.text, source=d.source) for d in payload.documents]
    await rag_service.upsert_documents(docs)
    return {"status": "ok", "indexed": len(docs)}


@router.post("/index-pdf")
async def index_pdf(pdf_path: str = Form(...), source: str | None = Form(default=None)) -> Dict[str, Any]:
    return await index_pdf_document(pdf_path=pdf_path, source=source)


@router.post("/analyze")
async def analyze_pipeline(
    image: UploadFile = File(...),
    description: str = Form(...),
    soil: str | None = Form(default=None),
    fertilizer: str | None = Form(default=None),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
) -> Dict[str, Any]:
    """
    Full GraphRAG pipeline endpoint.

    Frontend FormData example:
        const form = new FormData();
        form.append("image", fileInput.files[0]);
        form.append("description", descriptionText);
        form.append("soil", soilValue || "");
        form.append("fertilizer", fertilizerValue || "");
        form.append("latitude", String(lat));
        form.append("longitude", String(lon));

        await fetch("/pipeline/analyze", {
          method: "POST",
          body: form,
        });

    CORS compatibility is handled globally in app/main.py via CORSMiddleware.
    """

    try:
        image_bytes = await image.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded image: {exc}") from exc

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    try:
        return await pipeline_service.analyze(
            image_bytes=image_bytes,
            filename=image.filename,
            description=description,
            soil=soil,
            fertilizer=fertilizer,
            latitude=latitude,
            longitude=longitude,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {exc}") from exc
