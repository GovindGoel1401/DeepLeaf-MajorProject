import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

interface ImageUploadSectionProps {
  onAnalyze: (file: File) => void;
  isAnalyzing: boolean;
  confidence?: number;
}

export function ImageUploadSection({ onAnalyze, isAnalyzing, confidence }: ImageUploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleAnalyze = () => {
    if (uploadedFile) {
      onAnalyze(uploadedFile);
    }
  };

  return (
    <Card className="p-6 border-green-200">
      <div className="mb-4">
        <h2 className="text-2xl text-green-900 mb-2">Upload Rice Leaf Image</h2>
        <p className="text-gray-600">
          Take a clear photo of the rice leaf showing any disease symptoms
        </p>
      </div>

      {!previewUrl ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-green-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            id="file-upload"
          />
          
          <div className="flex flex-col items-center">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg mb-2 text-gray-700">
              Drag and drop your image here
            </h3>
            <p className="text-gray-500 mb-4">or</p>
            <Button
              onClick={() => inputRef.current?.click()}
              variant="outline"
              className="border-green-500 text-green-700 hover:bg-green-50"
            >
              Browse Files
            </Button>
            <p className="text-sm text-gray-400 mt-3">
              PNG, JPG up to 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border-2 border-green-200">
            <img 
              src={previewUrl} 
              alt="Uploaded rice leaf" 
              className="w-full h-64 object-cover"
            />
            <button
              onClick={removeFile}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ImageIcon className="w-4 h-4" />
            <span>{uploadedFile?.name}</span>
            <span className="text-gray-400">
              ({(uploadedFile!.size / 1024).toFixed(1)} KB)
            </span>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Analyzing image...</span>
                <span className="text-green-600">Processing</span>
              </div>
              <Progress value={66} className="h-2" />
            </div>
          )}

          {confidence !== undefined && !isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Model Confidence</span>
                <span className="text-green-600 font-medium">{confidence}%</span>
              </div>
              <Progress value={confidence} className="h-2" />
            </div>
          )}

          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isAnalyzing ? 'Analyzing...' : 'Run Disease Detection'}
          </Button>
        </div>
      )}
    </Card>
  );
}
