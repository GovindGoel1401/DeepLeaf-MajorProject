from __future__ import annotations

import json
from typing import Any, Dict

from app.config import settings
from app.services.gemini_client import generate_text


def _extract_json_object(raw_text: str) -> Dict[str, Any]:
    """
    Parse JSON from plain text or markdown-fenced output.
    """

    candidate = raw_text.strip()
    if candidate.startswith("```"):
        candidate = candidate.strip("`")
        if candidate.lower().startswith("json"):
            candidate = candidate[4:].strip()

    start = candidate.find("{")
    end = candidate.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = candidate[start : end + 1]

    data = json.loads(candidate)
    if not isinstance(data, dict):
        raise ValueError("LLM response is not a JSON object")
    return data


async def extract_structured_data(text: str) -> Dict[str, Any]:
    """
    Extract normalized structured field data from farmer text (Hindi or English).

    Returns JSON with keys:
      - symptoms: list[str]
      - fertilizer: str | null
      - soil: str | null
      - growth_stage: str | null
    """

    if not text.strip():
        return {
            "symptoms": [],
            "fertilizer": None,
            "soil": None,
            "growth_stage": None,
        }

    api_key = settings.gemini_api_key or settings.google_api_key
    if not api_key:
        # Safe deterministic fallback when Gemini key is missing.
        return {
            "symptoms": [],
            "fertilizer": None,
            "soil": None,
            "growth_stage": None,
        }

    prompt = (
        "You are an agricultural information extraction engine.\n"
        "Extract structured JSON from farmer text.\n"
        "Return ONLY valid JSON. No markdown. No extra text.\n\n"
        "Required schema:\n"
        "{\n"
        "  \"symptoms\": [string],\n"
        "  \"fertilizer\": string or null,\n"
        "  \"soil\": string or null,\n"
        "  \"growth_stage\": string or null\n"
        "}\n\n"
        f"Farmer text:\n{text}"
    )

    try:
        raw = await generate_text(prompt)
    except Exception:
        return {
            "symptoms": [],
            "fertilizer": None,
            "soil": None,
            "growth_stage": None,
        }

    try:
        parsed = _extract_json_object(raw)
    except Exception:
        parsed = {}

    symptoms = parsed.get("symptoms")
    if not isinstance(symptoms, list):
        symptoms = []
    symptoms = [str(item).strip() for item in symptoms if str(item).strip()]

    fertilizer = parsed.get("fertilizer")
    soil = parsed.get("soil")
    growth_stage = parsed.get("growth_stage")

    return {
        "symptoms": symptoms,
        "fertilizer": str(fertilizer).strip() if fertilizer else None,
        "soil": str(soil).strip() if soil else None,
        "growth_stage": str(growth_stage).strip() if growth_stage else None,
    }
