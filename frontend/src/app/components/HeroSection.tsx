import { Sprout } from "lucide-react";
import { Button } from "./ui/button";

interface HeroSectionProps {
  onAnalyzeClick: () => void;
}

export function HeroSection({ onAnalyzeClick }: HeroSectionProps) {
  return (
    <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586984456747-d78bd259c534?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaWNlJTIwcGFkZHklMjBmaWVsZCUyMGdyZWVuJTIwYWdyaWN1bHR1cmV8ZW58MXx8fHwxNzcxOTQ1MjcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-800/85 to-green-900/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-500 p-4 rounded-full">
            <Sprout className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
          AI-Powered Rice Disease Detection & Advisory System
        </h1>
        
        <p className="text-lg sm:text-xl text-green-50 mb-4 max-w-3xl mx-auto">
          Upload rice leaf images, enter soil conditions, provide location for weather analysis, 
          and ask questions in Hindi or English.
        </p>
        
        <p className="text-base sm:text-lg text-green-100 mb-8 max-w-2xl mx-auto">
          Get instant AI-powered disease detection, personalized treatment recommendations, 
          and expert agricultural guidance tailored to your specific conditions.
        </p>
        
        <Button 
          onClick={onAnalyzeClick}
          size="lg"
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg"
        >
          Analyze My Crop
        </Button>
      </div>
    </div>
  );
}
