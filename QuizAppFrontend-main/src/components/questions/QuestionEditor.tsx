import React from 'react';
import { Label } from '../ui/label.tsx';
import { Textarea } from '../ui/textarea.tsx';
import { Button } from '../ui/button.tsx';
import OptionInput from '../steps/OptionInput.tsx';

interface Option {
  text: string;
  correct: boolean;
}

interface Props {
  questionIndex: number;
  questionText: string;
  options: Option[];
  questionTextError?: string;
  optionErrors?: (string | undefined)[];
  noCorrectError?: string;
  onQuestionTextChange: (text: string) => void;
  onOptionTextChange: (index: number, text: string) => void;
  onOptionCorrectToggle: (index: number) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
}

const QuestionEditor: React.FC<Props> = ({
  questionIndex,
  questionText,
  options,
  questionTextError,
  optionErrors,
  noCorrectError,
  onQuestionTextChange,
  onOptionTextChange,
  onOptionCorrectToggle,
  onAddOption,
  onRemoveOption,
}) => {
  const textareaId = `q${questionIndex}-text`;
  const textareaErrorId = `q${questionIndex}-text-error`;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={textareaId} className="text-sm">
          Question Text
        </Label>
        <Textarea
          id={textareaId}
          value={questionText}
          onChange={(e) => onQuestionTextChange(e.target.value)}
          placeholder="Enter your question"
          aria-describedby={questionTextError ? textareaErrorId : undefined}
          aria-invalid={!!questionTextError}
          className="min-h-[80px] text-sm"
        />
        {questionTextError && (
          <p id={textareaErrorId} className="text-destructive text-xs" role="alert">
            {questionTextError}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Answer Options</p>
          <p className="text-xs text-muted-foreground">Check the correct answer(s)</p>
        </div>
        {noCorrectError && (
          <p className="text-destructive text-xs" role="alert">
            {noCorrectError}
          </p>
        )}

        {options.map((option, index) => (
          <OptionInput
            key={index}
            questionIndex={questionIndex}
            index={index}
            option={option}
            error={optionErrors?.[index]}
            onTextChange={onOptionTextChange}
            onToggleCorrect={onOptionCorrectToggle}
            onRemove={onRemoveOption}
            disableRemove={options.length <= 2}
          />
        ))}

        <Button
          type="button"
          onClick={onAddOption}
          variant="outline"
          size="sm"
          className="mt-1 text-xs border-dashed"
        >
          + Add Option
        </Button>
      </div>
    </div>
  );
};

export default QuestionEditor;
