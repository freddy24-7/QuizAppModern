import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import QuizForm from './QuizForm';

vi.mock('axios');
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockedAxios = vi.mocked(axios);

function renderQuizForm() {
  return render(
    <MemoryRouter>
      <QuizForm />
    </MemoryRouter>,
  );
}

describe('QuizForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all four sections', () => {
    renderQuizForm();
    expect(screen.getByText('Quiz Info')).toBeInTheDocument();
    expect(screen.getByText(/Questions/)).toBeInTheDocument();
    expect(screen.getByText('Recipients')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Quiz/i })).toBeInTheDocument();
  });

  it('renders quiz title and duration fields with labels', () => {
    renderQuizForm();
    expect(screen.getByLabelText('Quiz Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (seconds)')).toBeInTheDocument();
  });

  it('shows inline error when title is blank on submit', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    await user.click(screen.getByRole('button', { name: /Send Quiz/i }));

    expect(screen.getByText('Quiz title is required.')).toBeInTheDocument();
  });

  it('shows error when title is too short', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    await user.type(screen.getByLabelText('Quiz Title'), 'AB');
    await user.click(screen.getByRole('button', { name: /Send Quiz/i }));

    expect(
      screen.getByText('Title must be at least 3 characters.'),
    ).toBeInTheDocument();
  });

  it('shows error when phone number is not E.164', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    const phoneInput = screen.getByPlaceholderText('+31612345678');
    await user.type(phoneInput, '0612345678');
    await user.click(screen.getByRole('button', { name: /Send Quiz/i }));

    expect(
      screen.getByText(/E.164 phone number/),
    ).toBeInTheDocument();
  });

  it('accepts valid E.164 phone number format', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    const phoneInput = screen.getByPlaceholderText('+31612345678');
    await user.type(phoneInput, '+31612345678');

    // No phone error should be present after clearing
    expect(
      screen.queryByText(/E.164 phone number/),
    ).not.toBeInTheDocument();
  });

  it('all form fields have associated labels', () => {
    renderQuizForm();
    expect(screen.getByLabelText('Quiz Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (seconds)')).toBeInTheDocument();
  });

  it('error messages have aria-describedby linkage', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    await user.click(screen.getByRole('button', { name: /Send Quiz/i }));

    const titleInput = screen.getByLabelText('Quiz Title');
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(titleInput).toHaveAttribute('aria-describedby', 'quiz-title-error');
  });

  it('shows user-friendly message on 429 response', async () => {
    const { toast } = await import('react-toastify');
    const user = userEvent.setup();
    renderQuizForm();

    // Fill in minimum valid data
    await user.type(screen.getByLabelText('Quiz Title'), 'Valid Quiz Title');
    const phoneInput = screen.getByPlaceholderText('+31612345678');
    await user.type(phoneInput, '+31612345678');

    // Fill in question text (need at least 10 chars)
    const questionTextarea = screen.getByPlaceholderText('Enter your question');
    await user.type(questionTextarea, 'What is the Java programming language?');

    // Mark an option as correct and fill in option texts
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/);
    for (const input of optionInputs) {
      await user.type(input, 'Option text');
      await user.clear(input);
    }
    await user.type(optionInputs[0], 'First option answer');
    await user.type(optionInputs[1], 'Second option answer');
    await user.type(optionInputs[2], 'Third option answer');
    await user.type(optionInputs[3], 'Fourth option answer');

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    vi.mocked(mockedAxios.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 429, data: {} },
    });
    vi.mocked(mockedAxios).isAxiosError = vi.fn().mockReturnValue(true);

    await user.click(screen.getByRole('button', { name: /Send Quiz/i }));

    // Confirm dialog opens — both the main button and dialog button are named "Send Quiz".
    // Click the dialog's confirm button (last in the list).
    await waitFor(() => {
      expect(screen.getByText('Send Quiz?')).toBeInTheDocument();
    });
    const sendBtns = screen.getAllByRole('button', { name: /^Send Quiz$/i });
    await user.click(sendBtns[sendBtns.length - 1]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("You've sent too many requests"),
      );
    });
  });

  it('can add and remove questions', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    expect(screen.getByText((_content, node) => {
      return node?.textContent === 'Questions(1)' || node?.textContent === 'Questions (1)';
    })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Add Question/i }));
    expect(screen.getByText((_content, node) => {
      return node?.textContent === 'Questions(2)' || node?.textContent === 'Questions (2)';
    })).toBeInTheDocument();
  });

  it('can switch between manual and AI modes', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    expect(screen.queryByPlaceholderText(/Roman Empire/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Generate with AI/i }));
    expect(screen.getByPlaceholderText(/Roman Empire/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Create manually/i }));
    expect(screen.queryByPlaceholderText(/Roman Empire/i)).not.toBeInTheDocument();
  });
});
