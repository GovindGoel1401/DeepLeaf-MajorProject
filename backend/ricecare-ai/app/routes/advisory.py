from fastapi import APIRouter

from app.services.rag_service import generate_advisory

router = APIRouter()


@router.get("/")
def advisory(query: str):
    return {"query": query, "advisory": generate_advisory(query)}
