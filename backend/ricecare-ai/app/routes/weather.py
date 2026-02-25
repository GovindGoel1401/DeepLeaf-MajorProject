from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.weather_service import get_weather_for_location

router = APIRouter()


class WeatherRequest(BaseModel):
    location: str = Field(..., examples=["Bangalore"])


class WeatherResponse(BaseModel):
    location: str
    temperature: float = Field(..., description="Temperature in °C", examples=[30.0])
    humidity: float = Field(..., description="Relative humidity in %", examples=[80.0])
    rainfall: float = Field(..., description="Rainfall in mm for last 1–3h", examples=[5.0])


@router.post("/", response_model=WeatherResponse)
async def get_weather(payload: WeatherRequest) -> WeatherResponse:
    """
    Phase 3: real weather integration using OpenWeather.
    """

    try:
        data = await get_weather_for_location(location=payload.location)
    except Exception as exc:
        # Keep this basic for now; can expand into structured error responses later.
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return WeatherResponse(**data)
