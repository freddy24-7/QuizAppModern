import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';

interface Option {
  text: string;
  correct: boolean;
}

interface Props {
  questionIndex: number;
  index: number;
  option: Option;
  error?: string;
  onTextChange: (index: number, text: string) => void;
  onToggleCorrect: (index: number) => void;
  onRemove: (index: number) => void;
  disableRemove?: boolean;
}

const OptionInput: React.FC<Props> = ({
  questionIndex,
  index,
  option,
  error,
  onTextChange,
  onToggleCorrect,
  onRemove,
  disableRemove = false,
}) => {
  const checkboxId = `q${questionIndex}-opt${index}-correct`;
  const inputId = `q${questionIndex}-opt${index}`;
  const errorId = `q${questionIndex}-opt${index}-error`;

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={checkboxId}
            checked={option.correct}
            onCheckedChange={() => onToggleCorrect(index)}
          />
          <Label
            htmlFor={checkboxId}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Correct
          </Label>
        </div>

        <div className="flex-1">
          <Label htmlFor={inputId} className="sr-only">
            Option {index + 1}
          </Label>
          <Input
            id={inputId}
            value={option.text}
            onChange={(e) => onTextChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={!!error}
            className="h-12"
          />
        </div>

        {!disableRemove && (
          <Button
            type="button"
            onClick={() => onRemove(index)}
            variant="destructive"
            size="sm"
            aria-label={`Remove option ${index + 1}`}
          >
            Remove
          </Button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-red-500 text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default OptionInput;
