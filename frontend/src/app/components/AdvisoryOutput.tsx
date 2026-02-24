import { 
  AlertTriangle, 
  Activity, 
  Target, 
  CloudRain, 
  Pill, 
  Shield, 
  AlertCircle,
  BookOpen 
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

export interface AdvisoryData {
  disease: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  climateRisk: string;
  treatment: string[];
  preventiveMeasures: string[];
  pesticides: Array<{
    name: string;
    dosage: string;
    safetyNote: string;
  }>;
  researchInsights: string[];
}

interface AdvisoryOutputProps {
  data: AdvisoryData;
}

export function AdvisoryOutput({ data }: AdvisoryOutputProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl text-green-900 mb-2">AI Analysis Results</h2>
        <p className="text-gray-600">
          Comprehensive disease advisory based on your inputs
        </p>
      </div>

      {/* Disease Prediction & Confidence */}
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
                <span className="text-green-600 font-medium">{data.confidence}%</span>
              </div>
              <Progress value={data.confidence} className="h-2" />
            </div>
          </div>
        </div>
      </Card>

      {/* Severity & Climate Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 border-orange-200">
          <div className="flex items-start gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm text-gray-600 mb-2">Severity Level</h3>
              <Badge className={`${getSeverityColor(data.severity)} border px-3 py-1`}>
                {data.severity}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <CloudRain className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm text-gray-600 mb-2">Climate Risk Factor</h3>
              <p className="text-blue-900">{data.climateRisk}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recommended Treatment */}
      <Card className="p-6 border-green-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-green-600 p-2 rounded-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl text-green-900">Recommended Treatment</h3>
        </div>
        <ul className="space-y-3">
          {data.treatment.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm">
                {index + 1}
              </span>
              <span className="text-gray-700 flex-1">{step}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Preventive Measures */}
      <Card className="p-6 border-blue-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl text-blue-900">Preventive Measures</h3>
        </div>
        <ul className="space-y-2">
          {data.preventiveMeasures.map((measure, index) => (
            <li key={index} className="flex gap-2 text-gray-700">
              <span className="text-blue-500 mt-1">•</span>
              <span className="flex-1">{measure}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Pesticide Suggestions */}
      <Card className="p-6 border-purple-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl text-purple-900">Pesticide Suggestions</h3>
        </div>
        <div className="space-y-4">
          {data.pesticides.map((pesticide, index) => (
            <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-purple-900 mb-2">{pesticide.name}</h4>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Dosage:</strong> {pesticide.dosage}
              </p>
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-700">{pesticide.safetyNote}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Research-Based Insights */}
      <Card className="p-6 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-amber-600 p-2 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl text-amber-900">Research-Based Insights</h3>
        </div>
        <ul className="space-y-2">
          {data.researchInsights.map((insight, index) => (
            <li key={index} className="flex gap-2 text-gray-700">
              <span className="text-amber-500 mt-1">📚</span>
              <span className="flex-1">{insight}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
