import React from 'react';
import { Modal } from './ui/modal';
import { Button } from './ui/button';

interface Props {
  isOpen: boolean;
  questionCount: number;
  participantCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmSendDialog: React.FC<Props> = ({
  isOpen,
  questionCount,
  participantCount,
  onConfirm,
  onCancel,
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} title="Send Quiz?">
    <p className="text-sm text-muted-foreground mb-6">
      You&apos;re about to send a quiz with {questionCount} question
      {questionCount !== 1 ? 's' : ''} to {participantCount} recipient
      {participantCount !== 1 ? 's' : ''} via SMS. This action cannot be undone.
    </p>
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" size="sm" onClick={onConfirm}>
        Send Quiz
      </Button>
    </div>
  </Modal>
);

export default ConfirmSendDialog;
