export interface AnalyzePipelinePayload {
  image: File;
  description: string;
  soil?: string;
  fertilizer?: string;
  latitude?: number;
  longitude?: number;
}

export interface AnalyzePipelineResponse {
  status: string;
  predicted_disease?: string;
  confidence?: number;
  risk_score?: number;
  analysis?: string;
  treatment?: string[];
  prevention?: string[];
  fertilizer_correction?: string;
  disease_prediction: {
    disease: string;
    confidence: number;
  };
  structured_input: {
    symptoms: string[];
    fertilizer?: string | null;
    soil?: string | null;
    growth_stage?: string | null;
  };
  weather?: {
    temperature: number;
    humidity: number;
    rainfall: number;
  } | null;
  graph_evidence?: {
    disease: string;
    graph_risk_score: number;
    supporting_factors: string[];
    matched_nodes: Array<{ relation: string; target: string }>;
  };
  rag_context?: Array<{ id: string; text: string; source?: string; score?: number }>;
  explanations?: {
    graph_risk_score?: string;
    current_graph_score_reason?: string;
    weather_snapshot?: string;
    graph_evidence?: string;
    rag_context?: string;
  };
  comparison?: {
    graphrag: { score: number; label: string; summary: string };
    rag_only: { score: number; label: string; summary: string };
  };
  comparison_breakdown?: {
    confidence_signal: number;
    rag_signal: number;
    graph_signal: number;
    graph_bonus: number;
    weather_bonus: number;
    graphrag_formula: string;
    rag_only_formula: string;
  };
  advisory: string;
  meta?: {
    frontend_contract?: string;
    weather_error?: string | null;
  };
  debug?: {
    neo4j_connected?: boolean;
    graph_relations_found?: number;
    rag_matches_count?: number;
    weather_source_used?: string;
    normalized_disease_name?: string;
    errors_by_layer?: Record<string, string>;
  };
}

export interface BackendHealthResponse {
  status: string;
  services: {
    graph: Record<string, unknown>;
    rag: Record<string, unknown>;
    ready: boolean;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function analyzePipeline(
  payload: AnalyzePipelinePayload,
): Promise<AnalyzePipelineResponse> {
  const formData = new FormData();
  formData.append("image", payload.image);
  formData.append("description", payload.description);

  if (payload.soil) formData.append("soil", payload.soil);
  if (payload.fertilizer) formData.append("fertilizer", payload.fertilizer);
  if (payload.latitude !== undefined) formData.append("latitude", String(payload.latitude));
  if (payload.longitude !== undefined) formData.append("longitude", String(payload.longitude));

  const response = await fetch(`${API_BASE_URL}/pipeline/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pipeline request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as AnalyzePipelineResponse;
}

export async function getBackendHealth(): Promise<BackendHealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Health check failed (${response.status}): ${text}`);
  }

  return (await response.json()) as BackendHealthResponse;
}
