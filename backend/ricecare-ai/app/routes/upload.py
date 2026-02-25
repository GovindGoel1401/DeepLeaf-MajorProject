from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services.classifier import classify_rice_leaf

router = APIRouter()


class UploadResponse(BaseModel):
    disease: str = Field(..., examples=["Brown Spot"])
    confidence: float = Field(..., ge=0.0, le=1.0, examples=[0.87])


@router.post("/", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)) -> UploadResponse:
    """
    Phase 1: dummy classification response.
    Phase 2: read bytes and run the PyTorch model.
    """

    try:
        image_bytes = await file.read()
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {e}") from e

    result = await classify_rice_leaf(image_bytes=image_bytes, filename=file.filename)
    return UploadResponse(**result)
