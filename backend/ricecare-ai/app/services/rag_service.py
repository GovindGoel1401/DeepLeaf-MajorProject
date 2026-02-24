from app.services.llm_service import call_llm


def generate_advisory(query: str) -> str:
    prompt = f"Provide rice farming advisory for: {query}"
    return call_llm(prompt)
