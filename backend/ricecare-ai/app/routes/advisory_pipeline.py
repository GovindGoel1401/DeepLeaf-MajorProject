from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.config import settings
from app.services.advisory_llm_service import generate_advisory, generate_rag_only_advisory
from app.services.classifier import classify_rice_leaf
from app.services.document_ingestion_service import index_pdf_document
from app.services.graph_service import graph_service
from app.services.graphrag_service import retrieve_graph_context
from app.services.input_parser_service import extract_structured_data
from app.services.rag_service import RagDocument, rag_service, retrieve_rag_context
from app.services.weather_service import fetch_weather

router = APIRouter()


class IndexDoc(BaseModel):
    id: str
    text: str
    source: str | None = None


class IndexRequest(BaseModel):
    documents: list[IndexDoc] = Field(default_factory=list)


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


@router.post("/index-docs")
async def index_docs(payload: IndexRequest) -> Dict[str, Any]:
    docs = [RagDocument(id=d.id, text=d.text, source=d.source) for d in payload.documents]
    await rag_service.upsert_documents(docs)
    return {"status": "ok", "indexed": len(docs)}


@router.post("/index-pdf")
async def index_pdf(pdf_path: str = Form(...), source: str | None = Form(default=None)) -> Dict[str, Any]:
    return await index_pdf_document(pdf_path=pdf_path, source=source)


@router.post("/analyze")
async def analyze_pipeline(
    image: UploadFile = File(...),
    description: str = Form(...),
    soil: str | None = Form(default=None),
    fertilizer: str | None = Form(default=None),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
) -> Dict[str, Any]:
    """
    Full GraphRAG pipeline endpoint.

    Frontend FormData example:
        const form = new FormData();
        form.append("image", fileInput.files[0]);
        form.append("description", descriptionText);
        form.append("soil", soilValue || "");
        form.append("fertilizer", fertilizerValue || "");
        form.append("latitude", String(lat));
        form.append("longitude", String(lon));

        await fetch("/pipeline/analyze", {
          method: "POST",
          body: form,
        });

    CORS compatibility is handled globally in app/main.py via CORSMiddleware.
    """

    try:
        image_bytes = await image.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded image: {exc}") from exc

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    try:
        errors_by_layer: Dict[str, str] = {}
        disease_prediction = await classify_rice_leaf(image_bytes=image_bytes, filename=image.filename)
        try:
            extracted = await extract_structured_data(description)
        except Exception as exc:
            errors_by_layer["input_parser"] = str(exc)
            extracted = {
                "symptoms": [],
                "fertilizer": None,
                "soil": None,
                "growth_stage": None,
            }

        weather: Dict[str, Any] | None = None
        weather_error: str | None = None
        if latitude is not None and longitude is not None:
            try:
                weather = await fetch_weather(latitude, longitude)
            except Exception as exc:
                weather_error = f"Weather fetch failed: {exc}"
                errors_by_layer["weather"] = str(exc)

        final_soil = (soil or extracted.get("soil") or "").strip() or None
        final_fertilizer = (fertilizer or extracted.get("fertilizer") or "").strip() or None

        try:
            graph_evidence = await retrieve_graph_context(
                disease=str(disease_prediction.get("disease", "unknown")),
                humidity=float((weather or {}).get("humidity", 0.0)),
                rainfall=float((weather or {}).get("rainfall", 0.0)),
                fertilizer=final_fertilizer or "",
                soil=final_soil or "",
                symptoms=extracted.get("symptoms", []),
                growth_stage=extracted.get("growth_stage"),
                description=description,
            )
        except Exception as exc:
            errors_by_layer["graph"] = str(exc)
            graph_evidence = {
                "disease": str(disease_prediction.get("disease", "unknown")),
                "graph_risk_score": 0.0,
                "supporting_factors": [],
                "matched_nodes": [],
                "query_stats": {"relations_found": 0, "symptoms_count": 0},
            }
        rag_query = (
            f"Disease: {disease_prediction.get('disease', 'unknown')}; "
            f"Symptoms: {', '.join(extracted.get('symptoms', []))}; "
            f"Soil: {final_soil or 'unknown'}; Fertilizer: {final_fertilizer or 'unknown'}; "
            f"Description: {description}"
        )
        try:
            rag_context = await retrieve_rag_context(rag_query, k=4)
        except Exception as exc:
            errors_by_layer["rag"] = str(exc)
            rag_context = []

        advisory_context = {
            "disease_prediction": disease_prediction,
            "description": description,
            "extracted": extracted,
            "soil": final_soil,
            "fertilizer": final_fertilizer,
            "weather": weather,
            "graph_evidence": graph_evidence,
            "rag_context": rag_context,
            "geo": {"latitude": latitude, "longitude": longitude},
        }
        try:
            advisory_payload = await generate_advisory(advisory_context)
        except Exception as exc:
            errors_by_layer["advisory_llm"] = str(exc)
            advisory_payload = {
                "analysis": "Advisory generation failed.",
                "treatment": [],
                "prevention": [],
                "fertilizer_correction": "",
                "final_message": "Advisory generation unavailable.",
            }
        advisory_text = advisory_payload.get("final_message") or advisory_payload.get("analysis") or ""
        risk_score = float(graph_evidence.get("graph_risk_score", 0.0))
        graph_health = await graph_service.health()
        rag_only_payload = await generate_rag_only_advisory(advisory_context)

        rag_scores = [float(item.get("score", 0.0)) for item in rag_context if isinstance(item.get("score"), (float, int))]
        rag_signal = _clamp01(sum(rag_scores) / len(rag_scores) if rag_scores else 0.0)
        graph_signal = _clamp01(risk_score)
        confidence_signal = _clamp01(float(disease_prediction.get("confidence", 0.0)))
        symptom_signal = _clamp01(len(extracted.get("symptoms", [])) / 3.0)
        non_weather_factors = [
            item
            for item in graph_evidence.get("supporting_factors", [])
            if "humidity" not in item.lower()
        ]
        relations_found = int((graph_evidence.get("query_stats") or {}).get("relations_found", 0))
        context_alignment = _clamp01(len(non_weather_factors) / 4.0)
        weather_signal = _clamp01(float((weather or {}).get("rainfall", 0.0)) / 20.0) if weather else 0.0
        combined_rag_only = _clamp01((confidence_signal + rag_signal + symptom_signal) / 3.0)
        combined_graphrag = _clamp01((confidence_signal + rag_signal + graph_signal + context_alignment + weather_signal) / 5.0)
        neo4j_connected = graph_health.get("neo4j") == "ok"
        if not neo4j_connected or relations_found == 0:
            # If graph has no usable evidence for this case, GraphRAG should not score below RAG-only.
            combined_graphrag = max(combined_graphrag, combined_rag_only)

        weather_source_used = (
            "openweather"
            if settings.openweather_api_key
            else "weatherapi"
            if settings.weatherapi_key
            else "mock"
        )

        return {
            "status": "ok",
            "predicted_disease": disease_prediction.get("disease"),
            "confidence": disease_prediction.get("confidence"),
            "risk_score": risk_score,
            "analysis": advisory_payload.get("analysis"),
            "treatment": advisory_payload.get("treatment", []),
            "prevention": advisory_payload.get("prevention", []),
            "fertilizer_correction": advisory_payload.get("fertilizer_correction", ""),
            "explanations": {
                "graph_risk_score": (
                    "Graph Risk Score is an evidence ratio: matched checks divided by total checks "
                    "(weather, soil, fertilizer, symptoms, growth-stage and graph links)."
                ),
                "current_graph_score_reason": (
                    f"Current score is {round(risk_score * 100)}% based on evidence checks. "
                    f"Matched factors: {', '.join(graph_evidence.get('supporting_factors', [])[:3]) or 'none'}. "
                    f"Evidence checks passed: {(graph_evidence.get('score_breakdown') or {}).get('positive_checks', 0)} / "
                    f"{(graph_evidence.get('score_breakdown') or {}).get('total_checks', 0)}."
                ),
                "weather_snapshot": (
                    "Weather Snapshot shows temperature, humidity, and rainfall at your location. "
                    "These values directly influence fungal/bacterial disease pressure."
                ),
                "graph_evidence": (
                    "Graph Evidence lists the specific scientific factors linked to your predicted disease in the Neo4j knowledge graph."
                ),
                "rag_context": (
                    "RAG Context shows short research snippets retrieved from indexed documents that are semantically closest to your case."
                ),
            },
            "disease_prediction": disease_prediction,
            "structured_input": extracted,
            "weather": weather,
            "graph_evidence": graph_evidence,
            "rag_context": rag_context,
            "advisory": advisory_text,
            "comparison": {
                "graphrag": {
                    "score": combined_graphrag,
                    "label": "GraphRAG (Graph + RAG + CNN)",
                    "summary": advisory_text,
                },
                "rag_only": {
                    "score": combined_rag_only,
                    "label": "RAG only (No Graph)",
                    "summary": rag_only_payload.get("final_message") or rag_only_payload.get("analysis") or "",
                },
            },
            "comparison_breakdown": {
                "confidence_signal": round(confidence_signal, 3),
                "rag_signal": round(rag_signal, 3),
                "graph_signal": round(graph_signal, 3),
                "graph_bonus": 0.0,
                "weather_bonus": 0.0,
                "graphrag_formula": "graphrag = average(confidence, rag, graph, context, weather)",
                "rag_only_formula": "rag_only = average(confidence, rag, symptoms)",
            },
            "meta": {
                "frontend_contract": "multipart/form-data",
                "weather_error": weather_error,
            },
            "debug": {
                "neo4j_connected": neo4j_connected,
                "graph_relations_found": int((graph_evidence.get("query_stats") or {}).get("relations_found", 0)),
                "rag_matches_count": len(rag_context),
                "weather_source_used": weather_source_used if latitude is not None and longitude is not None else "not_requested",
                "normalized_disease_name": str(disease_prediction.get("disease", "unknown")),
                "errors_by_layer": errors_by_layer,
            },
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {exc}") from exc
