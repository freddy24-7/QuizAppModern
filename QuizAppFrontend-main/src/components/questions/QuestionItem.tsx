import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import QuestionEditor from './QuestionEditor';

interface Option {
  text: string;
  correct: boolean;
}

interface Question {
  text: string;
  options: Option[];
}

interface QuestionErrors {
  text?: string;
  noCorrect?: string;
  options: (string | undefined)[];
}

interface Props {
  index: number;
  question: Question;
  errors: QuestionErrors;
  canRemove: boolean;
  onTextChange: (questionIndex: number, text: string) => void;
  onOptionTextChange: (questionIndex: number, optionIndex: number, text: string) => void;
  onToggleCorrect: (questionIndex: number, optionIndex: number) => void;
  onAddOption: (questionIndex: number) => void;
  onRemoveOption: (questionIndex: number, optionIndex: number) => void;
  onRemove: (questionIndex: number) => void;
}

const QuestionItem: React.FC<Props> = ({
  index,
  question,
  errors,
  canRemove,
  onTextChange,
  onOptionTextChange,
  onToggleCorrect,
  onAddOption,
  onRemoveOption,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasError = !!(
    errors.text ||
    errors.noCorrect ||
    errors.options.some(Boolean)
  );

  const questionPreview = question.text.trim()
    ? question.text.length > 60
      ? question.text.slice(0, 60) + '...'
      : question.text
    : 'New question';

  const handleToggleExpanded = () => setIsExpanded((prev) => !prev);

  const handleTextChange = (text: string) => onTextChange(index, text);

  const handleOptionTextChange = (optionIndex: number, text: string) =>
    onOptionTextChange(index, optionIndex, text);

  const handleToggleCorrect = (optionIndex: number) =>
    onToggleCorrect(index, optionIndex);

  const handleAddOption = () => onAddOption(index);

  const handleRemoveOption = (optionIndex: number) =>
    onRemoveOption(index, optionIndex);

  const handleRemove = () => onRemove(index);

  const headerId = `question-${index}-header`;
  const bodyId = `question-${index}-body`;

  return (
    <div className="border border-border rounded-lg bg-card" aria-labelledby={headerId}>
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          id={headerId}
          aria-expanded={isExpanded}
          aria-controls={bodyId}
          onClick={handleToggleExpanded}
          className="flex-1 text-left font-medium flex items-center gap-2 text-sm text-foreground"
        >
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
          />
          <span>Question {index + 1}</span>
          {!isExpanded && (
            <span className="text-muted-foreground font-normal text-xs truncate max-w-[200px]">
              — {questionPreview}
            </span>
          )}
          {hasError && !isExpanded && (
            <span className="inline-flex items-center justify-center size-2 rounded-full bg-destructive shrink-0" aria-label="Has errors" />
          )}
        </button>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            aria-label={`Remove question ${index + 1}`}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </Button>
        )}
      </div>

      {isExpanded && (
        <div id={bodyId} className="px-4 pb-4 border-t border-border pt-4">
          <QuestionEditor
            questionIndex={index}
            questionText={question.text}
            options={question.options}
            questionTextError={errors.text}
            optionErrors={errors.options}
            noCorrectError={errors.noCorrect}
            onQuestionTextChange={handleTextChange}
            onOptionTextChange={handleOptionTextChange}
            onOptionCorrectToggle={handleToggleCorrect}
            onAddOption={handleAddOption}
            onRemoveOption={handleRemoveOption}
          />
        </div>
      )}
    </div>
  );
};

export default QuestionItem;
