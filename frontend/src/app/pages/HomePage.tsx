import { useRef, useState } from "react";
import { HeroSection } from "../components/HeroSection";
import { ImageUploadSection } from "../components/ImageUploadSection";
import { SoilLocationSection } from "../components/SoilLocationSection";
import { QuerySection } from "../components/QuerySection";
import { AdvisoryOutput, AdvisoryData } from "../components/AdvisoryOutput";
import { SystemExplanation } from "../components/SystemExplanation";
import { analyzePipeline } from "../services/pipelineApi";

export interface ComparisonPayload {
  graphrag: { score: number; label: string; summary: string };
  rag_only: { score: number; label: string; summary: string };
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

interface HomePageProps {
  onOpenCompare?: (data: ComparisonPayload) => void;
}

function parseCoordinates(raw: string): { latitude?: number; longitude?: number } {
  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length !== 2) return {};

  const lat = Number(parts[0].replace(/[^0-9+\-.]/g, ""));
  const lon = Number(parts[1].replace(/[^0-9+\-.]/g, ""));

  if (Number.isNaN(lat) || Number.isNaN(lon)) return {};
  return { latitude: lat, longitude: lon };
}

export function HomePage({ onOpenCompare }: HomePageProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uiConfidencePct, setUiConfidencePct] = useState<number | undefined>(undefined);
  const [soilType, setSoilType] = useState("");
  const [fertilizer, setFertilizer] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [weatherData, setWeatherData] = useState<{ temperature: number; humidity: number; rainfall: number } | null>(null);
  const [advisoryData, setAdvisoryData] = useState<AdvisoryData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonPayload | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const analysisRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyzeClick = () => {
    analysisRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const runPipeline = async (file: File, queryText: string) => {
    setIsAnalyzing(true);
    setErrorText(null);

    try {
      const response = await analyzePipeline({
        image: file,
        description: queryText,
        soil: soilType || undefined,
        fertilizer: fertilizer || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      const rawConfidence =
        typeof response.confidence === "number"
          ? response.confidence
          : typeof response.disease_prediction?.confidence === "number"
            ? response.disease_prediction.confidence
            : 0;

      const diseaseName = response.predicted_disease || response.disease_prediction?.disease || "Unknown";

      setUiConfidencePct(Math.round(rawConfidence * 100));
      setWeatherData(response.weather || null);

      setAdvisoryData({
        disease: diseaseName,
        confidence: rawConfidence,
        advisory: response.advisory || response.analysis || "No advisory returned.",
        weather: response.weather || null,
        graphRiskScore:
          typeof response.risk_score === "number"
            ? response.risk_score
            : response.graph_evidence?.graph_risk_score,
        supportingFactors: response.graph_evidence?.supporting_factors || [],
        ragContext: response.rag_context || [],
        treatment: response.treatment || [],
        prevention: response.prevention || [],
        fertilizerCorrection: response.fertilizer_correction || "",
        explanations: response.explanations,
        graphLinked: Boolean(response.debug?.neo4j_connected),
        graphRelationsFound: typeof response.debug?.graph_relations_found === "number" ? response.debug.graph_relations_found : undefined,
      });

      const comparisonPayload = response.comparison
        ? {
            ...response.comparison,
            breakdown: response.comparison_breakdown,
          }
        : null;
      setComparisonData(comparisonPayload);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pipeline request failed.";
      setErrorText(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageAnalyze = (file: File) => {
    setUploadedFile(file);

    if (!description.trim()) {
      setErrorText("Please enter your crop description/question before running analysis.");
      return;
    }

    void runPipeline(file, description);
  };

  const handleSoilChange = (soil: string) => {
    setSoilType(soil);
  };

  const handleLocationChange = (loc: string) => {
    const parsed = parseCoordinates(loc);
    if (parsed.latitude !== undefined && parsed.longitude !== undefined) {
      setCoords(parsed);
    }
  };

  const handleCoordinatesChange = (value: { latitude?: number; longitude?: number }) => {
    setCoords(value);
  };

  const handleQuerySubmit = (query: string) => {
    setDescription(query);

    if (!uploadedFile) {
      setErrorText("Please upload a rice leaf image first.");
      return;
    }

    void runPipeline(uploadedFile, query);
  };

  const handleQueryChange = (query: string) => {
    setDescription(query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      <HeroSection onAnalyzeClick={handleAnalyzeClick} />

      <div ref={analysisRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-8">
            <ImageUploadSection onAnalyze={handleImageAnalyze} isAnalyzing={isAnalyzing} confidence={uiConfidencePct} />

            <SoilLocationSection
              onSoilChange={handleSoilChange}
              onFertilizerChange={setFertilizer}
              onLocationChange={handleLocationChange}
              onCoordinatesChange={handleCoordinatesChange}
              weatherData={weatherData}
            />
          </div>

          <div>
            <QuerySection onSubmitQuery={handleQuerySubmit} onQueryChange={handleQueryChange} isProcessing={isAnalyzing} />
            {comparisonData && (
              <button
                type="button"
                onClick={() => comparisonData && onOpenCompare?.(comparisonData)}
                className="mt-3 w-full rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 hover:bg-emerald-100"
              >
                Compare (New Page)
              </button>
            )}
            {errorText && <p className="mt-3 text-sm text-red-600">{errorText}</p>}
          </div>
        </div>

        {advisoryData && (
          <div ref={resultsRef} className="mt-12">
            <AdvisoryOutput data={advisoryData} />
          </div>
        )}
      </div>

      <SystemExplanation />
    </div>
  );
}
