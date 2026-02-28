from __future__ import annotations

from typing import Any, Dict, List


class CRagService:
    """
    Corrective-RAG evaluator.
    Pure deterministic evaluation logic (no retrieval, no DB calls).
    """

    W_CNN = 0.4
    W_GRAPH = 0.35
    W_VECTOR = 0.25

    VECTOR_LOW_THRESHOLD = 0.6
    CNN_LOW_THRESHOLD = 0.5

    PENALTY_DISEASE_MISMATCH = 0.12
    PENALTY_LOW_VECTOR = 0.1
    PENALTY_LOW_CNN = 0.08

    def _clamp_score(self, value: float) -> float:
        return max(0.0, min(1.0, float(value)))

    def _confidence_level(self, score: float) -> str:
        if score >= 0.75:
            return "high"
        if score >= 0.5:
            return "medium"
        return "low"

    def _calculate_penalty(
        self,
        *,
        cnn_confidence: float,
        vector_similarity: float,
        top_graph_disease: str,
        cnn_prediction: str,
    ) -> Dict[str, Any]:
        penalties_applied: List[str] = []
        penalty = 0.0

        graph_norm = (top_graph_disease or "").strip().lower().replace("_", " ").replace("-", " ")
        cnn_norm = (cnn_prediction or "").strip().lower().replace("_", " ").replace("-", " ")
        if graph_norm and cnn_norm and graph_norm != cnn_norm:
            penalty += self.PENALTY_DISEASE_MISMATCH
            penalties_applied.append("cnn_graph_mismatch")

        if vector_similarity < self.VECTOR_LOW_THRESHOLD:
            penalty += self.PENALTY_LOW_VECTOR
            penalties_applied.append("low_vector_similarity")

        if cnn_confidence < self.CNN_LOW_THRESHOLD:
            penalty += self.PENALTY_LOW_CNN
            penalties_applied.append("low_cnn_confidence")

        return {"penalty": penalty, "penalties_applied": penalties_applied}

    async def evaluate(
        self,
        *,
        cnn_confidence: float,
        graph_score: float,
        vector_similarity: float,
        top_graph_disease: str,
        cnn_prediction: str,
    ) -> Dict[str, Any]:
        cnn = self._clamp_score(cnn_confidence)
        graph = self._clamp_score(graph_score)
        vector = self._clamp_score(vector_similarity)

        penalty_info = self._calculate_penalty(
            cnn_confidence=cnn,
            vector_similarity=vector,
            top_graph_disease=top_graph_disease,
            cnn_prediction=cnn_prediction,
        )
        contradiction_penalty = float(penalty_info["penalty"])

        final_confidence = (
            self.W_CNN * cnn
            + self.W_GRAPH * graph
            + self.W_VECTOR * vector
            - contradiction_penalty
        )
        final_confidence = self._clamp_score(final_confidence)

        return {
            "final_confidence": round(final_confidence, 4),
            "confidence_level": self._confidence_level(final_confidence),
            "penalties_applied": penalty_info["penalties_applied"],
        }


crag_service = CRagService()

