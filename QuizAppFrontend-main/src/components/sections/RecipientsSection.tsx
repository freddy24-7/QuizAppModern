import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface Participant {
  phoneNumber: string;
}

interface Props {
  participants: Participant[];
  errors: (string | undefined)[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

const RecipientsSection: React.FC<Props> = ({
  participants,
  errors,
  onChange,
  onAdd,
  onRemove,
}) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Enter phone numbers in E.164 format (e.g. +31612345678).
    </p>

    {participants.map((p, i) => {
      const inputId = `participant-${i}`;
      const errorId = `participant-${i}-error`;
      return (
        <div key={i} className="space-y-1">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor={inputId} className="sr-only">
                Recipient {i + 1} phone number
              </Label>
              <Input
                id={inputId}
                value={p.phoneNumber}
                onChange={(e) => onChange(i, e.target.value)}
                placeholder="+31612345678"
                aria-describedby={errors[i] ? errorId : undefined}
                aria-invalid={!!errors[i]}
                className="h-12"
              />
            </div>
            {participants.length > 1 && (
              <Button
                type="button"
                onClick={() => onRemove(i)}
                variant="destructive"
                aria-label={`Remove recipient ${i + 1}`}
              >
                Remove
              </Button>
            )}
          </div>
          {errors[i] && (
            <p id={errorId} className="text-red-500 text-sm" role="alert">
              {errors[i]}
            </p>
          )}
        </div>
      );
    })}

    <Button type="button" onClick={onAdd} variant="outline">
      Add Recipient
    </Button>
  </div>
);

export default RecipientsSection;
