import { useState } from "react";
import { Menu, Sprout, X } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  language: string;
}

export function Header({ currentPage, onNavigate, language }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHindi = language === "hindi";

  const navItems = [
    { id: "home", label: isHindi ? "Home" : "Home" },
    { id: "compare", label: isHindi ? "Compare" : "Compare" },
    { id: "about", label: isHindi ? "About" : "About" },
    { id: "contact", label: isHindi ? "Contact" : "Contact" },
  ];

  const handleNavClick = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-green-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={() => handleNavClick("home")} className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="rounded-lg bg-green-600 p-2">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <span className="block text-xl text-green-900">DeepLeaf</span>
            <span className="hidden text-xs text-green-600 sm:block">Rice Disease Advisory</span>
          </div>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              variant={currentPage === item.id ? "default" : "ghost"}
              className={
                currentPage === item.id
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "text-gray-700 hover:bg-green-50 hover:text-green-600"
              }
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <button onClick={() => setMobileMenuOpen((prev) => !prev)} className="p-2 text-gray-700 hover:text-green-600 md:hidden">
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-green-100 py-4 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 sm:px-6 lg:px-8">
            {navItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                variant={currentPage === item.id ? "default" : "ghost"}
                className={`justify-start ${
                  currentPage === item.id ? "bg-green-600 text-white" : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                }`}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
