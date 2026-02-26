from fastapi import APIRouter
from app.services.graph_service import graph_service

router = APIRouter()

@router.post("/rank-disease")
async def rank_disease(data: dict):
    result = await graph_service.rank_diseases(
        humidity=data.get("humidity"),
        fertilizer=data.get("fertilizer"),
        soil=data.get("soil"),
    )
    return result