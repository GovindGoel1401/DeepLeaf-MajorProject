from __future__ import annotations

import json
from typing import Any, Dict

from app.config import settings
from app.services.gemini_client import generate_text


def _extract_json(raw: str) -> Dict[str, Any]:
    candidate = raw.strip()
    if candidate.startswith("```"):
        candidate = candidate.strip("`")
        if candidate.lower().startswith("json"):
            candidate = candidate[4:].strip()
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = candidate[start : end + 1]
    parsed = json.loads(candidate)
    if not isinstance(parsed, dict):
        raise ValueError("LLM output is not a JSON object")
    return parsed


def _deterministic_fallback(context: Dict[str, Any], *, mode: str) -> Dict[str, Any]:
    disease = context.get("disease_prediction", {})
    weather = context.get("weather", {}) or {}
    graph_evidence = context.get("graph_evidence", {}) or {}
    extracted = context.get("extracted", {}) or {}
    ranking = context.get("disease_ranking", []) if isinstance(context.get("disease_ranking"), list) else []
    confidence_index = float(context.get("confidence_index", 0.0) or 0.0)
    advisory_mode = str(context.get("advisory_mode") or "medium_confidence")

    disease_name = str(disease.get("disease", "unknown"))
    conf = float(disease.get("confidence", 0.0))
    humidity = weather.get("humidity")
    temp = weather.get("temperature")
    rainfall = weather.get("rainfall")
    factors = graph_evidence.get("supporting_factors", []) if isinstance(graph_evidence, dict) else []
    symptoms = extracted.get("symptoms", []) if isinstance(extracted, dict) else []
    growth_stage = extracted.get("growth_stage") if isinstance(extracted, dict) else None
    score_breakdown = graph_evidence.get("score_breakdown", {}) if isinstance(graph_evidence, dict) else {}
    humidity_flag = bool(score_breakdown.get("humidity_flag", False))
    airflow_component = 1.0 if any("airflow" in str(f).lower() or "canopy" in str(f).lower() for f in factors) else 0.0
    stage_component = 1.0 if growth_stage else 0.0

    drivers = []
    if stage_component and growth_stage:
        drivers.append(f"growth stage ({growth_stage})")
    if airflow_component:
        drivers.append("dense canopy / poor airflow")
    if humidity_flag:
        drivers.append("humidity")
    if not drivers:
        drivers.append("visible symptom pattern")

    analysis = (
        f"Predicted disease is {disease_name} with model confidence {round(conf * 100)}%. "
        f"Top graph rank: {ranking[0].get('disease') if ranking else disease_name}. "
        f"Confidence index: {round(confidence_index * 100)}% ({advisory_mode}). "
        f"Observed symptoms: {', '.join(symptoms) if symptoms else 'not clearly extracted'}. "
        f"Weather around field is temperature {temp}, humidity {humidity}, rainfall {rainfall}. "
        f"{'Graph matches found: ' + ', '.join(factors[:3]) + '.' if factors else 'Graph matches are limited in current query.'} "
        f"Primary risk drivers in this case: {', '.join(drivers)}. "
        f"Reasoning mode: {'GraphRAG' if mode == 'graphrag' else 'RAG-only'}."
    )

    treatment = [
        "Remove and destroy heavily infected leaves outside the field.",
        "Avoid standing water and improve drainage to reduce humidity around canopy.",
        "Avoid excess nitrogen for the next 7-10 days; keep nutrition balanced.",
        "Spray only locally recommended fungicide/bactericide if spread continues.",
        "Monitor 20 random plants daily and record new lesions.",
    ]
    prevention = [
        "Use certified seed and resistant variety in next planting cycle.",
        "Maintain proper plant spacing for airflow.",
        "Practice residue management and field sanitation after harvest.",
        "Follow balanced NPK schedule; avoid heavy late nitrogen top-dressing.",
        "Use weather-based scouting after high humidity/rain periods.",
    ]
    if airflow_component > 0 or stage_component > 0:
        final_message = (
            f"Your crop likely has {disease_name}. In this case, field structure and crop stage are key drivers, not only weather. "
            "Because canopy is dense and airflow is restricted, disease can persist locally even without heavy rainfall. "
            "Open canopy conditions where possible, remove infected leaves, and keep plant nutrition balanced without excess nitrogen. "
            "During current growth stage, scout every 2-3 days and isolate patches where lesion count is increasing. "
            "Use only approved local products and dose schedules. If spread continues after 3-5 days, get field-level confirmation."
        )
    elif humidity_flag:
        final_message = (
            f"Your crop likely has {disease_name}. Immediate focus should be moisture control, sanitation, and balanced nutrition. "
            f"Humidity ({humidity}%) is contributing to disease pressure in your field conditions. "
            "Inspect plants every 2-3 days, avoid excess nitrogen at this stage, and apply only approved products as per local guidance. "
            "If lesions increase after 3-5 days, escalate to a local agronomist for field verification."
        )
    else:
        final_message = (
            f"Your crop likely has {disease_name}. Current risk appears to be driven mainly by symptom pattern and crop management context. "
            "Prioritize sanitation, balanced nutrition, and close scouting over the next week. "
            "Apply treatment only where disease is actively spreading and follow local extension recommendations."
        )

    return {
        "analysis": analysis,
        "treatment": treatment,
        "prevention": prevention,
        "fertilizer_correction": "Pause extra nitrogen for a week; restore balance with potassium support as advised locally.",
        "final_message": final_message,
    }


async def generate_advisory(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate structured farmer-friendly advisory from unified context.
    """

    disease = context.get("disease_prediction", {})
    weather = context.get("weather", {})
    graph_evidence = context.get("graph_evidence", {})
    rag_context = context.get("rag_context", [])
    extracted = context.get("extracted", {})
    disease_ranking = context.get("disease_ranking", [])
    confidence_index = context.get("confidence_index", 0.0)
    advisory_mode = context.get("advisory_mode", "medium_confidence")

    prompt = (
        "You are an expert rice disease advisory assistant.\n"
        "Use only the provided evidence. Do NOT change the predicted disease label.\n"
        "Explain clearly for farmers and avoid generic one-line advice.\n"
        "If confidence is low, explicitly recommend field verification.\n"
        "Return ONLY valid JSON (no markdown) using this schema:\n"
        "{\n"
        "  \"analysis\": string,\n"
        "  \"treatment\": [string],\n"
        "  \"prevention\": [string],\n"
        "  \"fertilizer_correction\": string,\n"
        "  \"final_message\": string\n"
        "}\n\n"
        "Rules:\n"
        "- treatment must contain at least 5 concrete actions\n"
        "- prevention must contain at least 5 concrete actions\n"
        "- analysis must explain why risk is high/medium/low using weather + graph + symptoms\n"
        "- final_message must be 120-220 words, practical and farmer-friendly\n\n"
        f"Advisory confidence mode: {advisory_mode}\n"
        f"Confidence index: {confidence_index}\n"
        f"Disease prediction: {json.dumps(disease, ensure_ascii=False)}\n"
        f"Disease ranking: {json.dumps(disease_ranking, ensure_ascii=False)}\n"
        f"Graph evidence: {json.dumps(graph_evidence, ensure_ascii=False)}\n"
        f"RAG context: {json.dumps(rag_context, ensure_ascii=False)}\n"
        f"Weather: {json.dumps(weather, ensure_ascii=False)}\n"
        f"Soil: {context.get('soil')}\n"
        f"Fertilizer: {context.get('fertilizer')}\n"
        f"Symptoms: {json.dumps(extracted.get('symptoms', []), ensure_ascii=False)}\n"
        f"Farmer description: {context.get('description')}"
    )

    api_key = settings.gemini_api_key or settings.google_api_key
    if not api_key:
        return _deterministic_fallback(context, mode="graphrag")

    try:
        raw = await generate_text(prompt)
        parsed = _extract_json(raw)
    except Exception:
        return _deterministic_fallback(context, mode="graphrag")

    treatment = parsed.get("treatment")
    prevention = parsed.get("prevention")

    return {
        "analysis": str(parsed.get("analysis") or ""),
        "treatment": treatment if isinstance(treatment, list) else [],
        "prevention": prevention if isinstance(prevention, list) else [],
        "fertilizer_correction": str(parsed.get("fertilizer_correction") or ""),
        "final_message": str(parsed.get("final_message") or ""),
    }


async def generate_rag_only_advisory(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Advisory generation using only RAG context + disease prediction (no graph evidence).
    Used for comparison view in frontend.
    """
    disease = context.get("disease_prediction", {})
    rag_context = context.get("rag_context", [])
    weather = context.get("weather", {})
    extracted = context.get("extracted", {})
    prompt = (
        "You are a rice disease advisory assistant in RAG-only mode.\n"
        "Use only disease prediction + weather + retrieved document context.\n"
        "Do not use graph reasoning or graph risk fields.\n"
        "Return ONLY valid JSON with schema:\n"
        "{\n"
        "  \"analysis\": string,\n"
        "  \"treatment\": [string],\n"
        "  \"prevention\": [string],\n"
        "  \"fertilizer_correction\": string,\n"
        "  \"final_message\": string\n"
        "}\n\n"
        f"Disease prediction: {json.dumps(disease, ensure_ascii=False)}\n"
        f"RAG context: {json.dumps(rag_context, ensure_ascii=False)}\n"
        f"Weather: {json.dumps(weather, ensure_ascii=False)}\n"
        f"Symptoms: {json.dumps(extracted.get('symptoms', []), ensure_ascii=False)}\n"
        f"Farmer description: {context.get('description')}"
    )
    try:
        raw = await generate_text(prompt)
        parsed = _extract_json(raw)
        return {
            "analysis": str(parsed.get("analysis") or ""),
            "treatment": parsed.get("treatment") if isinstance(parsed.get("treatment"), list) else [],
            "prevention": parsed.get("prevention") if isinstance(parsed.get("prevention"), list) else [],
            "fertilizer_correction": str(parsed.get("fertilizer_correction") or ""),
            "final_message": str(parsed.get("final_message") or ""),
        }
    except Exception:
        copied = dict(context)
        copied["graph_evidence"] = {"graph_risk_score": 0.0, "supporting_factors": []}
        return _deterministic_fallback(copied, mode="rag_only")
