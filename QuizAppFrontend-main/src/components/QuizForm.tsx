import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Button } from './ui/button';
import { BASE_URL } from '../services/api';
import QuizInfoSection from './sections/QuizInfoSection';
import QuestionItem from './questions/QuestionItem';
import RecipientsSection from './sections/RecipientsSection';
import ConfirmSendDialog from './ConfirmSendDialog';
import AiGeneratePanel from './AiGeneratePanel';

interface Option {
  text: string;
  correct: boolean;
}

interface Question {
  text: string;
  options: Option[];
}

interface Participant {
  phoneNumber: string;
}

interface QuizData {
  title: string;
  durationInSeconds: number;
  questions: Question[];
  participants: Participant[];
}

interface QuestionErrors {
  text?: string;
  noCorrect?: string;
  options: (string | undefined)[];
}

interface FormErrors {
  title?: string;
  duration?: string;
  questions: QuestionErrors[];
  participants: (string | undefined)[];
}

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

const EMPTY_OPTION = (): Option => ({ text: '', correct: false });

const EMPTY_QUESTION = (): Question => ({
  text: '',
  options: [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()],
});

const EMPTY_QUESTION_ERRORS = (): QuestionErrors => ({
  text: undefined,
  noCorrect: undefined,
  options: [undefined, undefined, undefined, undefined],
});

function validateQuizData(data: QuizData): FormErrors {
  const errors: FormErrors = {
    questions: data.questions.map(() => EMPTY_QUESTION_ERRORS()),
    participants: data.participants.map(() => undefined),
  };

  const titleTrimmed = data.title.trim();
  if (!titleTrimmed) {
    errors.title = 'Quiz title is required.';
  } else if (titleTrimmed.length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  } else if (titleTrimmed.length > 120) {
    errors.title = 'Title must be 120 characters or fewer.';
  }

  if (data.durationInSeconds < 30) {
    errors.duration = 'Duration must be at least 30 seconds.';
  }

  data.questions.forEach((q, qi) => {
    const qText = q.text.trim();
    if (!qText) {
      errors.questions[qi].text = 'Question text is required.';
    } else if (qText.length < 10) {
      errors.questions[qi].text = 'Question must be at least 10 characters.';
    } else if (qText.length > 500) {
      errors.questions[qi].text = 'Question must be 500 characters or fewer.';
    }

    const trimmedTexts = q.options.map((o) => o.text.trim());
    const nonEmptyTexts = trimmedTexts.filter(Boolean);
    const hasDuplicates =
      nonEmptyTexts.length !== new Set(nonEmptyTexts).size;

    q.options.forEach((o, oi) => {
      const optText = o.text.trim();
      if (!optText) {
        errors.questions[qi].options[oi] = 'Option text is required.';
      } else if (optText.length > 200) {
        errors.questions[qi].options[oi] =
          'Option must be 200 characters or fewer.';
      } else if (
        hasDuplicates &&
        trimmedTexts.filter((t) => t === optText).length > 1
      ) {
        errors.questions[qi].options[oi] = 'Options must be distinct.';
      }
    });

    if (!q.options.some((o) => o.correct)) {
      errors.questions[qi].noCorrect = 'Mark at least one correct answer.';
    }
  });

  data.participants.forEach((p, pi) => {
    const phone = p.phoneNumber.trim();
    if (!phone) {
      errors.participants[pi] = 'Phone number is required.';
    } else if (!E164_REGEX.test(phone)) {
      errors.participants[pi] =
        'Enter a valid E.164 phone number (e.g. +31612345678).';
    }
  });

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  if (errors.title || errors.duration) return true;
  if (
    errors.questions.some(
      (q) => q.text || q.noCorrect || q.options.some(Boolean),
    )
  )
    return true;
  if (errors.participants.some(Boolean)) return true;
  return false;
}

const QuizForm = () => {
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState<QuizData>({
    title: '',
    durationInSeconds: 120,
    questions: [EMPTY_QUESTION()],
    participants: [{ phoneNumber: '' }],
  });

  const [errors, setErrors] = useState<FormErrors>({
    questions: [EMPTY_QUESTION_ERRORS()],
    participants: [undefined],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [questionMode, setQuestionMode] = useState<'manual' | 'ai'>('manual');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setQuizData((prev) => ({ ...prev, title }));
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const durationInSeconds = parseInt(e.target.value, 10) || 30;
    setQuizData((prev) => ({ ...prev, durationInSeconds }));
    if (errors.duration) {
      setErrors((prev) => ({ ...prev, duration: undefined }));
    }
  };

  const handleQuestionTextChange = (questionIndex: number, text: string) => {
    setQuizData((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex] = { ...questions[questionIndex], text };
      return { ...prev, questions };
    });
    setErrors((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex] = {
        ...questions[questionIndex],
        text: undefined,
      };
      return { ...prev, questions };
    });
  };

  const handleOptionTextChange = (
    questionIndex: number,
    optionIndex: number,
    text: string,
  ) => {
    setQuizData((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[questionIndex].options];
      options[optionIndex] = { ...options[optionIndex], text };
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
    setErrors((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[questionIndex].options];
      options[optionIndex] = undefined;
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
  };

  const handleToggleCorrect = (questionIndex: number, optionIndex: number) => {
    setQuizData((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[questionIndex].options];
      options[optionIndex] = {
        ...options[optionIndex],
        correct: !options[optionIndex].correct,
      };
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
    setErrors((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex] = {
        ...questions[questionIndex],
        noCorrect: undefined,
      };
      return { ...prev, questions };
    });
  };

  const handleAddOption = (questionIndex: number) => {
    setQuizData((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[questionIndex].options, EMPTY_OPTION()];
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
    setErrors((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[questionIndex].options, undefined];
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    if (quizData.questions[questionIndex].options.length <= 2) return;
    setQuizData((prev) => {
      const questions = [...prev.questions];
      const options = questions[questionIndex].options.filter(
        (_, i) => i !== optionIndex,
      );
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
    setErrors((prev) => {
      const questions = [...prev.questions];
      const options = questions[questionIndex].options.filter(
        (_, i) => i !== optionIndex,
      );
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
  };

  const handleAddQuestion = () => {
    setQuizData((prev) => ({
      ...prev,
      questions: [...prev.questions, EMPTY_QUESTION()],
    }));
    setErrors((prev) => ({
      ...prev,
      questions: [...prev.questions, EMPTY_QUESTION_ERRORS()],
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    if (quizData.questions.length <= 1) return;
    setQuizData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
    setErrors((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handlePhoneChange = (index: number, value: string) => {
    setQuizData((prev) => {
      const participants = [...prev.participants];
      participants[index] = { phoneNumber: value };
      return { ...prev, participants };
    });
    setErrors((prev) => {
      const participants = [...prev.participants];
      participants[index] = undefined;
      return { ...prev, participants };
    });
  };

  const handleAddParticipant = () => {
    setQuizData((prev) => ({
      ...prev,
      participants: [...prev.participants, { phoneNumber: '' }],
    }));
    setErrors((prev) => ({
      ...prev,
      participants: [...prev.participants, undefined],
    }));
  };

  const handleRemoveParticipant = (index: number) => {
    if (quizData.participants.length <= 1) return;
    setQuizData((prev) => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }));
    setErrors((prev) => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }));
  };

  const handleSendClick = () => {
    const validationErrors = validateQuizData(quizData);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      toast.error('Please fix the errors above before sending.');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    setSubmitStatus('sending');

    try {
      const payload = {
        title: quizData.title.trim(),
        durationInSeconds: quizData.durationInSeconds,
        startTime: new Date().toISOString().slice(0, 19),
        closed: false,
        questions: quizData.questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => ({
            text: o.text.trim(),
            correct: o.correct,
          })),
        })),
        participants: quizData.participants.map((p) => ({
          phoneNumber: p.phoneNumber.trim(),
        })),
      };

      const res = await axios.post(`${BASE_URL}/api/quizzes`, payload);

      if (!res.data?.id) {
        throw new Error('Invalid response from server');
      }

      setSubmitStatus('success');
      toast.success('Quiz created and invites sent!');
      navigate(`/quiz/results/${res.data.id}`);
    } catch (err) {
      setSubmitStatus('error');
      let msg = 'We could not create the quiz right now.';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          msg =
            "You've sent too many requests. Please wait a few minutes before trying again.";
        } else {
          msg = err.response?.data?.message || msg;
        }
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = () => setShowConfirmDialog(false);

  const handleSwitchToManual = () => setQuestionMode('manual');
  const handleSwitchToAi = () => setQuestionMode('ai');

  const handleQuestionsGenerated = (
    generated: { text: string; options: { text: string; correct: boolean }[] }[],
  ) => {
    setQuizData((prev) => ({ ...prev, questions: generated }));
    setErrors((prev) => ({
      ...prev,
      questions: generated.map(() => EMPTY_QUESTION_ERRORS()),
    }));
    setQuestionMode('manual');
    toast.success(`${generated.length} questions loaded — review and edit below.`);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div aria-live="polite" className="sr-only">
        {submitStatus === 'sending' && 'Sending quiz...'}
        {submitStatus === 'success' && 'Quiz sent successfully.'}
        {submitStatus === 'error' && 'Failed to send quiz.'}
      </div>

      <h1 className="text-4xl font-bold">Create a New Quiz</h1>

      {/* Section 1: Quiz Info */}
      <section aria-labelledby="section-info">
        <h2 id="section-info" className="text-2xl font-semibold mb-4">
          Quiz Info
        </h2>
        <QuizInfoSection
          title={quizData.title}
          duration={quizData.durationInSeconds}
          titleError={errors.title}
          durationError={errors.duration}
          onTitleChange={handleTitleChange}
          onDurationChange={handleDurationChange}
        />
      </section>

      {/* Section 2: Questions */}
      <section aria-labelledby="section-questions">
        <div className="flex items-center justify-between mb-4">
          <h2 id="section-questions" className="text-2xl font-semibold">
            Questions ({quizData.questions.length})
          </h2>
          <div className="flex gap-2" role="group" aria-label="Question creation mode">
            <Button
              type="button"
              variant={questionMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={handleSwitchToManual}
              aria-pressed={questionMode === 'manual'}
            >
              Create manually
            </Button>
            <Button
              type="button"
              variant={questionMode === 'ai' ? 'default' : 'outline'}
              size="sm"
              onClick={handleSwitchToAi}
              aria-pressed={questionMode === 'ai'}
            >
              Generate with AI
            </Button>
          </div>
        </div>

        {questionMode === 'ai' && (
          <AiGeneratePanel onQuestionsGenerated={handleQuestionsGenerated} />
        )}

        {questionMode === 'manual' && (
          <>
            <div className="space-y-4">
              {quizData.questions.map((question, qi) => (
                <QuestionItem
                  key={qi}
                  index={qi}
                  question={question}
                  errors={errors.questions[qi]}
                  canRemove={quizData.questions.length > 1}
                  onTextChange={handleQuestionTextChange}
                  onOptionTextChange={handleOptionTextChange}
                  onToggleCorrect={handleToggleCorrect}
                  onAddOption={handleAddOption}
                  onRemoveOption={handleRemoveOption}
                  onRemove={handleRemoveQuestion}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddQuestion}
              className="mt-4"
            >
              Add Question
            </Button>
          </>
        )}
      </section>

      {/* Section 3: Recipients */}
      <section aria-labelledby="section-recipients">
        <h2 id="section-recipients" className="text-2xl font-semibold mb-4">
          Recipients
        </h2>
        <RecipientsSection
          participants={quizData.participants}
          errors={errors.participants}
          onChange={handlePhoneChange}
          onAdd={handleAddParticipant}
          onRemove={handleRemoveParticipant}
        />
      </section>

      {/* Section 4: Send */}
      <section>
        <h2 className="sr-only">Send Quiz</h2>
        <Button
          onClick={handleSendClick}
          disabled={isSubmitting}
          size="lg"
          className="text-lg px-8"
        >
          {isSubmitting ? 'Sending...' : 'Send Quiz'}
        </Button>
      </section>

      <ConfirmSendDialog
        isOpen={showConfirmDialog}
        questionCount={quizData.questions.length}
        participantCount={quizData.participants.length}
        onConfirm={handleConfirmSend}
        onCancel={handleCancelConfirm}
      />
    </div>
  );
};

export default QuizForm;
