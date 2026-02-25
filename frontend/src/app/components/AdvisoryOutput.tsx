import { Activity, CloudRain, Network, FileText, MessageSquare } from "lucide-react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

export interface AdvisoryData {
  disease: string;
  confidence: number;
  advisory: string;
  weather?: {
    temperature: number;
    humidity: number;
    rainfall: number;
  } | null;
  graphRiskScore?: number;
  supportingFactors: string[];
  ragContext: Array<{ id: string; text: string; source?: string; score?: number }>;
}

interface AdvisoryOutputProps {
  data: AdvisoryData;
}

export function AdvisoryOutput({ data }: AdvisoryOutputProps) {
  const confidencePct = Math.round((data.confidence || 0) * 100);
  const graphPct = Math.round((data.graphRiskScore || 0) * 100);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl text-green-900 mb-2">AI Analysis Results</h2>
        <p className="text-gray-600">Disease prediction + GraphRAG + LLM advisory</p>
      </div>

      <Card className="p-6 border-green-200 bg-gradient-to-br from-green-50 to-white">
        <div className="flex items-start gap-4">
          <div className="bg-green-600 p-3 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl text-green-900 mb-2">Predicted Disease</h3>
            <p className="text-2xl text-green-800 mb-3">{data.disease}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Model Confidence</span>
                <span className="text-green-600 font-medium">{confidencePct}%</span>
              </div>
              <Progress value={confidencePct} className="h-2" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm text-gray-600 mb-2">Graph Risk Score</h3>
              <p className="text-2xl text-blue-900">{graphPct}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-sky-200">
          <div className="flex items-start gap-3">
            <div className="bg-sky-500 p-2 rounded-lg">
              <CloudRain className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm text-gray-600 mb-2">Weather Snapshot</h3>
              {data.weather ? (
                <p className="text-sky-900">
                  {data.weather.temperature}C, {data.weather.humidity}% RH, {data.weather.rainfall} mm rain
                </p>
              ) : (
                <p className="text-sky-900">Not available</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 border-indigo-200">
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl text-indigo-900">Graph Evidence</h3>
        </div>
        <ul className="space-y-2">
          {data.supportingFactors.length > 0 ? (
            data.supportingFactors.map((factor, idx) => (
              <li key={idx} className="text-gray-700">- {factor}</li>
            ))
          ) : (
            <li className="text-gray-500">No specific graph factors found.</li>
          )}
        </ul>
      </Card>

      <Card className="p-6 border-amber-200">
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-amber-600 p-2 rounded-lg">
            <Network className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl text-amber-900">RAG Context</h3>
        </div>
        <ul className="space-y-2">
          {data.ragContext.length > 0 ? (
            data.ragContext.map((doc) => (
              <li key={doc.id} className="text-gray-700">
                - {doc.text}
                {doc.source ? ` (source: ${doc.source})` : ""}
              </li>
            ))
          ) : (
            <li className="text-gray-500">No vector context retrieved yet.</li>
          )}
        </ul>
      </Card>

      <Card className="p-6 border-green-200">
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-green-700 p-2 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl text-green-900">Final Advisory</h3>
        </div>
        <p className="text-gray-800 whitespace-pre-line">{data.advisory}</p>
      </Card>
    </div>
  );
}
