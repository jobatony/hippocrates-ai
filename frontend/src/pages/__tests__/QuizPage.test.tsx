// @ts-nocheck
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    fetchMaterialDetail: vi.fn(),
  };
});

describe('QuizPage', () => {
  let mockStoreState: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    vi.mocked(api.fetchQuizSession).mockResolvedValue({
      session_total: 1,
      completed: 0,
      queue: [],
      has_more: false,
    } as any);

    mockStoreState = {
      quizSession: null,
      setQuizSession: vi.fn((session) => {
        mockStoreState.quizSession = session;
      }),
      updateQuizSession: vi.fn(),
      activeMaterialId: null,
      setActiveMaterial: vi.fn(),
      setDocumentBlocks: vi.fn(),
      setLoadingDocument: vi.fn(),
      setActiveBlockId: vi.fn(),
    };

    mockUseStore.mockImplementation(() => mockStoreState);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createCard = (id: string, streak: number, availableAt: number) => ({
    id,
    question_type: 'mcq',
    material_title: 'Test Material',
    topic: 'Test Topic',
    payload: {
      question: `Question ${id}?`,
      options: ['Apple', 'Banana'],
      correct_index: 0,
      explanation: 'Because',
    },
    streak,
    mastery_dots: Math.min(streak, 3),
    mastery_required: 3,
    availableAt,
  });

  it('interleaves New and Review cards correctly', async () => {
    // 2 review cards, 2 new cards, all available now
    const session = {
      session_total: 4,
      completed: 0,
      has_more: false,
      queue: [
        createCard('review-1', 1, 0),
        createCard('new-1', 0, 0),
        createCard('review-2', 1, 0),
        createCard('new-2', 0, 0),
      ],
    };
    
    vi.mocked(api.fetchQuizSession).mockResolvedValueOnce(session as any);

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    // Initial effect updates store
    // Wait for promise to resolve
    await act(async () => {
      // flush microtasks
    });
    
    expect(mockStoreState.setQuizSession).toHaveBeenCalledWith(session);

    mockStoreState.quizSession = session;

    // Fast-forward to trigger the interval runner
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // We should see the first review card or first new card. Wait for it to appear.
    let currentText = screen.getByRole('heading', { level: 1 }).textContent;
    const isFirstReview = currentText?.includes('review-1');
    const isFirstNew = currentText?.includes('new-1');
    expect(isFirstReview || isFirstNew).toBe(true);

    // Answer it and proceed
    fireEvent.click(screen.getByText('Apple')); // Correct answer
    vi.mocked(api.submitCardAnswer).mockResolvedValueOnce({
      streak: 3, // mastered
      mastered: true,
      next_scheduled: null,
      available_at: 0,
    } as any);
    fireEvent.click(screen.getByRole('button', { name: /Next Question/i }));

    // Flush microtasks so submitCardAnswer resolves and React re-renders
    await act(async () => {
    });

    // The next card should be of the OPPOSITE type
    const secondText = screen.getByRole('heading', { level: 1 }).textContent;
    if (isFirstReview) {
      expect(secondText).toContain('new-1');
    } else {
      expect(secondText).toContain('review-1');
    }
  });

  it('re-queues cards and serves them when their cooldown expires', async () => {
    const now = Date.now();
    const session = {
      session_total: 1,
      completed: 0,
      has_more: false,
      queue: [
        createCard('new-1', 0, 0),
      ],
    };
    
    vi.mocked(api.fetchQuizSession).mockResolvedValueOnce(session as any);

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    await act(async () => {
      // flush microtasks
    });
    expect(mockStoreState.setQuizSession).toHaveBeenCalled();
    mockStoreState.quizSession = session;

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Question new-1?')).toBeInTheDocument();

    // Answer INCORRECTLY
    fireEvent.click(screen.getByText('Banana'));
    
    // Simulate API returning 3 minute cooldown (180,000 ms)
    const futureAvailableAt = now + 180000;
    vi.mocked(api.submitCardAnswer).mockResolvedValueOnce({
      streak: 0,
      mastered: false,
      next_scheduled: null,
      available_at: futureAvailableAt,
    } as any);

    fireEvent.click(screen.getByRole('button', { name: /Next Question/i }));

    await act(async () => {
      vi.advanceTimersByTime(1100); // give time for the queue runner to evaluate
    });

    // Card should be gone, waiting screen should appear
    expect(screen.getByText(/Next question ready in/i)).toBeInTheDocument();
    
    // Check live countdown
    // Total wait is approx 3 minutes minus some ms
    expect(screen.getByText(/2:5[89]/)).toBeInTheDocument();

    // Advance by 1 minute
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByText(/1:5[89]/)).toBeInTheDocument();

    // Advance past cooldown
    await act(async () => {
      vi.advanceTimersByTime(120000);
    });

    // The card should reappear!
    expect(screen.getByText('Question new-1?')).toBeInTheDocument();
  });

  it('triggers backfill when unattempted cards drop below 10', async () => {
    // Start with 9 unattempted cards
    const initialQueue = Array.from({ length: 9 }).map((_, i) => createCard(`new-${i}`, 0, 0));
    const session = {
      session_total: 20,
      completed: 0,
      has_more: true, // Backend has more cards
      queue: initialQueue,
    };
    
    vi.mocked(api.fetchQuizSession).mockResolvedValueOnce(session as any);

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    await act(async () => {
      // flush microtasks
    });
    expect(mockStoreState.setQuizSession).toHaveBeenCalled();
    mockStoreState.quizSession = session;

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // We are looking at a card.
    expect(screen.getByText('Question new-0?')).toBeInTheDocument();

    // Mock the backfill response: Returns 5 more cards
    const backfillQueue = Array.from({ length: 5 }).map((_, i) => createCard(`backfill-${i}`, 0, 0));
    vi.mocked(api.fetchQuizSession).mockResolvedValueOnce({
      session_total: 20,
      completed: 0,
      has_more: true,
      queue: backfillQueue
    } as any);

    // Answer the card
    fireEvent.click(screen.getByText('Apple'));
    vi.mocked(api.submitCardAnswer).mockResolvedValueOnce({
      streak: 3,
      mastered: true,
      next_scheduled: null,
      available_at: 0,
    } as any);

    // Click Next, which triggers setTimeout(tryBackfill, 100)
    fireEvent.click(screen.getByRole('button', { name: /Next Question/i }));

    await act(async () => {
      // Flush microtasks so submitCardAnswer resolves and setTimeout is called
    });

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    // Backfill should have been called!
    expect(api.fetchQuizSession).toHaveBeenCalledTimes(2);

    // The queue runner should present the next card
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Check we see another card (e.g. new-1)
    expect(screen.getByText('Question new-1?')).toBeInTheDocument();
  });
});
