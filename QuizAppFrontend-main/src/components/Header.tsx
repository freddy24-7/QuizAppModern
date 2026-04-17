import { useState } from 'react';
import { Button } from './ui/button';
import About from './About';

const Header = () => {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-md border-b border-orange-100/60 shadow-sm"
        role="banner"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex justify-between items-center">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="sr-only">Quiz Generator</span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #f97316, #ef4444)' }}
            >
              Quiz
            </span>
            <span className="text-foreground">Generator</span>
          </h1>
          <nav aria-label="Main navigation">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              aria-label="About Quiz Generator"
              onClick={() => setShowAbout(true)}
            >
              About
            </Button>
          </nav>
        </div>
      </header>
      <About isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
};

export default Header;
