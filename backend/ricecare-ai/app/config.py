from __future__ import annotations

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central place for env configuration.

    Keep keys swappable/optional in early phases; validate strictly later.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_env: str = "dev"
    cors_origins: str = "*"  # comma-separated, e.g. "http://localhost:5173,http://127.0.0.1:5173"

    # External services (Phase 3+ / Phase 6+)
    openweather_api_key: str | None = None
    weatherapi_key: str | None = None
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    google_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"

    # Phase 4 (Neo4j)
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "password"

    # Phase 5 (RAG / Vector DB)
    vector_db_backend: str = "chroma"  # "chroma" or "pinecone"
    chroma_persist_dir: str = "./vectorstore"
    chroma_collection: str = "ricecare_docs"
    pinecone_api_key: str | None = None
    pinecone_environment: str = "us-east-1"
    pinecone_index_name: str = "nodejs"
    pinecone_namespace: str = "ricecare"
    gemini_embedding_model: str = "models/gemini-embedding-001"
    pinecone_dimension: int = 768

    @property
    def cors_origins_list(self) -> List[str]:
        value = (self.cors_origins or "").strip()
        if not value or value == "*":
            return ["*"]
        return [v.strip() for v in value.split(",") if v.strip()]


settings = Settings()

