import { useState } from 'react';
import { Button } from './ui/button';
import About from './About';

const Header = () => {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-border z-50"
        role="banner"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex justify-between items-center">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            <span className="sr-only">Quiz Generator</span>
            <span className="text-primary">Quiz</span>Generator
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
