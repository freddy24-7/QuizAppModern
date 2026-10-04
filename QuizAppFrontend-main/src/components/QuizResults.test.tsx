import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QuizResults from './QuizResults';
import api from '../services/api';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, ...rest }: { value: string }) => (
    <svg data-testid="qr-code" data-value={value} {...rest} />
  ),
}));

vi.mock('../services/api', () => ({
  BASE_URL: 'http://localhost:8080',
  default: {
    getQuestions: vi.fn(),
    getResults: vi.fn(),
    getLobbyStatus: vi.fn(),
    startQuiz: vi.fn(),
    deleteQuiz: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

function renderHostPage() {
  return render(
    <MemoryRouter initialEntries={['/quiz/results/7']}>
      <Routes>
        <Route path="/quiz/results/:quizId" element={<QuizResults />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('QuizResults host lobby', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.getQuestions.mockResolvedValue({
      id: 7,
      title: 'Test Quiz',
      durationInSeconds: 120,
      startTime: '2025-01-01T10:00:00',
      closed: false,
      questions: [],
    });
    mockedApi.getResults.mockResolvedValue({
      totalResults: 0,
      size: 10,
      totalPages: 0,
      page: 0,
      results: [],
    });
    mockedApi.deleteQuiz.mockResolvedValue();
  });

  it('shows a QR code that encodes the join link for this quiz', async () => {
    mockedApi.getLobbyStatus.mockResolvedValue({
      joinedCount: 0,
      started: false,
      usernames: [],
    });
    renderHostPage();

    const qr = await screen.findByRole('img', { name: /QR code to join the quiz/i });
    const expectedUrl = `${window.location.origin}/quiz/respond?quizId=7`;
    expect(qr).toHaveAttribute('data-value', expectedUrl);
    expect(screen.getByRole('link', { name: expectedUrl })).toHaveAttribute(
      'href',
      expectedUrl,
    );
  });

  it('keeps Start disabled until a player has joined', async () => {
    mockedApi.getLobbyStatus.mockResolvedValue({
      joinedCount: 0,
      started: false,
      usernames: [],
    });
    renderHostPage();

    const startButton = await screen.findByRole('button', { name: /Start Quiz/i });
    expect(startButton).toBeDisabled();
    expect(screen.getByText('0 players joined')).toBeInTheDocument();
    expect(startButton).toHaveAccessibleDescription(
      /Waiting for the first player to join/,
    );
  });

  it('lists joined players and starts the quiz when the host clicks Start', async () => {
    const user = userEvent.setup();
    mockedApi.getLobbyStatus.mockResolvedValue({
      joinedCount: 2,
      started: false,
      usernames: ['Alice', 'Bob'],
    });
    mockedApi.startQuiz.mockResolvedValue({
      joinedCount: 2,
      started: true,
      usernames: ['Alice', 'Bob'],
    });
    renderHostPage();

    expect(await screen.findByText('2 players joined')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));

    expect(mockedApi.startQuiz).toHaveBeenCalledWith('7');
    expect(
      await screen.findByRole('heading', { name: 'Quiz Results' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

  it('shows an inline error when starting fails', async () => {
    const user = userEvent.setup();
    mockedApi.getLobbyStatus.mockResolvedValue({
      joinedCount: 1,
      started: false,
      usernames: ['Alice'],
    });
    mockedApi.startQuiz.mockRejectedValue(new Error('network down'));
    renderHostPage();

    await screen.findByText('1 player joined');
    await user.click(screen.getByRole('button', { name: /Start Quiz/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not start the quiz. Please try again.',
      );
    });
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
  });
});
