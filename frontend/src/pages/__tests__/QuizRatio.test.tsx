import '@testing-library/jest-dom';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QuizPage } from '../QuizPage';
import { MemoryRouter } from 'react-router-dom';
import * as api from '../../api';

const mockUseStore = vi.fn();
vi.mock('../../store/useStore', () => ({
  useStore: () => mockUseStore(),
}));

vi.mock('../../components/TopNav', () => ({ TopNav: () => null }));
vi.mock('../../components/DocumentRenderer', () => ({ DocumentRenderer: () => null }));
vi.mock('../../components/QuizCard', () => ({
  QuizCard: ({ card, onRevealAnswer }: any) => (
    <div>
      <span data-testid="current-card">{card.id}</span>
      <button onClick={() => onRevealAnswer(true)}>answer-correct</button>
    </div>
  ),
}));

vi.mock('../../api', async () => {
  const actual = await vi.importActual('../../api');
  return {
    ...(actual as any),
    fetchQuizSession: vi.fn(),
    submitCardAnswer: vi.fn(),
  };
});

const makeCard = (id: string) => ({
  id,
  question_type: 'mcq',
  material_id: 'm1',
  material_title: 'Mat',
  topic: 'T',
  payload: { question: id, options: ['a'], correct_index: 0, explanation: '' },
  streak: 0,
  review_count: 0,
  scheduled_date: '2026-10-10',
  mastery_dots: 0,
  mastery_required: 3,
  availableAt: 0,
});

/** Answer the current card correctly and click Next. Returns the id answered. */
const answerCurrent = async () => {
  const id = screen.getByTestId('current-card').textContent as string;
  fireEvent.click(screen.getByText('answer-correct'));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next Question/i }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1100);
  });
  return id;
};

const currentId = () => screen.queryByTestId('current-card')?.textContent ?? null;

describe('QuizPage new:review ratio', () => {
  let storeState: any;
  const streaks: Record<string, number> = {};

  const setup = async (ratio: number | undefined, count = 12) => {
    const queue = Array.from({ length: count }, (_, i) => makeCard(`n${i + 1}`));
    const session = { session_total: count, completed: 0, queue, has_more: false };
    vi.mocked(api.fetchQuizSession).mockResolvedValue(session as any);
    vi.mocked(api.submitCardAnswer).mockImplementation(async (id: string) => {
      streaks[id] = (streaks[id] || 0) + 1;
      return {
        streak: streaks[id],
        mastered: false,
        next_scheduled: null,
        available_at: Date.now() + 5 * 60 * 1000, // backend returns epoch ms
      } as any;
    });
    storeState = {
      currentUser: ratio === undefined ? null : { quiz_ratio: ratio },
      quizSession: session,
      setQuizSession: vi.fn((s) => { storeState.quizSession = s; }),
      updateQuizSession: vi.fn(),
    };
    mockUseStore.mockImplementation(() => storeState);
    render(<MemoryRouter><QuizPage /></MemoryRouter>);
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 10, 12, 0, 0));
    for (const k of Object.keys(streaks)) delete streaks[k];
  });
  afterEach(() => { vi.useRealTimers(); });

  it.each([1, 2, 4])('re-shows due review cards once cooldown ends (ratio %i)', async (ratio) => {
    await setup(ratio);
    const seen: string[] = [];
    // Answer 3 new cards quickly (n1, n2, n3)
    for (let i = 0; i < 3; i++) seen.push(await answerCurrent());
    expect(seen).toEqual(['n1', 'n2', 'n3']);

    // Cooldown (5 min) elapses while sitting on the 4th new card
    expect(currentId()).toBe('n4');
    await act(async () => { await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1000); });
    await answerCurrent(); // n4 answered, review n1/n2/n3 now due

    // Next cards must be due reviews (n1,n2,n3) - up to `ratio` of them - before new n5
    const next: string[] = [];
    for (let i = 0; i < Math.min(ratio, 3); i++) {
      next.push(currentId() as string);
      await answerCurrent();
    }
    expect(next.every(id => ['n1', 'n2', 'n3', 'n4'].includes(id))).toBe(true);
    expect(next).not.toContain('n5');
  });

  it('after `ratio` consecutive reviews a new card is inserted', async () => {
    await setup(2);
    for (let i = 0; i < 3; i++) await answerCurrent(); // n1..n3 answered, n4 on screen
    await act(async () => { await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1000); });
    await answerCurrent(); // n4 answered -> n1..n3 due, n5.. new
    const order: string[] = [];
    for (let i = 0; i < 3; i++) { order.push(currentId() as string); await answerCurrent(); }
    // ratio 2 => review, review, then a new card
    expect(order[0]).toMatch(/^n[1-4]$/);
    expect(order[1]).toMatch(/^n[1-4]$/);
    expect(order[2]).toBe('n5');
  });
});

