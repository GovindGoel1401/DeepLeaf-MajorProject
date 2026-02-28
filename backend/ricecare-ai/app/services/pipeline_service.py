from __future__ import annotations

from typing import Any, Dict, List

from app.services.advisory_llm_service import generate_advisory, generate_rag_only_advisory
from app.services.classifier import classify_rice_leaf
from app.services.crag_service import crag_service
from app.services.graph_service import graph_service
from app.services.input_parser_service import extract_structured_data
from app.services.rag_service import retrieve_rag_context
from app.services.weather_service import fetch_weather


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _normalize_vector_similarity(items: List[Dict[str, Any]]) -> float:
    scores = [float(item.get("score", 0.0)) for item in items if isinstance(item.get("score"), (float, int))]
    if not scores:
        return 0.0
    raw = sum(scores) / len(scores)
    if raw > 1.0:
        # Distance-like value fallback (e.g. chroma distance): convert to similarity.
        raw = 1.0 / (1.0 + raw)
    return _clamp01(raw)


class PipelineService:
    async def analyze(
        self,
        *,
        image_bytes: bytes,
        filename: str | None,
        description: str,
        soil: str | None = None,
        fertilizer: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
    ) -> Dict[str, Any]:
        errors_by_layer: Dict[str, str] = {}

        disease_prediction = await classify_rice_leaf(image_bytes=image_bytes, filename=filename)
        cnn_prediction = str(disease_prediction.get("disease", "unknown"))
        cnn_confidence = float(disease_prediction.get("confidence", 0.0))

        try:
            extracted = await extract_structured_data(description)
        except Exception as exc:
            errors_by_layer["input_parser"] = str(exc)
            extracted = {"symptoms": [], "fertilizer": None, "soil": None, "growth_stage": None}

        weather: Dict[str, Any] | None = None
        weather_error: str | None = None
        if latitude is not None and longitude is not None:
            try:
                weather = await fetch_weather(latitude, longitude)
            except Exception as exc:
                weather_error = str(exc)
                errors_by_layer["weather"] = str(exc)

        final_soil = (soil or extracted.get("soil") or "").strip() or None
        final_fertilizer = (fertilizer or extracted.get("fertilizer") or "").strip() or None

        humidity = float((weather or {}).get("humidity", 0.0))
        try:
            graph_rank_result = await graph_service.rank_diseases(
                humidity=humidity,
                fertilizer=final_fertilizer or "",
                soil=final_soil or "",
                cnn_prediction=cnn_prediction,
            )
        except Exception as exc:
            errors_by_layer["graph_rank"] = str(exc)
            graph_rank_result = {"ranking": [], "top_disease": cnn_prediction}

        disease_ranking = graph_rank_result.get("ranking", [])
        top_graph_disease = str(graph_rank_result.get("top_disease") or cnn_prediction)
        top_entry = disease_ranking[0] if disease_ranking else {"disease": top_graph_disease, "score": 0.0, "evidence": []}
        graph_score = float(top_entry.get("score", 0.0))
        explainable_evidence = top_entry.get("evidence", [])

        try:
            matched_nodes = await graph_service.get_disease_relations(top_graph_disease, limit=40)
        except Exception as exc:
            errors_by_layer["graph_relations"] = str(exc)
            matched_nodes = []

        graph_evidence = {
            "disease": top_graph_disease,
            "graph_risk_score": round(_clamp01(graph_score), 4),
            "supporting_factors": [
                f"{item.get('factor')} (impact={item.get('impact')})"
                for item in explainable_evidence
                if float(item.get("impact", 0.0)) > 0
            ],
            "matched_nodes": [{"relation": node.relation, "target": node.target} for node in matched_nodes],
            "query_stats": {"relations_found": len(matched_nodes), "symptoms_count": len(extracted.get("symptoms", []))},
            "explainable_evidence": explainable_evidence,
        }

        rag_query = (
            f"CNN disease: {cnn_prediction}; Graph top disease: {top_graph_disease}; "
            f"Soil: {final_soil or 'unknown'}; Fertilizer: {final_fertilizer or 'unknown'}; "
            f"Description: {description}"
        )
        try:
            rag_context = await retrieve_rag_context(rag_query, k=4)
        except Exception as exc:
            errors_by_layer["rag"] = str(exc)
            rag_context = []
        vector_similarity = _normalize_vector_similarity(rag_context)

        crag = await crag_service.evaluate(
            cnn_confidence=cnn_confidence,
            graph_score=graph_score,
            vector_similarity=vector_similarity,
            top_graph_disease=top_graph_disease,
            cnn_prediction=cnn_prediction,
        )
        final_confidence = float(crag.get("final_confidence", 0.0))
        confidence_level = str(crag.get("confidence_level", "medium"))

        advisory_context = {
            "disease_prediction": disease_prediction,
            "description": description,
            "extracted": extracted,
            "soil": final_soil,
            "fertilizer": final_fertilizer,
            "weather": weather,
            "graph_evidence": graph_evidence,
            "rag_context": rag_context,
            "disease_ranking": disease_ranking,
            "confidence_index": final_confidence,
            "advisory_mode": confidence_level,
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

        rag_only_payload = await generate_rag_only_advisory(advisory_context)
        advisory_text = advisory_payload.get("final_message") or advisory_payload.get("analysis") or ""

        comparison_metrics = {
            "cnn_confidence": round(_clamp01(cnn_confidence), 4),
            "graph_score": round(_clamp01(graph_score), 4),
            "vector_similarity": round(_clamp01(vector_similarity), 4),
            "hybrid_score": round(_clamp01(final_confidence), 4),
        }

        graph_health = await graph_service.health()
        neo4j_connected = graph_health.get("neo4j") == "ok"

        return {
            "status": "ok",
            "predicted_disease": cnn_prediction,
            "confidence": cnn_confidence,
            "risk_score": graph_score,
            "analysis": advisory_payload.get("analysis"),
            "treatment": advisory_payload.get("treatment", []),
            "prevention": advisory_payload.get("prevention", []),
            "fertilizer_correction": advisory_payload.get("fertilizer_correction", ""),
            "advisory": advisory_text,
            "final_advisory": advisory_text,
            "disease_prediction": disease_prediction,
            "disease_ranking": disease_ranking,
            "graph_evidence": graph_evidence,
            "vector_context": rag_context,
            "rag_context": rag_context,
            "structured_input": extracted,
            "weather": weather,
            "comparison_metrics": comparison_metrics,
            "confidence_evaluation": {
                "final_confidence": round(_clamp01(final_confidence), 4),
                "confidence_level": confidence_level,
                "penalties_applied": crag.get("penalties_applied", []),
            },
            # Backward compatibility with existing frontend while using structured metrics.
            "comparison": {
                "graphrag": {
                    "score": comparison_metrics["hybrid_score"],
                    "label": "Hybrid (CNN + Graph + Vector + C-RAG)",
                    "summary": advisory_text,
                },
                "rag_only": {
                    "score": comparison_metrics["vector_similarity"],
                    "label": "Vector RAG only",
                    "summary": rag_only_payload.get("final_message") or rag_only_payload.get("analysis") or "",
                },
            },
            "comparison_breakdown": {
                "confidence_signal": comparison_metrics["cnn_confidence"],
                "rag_signal": comparison_metrics["vector_similarity"],
                "graph_signal": comparison_metrics["graph_score"],
                "graph_bonus": 0.0,
                "weather_bonus": 0.0,
                "graphrag_formula": "hybrid_score = C-RAG(cnn, graph, vector) - penalties",
                "rag_only_formula": "rag_only = vector_similarity",
            },
            "meta": {"frontend_contract": "multipart/form-data", "weather_error": weather_error},
            "debug": {
                "neo4j_connected": neo4j_connected,
                "graph_relations_found": int((graph_evidence.get("query_stats") or {}).get("relations_found", 0)),
                "rag_matches_count": len(rag_context),
                "normalized_disease_name": cnn_prediction,
                "errors_by_layer": errors_by_layer,
            },
            "explanations": {
                "graph_risk_score": "Weighted GraphRAG score from base risk and factor impacts.",
                "current_graph_score_reason": f"Top graph disease: {top_graph_disease} with score {round(graph_score * 100)}%.",
                "weather_snapshot": "Weather contributes through humidity_match.",
                "graph_evidence": "Each factor includes value, weight and impact contribution.",
                "rag_context": "Vector context is semantic retrieval from indexed documents.",
            },
        }


pipeline_service = PipelineService()
