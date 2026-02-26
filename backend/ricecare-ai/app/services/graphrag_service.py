from __future__ import annotations

from typing import Any, Dict, List

from app.services.graph_service import graph_service


def _normalize(value: str | None) -> str:
    return (value or "").strip().lower()


async def retrieve_graph_context(
    disease: str,
    humidity: float,
    rainfall: float,
    fertilizer: str,
    soil: str,
    symptoms: List[str],
    growth_stage: str | None = None,
    description: str | None = None,
) -> Dict[str, Any]:
    """
    Query Neo4j neighborhood and compute a simple deterministic risk score.
    """

    relations = await graph_service.get_context_matches(
        disease=disease,
        soil=soil,
        fertilizer=fertilizer,
        symptoms=symptoms,
        limit=30,
    )
    if not relations:
        relations = await graph_service.get_disease_relations(disease=disease, limit=30)

    normalized_soil = _normalize(soil)
    normalized_fertilizer = _normalize(fertilizer)
    normalized_growth_stage = _normalize(growth_stage)
    normalized_description = _normalize(description)
    normalized_symptoms = {_normalize(item) for item in symptoms if item}

    factors: List[str] = []
    matched_nodes: List[Dict[str, str]] = []
    soil_matched = False
    fertilizer_matched = False
    symptom_matches = 0
    stage_matched = False

    positive_checks = 0
    total_checks = 0

    dry_cues = ("no rain", "dry", "कम बारिश", "बारिश नहीं", "no heavy rain", "airflow is poor")
    has_dry_cue = any(cue in normalized_description for cue in dry_cues)

    total_checks += 1
    humidity_flag = humidity >= 80 and (rainfall > 0.5 or not has_dry_cue)
    if humidity_flag:
        positive_checks += 1
        factors.append("Humidity conditions can increase disease pressure")
    elif has_dry_cue:
        factors.append("Dry/no-rain field context lowers humidity-driven risk contribution")

    total_checks += 1
    if normalized_growth_stage:
        positive_checks += 1
        factors.append(f"Growth-stage signal considered ({growth_stage})")

    total_checks += 1
    airflow_cues = ("tight", "dense", "crowded", "airflow", "poor ventilation", "घना", "हवा कम")
    if any(cue in normalized_description for cue in airflow_cues):
        positive_checks += 1
        factors.append("Dense canopy / poor airflow can drive local disease spread")

    for row in relations:
        relation = row.relation
        target = row.target
        matched_nodes.append({"relation": relation, "target": target})

        target_norm = target.lower()

        if normalized_soil and normalized_soil in target_norm and not soil_matched:
            soil_matched = True
            factors.append(f"Graph match: soil condition linked ({target})")

        if normalized_fertilizer and normalized_fertilizer in target_norm and not fertilizer_matched:
            fertilizer_matched = True
            factors.append(f"Graph match: fertilizer link found ({target})")

        for symptom in normalized_symptoms:
            if symptom and symptom in target_norm and symptom_matches < 2:
                symptom_matches += 1
                factors.append(f"Graph match: symptom evidence ({target})")
                break
        if normalized_growth_stage and normalized_growth_stage in target_norm:
            stage_matched = True

    if relations:
        factors.append(
            f"Knowledge graph contains {len(relations)} linked factors for {disease.replace('_', ' ')}"
        )

    total_checks += 1
    if soil_matched:
        positive_checks += 1
    total_checks += 1
    if fertilizer_matched:
        positive_checks += 1
    total_checks += 1
    if symptom_matches > 0:
        positive_checks += 1
    total_checks += 1
    if len(relations) > 0:
        positive_checks += 1
    if normalized_growth_stage:
        total_checks += 1
        if stage_matched:
            positive_checks += 1

    unique_factors = list(dict.fromkeys(factors))
    score = round(positive_checks / total_checks, 3) if total_checks else 0.0

    return {
        "disease": disease,
        "graph_risk_score": score,
        "supporting_factors": unique_factors,
        "matched_nodes": matched_nodes,
        "query_stats": {
            "relations_found": len(relations),
            "symptoms_count": len(symptoms),
        },
        "score_breakdown": {
            "method": "unweighted_evidence_ratio",
            "positive_checks": positive_checks,
            "total_checks": total_checks,
            "humidity_flag": humidity_flag,
            "soil_matched": soil_matched,
            "fertilizer_matched": fertilizer_matched,
            "symptom_matched": symptom_matches > 0,
            "disease_relations_found": len(relations) > 0,
            "growth_stage_matched": stage_matched if normalized_growth_stage else None,
        },
    }
