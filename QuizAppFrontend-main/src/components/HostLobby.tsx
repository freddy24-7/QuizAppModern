import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';
import { LobbyStatus } from '../services/api';

interface Props {
  joinUrl: string;
  lobbyStatus: LobbyStatus | null;
  isStarting: boolean;
  startError: string | null;
  onStart: () => void;
}

const HostLobby: React.FC<Props> = ({
  joinUrl,
  lobbyStatus,
  isStarting,
  startError,
  onStart,
}) => {
  const usernames = lobbyStatus?.usernames ?? [];
  const joinedCount = usernames.length;
  const canStart = joinedCount > 0 && !isStarting;

  return (
    <div className="bg-card border border-border rounded-xl p-6 text-center space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Scan to join</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Players scan this QR code with their phone camera and enter a name.
        </p>
      </div>

      <div className="inline-block bg-white p-4 rounded-lg">
        <QRCodeSVG
          value={joinUrl}
          size={224}
          role="img"
          aria-label="QR code to join the quiz"
        />
      </div>

      <p className="text-xs text-muted-foreground break-all">
        Or open this link: <a href={joinUrl} className="text-primary underline">{joinUrl}</a>
      </p>

      <div aria-live="polite" className="pt-4 border-t border-border space-y-2">
        <p className="text-sm font-medium text-foreground">
          {joinedCount} player{joinedCount !== 1 ? 's' : ''} joined
        </p>
        {joinedCount > 0 && (
          <ul className="flex flex-wrap justify-center gap-1.5">
            {usernames.map((name) => (
              <li
                key={name}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-xs font-medium text-primary"
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          aria-describedby="start-quiz-hint"
          className="w-full sm:w-auto"
        >
          {isStarting ? 'Starting...' : 'Start Quiz'}
        </Button>
        <p id="start-quiz-hint" className="text-xs text-muted-foreground">
          {joinedCount === 0
            ? 'Waiting for the first player to join.'
            : 'Start when everyone has joined. Nobody can join after the quiz starts.'}
        </p>
        {startError && (
          <p className="text-destructive text-xs" role="alert">
            {startError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Keep this page open. Leaving it ends the quiz and deletes its data.
        </p>
      </div>
    </div>
  );
};

export default HostLobby;
