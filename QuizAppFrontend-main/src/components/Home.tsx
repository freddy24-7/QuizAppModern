import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full w-full py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-border">
          <img
            src="/quizguy.jpg"
            alt="Quiz Generator mascot"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <div className="flex flex-col justify-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Create &amp; share quizzes
            <span className="block text-primary">in seconds.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md">
            Build quizzes manually or with AI, then send them to friends and family via SMS.
          </p>
          <Button
            onClick={() => navigate('/quiz')}
            className="w-fit px-8 h-12 text-base rounded-lg"
            aria-label="Start the quiz"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
