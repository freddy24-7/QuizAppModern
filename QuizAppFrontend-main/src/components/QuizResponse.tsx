import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import api, { LobbyStatus, Question, QuizAnswerResponse, QuizDTO } from '../services/api';

const QuizResponse = () => {
  const [searchParams] = useSearchParams();
  const quizIdParam = searchParams.get('quizId');
  const rawPhone = searchParams.get('phoneNumber') ?? '';
  // URLSearchParams decodes '+' as a space; restore it to '+' for E.164 numbers
  const phoneNumber = rawPhone.startsWith(' ') ? '+' + rawPhone.slice(1) : rawPhone;
  const quizId = quizIdParam ? parseInt(quizIdParam, 10) : null;

  const [username, setUsername] = useState('');
  const [currentStep, setCurrentStep] = useState<'username' | 'lobby' | 'questions'>('username');
  const [lobbyStatus, setLobbyStatus] = useState<LobbyStatus | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizData, setQuizData] = useState<QuizDTO | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);

  // Log initial mount and parameters
  useEffect(() => {
    console.log('QuizResponse component mounted');
    console.log('Current quizId from URL:', quizId);
    console.log('Current phoneNumber from URL:', phoneNumber);
  }, [quizId, phoneNumber]);

  // Fetch quiz details when component mounts
  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        if (!quizId || !phoneNumber) {
          console.error('Missing quizId or phoneNumber in URL parameters');
          throw new Error('Quiz ID and phone number are required');
        }
        console.log('Starting to fetch quiz details for quiz:', quizId);

        const response = await api.getQuestions(quizId);
        console.log('Successfully fetched quiz details:', response);

        // Check for null/empty response
        if (!response || Object.values(response).every((val) => val === null)) {
          console.error('Server returned empty or null quiz data');
          throw new Error('Quiz not found or no longer available');
        }

        setQuizData(response);
        setQuestions(response.questions);
        setTimeLeft(response.durationInSeconds);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching quiz details:', err);
        if (err instanceof Error) {
          console.error('Error details:', {
            message: err.message,
            stack: err.stack,
          });
          // Set user-friendly error message based on specific error
          switch (err.message) {
            case 'Quiz not found':
              setError(
                'This quiz does not exist. Please check the link and try again.',
              );
              break;
            case 'Quiz data is invalid':
              setError(
                'This quiz is no longer available. Please check with the quiz organizer.',
              );
              break;
            case 'Server error occurred while fetching quiz':
              setError(
                'Unable to load the quiz at this time. Please try again later.',
              );
              break;
            default:
              setError(
                'An error occurred while loading the quiz. Please try again later.',
              );
          }
        }
        setIsLoading(false);
        // Show error toast
        toast.error('Failed to load quiz. Please try again later.');
      }
    };
    fetchQuizDetails();
  }, [quizId, phoneNumber]);

  useEffect(() => {
    if (currentStep !== 'lobby' || !quizId) return;

    let cancelled = false;

    const pollLobby = async () => {
      try {
        const status = await api.getLobbyStatus(quizId);
        if (cancelled) return;
        setLobbyStatus(status);

        if (status.allReady) {
          setCurrentStep('questions');
          toast.success('All players are ready — quiz starting!');
        }
      } catch {
        if (!cancelled) {
          console.error('Failed to poll lobby status');
        }
      }
    };

    void pollLobby();
    const interval = setInterval(pollLobby, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentStep, quizId]);

  // Timer effect
  useEffect(() => {
    if (currentStep === 'questions' && timeLeft > 0 && !isTimeUp) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsTimeUp(true);
            toast.error('Time is up!');
            return 0;
          }
          // Show warning when 30 seconds remaining
          if (prev === 30) {
            toast.warning('30 seconds remaining!');
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStep, timeLeft, isTimeUp]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (quizData?.closed) {
      toast.error('This quiz is no longer accepting responses');
      return;
    }

    if (!quizId || !phoneNumber) {
      toast.error('Invalid quiz link.');
      return;
    }

    try {
      await api.markReady(quizId, phoneNumber, username.trim());
      setCurrentStep('lobby');
    } catch {
      toast.error('Failed to join the lobby. Please try again.');
    }
  };

  const handleAnswerSubmit = async (selectedAnswer: string) => {
    if (isTimeUp) {
      toast.error('Time is up! You cannot submit more answers.');
      return;
    }

    if (isSubmitting) {
      return; // Prevent multiple submissions while one is in progress
    }

    // Rate limiting - prevent submissions within 1 second of each other
    const now = Date.now();
    if (now - lastSubmissionTime < 1000) {
      toast.warning('Please wait before submitting another answer');
      return;
    }

    try {
      setIsSubmitting(true);
      setLastSubmissionTime(now);

      if (!quizId || !phoneNumber) {
        console.error('Missing quizId or phoneNumber');
        toast.error('Invalid quiz link. Please check the URL.');
        return;
      }

      const currentQuestion = questions[currentQuestionIndex];

      const submissionData: QuizAnswerResponse = {
        phoneNumber,
        username,
        questionId: currentQuestion.id!,
        selectedAnswer,
        quizId,
      };

      console.log('Full submission data:', submissionData);

      await api.submitAnswer(submissionData);
      console.log('Answer submitted successfully');
      toast.success('Answer submitted successfully!');

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        toast.info(`Moving to question ${currentQuestionIndex + 2} of ${questions.length}`);
      } else {
        setSuccess('Thank you for completing the quiz!');
        toast.success('Quiz completed! Thank you for participating!');
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      if (err instanceof AxiosError && err.response?.status === 429) {
        toast.error('Too many attempts. Please wait a moment before trying again.');
      } else {
        toast.error('Failed to submit answer. Please try again.');
      }
      setError('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 border border-green-200 bg-green-50 rounded-xl">
        <p className="text-green-700 text-sm">{success}</p>
      </div>
    );
  }

  if (isTimeUp) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 border border-destructive/20 bg-destructive/5 rounded-xl">
        <p className="text-destructive text-lg font-semibold mb-1">Time&apos;s Up!</p>
        <p className="text-muted-foreground text-sm">
          You&apos;ve run out of time to complete the quiz.
        </p>
      </div>
    );
  }

  if (currentStep === 'lobby') {
    const waitingFor = lobbyStatus
      ? lobbyStatus.totalParticipants - lobbyStatus.readyCount
      : 0;

    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-card border border-border rounded-xl text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Waiting for players</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The quiz will start when everyone is ready.
          </p>
        </div>

        {lobbyStatus && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-primary tabular-nums">
                {lobbyStatus.readyCount}
              </span>
              <span className="text-sm text-muted-foreground">
                / {lobbyStatus.totalParticipants} ready
              </span>
            </div>

            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${(lobbyStatus.readyCount / lobbyStatus.totalParticipants) * 100}%` }}
              />
            </div>

            {lobbyStatus.readyUsernames.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Players ready:</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {lobbyStatus.readyUsernames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-xs font-medium text-primary"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {waitingFor > 0 && (
              <p className="text-xs text-muted-foreground">
                Waiting for {waitingFor} more player{waitingFor !== 1 ? 's' : ''}...
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (currentStep === 'username') {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-card border border-border rounded-xl">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          {quizData?.title || 'Quiz'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">Enter your name to begin.</p>
        <form onSubmit={handleUsernameSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm">Your Name</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              required
              className="h-9 text-sm"
            />
          </div>
          <Button type="submit" className="w-full">
            Start Quiz
          </Button>
          <div className="flex gap-4 text-xs text-muted-foreground">
            {quizData?.startTime && (
              <p>Starts: {new Date(quizData.startTime).toLocaleString()}</p>
            )}
            {quizData?.durationInSeconds && (
              <p>Duration: {Math.floor(quizData.durationInSeconds / 60)} min</p>
            )}
          </div>
        </form>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  return (
    <div className="max-w-2xl mx-auto mt-12 px-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-muted-foreground">{username}</span>
        </div>

        <div className="w-full bg-muted rounded-full h-1 mb-5">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-6">
          {currentQuestion.text}
        </h2>

        <div className="flex items-center gap-2 mb-5">
          <span className={`text-sm font-medium tabular-nums ${timeLeft <= 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-muted-foreground">remaining</span>
        </div>

        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => handleAnswerSubmit(option.text)}
              variant="outline"
              className="w-full text-left justify-start h-auto py-3 px-4 text-sm relative hover:border-primary hover:bg-primary/5 transition-colors"
              disabled={isSubmitting}
            >
              {option.text}
              {isSubmitting && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary border-t-transparent"></div>
                </div>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizResponse;
