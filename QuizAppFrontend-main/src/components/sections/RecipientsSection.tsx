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
  <div className="space-y-3">
    <p className="text-xs text-muted-foreground">
      Enter phone numbers in E.164 format (e.g. +31612345678).
    </p>

    {participants.map((p, i) => {
      const inputId = `participant-${i}`;
      const errorId = `participant-${i}-error`;
      return (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-3">
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
                className="h-9 text-sm"
              />
            </div>
            {participants.length > 1 && (
              <Button
                type="button"
                onClick={() => onRemove(i)}
                variant="ghost"
                size="sm"
                aria-label={`Remove recipient ${i + 1}`}
                className="text-xs text-muted-foreground hover:text-destructive shrink-0"
              >
                Remove
              </Button>
            )}
          </div>
          {errors[i] && (
            <p id={errorId} className="text-destructive text-xs" role="alert">
              {errors[i]}
            </p>
          )}
        </div>
      );
    })}

    <Button type="button" onClick={onAdd} variant="outline" className="w-full border-dashed">
      + Add Recipient
    </Button>
  </div>
);

export default RecipientsSection;
