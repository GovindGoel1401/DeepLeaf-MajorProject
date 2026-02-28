from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.advisory_service import synthesize_advice
from app.services.crag_service import crag_service
from app.services.graph_service import graph_service

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
    disease_ranking: list = Field(default_factory=list)
    comparison_metrics: dict = Field(default_factory=dict)
    confidence_index: float = 0.0
    advisory_mode: str = "medium_confidence"


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
        ranking = await graph_service.rank_diseases(
            humidity=payload.humidity,
            fertilizer="",
            soil=payload.soil_type,
            cnn_prediction=payload.disease,
        )
        ranking_list = ranking.get("ranking", [])
        top_graph_score = float((ranking_list[0] if ranking_list else {}).get("score", 0.0))
        crag = await crag_service.evaluate(
            cnn_confidence=payload.confidence,
            graph_score=top_graph_score,
            vector_similarity=0.5,
            cnn_prediction=payload.disease,
            top_graph_disease=str(ranking.get("top_disease") or payload.disease),
        )
        result["disease_ranking"] = ranking_list
        result["comparison_metrics"] = {
            "cnn_confidence": payload.confidence,
            "graph_score": top_graph_score,
            "vector_similarity": 0.5,
            "hybrid_score": crag.get("final_confidence", 0.0),
        }
        result["confidence_index"] = crag.get("final_confidence", 0.0)
        result["advisory_mode"] = crag.get("confidence_level", "medium")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return AdvisoryResponse(**result)
