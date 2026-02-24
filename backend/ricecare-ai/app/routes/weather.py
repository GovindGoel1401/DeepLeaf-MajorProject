from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_weather(location: str = "default"):
    return {"location": location, "status": "Weather service stub"}
