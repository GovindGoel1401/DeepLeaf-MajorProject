from __future__ import annotations

import logging
from importlib import import_module
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.routes.advisory import router as advisory_router
from app.routes.upload import router as upload_router
from app.routes.risky import router as risky_router
from app.routes.weather import router as weather_router
from app.services.graph_service import graph_service
from app.services.rag_service import rag_service


class HealthResponse(BaseModel):
    status: str
    services: dict[str, Any]


app = FastAPI(title="RiceCare AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/upload", tags=["upload"])
app.include_router(weather_router, prefix="/weather", tags=["weather"])
app.include_router(advisory_router, prefix="/advisory", tags=["advisory"])
app.include_router(risky_router, prefix="/risk", tags=["risk"])


def _include_optional_pipeline_router() -> None:
    """
    Keep app bootable even if pipeline dependencies are missing/broken.
    """
    logger = logging.getLogger("uvicorn.error")
    try:
        pipeline_module = import_module("app.routes.advisory_pipeline")
        app.include_router(pipeline_module.router, prefix="/pipeline", tags=["pipeline"])
    except Exception as exc:  # pragma: no cover
        logger.warning("Pipeline router disabled due to import error: %s", exc)


_include_optional_pipeline_router()


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    graph_health = await graph_service.health()
    rag_health = await rag_service.health()
    services_ready = graph_health.get("neo4j") == "ok" and rag_health.get("rag") in {"ok", "degraded"}
    return HealthResponse(
        status="running",
        services={
            "graph": graph_health,
            "rag": rag_health,
            "ready": services_ready,
        },
    )


@app.on_event("startup")
async def startup() -> None:
    try:
        await graph_service.connect()
    except Exception as e:
        logging.getLogger("uvicorn.error").warning(
            "Neo4j unavailable (app will run without graph): %s", e
        )


@app.on_event("shutdown")
async def shutdown() -> None:
    await graph_service.close()
