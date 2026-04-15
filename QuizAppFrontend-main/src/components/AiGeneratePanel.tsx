import React, { useState, useRef } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface GeneratedOption {
  text: string;
  correct: boolean;
}

interface GeneratedQuestion {
  text: string;
  options: GeneratedOption[];
}

interface Props {
  onQuestionsGenerated: (questions: GeneratedQuestion[]) => void;
}

const TOPIC_MIN = 3;
const TOPIC_MAX = 120;
const TOPIC_ALPHA_REGEX = /[a-zA-Z]/;
const DEBOUNCE_MS = 3000;

const QUESTION_COUNTS = [5, 10, 15, 20] as const;
type QuestionCount = (typeof QUESTION_COUNTS)[number];

const GEMINI_MODEL = 'gemini-2.0-flash';

function validateTopic(topic: string): string | undefined {
  const trimmed = topic.trim();
  if (!trimmed) return 'Topic is required.';
  if (trimmed.length < TOPIC_MIN)
    return `Topic must be at least ${TOPIC_MIN} characters.`;
  if (trimmed.length > TOPIC_MAX)
    return `Topic must be ${TOPIC_MAX} characters or fewer.`;
  if (!TOPIC_ALPHA_REGEX.test(trimmed))
    return 'Topic must contain at least one letter.';
  return undefined;
}

const AiGeneratePanel: React.FC<Props> = ({ onQuestionsGenerated }) => {
  const [topic, setTopic] = useState('');
  const [topicError, setTopicError] = useState<string | undefined>();
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDebouncing = useRef(false);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
    if (topicError) setTopicError(undefined);
  };

  const handleTopicBlur = () => {
    setTopicError(validateTopic(topic));
  };

  const handleCountChange = (count: QuestionCount) => {
    setQuestionCount(count);
  };

  const handleGenerate = async () => {
    const error = validateTopic(topic);
    if (error) {
      setTopicError(error);
      return;
    }

    if (isDebouncing.current) return;
    isDebouncing.current = true;
    debounceTimer.current = setTimeout(() => {
      isDebouncing.current = false;
    }, DEBOUNCE_MS);

    setStatus('loading');
    setErrorMessage(undefined);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setStatus('error');
      setErrorMessage(
        'Gemini API key is not configured. Add VITE_GEMINI_API_KEY to .env.local.',
      );
      isDebouncing.current = false;
      return;
    }

    const systemPrompt = `You are a quiz generator. Return ONLY valid JSON with no markdown, no explanation.
Format: { "questions": [ { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0 } ] }
Generate ${questionCount} multiple-choice questions about: ${topic.trim()}
Each question must have exactly 4 options and one correct answer.
If the topic is too narrow or obscure to generate a full quiz, return: { "error": "insufficient_topic" }`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
          }),
        },
      );

      if (response.status === 429) {
        setStatus('error');
        setErrorMessage(
          'AI generation is temporarily unavailable — please try again shortly.',
        );
        return;
      }

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const rawText: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      const parsed = JSON.parse(rawText);

      if (parsed.error === 'insufficient_topic') {
        setStatus('error');
        setErrorMessage(
          "Sorry, we couldn't make a quiz about that topic — please try a broader subject.",
        );
        return;
      }

      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('Unexpected response format from Gemini');
      }

      const questions: GeneratedQuestion[] = parsed.questions.map(
        (q: { question: string; options: string[]; correctIndex: number }) => ({
          text: q.question,
          options: q.options.map((opt: string, i: number) => ({
            text: opt,
            correct: i === q.correctIndex,
          })),
        }),
      );

      setStatus('success');
      onQuestionsGenerated(questions);
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        'Something went wrong generating your quiz. Please try again.',
      );
    }
  };

  return (
    <div className="space-y-5 border border-border rounded-lg p-5 bg-card">
      <div aria-live="polite" className="sr-only">
        {status === 'loading' && 'Generating quiz questions...'}
        {status === 'success' && 'Questions generated successfully.'}
        {status === 'error' && errorMessage}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai-topic" className="text-sm">
          Topic
        </Label>
        <Input
          id="ai-topic"
          value={topic}
          onChange={handleTopicChange}
          onBlur={handleTopicBlur}
          placeholder="e.g. The Roman Empire"
          maxLength={TOPIC_MAX}
          aria-describedby={topicError ? 'ai-topic-error' : undefined}
          aria-invalid={!!topicError}
          className="h-9 text-sm"
        />
        {topicError && (
          <p id="ai-topic-error" className="text-destructive text-xs" role="alert">
            {topicError}
          </p>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Number of questions</legend>
        <div className="flex gap-1">
          {QUESTION_COUNTS.map((count) => (
            <label
              key={count}
              className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm cursor-pointer border transition-colors ${
                questionCount === count
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <input
                type="radio"
                name="question-count"
                value={count}
                checked={questionCount === count}
                onChange={() => handleCountChange(count)}
                className="sr-only"
              />
              <span>{count}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {errorMessage && (
        <p className="text-destructive text-xs" role="alert">
          {errorMessage}
        </p>
      )}

      <Button
        type="button"
        onClick={handleGenerate}
        disabled={status === 'loading' || isDebouncing.current}
        className="w-full"
      >
        {status === 'loading' ? 'Generating...' : 'Generate Questions'}
      </Button>
    </div>
  );
};

export default AiGeneratePanel;
