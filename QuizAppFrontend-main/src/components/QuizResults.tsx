import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { QuizResult } from '../services/api';
import { Button } from './ui/button';

const QuizResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const generateBarShades = (score: number) => {
    return Array.from({ length: score }).map((_, index) => {
      const lightness = 48 - (index % 4) * 3;
      return `hsla(239, 84%, ${lightness}%, 1)`;
    });
  };

  const fetchQuizDetails = useCallback(async () => {
    if (!quizId) {
      setError('Quiz ID is required');
      return;
    }
    try {
      const quizData = await api.getQuestions(quizId);
      setTotalQuestions(quizData.questions.length);
    } catch (err) {
      console.error('Error fetching quiz details:', err);
      setError('Failed to load quiz details');
    }
  }, [quizId]);

  const fetchResults = useCallback(async () => {
    if (!quizId) {
      setError('Quiz ID is required');
      return;
    }
    try {
      const response = await api.getResults(quizId, currentPage);
      const filteredResults = response.results.filter(
        (result) => result.quizId === Number(quizId),
      );
      setResults(filteredResults);
      setTotalPages(response.totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load quiz results');
    } finally {
      setIsLoading(false);
    }
  }, [quizId, currentPage]);

  useEffect(() => {
    const fetchAll = async () => {
      await fetchQuizDetails();
      await fetchResults();
    };

    void fetchAll();
    const interval = setInterval(() => {
      void fetchResults();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchQuizDetails, fetchResults]);

  const renderScoreBar = (result: QuizResult) => {
    const segmentHeight = totalQuestions > 0 ? (1 / totalQuestions) * 100 : 0;
    const blueShades = generateBarShades(result.score);

    return (
      <div
        className="relative w-16 bg-muted rounded-lg overflow-hidden"
        style={{ height: '180px' }}
      >
        {Array.from({ length: totalQuestions }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="absolute w-full border-t border-border"
            style={{
              bottom: `${(index / totalQuestions) * 100}%`,
              height: `${segmentHeight}%`,
            }}
          />
        ))}

        {Array.from({ length: result.score }).map((_, index) => (
          <div
            key={`score-${index}`}
            className="absolute w-full transition-all duration-500 ease-in-out hover:brightness-110"
            style={{
              bottom: `${(index / totalQuestions) * 100}%`,
              height: `${segmentHeight}%`,
              backgroundColor: blueShades[index],
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
        ))}

        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-foreground whitespace-nowrap tabular-nums">
          {result.score}/{totalQuestions}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 border border-destructive/20 bg-destructive/5 rounded-xl">
        <p className="text-destructive text-sm">{error}</p>
        <Button
          onClick={() => navigate('/')}
          className="mt-4 w-full"
          variant="outline"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quiz Results</h1>
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          size="sm"
        >
          New Quiz
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Score Distribution
        </h2>
        <div className="flex items-end justify-around h-56 gap-4">
          {results.map((result) => (
            <div
              key={`${result.participantId}-${result.quizId}`}
              className="flex flex-col items-center gap-2"
            >
              {renderScoreBar(result)}
              <div className="text-xs font-medium text-foreground mt-2">
                {result.username}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {result.questionIds.length} answered
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Submission
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((result, index) => (
                <tr
                  key={`${result.participantId}-${result.quizId}`}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-foreground tabular-nums">
                    {currentPage * 10 + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {result.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                    {result.questionIds.length} / {totalQuestions}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium tabular-nums">
                    {result.score} / {totalQuestions}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {result.lastSubmittedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-3 border-t border-border">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage === totalPages - 1}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground text-center">
        Results update automatically every 5 seconds
      </p>
    </div>
  );
};

export default QuizResults;
