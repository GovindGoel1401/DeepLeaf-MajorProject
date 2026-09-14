from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.graph_service import graph_service

router = APIRouter()


class RankDiseaseRequest(BaseModel):
    humidity: float = Field(..., ge=0.0, le=100.0)
    fertilizer: str = Field(default="")
    soil: str = Field(default="")
    cnn_prediction: str = Field(default="")
    symptoms: list[str] = Field(default_factory=list)


@router.post("/rank-disease")
async def rank_disease(payload: RankDiseaseRequest) -> Dict[str, Any]:
    return await graph_service.rank_diseases(
        humidity=payload.humidity,
        fertilizer=payload.fertilizer,
        soil=payload.soil,
        cnn_prediction=payload.cnn_prediction,
        symptoms=payload.symptoms,
    )
