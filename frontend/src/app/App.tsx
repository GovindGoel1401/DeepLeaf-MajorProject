import { useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { ComparePage } from "./pages/ComparePage";
import { ComparisonPayload } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [globalLanguage, setGlobalLanguage] = useState("english");
  const [latestComparison, setLatestComparison] = useState<ComparisonPayload | null>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleLanguageToggle = () => {
    setGlobalLanguage(prev => prev === 'english' ? 'hindi' : 'english');
  };

  const handleOpenCompare = (data: ComparisonPayload) => {
    setLatestComparison(data);
    setCurrentPage("compare");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onOpenCompare={handleOpenCompare} />;
      case 'compare':
        return <ComparePage data={latestComparison} />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage onOpenCompare={handleOpenCompare} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        language={globalLanguage}
      />
      
      <main className="flex-1">
        {renderPage()}
      </main>
      
      <Footer 
        language={globalLanguage}
        onLanguageToggle={handleLanguageToggle}
      />
    </div>
  );
}

export default App;
