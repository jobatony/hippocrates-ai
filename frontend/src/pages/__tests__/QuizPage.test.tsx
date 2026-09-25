import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuizPage } from '../QuizPage';
import { MemoryRouter } from 'react-router-dom';
import * as api from '../../api';

const mockUseStore = vi.fn();
vi.mock('../../store/useStore', () => ({
  useStore: () => mockUseStore(),
}));

vi.mock('../../api', async () => {
  const actual = await vi.importActual('../../api');
  return {
    ...actual as any,
    fetchQuizSession: vi.fn(),
    submitCardAnswer: vi.fn(),
  };
});

describe('QuizPage', () => {
  const mockQuizSession = {
    session_total: 2,
    completed: 0,
    queue: [
      {
        id: 'card-1',
        question_type: 'mcq',
        material_title: 'Test Material',
        topic: 'Test Topic',
        payload: {
          question: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correct_index: 1,
          explanation: '2 + 2 equals 4',
        },
        mastery_dots: 0,
        mastery_required: 3,
        availableAt: Date.now() - 10000, // available now
      },
      {
        id: 'card-2',
        question_type: 'mcq',
        material_title: 'Test Material',
        topic: 'Test Topic 2',
        payload: {
          question: 'What is 3 + 3?',
          options: ['5', '6', '7', '8'],
          correct_index: 1,
          explanation: '3 + 3 equals 6',
        },
        mastery_dots: 0,
        mastery_required: 3,
        availableAt: Date.now() + 50000, // available in the future
      },
    ],
  };

  let mockStoreState: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(api.fetchQuizSession).mockResolvedValue({
      session_total: 1,
      completed: 0,
      queue: []
    } as any);

    mockStoreState = {
      quizSession: null,
      setQuizSession: vi.fn((session) => {
        mockStoreState.quizSession = session;
      }),
      updateQuizSession: vi.fn(),
    };

    mockUseStore.mockImplementation(() => mockStoreState);
  });

  it('renders loading state initially', () => {
    mockStoreState.quizSession = null;
    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading review session/i)).toBeInTheDocument();
  });

  it('shows empty state when session total is 0', async () => {
    mockStoreState.quizSession = { session_total: 0, completed: 0, queue: [] };
    
    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Session Complete/i)).toBeInTheDocument();
  });

  it('shows waiting state when queue is not empty but no cards are available yet', async () => {
    const session = {
      session_total: 1,
      completed: 0,
      queue: [mockQuizSession.queue[1]], // Only the future card
    };
    
    vi.mocked(api.fetchQuizSession).mockResolvedValueOnce(session as any);
    mockStoreState.quizSession = session;

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Waiting for next card to become available/i)).toBeInTheDocument();
    });
  });

  it('renders a card and handles correct answer workflow', async () => {
    vi.mocked(api.fetchQuizSession).mockResolvedValueOnce(mockQuizSession as any);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    // Initial loading
    expect(screen.getByText(/Loading review session/i)).toBeInTheDocument();

    // After effect runs, set up the store's session
    mockStoreState.quizSession = mockQuizSession;
    
    // We have to re-render to simulate the store update
    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    // Wait for the card to be displayed
    await waitFor(() => {
      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    });

    // Select the correct option
    const correctOption = screen.getByText('4');
    await user.click(correctOption);

    // Verify correct feedback is shown
    expect(screen.getByText(/Correct! You're making progress/i)).toBeInTheDocument();

    // Mock the submit API response (not mastered yet)
    vi.mocked(api.submitCardAnswer).mockResolvedValueOnce({
      streak: 1,
      mastered: false,
      next_scheduled: null,
      available_at: Date.now() / 1000 + 300,
    } as any);

    const nextButton = screen.getByRole('button', { name: /Next Question/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(api.submitCardAnswer).toHaveBeenCalledWith('card-1', true);
    });
  });

  it('renders a card and handles incorrect answer workflow', async () => {
    vi.mocked(api.fetchQuizSession).mockResolvedValueOnce(mockQuizSession as any);
    const user = userEvent.setup();

    mockStoreState.quizSession = mockQuizSession;

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    // Wait for the card to be displayed
    await waitFor(() => {
      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    });

    // Select the INCORRECT option
    const incorrectOption = screen.getByText('5');
    await user.click(incorrectOption);

    // Verify incorrect feedback is shown
    expect(screen.getByText(/Incorrect. We'll review this again shortly./i)).toBeInTheDocument();

    // Mock the submit API response
    vi.mocked(api.submitCardAnswer).mockResolvedValueOnce({
      streak: 0,
      mastered: false,
      next_scheduled: null,
      available_at: Date.now() / 1000 + 300,
    } as any);

    const nextButton = screen.getByRole('button', { name: /Next Question/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(api.submitCardAnswer).toHaveBeenCalledWith('card-1', false);
    });
  });

  it('prioritizes showing the card that became available first (smallest availableAt)', async () => {
    const session = {
      session_total: 2,
      completed: 0,
      queue: [
        {
          id: 'card-1',
          question_type: 'mcq',
          material_title: 'Title',
          topic: 'Topic 1',
          payload: { question: 'Question 1?', options: ['1'], correct_index: 0, explanation: '' },
          mastery_dots: 0,
          mastery_required: 3,
          availableAt: Date.now() - 5000, // Available 5 seconds ago
        },
        {
          id: 'card-2',
          question_type: 'mcq',
          material_title: 'Title',
          topic: 'Topic 2',
          payload: { question: 'Question 2?', options: ['2'], correct_index: 0, explanation: '' },
          mastery_dots: 0,
          mastery_required: 3,
          availableAt: Date.now() - 10000, // Available 10 seconds ago (older)
        }
      ],
    };
    
    vi.mocked(api.fetchQuizSession).mockResolvedValueOnce(session as any);
    mockStoreState.quizSession = session;

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    // It should render card-2 because its availableAt is older (smaller)
    await waitFor(() => {
      expect(screen.getByText('Question 2?')).toBeInTheDocument();
      expect(screen.queryByText('Question 1?')).not.toBeInTheDocument();
    });
  });
});
