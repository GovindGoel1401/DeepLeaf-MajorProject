import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ComparisonSection } from "../components/ComparisonSection";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ComparisonPayload } from "./HomePage";

interface ComparePageProps {
  data: ComparisonPayload | null;
}

const demoExamples = [
  {
    title: "Case A: High Humidity + Urea + Clay",
    input:
      "Image shows brown circular lesions; humidity 92%; fertilizer urea; soil clay; symptoms worsening in tillering stage.",
    ragRisk:
      "RAG-only may return generic broad-spectrum advice and miss fertilizer-weather interaction.",
    graphAdv:
      "Graph edges WORSENED_BY(urea) + FAVORED_BY(high_humidity) raise targeted risk and push moisture control + N correction.",
  },
  {
    title: "Case B: Similar Text, Different Context",
    input:
      "Farmer text resembles blast, but weather is dry (RH 48%) and no rainfall. Soil is sandy loam.",
    ragRisk:
      "RAG-only can over-index to common blast paragraphs due lexical similarity.",
    graphAdv:
      "Graph weakens fungal spread risk under dry context and avoids over-treatment recommendations.",
  },
  {
    title: "Case C: Mixed Symptoms",
    input:
      "Spots + yellowing + recent heavy nitrogen application with standing water pockets.",
    ragRisk:
      "RAG-only may prioritize one symptom and give shallow static recommendations.",
    graphAdv:
      "Graph traversal combines multi-factor links and produces condition-aware, staged actions.",
  },
];

export function ComparePage({ data }: ComparePageProps) {
  const [activeMode, setActiveMode] = useState<"graphrag" | "rag">("graphrag");
  const [exampleIndex, setExampleIndex] = useState(() => Math.floor(Math.random() * demoExamples.length));

  useEffect(() => {
    const timer = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % demoExamples.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const example = demoExamples[exampleIndex];

  const fallbackData: ComparisonPayload = useMemo(
    () => ({
      graphrag: {
        score: 0.78,
        label: "GraphRAG (Graph + RAG + CNN)",
        summary:
          "Graph-aware output emphasizes humidity-fertilizer interaction, disease-specific risk control, and stage-aware treatment planning.",
      },
      rag_only: {
        score: 0.61,
        label: "RAG only (No Graph)",
        summary:
          "RAG-only output is semantically relevant but may stay generic and less sensitive to structured agronomic relationships.",
      },
      breakdown: {
        confidence_signal: 0.82,
        rag_signal: 0.56,
        graph_signal: 0.64,
        graph_bonus: 0.12,
        weather_bonus: 0.05,
        graphrag_formula: "graphrag = rag_only + graph_bonus + weather_bonus",
        rag_only_formula: "rag_only = 0.55*confidence_signal + 0.45*rag_signal",
      },
    }),
    [],
  );

  const displayData = data ?? fallbackData;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ecfdf5,white_35%,#eff6ff_75%)] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-emerald-200 bg-white/80 p-6 shadow-sm backdrop-blur"
        >
          <h1 className="text-3xl text-emerald-900">GraphRAG vs RAG Analysis Lab</h1>
          <p className="mt-2 text-sm text-gray-700">
            This page demonstrates why GraphRAG is more reliable: it combines visual model confidence, structured graph reasoning, and semantic retrieval.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => setActiveMode("graphrag")}
              className={activeMode === "graphrag" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"}
            >
              Working of GraphRAG
            </Button>
            <Button
              onClick={() => setActiveMode("rag")}
              className={activeMode === "rag" ? "bg-amber-500 hover:bg-amber-600" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}
            >
              Working of RAG
            </Button>
            <Button variant="outline" onClick={() => setExampleIndex((i) => (i + 1) % demoExamples.length)}>
              Change Demo Example
            </Button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeMode}-${exampleIndex}`}
            initial={{ opacity: 0, x: activeMode === "graphrag" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeMode === "graphrag" ? 20 : -20 }}
            transition={{ duration: 0.35 }}
          >
            <Card className={`p-6 ${activeMode === "graphrag" ? "border-emerald-300 bg-emerald-50/60" : "border-amber-300 bg-amber-50/60"}`}>
              <h3 className={`text-xl ${activeMode === "graphrag" ? "text-emerald-900" : "text-amber-900"}`}>{example.title}</h3>
              <p className="mt-2 text-sm text-gray-700"><strong>Input:</strong> {example.input}</p>
              {activeMode === "graphrag" ? (
                <>
                  <p className="mt-3 text-sm text-gray-700"><strong>Reasoning trace:</strong> Vision model, parser, weather, graph traversal, vector retrieval, and final synthesis.</p>
                  <p className="mt-2 text-sm text-gray-700"><strong>Why better:</strong> {example.graphAdv}</p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm text-gray-700"><strong>Reasoning trace:</strong> semantic retrieval + language generation without relationship constraints.</p>
                  <p className="mt-2 text-sm text-gray-700"><strong>Hallucination risk:</strong> {example.ragRisk}</p>
                </>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <ComparisonSection data={displayData} />
        </motion.div>
      </div>
    </div>
  );
}
