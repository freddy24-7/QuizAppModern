import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface Props {
  title: string;
  duration: number;
  titleError?: string;
  durationError?: string;
  hideTitle?: boolean;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const QuizInfoSection: React.FC<Props> = ({
  title,
  duration,
  titleError,
  durationError,
  hideTitle = false,
  onTitleChange,
  onDurationChange,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
    {!hideTitle && (
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="quiz-title" className="text-sm">
          Quiz Title
        </Label>
        <Input
          id="quiz-title"
          value={title}
          onChange={onTitleChange}
          placeholder="Enter quiz title"
          aria-describedby={titleError ? 'quiz-title-error' : undefined}
          aria-invalid={!!titleError}
          className="h-9 text-sm"
        />
        {titleError && (
          <p id="quiz-title-error" className="text-destructive text-xs" role="alert">
            {titleError}
          </p>
        )}
      </div>
    )}

    <div className="space-y-2">
      <Label htmlFor="quiz-duration" className="text-sm">
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
        className="h-9 text-sm"
      />
      {durationError && (
        <p id="quiz-duration-error" className="text-destructive text-xs" role="alert">
          {durationError}
        </p>
      )}
    </div>
  </div>
);

export default QuizInfoSection;
