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
    <p className="text-gray-600 dark:text-gray-400 mb-6">
      You're about to send a quiz with {questionCount} question
      {questionCount !== 1 ? 's' : ''} to {participantCount} recipient
      {participantCount !== 1 ? 's' : ''} via SMS. This action cannot be undone.
    </p>
    <div className="flex justify-end space-x-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" onClick={onConfirm}>
        Send Quiz
      </Button>
    </div>
  </Modal>
);

export default ConfirmSendDialog;
