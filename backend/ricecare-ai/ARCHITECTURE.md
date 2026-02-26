## RiceCare AI Backend Architecture – GraphRAG Advisory

This document describes the Phase 2/3 backend architecture for the RiceCare AI advisory system, focusing on the **GraphRAG-ready** design. All current implementations are **placeholders** with clean interfaces so we can swap in real Neo4j, vector DB, and LLM later, without changing the API contract or frontend.

---

## High‑Level Flow

1. **Image classification** (already wired):
   - Frontend calls `POST /upload` with a rice leaf image.
   - Backend model (placeholder or real EfficientNet) returns:
     - `disease: string`
     - `confidence: float`

2. **Advisory synthesis**:
   - Frontend / orchestrator calls `POST /advisory` with:
     - `disease`, `confidence`
     - `soil_type`, `location`
     - `temperature`, `humidity`, `rainfall`
     - `user_query` (Hindi or English)
   - Backend advisory service:
     - Uses **Graph** structure (placeholder) to fetch disease‑centric relations.
     - Uses **RAG** structure (placeholder) to fetch text snippets for the context.
     - Computes an **environmental risk** score from weather + disease.
     - Produces a final advisory paragraph and overall **confidence_score**.

The response to `POST /advisory` is already in its final structured form and will remain stable as we plug in real components.

---

## API Contracts

### AdvisoryRequest (request body)

Defined in `app/routes/advisory.py`:

```python
class AdvisoryRequest(BaseModel):
    disease: str
    confidence: float
    soil_type: str
    location: str
    temperature: float
    humidity: float
    rainfall: float
    user_query: str
```

### AdvisoryResponse (response body)

```python
class AdvisoryResponse(BaseModel):
    predicted_disease: str
    model_confidence: float
    graph_insights: list
    environmental_risk: str
    rag_context: list
    final_advice: str
    confidence_score: float
```

### Endpoint

```python
@router.post("/advisory", response_model=AdvisoryResponse)
```

The route contains **no business logic**. It simply forwards data to the service layer and returns the result.

---

## Graph Data Model (Design)

In `app/services/advisory_service.py` we document and partially simulate the future graph schema.

### Node Types

- **Disease**  
  E.g. Brown Spot, Rice Blast, Bacterial Leaf Blight.

- **Symptom**  
  Visual or physiological effects (lesion types, chlorosis, wilting, etc.).

- **SoilType**  
  Clay, Loam, Sandy, Sandy Loam, and other agriculturally relevant classes.

- **ClimateCondition**  
  Aggregated weather states: high humidity, heavy rainfall, heat stress, etc.

- **Treatment**  
  Cultural/agronomic practices (drainage, spacing, fertilizer strategies).

- **Pesticide**  
  Active ingredients or classes (not local trade names).

- **ResearchInsight**  
  Key findings from scientific papers, manuals, and extension material.

### Edge Types

- **CAUSES**  
  `Disease -> Symptom` – typical manifestations.

- **ASSOCIATED_WITH**  
  `Disease -> Symptom/SoilType/ClimateCondition` – common risk factors.

- **HIGH_RISK_IN**  
  `Disease -> ClimateCondition` – when conditions are especially favourable.

- **TREATED_BY**  
  `Disease -> Treatment/Pesticide` – recommended control measures.

- **PREVENTED_BY**  
  `Disease -> Treatment` – preventive agronomy (resistant varieties, rotations, etc.).

- **STUDIED_IN**  
  `Disease -> ResearchInsight` – link to evidence sources.

### Indexing Strategy

To enable fast and expressive queries, the graph will be indexed by:

- **Disease name**  
  Primary entry point after ML classification.

- **Climate condition thresholds**  
  Humidity, rainfall, and temperature ranges mapped to `ClimateCondition` nodes.

- **Soil type**  
  Soil‑specific disease pressure and treatment recommendations.

- **Symptom pattern**  
  Supports symptom‑first queries (e.g. for diagnostic flows).

This design supports both **disease‑centric** and **context‑centric** retrieval:

- *Disease‑centric*: “Given disease D, what symptoms, risk factors, and treatments are known?”
- *Context‑centric*: “Given S soil and C climate, which diseases are likely or high risk?”

---

## RAG Layer (Design)

The RAG layer is responsible for retrieving **unstructured** agronomic knowledge (text).

In `advisory_service.py` we define a placeholder structure:

```python
class RagContextItem(TypedDict):
    id: str
    title: str
    summary: str
    source: str
```

The function:

```python
def retrieve_rag_documents(disease: str, soil_type: str) -> List[RagContextItem]:
    ...
```

currently returns hard‑coded documents, but in Phase 3+ it will:

- Use **ChromaDB or FAISS** as a vector index.
- Store embeddings of research papers, extension bulletins, and manuals.
- Query by:
  - disease name,
  - soil type,
  - (later) climate conditions and symptom patterns.

RAG output complements the graph:

- Graph: structured facts and relationships.
- RAG: free‑text explanations, recommendations, and evidence.

---

## Why Rice?

Rice is chosen as the first crop for this architecture because:

- **Major global staple** affecting billions of people.
- **High disease variability** (fungal, bacterial, viral) with distinct symptomology.
- **Strong climate sensitivity** – humidity, temperature, and rainfall strongly drive epidemics.
- **Rich research base** – many papers, manuals, and extension resources exist.
- **Good dataset availability** for leaf images and textual resources.
- **High practical impact** – even small yield improvements have large food security benefits.

This makes rice an ideal testbed for a GraphRAG agronomy platform that can later be generalized to other crops.

---

## How Graph + RAG + LLM Combine

The full future pipeline is:

1. **ML model (image)**  
   - EfficientNet (or similar) predicts `disease` and `confidence` from a leaf image.

2. **Graph retrieval (Neo4j)**  
   - Given the disease and context (soil type, climate), a graph query retrieves:
     - risk factors (`ASSOCIATED_WITH`, `HIGH_RISK_IN`),
     - key symptoms (`CAUSES`),
     - candidate treatments (`TREATED_BY`, `PREVENTED_BY`),
     - links to research insights (`STUDIED_IN`).

3. **RAG retrieval (Chroma/FAISS)**  
   - Using disease, soil type, and potentially climate/symptom context, the vector DB retrieves:
     - short, relevant document snippets (`RagContextItem`).

4. **LLM synthesis (OpenAI or pluggable API)**  
   - LLM receives:
     - structured graph facts (nodes + edges),
     - unstructured RAG snippets,
     - user query (Hindi or English).
   - Produces:
     - a farmer‑friendly `final_advice` paragraph,
     - optionally structured recommendations (treatment, prevention, risk level).

5. **Backend response**  
   - The `/advisory` endpoint returns a **fixed JSON schema** (see `AdvisoryResponse`).
   - Frontend renders this advisory without needing to know internal GraphRAG details.

---

## Current Placeholder Implementation (Phase 2/3)

All real integrations are **intentionally disabled** in this phase:

- `get_graph_relations(disease)`  
  Returns simulated `GraphInsight` edges instead of querying Neo4j.

- `compute_environmental_risk(disease, temperature, humidity, rainfall)`  
  Uses simple threshold logic instead of climate graph reasoning.

- `retrieve_rag_documents(disease, soil_type)`  
  Returns fixed `RagContextItem` examples instead of calling a vector DB.

- `_build_final_advice(...)`  
  Produces deterministic text instead of calling an LLM.

- `synthesize_advice(...)`  
  Orchestrates these functions and returns the `AdvisoryResponse` payload expected by the frontend.

This gives us a **clean, testable, and GraphRAG‑ready backend** that can be upgraded to real services by only replacing the internals of these functions, without touching:

- the frontend,
- the `/upload` endpoint,
- or the `/advisory` API contract.

