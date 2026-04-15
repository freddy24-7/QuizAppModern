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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Checkbox
            id={checkboxId}
            checked={option.correct}
            onCheckedChange={() => onToggleCorrect(index)}
          />
          <Label
            htmlFor={checkboxId}
            className="text-xs text-muted-foreground select-none"
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
            className="h-9 text-sm"
          />
        </div>

        {!disableRemove && (
          <Button
            type="button"
            onClick={() => onRemove(index)}
            variant="ghost"
            size="sm"
            aria-label={`Remove option ${index + 1}`}
            className="text-xs text-muted-foreground hover:text-destructive shrink-0"
          >
            Remove
          </Button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-destructive text-xs pl-[4.5rem]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default OptionInput;
