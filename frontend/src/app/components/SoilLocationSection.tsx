import { useState, useEffect } from "react";
import { MapPin, Cloud, Droplets, Thermometer } from "lucide-react";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
}

interface SoilLocationSectionProps {
  onSoilChange: (soilType: string) => void;
  onLocationChange: (location: string) => void;
  weatherData: WeatherData | null;
}

export function SoilLocationSection({ 
  onSoilChange, 
  onLocationChange,
  weatherData 
}: SoilLocationSectionProps) {
  const [soilType, setSoilType] = useState("");
  const [customSoil, setCustomSoil] = useState("");
  const [location, setLocation] = useState("");

  const handleSoilChange = (value: string) => {
    setSoilType(value);
    onSoilChange(value);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    onLocationChange(value);
  };

  return (
    <Card className="p-6 border-green-200">
      <h2 className="text-2xl text-green-900 mb-4">Soil & Location Details</h2>
      
      <div className="space-y-6">
        {/* Soil Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="soil-type" className="text-gray-700">Soil Type</Label>
          <Select onValueChange={handleSoilChange} value={soilType}>
            <SelectTrigger id="soil-type" className="border-gray-300">
              <SelectValue placeholder="Select soil type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clay">Clay</SelectItem>
              <SelectItem value="sandy">Sandy</SelectItem>
              <SelectItem value="loamy">Loamy</SelectItem>
              <SelectItem value="silty">Silty</SelectItem>
              <SelectItem value="peaty">Peaty</SelectItem>
              <SelectItem value="chalky">Chalky</SelectItem>
              <SelectItem value="saline">Saline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Soil Description */}
        <div className="space-y-2">
          <Label htmlFor="custom-soil" className="text-gray-700">
            Custom Soil Description (Optional)
          </Label>
          <Input
            id="custom-soil"
            placeholder="e.g., Well-drained, slightly acidic..."
            value={customSoil}
            onChange={(e) => setCustomSoil(e.target.value)}
            className="border-gray-300"
          />
        </div>

        {/* Location Input */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-gray-700">
            Location (City or GPS Coordinates)
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              id="location"
              placeholder="e.g., Patna, Bihar or 25.5941°N, 85.1376°E"
              value={location}
              onChange={handleLocationChange}
              className="pl-10 border-gray-300"
            />
          </div>
        </div>

        {/* Weather Display Card */}
        {weatherData && (
          <div className="mt-6">
            <h3 className="text-sm mb-3 text-gray-600">Current Weather Conditions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-500 p-2 rounded-lg">
                    <Thermometer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-orange-700 mb-1">Temperature</p>
                    <p className="text-2xl text-orange-900">{weatherData.temperature}°C</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Humidity</p>
                    <p className="text-2xl text-blue-900">{weatherData.humidity}%</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
                <div className="flex items-start gap-3">
                  <div className="bg-sky-500 p-2 rounded-lg">
                    <Cloud className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-sky-700 mb-1">Rainfall (7 days)</p>
                    <p className="text-2xl text-sky-900">{weatherData.rainfall}mm</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
