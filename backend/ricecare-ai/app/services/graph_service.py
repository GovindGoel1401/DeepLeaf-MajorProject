from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from neo4j import AsyncGraphDatabase, AsyncDriver

from database.neo4j_config import NEO4J_PASSWORD, NEO4J_URI, NEO4J_USER


@dataclass(frozen=True)
class DiseaseRelation:
    relation: str
    target: str


class GraphService:
    """
    Phase 4: minimal Neo4j integration.

    Keeps the driver managed centrally and exposes a couple of small query methods.
    """

    def __init__(self) -> None:
        self._driver: Optional[AsyncDriver] = None

    async def connect(self) -> None:
        if self._driver is not None:
            return
        self._driver = AsyncGraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USER, NEO4J_PASSWORD),
        )
        try:
            await self._driver.verify_connectivity()
        except Exception:
            await self._driver.close()
            self._driver = None
            raise

    async def close(self) -> None:
        if self._driver is None:
            return
        await self._driver.close()
        self._driver = None

    def _require_driver(self) -> AsyncDriver:
        if self._driver is None:
            raise RuntimeError("Neo4j driver is not initialised. Call GraphService.connect() on startup.")
        return self._driver

    async def get_disease_relations(self, disease: str, limit: int = 10) -> List[DiseaseRelation]:
        """
        Example query: fetch related nodes/relations around a Disease node.

        Graph schema can evolve; this method is intentionally generic.
        Returns empty list if Neo4j is not connected (e.g. not running).
        """
        if self._driver is None:
            return []

        driver = self._driver

        cypher = """
        MATCH (d:Disease {name: $disease})-[r]->(n)
        RETURN type(r) AS relation, coalesce(n.name, n.id, toString(id(n))) AS target
        LIMIT $limit
        """

        async with driver.session() as session:
            result = await session.run(cypher, disease=disease, limit=limit)
            records = await result.data()

        return [DiseaseRelation(relation=row["relation"], target=row["target"]) for row in records]

    async def get_context_matches(
        self,
        *,
        disease: str,
        soil: str = "",
        fertilizer: str = "",
        symptoms: List[str] | None = None,
        limit: int = 20,
    ) -> List[DiseaseRelation]:
        """
        Query disease-adjacent nodes that match contextual evidence.
        """
        if self._driver is None:
            return []

        symptoms = symptoms or []
        driver = self._driver

        cypher = """
        MATCH (d:Disease {name: $disease})-[r]-(n)
        WITH r, n, toLower(coalesce(n.name, "")) AS nn
        WHERE
            ($soil <> "" AND nn CONTAINS toLower($soil))
            OR ($fertilizer <> "" AND nn CONTAINS toLower($fertilizer))
            OR any(sym IN $symptoms WHERE sym <> "" AND nn CONTAINS toLower(sym))
        RETURN type(r) AS relation, coalesce(n.name, n.id, toString(id(n))) AS target
        LIMIT $limit
        """

        async with driver.session() as session:
            result = await session.run(
                cypher,
                disease=disease,
                soil=soil,
                fertilizer=fertilizer,
                symptoms=symptoms,
                limit=limit,
            )
            records = await result.data()

        return [DiseaseRelation(relation=row["relation"], target=row["target"]) for row in records]

    async def health(self) -> Dict[str, Any]:
        """
        Lightweight health check for Neo4j.
        """
        if self._driver is None:
            return {"neo4j": "unavailable"}
        try:
            async with self._driver.session() as session:
                result = await session.run("RETURN 1 AS ok")
                record = await result.single()
            return {"neo4j": "ok" if record and record.get("ok") == 1 else "unknown"}
        except Exception:
            return {"neo4j": "error"}


# Singleton instance for the app.
graph_service = GraphService()

