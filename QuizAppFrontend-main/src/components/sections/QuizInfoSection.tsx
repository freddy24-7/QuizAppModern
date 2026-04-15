import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface Props {
  title: string;
  duration: number;
  titleError?: string;
  durationError?: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const QuizInfoSection: React.FC<Props> = ({
  title,
  duration,
  titleError,
  durationError,
  onTitleChange,
  onDurationChange,
}) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="quiz-title" className="text-base">
        Quiz Title
      </Label>
      <Input
        id="quiz-title"
        value={title}
        onChange={onTitleChange}
        placeholder="Enter quiz title"
        aria-describedby={titleError ? 'quiz-title-error' : undefined}
        aria-invalid={!!titleError}
        className="h-12"
      />
      {titleError && (
        <p id="quiz-title-error" className="text-red-500 text-sm" role="alert">
          {titleError}
        </p>
      )}
    </div>

    <div className="space-y-2">
      <Label htmlFor="quiz-duration" className="text-base">
        Duration (seconds)
      </Label>
      <Input
        id="quiz-duration"
        type="number"
        value={duration}
        onChange={onDurationChange}
        min="30"
        aria-describedby={durationError ? 'quiz-duration-error' : undefined}
        aria-invalid={!!durationError}
        className="h-12"
      />
      {durationError && (
        <p id="quiz-duration-error" className="text-red-500 text-sm" role="alert">
          {durationError}
        </p>
      )}
    </div>
  </div>
);

export default QuizInfoSection;
