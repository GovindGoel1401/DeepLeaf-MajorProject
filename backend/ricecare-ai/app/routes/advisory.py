from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.advisory_service import synthesize_advice

router = APIRouter()


class AdvisoryRequest(BaseModel):
    disease: str = Field(..., examples=["Brown Spot"])
    confidence: float = Field(..., ge=0.0, le=1.0, examples=[0.87])
    soil_type: str = Field(..., examples=["Clay"])
    location: str = Field(..., examples=["Bangalore"])
    temperature: float = Field(..., examples=[30.0])
    humidity: float = Field(..., ge=0.0, le=100.0, examples=[80.0])
    rainfall: float = Field(..., ge=0.0, examples=[5.0])
    user_query: str = Field(..., examples=["What should I do?"])


class AdvisoryResponse(BaseModel):
    predicted_disease: str
    model_confidence: float
    graph_insights: list
    environmental_risk: str
    rag_context: list
    final_advice: str
    confidence_score: float


@router.post("/", response_model=AdvisoryResponse)
async def create_advisory(payload: AdvisoryRequest) -> AdvisoryResponse:
    """
    Phase 2/3: structured advisory endpoint using mock Graph + RAG + LLM architecture.
    """

    try:
        result = synthesize_advice(
            disease=payload.disease,
            confidence=payload.confidence,
            soil_type=payload.soil_type,
            location=payload.location,
            temperature=payload.temperature,
            humidity=payload.humidity,
            rainfall=payload.rainfall,
            user_query=payload.user_query,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return AdvisoryResponse(**result)
