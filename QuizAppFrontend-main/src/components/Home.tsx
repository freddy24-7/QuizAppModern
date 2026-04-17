import { PenLine, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleManual = () => navigate('/quiz?mode=manual');
  const handleAi = () => navigate('/quiz?mode=ai');

  return (
    <div className="min-h-full w-full">
      {/* Gradient hero */}
      <div
        className="w-full py-20 md:py-32 px-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ef4444 55%, #dc2626 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 -left-16 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #fde68a 0%, transparent 70%)' }}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-sm">
              Create &amp; share quizzes
              <span className="block mt-2 text-white/90">in seconds.</span>
            </h2>
            <p className="text-white/75 text-base md:text-lg leading-relaxed max-w-lg mx-auto mt-5">
              Build quizzes manually or let AI generate them, then send to friends and family via SMS.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button
              onClick={handleManual}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm hover:bg-white/25 hover:border-white/40 transition-all text-left shadow-lg"
            >
              <div className="flex items-center justify-center size-12 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors shadow-inner">
                <PenLine className="size-6 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white text-base">Create Manually</p>
                <p className="text-sm text-white/70 mt-1">
                  Write your own questions and answer options from scratch.
                </p>
              </div>
            </button>

            <button
              onClick={handleAi}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm hover:bg-white/25 hover:border-white/40 transition-all text-left shadow-lg"
            >
              <div className="flex items-center justify-center size-12 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors shadow-inner">
                <Sparkles className="size-6 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white text-base">Generate with AI</p>
                <p className="text-sm text-white/70 mt-1">
                  Pick a topic and let AI create quiz questions for you.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Below-hero subtle info strip */}
      <div className="w-full py-10 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            No account needed &mdash; create a quiz and share it instantly via SMS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
