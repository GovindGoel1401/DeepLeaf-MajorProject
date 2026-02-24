import { useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [globalLanguage, setGlobalLanguage] = useState("english");

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleLanguageToggle = () => {
    setGlobalLanguage(prev => prev === 'english' ? 'hindi' : 'english');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage />;
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
