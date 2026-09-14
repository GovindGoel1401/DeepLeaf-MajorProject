import { Brain, Network, CloudSun, Database } from "lucide-react";
import { Card } from "./ui/card";

export function SystemExplanation() {
  const features = [
    {
      icon: Brain,
      title: "Vision AI Disease Detection",
      description: "Advanced deep learning models trained on thousands of rice disease images to accurately identify and classify various rice plant diseases.",
      color: "bg-purple-500"
    },
    {
      icon: Network,
      title: "Knowledge Graph Reasoning",
      description: "Interconnected agricultural knowledge base that provides context-aware recommendations based on disease relationships and historical treatment data.",
      color: "bg-blue-500"
    },
    {
      icon: CloudSun,
      title: "Weather-Based Contextual Analysis",
      description: "Real-time weather integration to assess climate-related disease risks and provide season-specific advisory for your location.",
      color: "bg-orange-500"
    },
    {
      icon: Database,
      title: "Retrieval-Augmented AI Recommendations",
      description: "Combines latest research papers, agricultural guidelines, and expert knowledge to provide evidence-based treatment recommendations.",
      color: "bg-green-500"
    }
  ];

  return (
    <div className="py-12 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h2 className="text-3xl text-green-900 mb-3">How RiceCare AI Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The backend combines image classification, graph reasoning, weather context, and RAG so the advice stays grounded in field conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-green-200">
                <div className="flex items-start gap-4">
                  <div className={`${feature.color} p-3 rounded-lg flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 p-6 bg-white border-green-300">
          <div className="flex items-start gap-4">
            <div className="bg-green-600 p-2 rounded-lg flex-shrink-0">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg text-green-900 mb-2">Deployment Notes</h3>
              <p className="text-gray-700 mb-3">
                RiceCare AI uses a hybrid path: the image model predicts a disease, the graph layer scores structured field context, the RAG layer
                fetches supporting text, and the advisory layer synthesizes the final answer.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Health check:</strong> Use the backend status banner to confirm graph and RAG readiness before field use.
                <br />
                <strong>Fallback behavior:</strong> The app still runs if Neo4j or the vector store is unavailable, but the advice is less grounded.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}