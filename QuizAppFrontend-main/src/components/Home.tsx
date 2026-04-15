import { PenLine, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleManual = () => navigate('/quiz?mode=manual');
  const handleAi = () => navigate('/quiz?mode=ai');

  return (
    <div className="min-h-full w-full py-16 md:py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Create &amp; share quizzes
            <span className="block text-primary mt-1">in seconds.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-lg mx-auto mt-4">
            Build quizzes manually or let AI generate them, then send to friends and family via SMS.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <button
            onClick={handleManual}
            className="group flex flex-col items-center gap-4 p-8 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left"
          >
            <div className="flex items-center justify-center size-12 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <PenLine className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Create Manually</p>
              <p className="text-sm text-muted-foreground mt-1">
                Write your own questions and answer options from scratch.
              </p>
            </div>
          </button>

          <button
            onClick={handleAi}
            className="group flex flex-col items-center gap-4 p-8 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left"
          >
            <div className="flex items-center justify-center size-12 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <Sparkles className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Generate with AI</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pick a topic and let AI create quiz questions for you.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
