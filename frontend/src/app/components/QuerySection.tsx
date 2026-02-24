import { useState } from "react";
import { MessageSquare, Languages } from "lucide-react";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";

interface QuerySectionProps {
  onSubmitQuery: (query: string, language: string) => void;
  isProcessing: boolean;
}

export function QuerySection({ onSubmitQuery, isProcessing }: QuerySectionProps) {
  const [query, setQuery] = useState("");
  const [isHindi, setIsHindi] = useState(false);

  const placeholder = isHindi
    ? "मेरे धान की पत्तियों पर भूरे धब्बे हैं, क्या करूँ?"
    : "My rice leaves have brown spots. What should I do?";

  const handleSubmit = () => {
    if (query.trim()) {
      onSubmitQuery(query, isHindi ? 'hindi' : 'english');
    }
  };

  return (
    <Card className="p-6 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl text-green-900">Ask Your Question</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <Languages className="w-5 h-5 text-gray-500" />
          <div className="flex items-center gap-2">
            <Label htmlFor="language-toggle" className="text-sm text-gray-600">
              {isHindi ? 'हिंदी' : 'English'}
            </Label>
            <Switch
              id="language-toggle"
              checked={isHindi}
              onCheckedChange={setIsHindi}
            />
          </div>
        </div>
      </div>

      <p className="text-gray-600 mb-4">
        {isHindi 
          ? 'हिंदी या अंग्रेजी में अपनी फसल के बारे में कोई भी सवाल पूछें'
          : 'Ask any question about your crop in Hindi or English'
        }
      </p>

      <div className="space-y-4">
        <Textarea
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[120px] border-gray-300 resize-none"
          dir={isHindi ? 'auto' : 'ltr'}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleSubmit}
            disabled={!query.trim() || isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              isHindi ? 'विश्लेषण हो रहा है...' : 'Analyzing...'
            ) : (
              isHindi ? 'AI सलाह प्राप्त करें' : 'Get AI Advice'
            )}
          </Button>
          
          {query && (
            <Button 
              onClick={() => setQuery('')}
              variant="outline"
              className="border-gray-300"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm text-green-800">
          <strong>Example questions:</strong>
        </p>
        <ul className="text-sm text-green-700 mt-2 space-y-1 list-disc list-inside">
          {isHindi ? (
            <>
              <li>पत्तियों पर सफेद धब्बे क्यों हैं?</li>
              <li>कौन सा कीटनाशक उपयोग करें?</li>
              <li>रोग को कैसे रोकें?</li>
            </>
          ) : (
            <>
              <li>Why are there white spots on the leaves?</li>
              <li>Which pesticide should I use?</li>
              <li>How can I prevent this disease?</li>
            </>
          )}
        </ul>
      </div>
    </Card>
  );
}
