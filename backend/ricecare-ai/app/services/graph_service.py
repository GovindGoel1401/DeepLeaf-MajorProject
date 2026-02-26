from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from neo4j import AsyncDriver, AsyncGraphDatabase

from database.neo4j_config import NEO4J_PASSWORD, NEO4J_URI, NEO4J_USER


@dataclass(frozen=True)
class DiseaseRelation:
    relation: str
    target: str


class GraphService:
    """
    Neo4j integration for deterministic graph reasoning.
    """

    def __init__(self) -> None:
        self._driver: Optional[AsyncDriver] = None

    @staticmethod
    def _disease_keys(disease: str) -> List[str]:
        raw = (disease or "").strip()
        if not raw:
            return []
        keys = {
            raw.lower(),
            raw.replace("_", " ").lower(),
            raw.replace("-", " ").lower(),
        }
        compact = raw.replace("_", "").replace("-", "").replace(" ", "").lower()
        if compact:
            keys.add(compact)
        return list(keys)

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

    async def get_disease_relations(self, disease: str, limit: int = 10) -> List[DiseaseRelation]:
        """
        Fetch related nodes around a Disease node.
        Returns empty list when Neo4j is unavailable.
        """
        if self._driver is None:
            return []

        disease_keys = self._disease_keys(disease)
        if not disease_keys:
            return []

        cypher = """
        MATCH (d:Disease)-[r]->(n)
        WHERE toLower(coalesce(d.name, "")) IN $disease_keys
        RETURN type(r) AS relation, coalesce(n.name, n.id, toString(id(n))) AS target
        LIMIT $limit
        """

        async with self._driver.session() as session:
            result = await session.run(cypher, disease_keys=disease_keys, limit=limit)
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
        Find disease-adjacent nodes matching contextual evidence.
        """
        if self._driver is None:
            return []

        symptoms = symptoms or []

        disease_keys = self._disease_keys(disease)
        if not disease_keys:
            return []

        cypher = """
        MATCH (d:Disease)-[r]-(n)
        WHERE toLower(coalesce(d.name, "")) IN $disease_keys
        WITH r, n, toLower(coalesce(n.name, "")) AS nn
        WHERE
            ($soil <> "" AND nn CONTAINS toLower($soil))
            OR ($fertilizer <> "" AND nn CONTAINS toLower($fertilizer))
            OR any(sym IN $symptoms WHERE sym <> "" AND nn CONTAINS toLower(sym))
        RETURN type(r) AS relation, coalesce(n.name, n.id, toString(id(n))) AS target
        LIMIT $limit
        """

        async with self._driver.session() as session:
            result = await session.run(
                cypher,
                disease_keys=disease_keys,
                soil=soil,
                fertilizer=fertilizer,
                symptoms=symptoms,
                limit=limit,
            )
            records = await result.data()

        return [DiseaseRelation(relation=row["relation"], target=row["target"]) for row in records]

    async def rank_diseases(
        self,
        humidity: int | float,
        fertilizer: str,
        soil: str,
    ) -> List[Dict[str, Any]]:
        """
        Rank diseases by contextual weighted edges.
        Returns empty list when Neo4j is unavailable.
        """
        if self._driver is None:
            return []

        cypher = """
        MATCH (d:Disease)

        OPTIONAL MATCH (d)-[:HIGH_RISK_IF]->(w:WeatherCondition)
        WHERE w.parameter = "humidity" AND $humidity >= 80

        OPTIONAL MATCH (d)-[:WORSENED_BY]->(f:Fertilizer)
        WHERE toLower(f.name) = toLower($fertilizer)

        OPTIONAL MATCH (d)-[:MORE_LIKELY_IN]->(s:SoilType)
        WHERE toLower(s.name) = toLower($soil)

        WITH d,
        sum(COALESCE(w.weight,0)) +
        sum(COALESCE(f.weight,0)) +
        sum(COALESCE(s.weight,0)) AS score

        RETURN d.name AS disease, score
        ORDER BY score DESC
        """

        async with self._driver.session() as session:
            result = await session.run(
                cypher,
                humidity=float(humidity),
                fertilizer=fertilizer or "",
                soil=soil or "",
            )
            records = await result.data()

        return records

    async def health(self) -> Dict[str, Any]:
        if self._driver is None:
            return {"neo4j": "unavailable"}

        try:
            async with self._driver.session() as session:
                result = await session.run("RETURN 1 AS ok")
                record = await result.single()
            return {"neo4j": "ok" if record and record.get("ok") == 1 else "unknown"}
        except Exception:
            return {"neo4j": "error"}


graph_service = GraphService()
