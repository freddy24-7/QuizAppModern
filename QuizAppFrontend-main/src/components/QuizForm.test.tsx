import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import QuizForm from './QuizForm';

vi.mock('axios');
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
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

  it('renders the quiz info, questions and create sections', () => {
    renderQuizForm();
    expect(screen.getByText('Quiz Info')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Questions/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Quiz/i })).toBeInTheDocument();
  });

  it('does not ask for recipients or phone numbers', () => {
    renderQuizForm();
    expect(screen.queryByText('Recipients')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
  });

  it('renders quiz title and duration fields with labels', () => {
    renderQuizForm();
    expect(screen.getByLabelText('Quiz Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (seconds)')).toBeInTheDocument();
  });

  it('shows inline error when title is blank on submit', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    await user.click(screen.getByRole('button', { name: /Create Quiz/i }));

    expect(screen.getByText('Quiz title is required.')).toBeInTheDocument();
  });

  it('shows error when title is too short', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    await user.type(screen.getByLabelText('Quiz Title'), 'AB');
    await user.click(screen.getByRole('button', { name: /Create Quiz/i }));

    expect(
      screen.getByText('Title must be at least 3 characters.'),
    ).toBeInTheDocument();
  });

  it('all form fields have associated labels', () => {
    renderQuizForm();
    expect(screen.getByLabelText('Quiz Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (seconds)')).toBeInTheDocument();
  });

  it('error messages have aria-describedby linkage', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    await user.click(screen.getByRole('button', { name: /Create Quiz/i }));

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
    (mockedAxios.isAxiosError as unknown) = (_payload: unknown): _payload is AxiosError => true;

    await user.click(screen.getByRole('button', { name: /Create Quiz/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("You've sent too many requests"),
      );
    });
  });

  it('creates the quiz without participants and opens the host page', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    await user.type(screen.getByLabelText('Quiz Title'), 'Valid Quiz Title');
    await user.type(
      screen.getByPlaceholderText('Enter your question'),
      'What is the Java programming language?',
    );
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/);
    await user.type(optionInputs[0], 'First option answer');
    await user.type(optionInputs[1], 'Second option answer');
    await user.type(optionInputs[2], 'Third option answer');
    await user.type(optionInputs[3], 'Fourth option answer');
    await user.click(screen.getAllByRole('checkbox')[0]);

    vi.mocked(mockedAxios.post).mockResolvedValueOnce({ data: { id: 7 } });

    await user.click(screen.getByRole('button', { name: /Create Quiz/i }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
    const [url, payload] = vi.mocked(mockedAxios.post).mock.calls[0];
    expect(url).toMatch(/\/api\/quizzes$/);
    expect(payload).not.toHaveProperty('participants');
    expect(payload).toMatchObject({ title: 'Valid Quiz Title' });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/quiz/results/7');
    });
  });

  it('can add and remove questions', async () => {
    const user = userEvent.setup();
    renderQuizForm();

    expect(screen.getByRole('heading', { name: /Questions/ })).toHaveTextContent('(1)');
    await user.click(screen.getByRole('button', { name: /Add Question/i }));
    expect(screen.getByRole('heading', { name: /Questions/ })).toHaveTextContent('(2)');
  });

  it('shows AI panel when navigated with ?mode=ai', () => {
    render(
      <MemoryRouter initialEntries={['/quiz?mode=ai']}>
        <QuizForm />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText(/Roman Empire/i)).toBeInTheDocument();
  });

  it('shows manual form when navigated with ?mode=manual', () => {
    render(
      <MemoryRouter initialEntries={['/quiz?mode=manual']}>
        <QuizForm />
      </MemoryRouter>,
    );
    expect(screen.queryByPlaceholderText(/Roman Empire/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your question')).toBeInTheDocument();
  });
});
