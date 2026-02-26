import { Card } from "./ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ComparisonData {
  graphrag: {
    score: number;
    label: string;
    summary: string;
  };
  rag_only: {
    score: number;
    label: string;
    summary: string;
  };
  breakdown?: {
    confidence_signal: number;
    rag_signal: number;
    graph_signal: number;
    graph_bonus: number;
    weather_bonus: number;
    graphrag_formula: string;
    rag_only_formula: string;
  };
}

interface ComparisonProps {
  data: ComparisonData;
}

export function ComparisonSection({ data }: ComparisonProps) {
  const chartData = [
    { name: data.graphrag.label, value: Math.round((data.graphrag.score || 0) * 100) },
    { name: data.rag_only.label, value: Math.round((data.rag_only.score || 0) * 100) },
  ];
  const graphragPct = Math.round((data.graphrag.score || 0) * 100);
  const ragOnlyPct = Math.round((data.rag_only.score || 0) * 100);
  const scoreGap = graphragPct - ragOnlyPct;
  const gapText =
    scoreGap > 0
      ? `+${scoreGap}% in favor of GraphRAG`
      : scoreGap < 0
        ? `${scoreGap}% (RAG-only scored higher in this case)`
        : "0% (both modes scored equal)";

  const colors = ["#16a34a", "#f59e0b"];

  return (
    <Card className="p-6 border-emerald-200">
      <h3 className="text-2xl text-emerald-900 mb-4">Comparison: GraphRAG vs RAG-only</h3>
      <p className="text-sm text-gray-600 mb-4">
        This chart compares evidence strength for your current case. GraphRAG combines graph relationships + vector retrieval + model confidence.
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
        <h4 className="text-sky-900 mb-2">Demo Case: Why GraphRAG can beat RAG-only</h4>
        <p className="text-sm text-gray-700">
          <strong>Input example:</strong> Brown spot-like image, humidity 92%, fertilizer = urea, soil = clay, symptoms = brown circular spots.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <strong>RAG-only risk:</strong> May return generic fungal advice from semantically similar text chunks.
        </p>
        <p className="text-sm text-gray-700 mt-1">
          <strong>GraphRAG advantage:</strong> Uses explicit graph links like <code>WORSENED_BY(urea)</code> and{" "}
          <code>FAVORED_BY(high_humidity)</code>, so recommendations stay condition-aware and more reliable.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <h4 className="text-emerald-900 mb-2">Why GraphRAG is used</h4>
        <p className="text-sm text-gray-700">
          GraphRAG combines graph logic (cause-effect links) with semantic retrieval. This reduces generic advice and makes recommendations more
          condition-aware for your exact weather, soil, fertilizer, and symptoms.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          Confidence gap in this case: <strong>{gapText}</strong>.
        </p>
      </div>

      {data.breakdown && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-gray-900 mb-2">Score Formula Breakdown</h4>
          <p className="text-xs text-gray-700">
            confidence_signal: {data.breakdown.confidence_signal} | rag_signal: {data.breakdown.rag_signal} | graph_signal: {data.breakdown.graph_signal}
          </p>
          <p className="text-xs text-gray-700 mt-1">
            graph_bonus: {data.breakdown.graph_bonus} | weather_bonus: {data.breakdown.weather_bonus}
          </p>
          <p className="text-xs text-gray-700 mt-2">RAG-only formula: {data.breakdown.rag_only_formula}</p>
          <p className="text-xs text-gray-700">GraphRAG formula: {data.breakdown.graphrag_formula}</p>
        </div>
      )}

      <h4 className="text-lg text-gray-800 mt-5">Output Comparison</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <Card className="p-4 border-emerald-200 bg-emerald-50">
          <h4 className="text-emerald-900 mb-2">Our Model (Graph + RAG)</h4>
          <p className="text-xs text-emerald-800 mb-2">Composite score: {graphragPct}%</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{data.graphrag.summary}</p>
        </Card>
        <Card className="p-4 border-amber-200 bg-amber-50">
          <h4 className="text-amber-900 mb-2">Normal RAG Only</h4>
          <p className="text-xs text-amber-800 mb-2">Composite score: {ragOnlyPct}%</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{data.rag_only.summary}</p>
        </Card>
      </div>
    </Card>
  );
}
