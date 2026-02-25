from __future__ import annotations

from typing import Optional

from openai import AsyncOpenAI

from app.config import settings


_client: Optional[AsyncOpenAI] = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is not None:
        return _client

    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set in the environment/.env file.")

    _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def call_llm(
    prompt: str,
    *,
    system_prompt: str | None = None,
    model: str | None = None,
) -> str:
    """
    Thin async wrapper around the OpenAI Chat Completions API.

    The default model is small/cheap; can be swapped via env/config later.
    """

    client = _get_client()
    final_model = model or "gpt-4.1-mini"

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.completions.create(
        model=final_model,
        messages=messages,
        temperature=0.4,
    )

    content = response.choices[0].message.content or ""
    return content.strip()
