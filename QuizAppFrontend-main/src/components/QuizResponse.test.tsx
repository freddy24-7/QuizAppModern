import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError, AxiosResponse } from 'axios';
import QuizResponse from './QuizResponse';
import api from '../services/api';

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('../services/api', () => ({
  BASE_URL: 'http://localhost:8080',
  default: {
    getQuestions: vi.fn(),
    joinQuiz: vi.fn(),
    getLobbyStatus: vi.fn(),
    submitAnswer: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

function axiosError(status: number, data: unknown) {
  return new AxiosError('Request failed', String(status), undefined, undefined, {
    status,
    data,
  } as AxiosResponse);
}

function renderJoinPage() {
  return render(
    <MemoryRouter initialEntries={['/quiz/respond?quizId=7']}>
      <QuizResponse />
    </MemoryRouter>,
  );
}

describe('QuizResponse join flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockedApi.getQuestions.mockResolvedValue({
      id: 7,
      title: 'Test Quiz',
      durationInSeconds: 120,
      startTime: '2025-01-01T10:00:00',
      closed: false,
      questions: [
        {
          id: 50,
          text: 'What is the Java programming language?',
          options: [
            { text: 'A language', correct: true },
            { text: 'A coffee', correct: false },
          ],
        },
      ],
    });
    mockedApi.getLobbyStatus.mockResolvedValue({
      joinedCount: 1,
      started: false,
      usernames: ['Alice'],
    });
  });

  it('asks only for a name, with a labelled field', async () => {
    renderJoinPage();

    expect(await screen.findByLabelText('Your Name')).toBeInTheDocument();
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
  });

  it('shows an inline error linked to the field when the name is blank', async () => {
    const user = userEvent.setup();
    renderJoinPage();

    await user.click(await screen.findByRole('button', { name: /Join Quiz/i }));

    const input = screen.getByLabelText('Your Name');
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your name.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'username-error');
    expect(mockedApi.joinQuiz).not.toHaveBeenCalled();
  });

  it('joins with the trimmed name and waits for the host to start', async () => {
    const user = userEvent.setup();
    mockedApi.joinQuiz.mockResolvedValue({ participantId: 42, username: 'Alice' });
    renderJoinPage();

    await user.type(await screen.findByLabelText('Your Name'), '  Alice ');
    await user.click(screen.getByRole('button', { name: /Join Quiz/i }));

    expect(mockedApi.joinQuiz).toHaveBeenCalledWith(7, 'Alice');
    expect(
      await screen.findByText('Waiting for the host to start the quiz.'),
    ).toBeInTheDocument();
  });

  it('shows the server message when the name is taken or the quiz has started', async () => {
    const user = userEvent.setup();
    mockedApi.joinQuiz.mockRejectedValue(
      axiosError(409, { detail: 'This quiz has already started.' }),
    );
    renderJoinPage();

    await user.type(await screen.findByLabelText('Your Name'), 'Alice');
    await user.click(screen.getByRole('button', { name: /Join Quiz/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This quiz has already started.',
    );
  });

  it('shows a friendly message on a 429 response', async () => {
    const user = userEvent.setup();
    mockedApi.joinQuiz.mockRejectedValue(axiosError(429, {}));
    renderJoinPage();

    await user.type(await screen.findByLabelText('Your Name'), 'Alice');
    await user.click(screen.getByRole('button', { name: /Join Quiz/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Too many join attempts/,
    );
  });

  it('submits answers with the participant ID once the host has started', async () => {
    const user = userEvent.setup();
    mockedApi.joinQuiz.mockResolvedValue({ participantId: 42, username: 'Alice' });
    mockedApi.getLobbyStatus.mockResolvedValue({
      joinedCount: 1,
      started: true,
      usernames: ['Alice'],
    });
    mockedApi.submitAnswer.mockResolvedValue();
    renderJoinPage();

    await user.type(await screen.findByLabelText('Your Name'), 'Alice');
    await user.click(screen.getByRole('button', { name: /Join Quiz/i }));

    await user.click(await screen.findByRole('button', { name: 'A language' }));

    await waitFor(() => {
      expect(mockedApi.submitAnswer).toHaveBeenCalledWith({
        participantId: 42,
        questionId: 50,
        selectedAnswer: 'A language',
        quizId: 7,
      });
    });
  });

  it('does not join twice after a refresh', async () => {
    sessionStorage.setItem(
      'quiz-7-participant',
      JSON.stringify({ participantId: 42, username: 'Alice' }),
    );
    renderJoinPage();

    expect(
      await screen.findByText('Waiting for the host to start the quiz.'),
    ).toBeInTheDocument();
    expect(mockedApi.joinQuiz).not.toHaveBeenCalled();
  });
});
