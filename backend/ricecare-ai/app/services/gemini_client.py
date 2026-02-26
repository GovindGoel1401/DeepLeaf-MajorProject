from __future__ import annotations

import asyncio

from app.config import settings


async def generate_text(prompt: str) -> str:
    """
    Async Gemini text generation helper.
    """

    api_key = settings.gemini_api_key or settings.google_api_key
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY or GOOGLE_API_KEY is not configured.")

    try:
        import google.generativeai as genai
    except ModuleNotFoundError as exc:  # pragma: no cover
        raise RuntimeError(
            "google-generativeai is not installed in the active environment."
        ) from exc

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    def _call() -> str:
        response = model.generate_content(prompt)
        return (response.text or "").strip()

    return await asyncio.to_thread(_call)
