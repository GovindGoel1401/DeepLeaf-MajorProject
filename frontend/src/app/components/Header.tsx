import { useState } from "react";
import { Sprout, Menu, X } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  language: string;
}

export function Header({ currentPage, onNavigate, language }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHindi = language === 'hindi';

  const navItems = [
    { id: 'home', label: isHindi ? 'होम' : 'Home' },
    { id: 'about', label: isHindi ? 'हमारे बारे में' : 'About' },
    { id: 'contact', label: isHindi ? 'संपर्क करें' : 'Contact' },
  ];

  const handleNavClick = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="bg-white border-b border-green-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="bg-green-600 p-2 rounded-lg">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <span className="text-xl text-green-900 block">DeepLeaf</span>
              <span className="text-xs text-green-600 hidden sm:block">
                {isHindi ? 'धान रोग सलाहकार' : 'Rice Disease Advisory'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                variant={currentPage === item.id ? "default" : "ghost"}
                className={
                  currentPage === item.id
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                }
              >
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-green-600"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-green-100">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  className={`justify-start ${
                    currentPage === item.id
                      ? "bg-green-600 text-white"
                      : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                  }`}
                >
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}