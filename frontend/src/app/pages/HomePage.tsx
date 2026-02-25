import { useRef, useState } from "react";
import { HeroSection } from "../components/HeroSection";
import { ImageUploadSection } from "../components/ImageUploadSection";
import { SoilLocationSection } from "../components/SoilLocationSection";
import { QuerySection } from "../components/QuerySection";
import { AdvisoryOutput, AdvisoryData } from "../components/AdvisoryOutput";
import { SystemExplanation } from "../components/SystemExplanation";
import { analyzePipeline } from "../services/pipelineApi";

function parseCoordinates(raw: string): { latitude?: number; longitude?: number } {
  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length !== 2) return {};

  const lat = Number(parts[0].replace(/[^0-9+\-.]/g, ""));
  const lon = Number(parts[1].replace(/[^0-9+\-.]/g, ""));

  if (Number.isNaN(lat) || Number.isNaN(lon)) return {};
  return { latitude: lat, longitude: lon };
}

export function HomePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [confidence, setConfidence] = useState<number | undefined>(undefined);
  const [soilType, setSoilType] = useState("");
  const [fertilizer, setFertilizer] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [weatherData, setWeatherData] = useState<{ temperature: number; humidity: number; rainfall: number } | null>(null);
  const [advisoryData, setAdvisoryData] = useState<AdvisoryData | null>(null);
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

      setConfidence((response.disease_prediction?.confidence || 0) * 100);
      setWeatherData(response.weather || null);

      setAdvisoryData({
        disease: response.disease_prediction?.disease || "Unknown",
        confidence: response.disease_prediction?.confidence || 0,
        advisory: response.advisory || "No advisory returned.",
        weather: response.weather,
        graphRiskScore: response.graph_evidence?.graph_risk_score,
        supportingFactors: response.graph_evidence?.supporting_factors || [],
        ragContext: response.rag_context || [],
      });

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
            <ImageUploadSection onAnalyze={handleImageAnalyze} isAnalyzing={isAnalyzing} confidence={confidence} />

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
