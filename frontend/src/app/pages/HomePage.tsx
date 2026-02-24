import { useState, useRef } from "react";
import { HeroSection } from "../components/HeroSection";
import { ImageUploadSection } from "../components/ImageUploadSection";
import { SoilLocationSection } from "../components/SoilLocationSection";
import { QuerySection } from "../components/QuerySection";
import { AdvisoryOutput, AdvisoryData } from "../components/AdvisoryOutput";
import { SystemExplanation } from "../components/SystemExplanation";

// Mock AI disease data for demonstration
const mockDiseases = [
  {
    disease: "Bacterial Leaf Blight",
    confidence: 92,
    severity: "High" as const,
    climateRisk: "High risk during warm, humid conditions (>80% humidity)",
    treatment: [
      "Remove and destroy infected plant debris immediately",
      "Apply copper-based bactericide (Bordeaux mixture 1%) as foliar spray",
      "Ensure proper field drainage to reduce moisture",
      "Apply balanced NPK fertilizer to strengthen plant immunity",
      "Maintain 15cm water level in field during critical stages"
    ],
    preventiveMeasures: [
      "Use disease-resistant rice varieties like Swarna Sub-1 or IR64",
      "Ensure adequate spacing between plants (20x15cm recommended)",
      "Avoid excessive nitrogen fertilizer application",
      "Practice crop rotation with non-host crops",
      "Clean farm equipment before moving between fields",
      "Monitor fields regularly for early symptoms"
    ],
    pesticides: [
      {
        name: "Copper Oxychloride 50% WP",
        dosage: "3g per liter of water, spray every 10-12 days",
        safetyNote: "Wear protective gloves and mask during application. Do not spray during windy conditions."
      },
      {
        name: "Streptocycline (100 ppm)",
        dosage: "2g + Copper Oxychloride 25g per 10 liters",
        safetyNote: "Maintain 15-day interval before harvest. Avoid skin contact."
      }
    ],
    researchInsights: [
      "Recent IRRI studies show that maintaining alternate wetting and drying (AWD) irrigation reduces BLB incidence by 35%",
      "Silicon application (120 kg/ha) has shown to enhance resistance against bacterial diseases in rice",
      "Weather-based disease prediction models suggest monitoring is critical when temperature is 25-30°C with >85% humidity",
      "Integrated disease management combining resistant varieties and judicious bactericide use shows 78% disease control efficacy"
    ]
  },
  {
    disease: "Rice Blast (Leaf Blast)",
    confidence: 89,
    severity: "Critical" as const,
    climateRisk: "Very high risk - cool nights (20-22°C) with high humidity favor blast development",
    treatment: [
      "Immediate application of Tricyclazole 75% WP @ 0.6g/liter",
      "Spray fungicide at boot leaf stage and repeat after 10 days",
      "Remove infected leaves and burn them away from the field",
      "Apply potassium-rich fertilizers to improve plant resistance",
      "Reduce nitrogen application during disease outbreak"
    ],
    preventiveMeasures: [
      "Plant blast-resistant varieties such as Pusa Basmati 1121, Pusa 44",
      "Avoid late planting which increases blast susceptibility",
      "Ensure balanced fertilization - avoid excessive nitrogen",
      "Maintain proper plant spacing for air circulation",
      "Avoid water stress during tillering and panicle initiation stages",
      "Use disease-free seeds treated with Tricyclazole"
    ],
    pesticides: [
      {
        name: "Tricyclazole 75% WP (Beam)",
        dosage: "0.6g per liter, 2-3 sprays at 10-day intervals",
        safetyNote: "Apply during early morning or evening. Wait 20 days before harvest."
      },
      {
        name: "Hexaconazole 5% EC",
        dosage: "2ml per liter of water",
        safetyNote: "Highly toxic to aquatic life. Do not contaminate water sources."
      },
      {
        name: "Carbendazim 50% WP",
        dosage: "1g per liter as preventive measure",
        safetyNote: "Use protective clothing. Avoid inhalation of spray mist."
      }
    ],
    researchInsights: [
      "Blast fungus (Magnaporthe oryzae) can cause up to 50% yield loss in susceptible varieties during favorable weather",
      "Studies show that silicon fertilization increases blast resistance by strengthening cell walls",
      "Integrated management with resistant varieties + fungicide reduces disease incidence from 60% to 12%",
      "Weather-based forecasting models help predict blast outbreaks 7-10 days in advance for timely intervention"
    ]
  },
  {
    disease: "Brown Spot Disease",
    confidence: 87,
    severity: "Medium" as const,
    climateRisk: "Moderate risk - occurs in nutrient-deficient soils during warm weather",
    treatment: [
      "Apply Mancozeb 75% WP @ 2g/liter as foliar spray",
      "Correct soil nutrient deficiencies with balanced fertilizer",
      "Apply farmyard manure (FYM) at 10 tons per hectare",
      "Ensure adequate potassium and silica supplementation",
      "Improve soil drainage if waterlogging is present"
    ],
    preventiveMeasures: [
      "Use certified disease-free seeds",
      "Treat seeds with Carbendazim @ 2g/kg seed before sowing",
      "Maintain optimal soil fertility with regular soil testing",
      "Practice proper water management - avoid both drought and waterlogging",
      "Remove weed hosts that harbor the pathogen",
      "Use tolerant varieties like TN1, IR20, IR36"
    ],
    pesticides: [
      {
        name: "Mancozeb 75% WP",
        dosage: "2.5g per liter, spray twice at 15-day intervals",
        safetyNote: "Mild irritant. Wash hands thoroughly after handling. Do not mix with alkaline products."
      },
      {
        name: "Propiconazole 25% EC",
        dosage: "1ml per liter of water",
        safetyNote: "Avoid contact with eyes and skin. Store away from food and animal feed."
      }
    ],
    researchInsights: [
      "Brown spot is often called 'the poor farmer's disease' as it thrives in nutrient-deficient conditions",
      "Research shows that maintaining soil organic matter above 2% significantly reduces disease incidence",
      "The pathogen (Bipolaris oryzae) survives on infected seeds and crop residues for up to 3 years",
      "Seed treatment combined with foliar sprays provides 85% disease control efficiency"
    ]
  }
];

export function HomePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [confidence, setConfidence] = useState<number | undefined>(undefined);
  const [soilType, setSoilType] = useState("");
  const [location, setLocation] = useState("");
  const [weatherData, setWeatherData] = useState<{temperature: number; humidity: number; rainfall: number} | null>(null);
  const [advisoryData, setAdvisoryData] = useState<AdvisoryData | null>(null);
  
  const analysisRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyzeClick = () => {
    analysisRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageAnalyze = (file: File) => {
    setUploadedFile(file);
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const randomDisease = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
      setConfidence(randomDisease.confidence);
      setAdvisoryData(randomDisease);
      setIsAnalyzing(false);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }, 2500);
  };

  const handleSoilChange = (soil: string) => {
    setSoilType(soil);
  };

  const handleLocationChange = (loc: string) => {
    setLocation(loc);
    
    if (loc.trim()) {
      setTimeout(() => {
        setWeatherData({
          temperature: Math.floor(Math.random() * 10) + 25,
          humidity: Math.floor(Math.random() * 20) + 70,
          rainfall: Math.floor(Math.random() * 100) + 20
        });
      }, 800);
    } else {
      setWeatherData(null);
    }
  };

  const handleQuerySubmit = (query: string, language: string) => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const randomDisease = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
      setAdvisoryData(randomDisease);
      setConfidence(randomDisease.confidence);
      setIsAnalyzing(false);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      <HeroSection onAnalyzeClick={handleAnalyzeClick} />

      <div ref={analysisRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-8">
            <ImageUploadSection 
              onAnalyze={handleImageAnalyze}
              isAnalyzing={isAnalyzing}
              confidence={confidence}
            />
            
            <SoilLocationSection 
              onSoilChange={handleSoilChange}
              onLocationChange={handleLocationChange}
              weatherData={weatherData}
            />
          </div>

          <div>
            <QuerySection 
              onSubmitQuery={handleQuerySubmit}
              isProcessing={isAnalyzing}
            />
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
