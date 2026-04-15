import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AiGeneratePanel from './AiGeneratePanel';

const mockOnQuestionsGenerated = vi.fn();

const GEMINI_RESPONSE = {
  candidates: [{
    content: {
      parts: [{
        text: JSON.stringify({
          questions: [
            {
              question: 'Who founded Rome?',
              options: ['Romulus', 'Caesar', 'Augustus', 'Nero'],
              correctIndex: 0,
            },
          ],
        }),
      }],
    },
  }],
};

function renderPanel() {
  return render(
    <AiGeneratePanel onQuestionsGenerated={mockOnQuestionsGenerated} />,
  );
}

describe('AiGeneratePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    // Provide a fake API key so the panel doesn't bail early
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('renders topic input and generate button', () => {
    renderPanel();
    expect(screen.getByLabelText('Topic')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Generate Questions/i }),
    ).toBeInTheDocument();
  });

  it('shows error when topic is empty', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: /Generate Questions/i }));

    expect(screen.getByText('Topic is required.')).toBeInTheDocument();
  });

  it('shows error when topic has no letters', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText('Topic'), '12345');
    await user.click(screen.getByRole('button', { name: /Generate Questions/i }));

    expect(
      screen.getByText('Topic must contain at least one letter.'),
    ).toBeInTheDocument();
  });

  it('shows error when topic is too short', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText('Topic'), 'AB');
    await user.click(screen.getByRole('button', { name: /Generate Questions/i }));

    expect(
      screen.getByText(/at least 3 characters/i),
    ).toBeInTheDocument();
  });

  it('calls onQuestionsGenerated on successful generation', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => GEMINI_RESPONSE,
    } as Response);

    renderPanel();

    await user.type(screen.getByLabelText('Topic'), 'Ancient Rome');
    await user.click(screen.getByRole('button', { name: /Generate Questions/i }));

    await waitFor(() => {
      expect(mockOnQuestionsGenerated).toHaveBeenCalledWith([
        {
          text: 'Who founded Rome?',
          options: [
            { text: 'Romulus', correct: true },
            { text: 'Caesar', correct: false },
            { text: 'Augustus', correct: false },
            { text: 'Nero', correct: false },
          ],
        },
      ]);
    });
  });

  it('shows insufficient_topic message when Gemini returns that error', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: JSON.stringify({ error: 'insufficient_topic' }) }],
          },
        }],
      }),
    } as Response);

    renderPanel();

    await user.type(screen.getByLabelText('Topic'), 'extremely obscure thing');
    await user.click(screen.getByRole('button', { name: /Generate Questions/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /couldn't make a quiz about that topic/i,
      );
    });
    expect(mockOnQuestionsGenerated).not.toHaveBeenCalled();
  });

  it('shows rate limit message on 429 from Gemini', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response);

    renderPanel();

    await user.type(screen.getByLabelText('Topic'), 'Ancient Rome');
    await user.click(screen.getByRole('button', { name: /Generate Questions/i }));

    // Message appears in both aria-live region and visible <p> — check the alert element
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /AI generation is temporarily unavailable/i,
      );
    });
  });

  it('shows generic error message on network failure', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    renderPanel();

    await user.type(screen.getByLabelText('Topic'), 'Ancient Rome');
    await user.click(screen.getByRole('button', { name: /Generate Questions/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Something went wrong/i);
    });
  });

  it('topic input has associated label', () => {
    renderPanel();
    const input = screen.getByLabelText('Topic');
    expect(input).toBeInTheDocument();
  });

  it('error message is linked via aria-describedby', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: /Generate Questions/i }));

    const topicInput = screen.getByLabelText('Topic');
    expect(topicInput).toHaveAttribute('aria-invalid', 'true');
    expect(topicInput).toHaveAttribute('aria-describedby', 'ai-topic-error');
  });
});
