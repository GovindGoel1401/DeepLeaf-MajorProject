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
        cnn_prediction: str = "",
        symptoms: List[str] | None = None,
    ) -> Dict[str, Any]:
        """
        Weighted multi-disease ranking with explainable factor contributions.

        risk_score =
          base_risk
          + humidity_weight * humidity_match
          + fertilizer_weight * fertilizer_match
          + soil_weight * soil_match
          + symptom_weight * symptom_match

        Returns:
            {
              "ranking": [...],
              "top_disease": str
            }
        """
        if self._driver is None:
            return {"ranking": [], "top_disease": ""}

        fertilizer_norm = (fertilizer or "").strip().lower()
        soil_norm = (soil or "").strip().lower()
        humidity_value = float(humidity or 0.0)
        cnn_norm = (cnn_prediction or "").strip().lower().replace("_", " ").replace("-", " ")
        normalized_symptoms = {
            (symptom or "").strip().lower().replace("_", " ").replace("-", " ")
            for symptom in (symptoms or [])
            if (symptom or "").strip()
        }

        disease_query = """
        MATCH (d:Disease)
        RETURN
            coalesce(d.name, "") AS disease,
            coalesce(toFloat(d.base_risk), 0.2) AS base_risk,
            coalesce(toFloat(d.humidity_weight), 0.25) AS humidity_weight,
            coalesce(toFloat(d.fertilizer_weight), 0.2) AS fertilizer_weight,
            coalesce(toFloat(d.soil_weight), 0.2) AS soil_weight,
            coalesce(toFloat(d.symptom_weight), 0.2) AS symptom_weight
        """

        async with self._driver.session() as session:
            result = await session.run(disease_query)
            disease_rows = await result.data()

        ranked: List[Dict[str, Any]] = []
        for row in disease_rows:
            disease_name = str(row.get("disease") or "").strip()
            if not disease_name:
                continue

            disease_norm = disease_name.lower().replace("_", " ").replace("-", " ")
            humidity_match = max(0.0, min(humidity_value / 100.0, 1.0))
            fertilizer_match = 1.0 if fertilizer_norm == "high_nitrogen" else 0.0
            soil_match = 1.0 if soil_norm in {"clay", "poor_drainage"} else 0.0
            symptom_overlap = any(
                symptom in disease_norm or disease_norm in symptom
                for symptom in normalized_symptoms
            )
            symptom_match = 1.0 if (cnn_norm and cnn_norm == disease_norm) or symptom_overlap else 0.0

            base_risk = float(row.get("base_risk", 0.2))
            humidity_weight = float(row.get("humidity_weight", 0.25))
            fertilizer_weight = float(row.get("fertilizer_weight", 0.2))
            soil_weight = float(row.get("soil_weight", 0.2))
            symptom_weight = float(row.get("symptom_weight", 0.2))

            risk_score = (
                base_risk
                + (humidity_weight * humidity_match)
                + (fertilizer_weight * fertilizer_match)
                + (soil_weight * soil_match)
                + (symptom_weight * symptom_match)
            )
            risk_score = round(max(0.0, min(1.0, risk_score)), 4)

            cnn_aligned = bool(cnn_norm and (cnn_norm == disease_norm or cnn_norm in disease_norm or disease_norm in cnn_norm))

            evidence = [
                {
                    "factor": "base_risk",
                    "value": round(base_risk, 4),
                    "weight": 1.0,
                    "impact": round(base_risk, 4),
                },
                {
                    "factor": "humidity",
                    "value": round(humidity_match, 4),
                    "weight": round(humidity_weight, 4),
                    "impact": round(humidity_weight * humidity_match, 4),
                },
                {
                    "factor": "fertilizer",
                    "value": fertilizer_norm or "n/a",
                    "weight": round(fertilizer_weight, 4),
                    "impact": round(fertilizer_weight * fertilizer_match, 4),
                },
                {
                    "factor": "soil",
                    "value": soil_norm or "n/a",
                    "weight": round(soil_weight, 4),
                    "impact": round(soil_weight * soil_match, 4),
                },
                {
                    "factor": "symptoms",
                    "value": ", ".join(sorted(normalized_symptoms)) if normalized_symptoms else f"cnn==disease ({cnn_norm == disease_norm})",
                    "weight": round(symptom_weight, 4),
                    "impact": round(symptom_weight * symptom_match, 4),
                },
            ]

            ranked.append(
                {
                    "disease": disease_name,
                    "score": risk_score,
                    "evidence": evidence,
                    "cnn_aligned": cnn_aligned,
                }
            )

        ranked.sort(key=lambda x: (float(x["score"]), 1.0 if x.get("cnn_aligned") else 0.0), reverse=True)
        top_disease = str(ranked[0]["disease"]) if ranked else ""
        return {"ranking": ranked, "top_disease": top_disease}

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
