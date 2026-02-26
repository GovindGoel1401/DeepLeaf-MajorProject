from __future__ import annotations

"""
GraphRAG architecture notes for RiceCare AI
==========================================

We are designing an index-based graph data structure for rice disease modelling.
This module currently uses ONLY placeholder logic, but its structure mirrors the
future Graph + RAG + LLM pipeline so that services can be swapped without
changing the FastAPI routes or the frontend.

Graph nodes
-----------
- Disease:        specific rice diseases (e.g. Brown Spot, Blast, Bacterial Blight)
- Symptom:        visual or physiological plant symptoms (lesions, chlorosis, etc.)
- SoilType:       soil categories (Clay, Loam, Sandy, Sandy Loam, etc.)
- ClimateCondition: aggregated weather patterns (high humidity, heavy rainfall, heat stress)
- Treatment:      agronomic or cultural practices (drainage, spacing, fertilizer regime)
- Pesticide:      active ingredients / product classes (not brand names)
- ResearchInsight: curated findings from papers, manuals, and extension bulletins

Graph edges
-----------
- CAUSES         : Disease  -> Symptom          (typical manifestations)
- ASSOCIATED_WITH: Disease  -> SoilType/Symptom/ClimateCondition
- HIGH_RISK_IN   : Disease  -> ClimateCondition (e.g. high humidity + warm nights)
- TREATED_BY     : Disease  -> Treatment/Pesticide
- PREVENTED_BY   : Disease  -> Treatment        (preventive practices)
- STUDIED_IN     : Disease  -> ResearchInsight  (links to evidence)

Graph indexing strategy
-----------------------
- By disease name                : fast primary lookup for a model-predicted disease
- By climate condition thresholds: enable queries like “diseases favoured by RH > 80% and rainfall > 5mm”
- By soil type                   : filter diseases or treatments that are soil-specific
- By symptom pattern             : support symptom-first diagnosis flows

Purpose
-------
The goal is to support both disease-centric and context-centric retrieval before
the RAG layer runs:
- Disease-centric: “Given disease D, what are its risks, symptoms, and controls?”
- Context-centric: “Given soil S and climate C, which diseases are likely / severe?”

Why rice?
---------
- Major global staple crop with huge food security importance.
- High disease variability (fungal, bacterial, viral) that depends strongly on climate.
- Climate sensitive: humidity, rainfall, and temperature patterns drive epidemics.
- Strong research base and good dataset availability for images and text.
- Practical impact: even a small yield improvement affects many farmers.

How Graph + RAG + LLM will combine
----------------------------------
1) ML model predicts a candidate disease from leaf images.
2) Graph layer retrieves structured relations around that disease and the current
   context (soil type, climate conditions, known risk factors).
3) RAG layer retrieves unstructured documents (research summaries, extension notes)
   that are relevant to the disease and context.
4) LLM layer receives both: structured graph facts + unstructured RAG text and
   synthesises a farmer-friendly advisory in Hindi or English.

In this Phase 2/3 scaffolding, we only simulate these steps with deterministic
Python functions and hard-coded examples. Real Neo4j, ChromaDB and LLM clients
will be wired into the same function signatures later.
"""

from typing import Any, Dict, List, TypedDict


class GraphInsight(TypedDict):
    relation: str
    from_node: str
    to_node_type: str
    to_node: str


class RagContextItem(TypedDict):
    id: str
    title: str
    summary: str
    source: str


def get_graph_relations(disease: str) -> List[GraphInsight]:
    """
    Placeholder for a Neo4j-backed graph query.

    For now we return a few hard-coded “edges” that illustrate the future schema.
    """

    name = disease.lower()
    edges: List[GraphInsight] = []

    if "brown" in name and "spot" in name:
        edges.extend(
            [
                {
                    "relation": "ASSOCIATED_WITH",
                    "from_node": "Brown Spot",
                    "to_node_type": "SoilType",
                    "to_node": "Poorly drained clay soils",
                },
                {
                    "relation": "HIGH_RISK_IN",
                    "from_node": "Brown Spot",
                    "to_node_type": "ClimateCondition",
                    "to_node": "High humidity and frequent rainfall",
                },
                {
                    "relation": "TREATED_BY",
                    "from_node": "Brown Spot",
                    "to_node_type": "Treatment",
                    "to_node": "Balanced fertilization and recommended fungicides",
                },
            ]
        )
    elif "blast" in name:
        edges.extend(
            [
                {
                    "relation": "ASSOCIATED_WITH",
                    "from_node": "Rice Blast",
                    "to_node_type": "Symptom",
                    "to_node": "Spindle-shaped lesions on leaves",
                },
                {
                    "relation": "HIGH_RISK_IN",
                    "from_node": "Rice Blast",
                    "to_node_type": "ClimateCondition",
                    "to_node": "Cool, humid conditions with frequent leaf wetness",
                },
            ]
        )
    else:
        edges.append(
            {
                "relation": "ASSOCIATED_WITH",
                "from_node": disease,
                "to_node_type": "ResearchInsight",
                "to_node": "General rice disease management practices",
            }
        )

    return edges


def compute_environmental_risk(
    disease: str,
    temperature: float,
    humidity: float,
    rainfall: float,
) -> str:
    """
    Placeholder environmental risk scoring using only simple thresholds.

    This will later be replaced with a graph+rule-based or ML-based risk model
    that considers climate condition nodes and edges.
    """

    score = 0

    if humidity >= 80:
        score += 2
    if rainfall >= 5:
        score += 2
    if 20 <= temperature <= 32:
        score += 1

    name = disease.lower()
    if "blast" in name or "blight" in name:
        score += 1  # these are often more aggressive under favourable weather

    if score >= 5:
        return "Very High"
    if score >= 3:
        return "High"
    if score >= 2:
        return "Moderate"
    return "Low"


def retrieve_rag_documents(disease: str, soil_type: str) -> List[RagContextItem]:
    """
    Placeholder for a vector-search backed RAG query.

    In a later phase this will call a FAISS/ChromaDB index using dense embeddings.
    """

    docs: List[RagContextItem] = []
    base_id = disease.lower().replace(" ", "_") or "unknown_disease"

    docs.append(
        RagContextItem(
            id=f"{base_id}_overview",
            title=f"Overview of {disease} in rice",
            summary=(
                f"{disease} is a common rice disease. Management typically combines resistant varieties, "
                "balanced fertilization, and timely fungicide applications when needed."
            ),
            source="MockExtensionBulletin",
        )
    )

    docs.append(
        RagContextItem(
            id=f"{base_id}_soil_management",
            title=f"Soil and water management for {disease} on {soil_type} soils",
            summary=(
                f"On {soil_type} soils, careful water management and avoiding prolonged leaf wetness can help "
                f"reduce severity of {disease}. Improving drainage and avoiding excess nitrogen are recommended."
            ),
            source="MockSoilManagementGuide",
        )
    )

    return docs


def _build_final_advice(
    *,
    disease: str,
    environmental_risk: str,
    soil_type: str,
    location: str,
    user_query: str,
) -> str:
    """
    Deterministic, human-readable advisory string that imitates an LLM output.
    """

    return (
        f"Based on the reported disease '{disease}' in your rice field at {location} on {soil_type} soil, "
        f"the environmental risk is currently assessed as {environmental_risk}. Focus on good field sanitation, "
        "balanced fertilizer use, and proper water management to avoid long periods of leaf wetness. If you decide "
        "to use fungicides or other pesticides, select only locally approved products and strictly follow label "
        "instructions. Monitor your crop over the next week; if symptoms worsen or spread rapidly, contact a local "
        "agricultural extension officer for field-specific advice. Your question was: "
        f"\"{user_query}\", and these recommendations provide a safe, general starting point."
    )


def synthesize_advice(
    *,
    disease: str,
    confidence: float,
    soil_type: str,
    location: str,
    temperature: float,
    humidity: float,
    rainfall: float,
    user_query: str,
) -> Dict[str, Any]:
    """
    High-level orchestration function for the advisory pipeline.

    Phase 2/3 behaviour:
    - Uses placeholder get_graph_relations / compute_environmental_risk / retrieve_rag_documents.
    - Produces a structured, GraphRAG-ready response that the route exposes directly.

    Later we will:
    - Replace get_graph_relations with real Neo4j queries.
    - Replace retrieve_rag_documents with a real vector database (FAISS/Chroma).
    - Replace _build_final_advice with a call to an LLM (OpenAI or compatible).
    """

    graph_insights = get_graph_relations(disease=disease)
    environmental_risk = compute_environmental_risk(
        disease=disease,
        temperature=temperature,
        humidity=humidity,
        rainfall=rainfall,
    )
    rag_context = retrieve_rag_documents(disease=disease, soil_type=soil_type)

    final_advice = _build_final_advice(
        disease=disease,
        environmental_risk=environmental_risk,
        soil_type=soil_type,
        location=location,
        user_query=user_query,
    )

    # Simple placeholder aggregation of confidence and environmental risk.
    base = float(confidence)
    if environmental_risk in {"Very High", "High"}:
        base = min(1.0, base + 0.05)
    confidence_score = round(base, 2)

    return {
        "predicted_disease": disease,
        "model_confidence": confidence,
        "graph_insights": graph_insights,
        "environmental_risk": environmental_risk,
        "rag_context": rag_context,
        "final_advice": final_advice,
        "confidence_score": confidence_score,
    }

