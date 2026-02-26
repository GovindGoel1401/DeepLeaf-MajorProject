from __future__ import annotations

from typing import Any, Dict

import httpx

from app.config import settings


async def fetch_weather(lat: float, lon: float) -> Dict[str, float]:
    """
    Fetch weather by latitude/longitude.

    Priority:
    1) OpenWeather (if OPENWEATHER_API_KEY set)
    2) WeatherAPI (if WEATHERAPI_KEY set)

    Returns:
        {
            "temperature": float,
            "humidity": float,
            "rainfall": float
        }
    """

    if settings.openweather_api_key:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": settings.openweather_api_key,
            "units": "metric",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        main = data.get("main", {})
        rain_data = data.get("rain", {}) or {}
        rainfall_mm = rain_data.get("1h") or rain_data.get("3h") or 0.0
        return {
            "temperature": float(main.get("temp", 0.0)),
            "humidity": float(main.get("humidity", 0.0)),
            "rainfall": float(rainfall_mm),
        }

    if settings.weatherapi_key:
        url = "http://api.weatherapi.com/v1/current.json"
        params = {
            "key": settings.weatherapi_key,
            "q": f"{lat},{lon}",
            "aqi": "no",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        current = data.get("current", {})
        return {
            "temperature": float(current.get("temp_c", 0.0)),
            "humidity": float(current.get("humidity", 0.0)),
            "rainfall": float(current.get("precip_mm", 0.0)),
        }

    return {
        "temperature": 30.0,
        "humidity": 80.0,
        "rainfall": 0.0,
    }


async def get_weather_for_location(location: str) -> Dict[str, Any]:
    """
    Backward-compatible weather call by city/location text.
    """

    if not settings.openweather_api_key and not settings.weatherapi_key:
        return {
            "location": location,
            "temperature": 30.0,
            "humidity": 80.0,
            "rainfall": 5.0,
        }

    if settings.openweather_api_key:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": location,
            "appid": settings.openweather_api_key,
            "units": "metric",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        main = data.get("main", {})
        rain_data = data.get("rain", {}) or {}
        rainfall_mm = rain_data.get("1h") or rain_data.get("3h") or 0.0
        return {
            "location": str((data.get("name") or location)),
            "temperature": float(main.get("temp", 0.0)),
            "humidity": float(main.get("humidity", 0.0)),
            "rainfall": float(rainfall_mm),
        }

    url = "http://api.weatherapi.com/v1/current.json"
    params = {
        "key": settings.weatherapi_key,
        "q": location,
        "aqi": "no",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)

    response.raise_for_status()
    data = response.json()

    current = data.get("current", {})
    loc = data.get("location", {})
    return {
        "location": str(loc.get("name", location)),
        "temperature": float(current.get("temp_c", 0.0)),
        "humidity": float(current.get("humidity", 0.0)),
        "rainfall": float(current.get("precip_mm", 0.0)),
    }
