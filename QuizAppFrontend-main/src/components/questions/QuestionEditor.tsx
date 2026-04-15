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
    <div className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor={textareaId} className="text-base">
          Question Text
        </Label>
        <Textarea
          id={textareaId}
          value={questionText}
          onChange={(e) => onQuestionTextChange(e.target.value)}
          placeholder="Enter your question"
          aria-describedby={questionTextError ? textareaErrorId : undefined}
          aria-invalid={!!questionTextError}
          className="min-h-[100px]"
        />
        {questionTextError && (
          <p id={textareaErrorId} className="text-red-500 text-sm" role="alert">
            {questionTextError}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mark correct answer(s)
        </p>
        {noCorrectError && (
          <p className="text-red-500 text-sm" role="alert">
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
          className="mt-2"
        >
          Add Option
        </Button>
      </div>
    </div>
  );
};

export default QuestionEditor;
