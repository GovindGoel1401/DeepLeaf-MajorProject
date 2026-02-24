import { useState } from "react";
import { Sprout, Mail, BookOpen, Users, Globe, Headphones, MessageCircle, Send } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface FooterProps {
  language: string;
  onLanguageToggle: () => void;
}

export function Footer({ language, onLanguageToggle }: FooterProps) {
  const isHindi = language === 'hindi';
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackEmail("");
    }, 3000);
  };

  return (
    <footer className="bg-green-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-500 p-2 rounded-lg">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl">DeepLeaf</span>
            </div>
            <p className="text-green-200 text-sm">
              {isHindi 
                ? 'कृत्रिम बुद्धिमत्ता द्वारा संचालित धान रोग सलाहकार प्रणाली'
                : 'AI-Powered Rice Disease Advisory System'
              }
            </p>
          </div>

          {/* About Project */}
          <div>
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {isHindi ? 'परियोजना के बारे में' : 'About Project'}
            </h3>
            <ul className="space-y-2 text-green-200 text-sm">
              <li>
                <a href="#mission" className="hover:text-white transition-colors">
                  {isHindi ? 'हमारा मिशन' : 'Our Mission'}
                </a>
              </li>
              <li>
                <a href="#team" className="hover:text-white transition-colors">
                  {isHindi ? 'टीम' : 'Team'}
                </a>
              </li>
              <li>
                <a href="#technology" className="hover:text-white transition-colors">
                  {isHindi ? 'प्रौद्योगिकी' : 'Technology'}
                </a>
              </li>
              <li>
                <a href="#partners" className="hover:text-white transition-colors">
                  {isHindi ? 'साझेदार' : 'Partners'}
                </a>
              </li>
            </ul>
          </div>

          {/* Research References */}
          <div>
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {isHindi ? 'शोध संदर्भ' : 'Research'}
            </h3>
            <ul className="space-y-2 text-green-200 text-sm">
              <li>
                <a href="#irri" className="hover:text-white transition-colors">
                  IRRI Publications
                </a>
              </li>
              <li>
                <a href="#papers" className="hover:text-white transition-colors">
                  {isHindi ? 'शोध पत्र' : 'Research Papers'}
                </a>
              </li>
              <li>
                <a href="#datasets" className="hover:text-white transition-colors">
                  {isHindi ? 'डेटासेट' : 'Datasets'}
                </a>
              </li>
              <li>
                <a href="#guidelines" className="hover:text-white transition-colors">
                  {isHindi ? 'कृषि दिशानिर्देश' : 'Guidelines'}
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              {isHindi ? 'ग्राहक सेवा' : 'Customer Service'}
            </h3>
            <ul className="space-y-2 text-green-200 text-sm">
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  {isHindi ? 'सामान्य प्रश्न' : 'FAQ'}
                </a>
              </li>
              <li>
                <a href="#support" className="hover:text-white transition-colors">
                  {isHindi ? 'तकनीकी सहायता' : 'Technical Support'}
                </a>
              </li>
              <li>
                <a href="#training" className="hover:text-white transition-colors">
                  {isHindi ? 'प्रशिक्षण' : 'Training Videos'}
                </a>
              </li>
              <li className="pt-2">
                <div className="flex items-center gap-2 text-green-400">
                  <Headphones className="w-4 h-4" />
                  <span className="text-sm">1800-123-4567</span>
                </div>
                <p className="text-xs text-green-300 mt-1">
                  {isHindi ? '24/7 हेल्पलाइन' : '24/7 Helpline'}
                </p>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {isHindi ? 'संपर्क करें' : 'Contact'}
            </h3>
            <ul className="space-y-2 text-green-200 text-sm">
              <li>
                <a href="mailto:info@ricecare.ai" className="hover:text-white transition-colors">
                  info@deepleaf.ai
                </a>
              </li>
              <li>
                <a href="mailto:support@ricecare.ai" className="hover:text-white transition-colors">
                  support@deepleaf.ai
                </a>
              </li>
              <li>
                <a href="tel:+911234567890" className="hover:text-white transition-colors">
                  +91 123 456 7890
                </a>
              </li>
              <li className="pt-2">
                <button 
                  onClick={onLanguageToggle}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="mt-12 pt-8 border-t border-green-800">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-xl text-center">
                {isHindi ? 'हमें अपनी प्रतिक्रिया दें' : 'Share Your Feedback'}
              </h3>
            </div>
            <p className="text-green-200 text-center text-sm mb-4">
              {isHindi 
                ? 'आपके सुझाव हमारे लिए महत्वपूर्ण हैं। हमें बेहतर बनाने में मदद करें।'
                : 'Your suggestions help us improve. Let us know how we can serve you better.'
              }
            </p>
            
            {feedbackSubmitted ? (
              <div className="bg-green-800 text-green-100 p-4 rounded-lg text-center">
                ✓ {isHindi ? 'धन्यवाद! आपकी प्रतिक्रिया प्राप्त हो गई है।' : 'Thank you! Your feedback has been received.'}
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="flex gap-2">
                <Input
                  type="email"
                  required
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  placeholder={isHindi ? 'अपना ईमेल दर्ज करें' : 'Enter your email for feedback'}
                  className="bg-green-800 border-green-700 text-white placeholder:text-green-400"
                />
                <Button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-green-800 mt-8 pt-8 text-center text-green-300 text-sm">
          <p>
            © 2026 DeepLeaf. {isHindi ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
          </p>
          <p className="mt-2 text-xs">
            {isHindi 
              ? 'यह प्रणाली सूचना के उद्देश्य से है। गंभीर बीमारियों के लिए स्थानीय कृषि विशेषज्ञों से परामर्श करें।'
              : 'This system is for informational purposes. Please consult local agricultural experts for severe diseases.'
            }
          </p>
        </div>
      </div>
    </footer>
  );
}