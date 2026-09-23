# Dashboard & Quiz Screen — Implementation Guide

> Based on the Stitch design in `stitch_distinction_ai_interface_design 2`.  
> Reference screenshots: `hippocrates_ai_web_dashboard/screen.png` and `hippocrates_ai_web_quiz_review/screen.png`.

---

## Overview of Changes

| Area | What changes |
|---|---|
| `App.tsx` | Add `/dashboard` and `/quiz` routes |
| `Layout.tsx` | Replace current header with the new top nav bar; add navigation links |
| `api.ts` | Add `fetchDashboardStats`, `fetchDailyActivity`, `fetchReviewSession`, `submitAnswer` |
| `useStore.ts` | Add `dashboardStats`, `quizSession`, and `quizCurrentCard` state slices |
| New page: `DashboardPage.tsx` | Full dashboard screen |
| New page: `QuizPage.tsx` | Full quiz/spaced-repetition screen |
| New component: `TopNav.tsx` | The hero-style top navigation bar shared across all pages |
| New component: `CircularProgress.tsx` | Re-usable donut/ring progress SVG |
| New component: `ActivityCalendar.tsx` | Monthly calendar grid with colour-coded day cells |
| New component: `DayDetailPanel.tsx` | Clicked-day stats panel beside the calendar |
| New component: `QuizCard.tsx` | The question card and answer grid |
| New component: `SRSAnswerTray.tsx` | "Again / Hard / Good / Easy" SRS interval button row |
| Backend | Two new Django endpoints (stats + review session) |

---

## Clarification Answers

| Question | Answer |
|---|---|
| **Library nav link** | Navigates to `/` (the existing `Layout` / reading screen) |
| **Quiz nav link** | Navigates to `/quiz` (new QuizPage) |
| **Search in nav** | Triggers the same search already wired in `SearchBar.tsx` / `useStore` |
| **"Resume Reading"** | Sets `mode = 'read'` in the store and navigates to `/` |
| **"Resume/Start Review"** | Navigates to `/quiz` |
| **Daily stats** | Need a new backend endpoint to expose counts per day |
| **SRS algorithm** | Backend controls next-review scheduling; frontend only sends the chosen interval button |

---

## Step 1 — Backend: New API Endpoints

### 1.1 Dashboard Stats Endpoint

**File:** `backend/materials/views.py` (or a new `dashboard/views.py`)

Create a new view:

```python
# GET /api/dashboard/stats/
# Returns today's review count, questions created today, streak, and per-day activity
{
  "reviewed_today": 84,
  "review_goal": 120,
  "created_today": 18,
  "creation_goal": 100,
  "current_streak": 14,
  "longest_streak": 14,
  "monthly_activity": [
    { "date": "2026-09-01", "reviewed": 112, "created": 5 },
    { "date": "2026-09-02", "reviewed": 140, "created": 12 },
    ...
  ]
}
```

**Implementation notes:**
- Query `ReviewSession` or `QuestionAttempt` model filtered to today's date for `reviewed_today`.
- Query `Question` model filtered to `created_at__date = today` for `created_today`.
- For streak: iterate backwards from today counting consecutive days where `reviewed >= 100`.
- For `monthly_activity`: group attempts by date for the current month.

**URL registration** (`backend/urls.py` or app-level `urls.py`):
```python
path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
```

---

### 1.2 Review Session Endpoint

**GET `/api/quiz/session/`** — Returns the next batch of due questions for the session.

```python
# Response shape
{
  "session_total": 120,
  "completed": 32,
  "current_card": {
    "id": "abc123",
    "question_type": "mcq",
    "material_title": "Cardiology Notes",
    "topic": "Myocardial Infarction",
    "payload": {
      "question": "Which biomarker...",
      "options": ["Myoglobin", "Troponin I", "CK-MB", "LDH"],
      "correct_index": 1,
      "explanation": "Troponin I elevates at 3-4 hours..."
    },
    "mastery_dots": 2,   // number of consecutive correct (out of 3)
    "mastery_required": 3
  }
}
```

**POST `/api/quiz/session/<card_id>/answer/`** — Records the user's chosen SRS interval.

```python
# Request body
{ "interval": "again" | "hard" | "good" | "easy" }

# Response
{ "next_card": { ...same shape as current_card... } | null }
```

**Implementation notes:**
- `mastery_dots` tracks how many times the user has answered correctly *in a row* for this card in this session.
- When `mastery_dots == mastery_required`, the card is removed from the session queue.
- SRS scheduling (next review date) should be handled server-side using an SM-2-like algorithm.
- `null` for `next_card` means the session is complete.

---

## Step 2 — Frontend: API Layer (`api.ts`)

Add these functions to [`src/api.ts`](file:///C:/Users/ANTHONY/Desktop/Hippocrates%20AI/frontend/src/api.ts):

```typescript
// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DayActivity {
  date: string;        // "YYYY-MM-DD"
  reviewed: number;
  created: number;
}

export interface DashboardStats {
  reviewed_today: number;
  review_goal: number;
  created_today: number;
  creation_goal: number;
  current_streak: number;
  longest_streak: number;
  monthly_activity: DayActivity[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await authFetch(`${BASE_URL}/dashboard/stats/`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

// ─── Quiz Session ─────────────────────────────────────────────────────────────

export interface QuizCard {
  id: string;
  question_type: 'mcq' | 'true_false' | 'fill_in' | 'applies';
  material_title: string;
  topic: string;
  payload: any;
  mastery_dots: number;
  mastery_required: number;
}

export interface QuizSession {
  session_total: number;
  completed: number;
  current_card: QuizCard | null;
}

export async function fetchQuizSession(): Promise<QuizSession> {
  const res = await authFetch(`${BASE_URL}/quiz/session/`);
  if (!res.ok) throw new Error('Failed to load quiz session');
  return res.json();
}

export type SRSInterval = 'again' | 'hard' | 'good' | 'easy';

export async function submitCardAnswer(
  cardId: string,
  interval: SRSInterval
): Promise<{ next_card: QuizCard | null }> {
  const res = await authFetch(`${BASE_URL}/quiz/session/${cardId}/answer/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interval }),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}
```

---

## Step 3 — Frontend: Store (`useStore.ts`)

Add new state slices to [`src/store/useStore.ts`](file:///C:/Users/ANTHONY/Desktop/Hippocrates%20AI/frontend/src/store/useStore.ts):

```typescript
// Add these imports at the top
import type { DashboardStats, QuizSession, QuizCard } from '../api';

// Add to the AppState interface:
dashboardStats: DashboardStats | null;
setDashboardStats: (stats: DashboardStats | null) => void;

quizSession: QuizSession | null;
setQuizSession: (session: QuizSession | null) => void;
updateQuizCard: (card: QuizCard | null, completed: number) => void;

// Add to the create() implementation:
dashboardStats: null,
setDashboardStats: (stats) => set({ dashboardStats: stats }),

quizSession: null,
setQuizSession: (session) => set({ quizSession: session }),
updateQuizCard: (card, completed) => set(state => ({
  quizSession: state.quizSession
    ? { ...state.quizSession, current_card: card, completed }
    : null,
})),
```

> **Note:** Do NOT add `dashboardStats` or `quizSession` to the `partialize` list — they should always be freshly fetched, not persisted to localStorage.

---

## Step 4 — New Component: `TopNav.tsx`

**File:** `src/components/TopNav.tsx`

This replaces the header inside `Layout.tsx` AND is shared by `DashboardPage` and `QuizPage`.

### What it contains (from the Stitch design):
- **Left:** Hippocrates AI logo/wordmark
- **Centre:** Pill-shaped nav links — `Dashboard`, `Library`, `Quiz`
  - Active link: `bg-surface-container-high text-primary font-title-sm`
  - Inactive: `text-on-surface-variant hover:bg-surface-container-highest`
- **Right:**
  - Search bar input (`bg-surface-container-low`, `rounded-xl`, width `w-64`) — clicking it activates the existing `SearchBar` logic
  - Notifications bell icon button
  - User avatar + name (from `useStore.currentUser`)

### Key behaviours:
- The `Library` link navigates to `/` and sets `mode = 'read'` in the store.
- The `Quiz` link navigates to `/quiz`.
- The `Dashboard` link navigates to `/dashboard`.
- The search bar uses the existing `setSearchQuery` / `setSearchResults` from the store.
- The nav is `fixed top-0`, `h-20`, `bg-surface-container-lowest/80 backdrop-blur-xl`.

### Skeleton:

```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useStore } from '../store/useStore';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setMode } = useStore();

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Library',   path: '/', onClick: () => setMode('read') },
    { label: 'Quiz',      path: '/quiz' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
      <div className="h-20 w-full px-spacing-xl flex items-center justify-between gap-spacing-lg max-w-7xl mx-auto">
        {/* Logo */}
        ...

        {/* Nav Links */}
        <nav className="hidden lg:flex items-center gap-spacing-xs bg-surface-container-low px-spacing-xs py-1.5 rounded-full">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={link.onClick}
              className={`px-spacing-md py-1.5 rounded-full transition-colors ${
                location.pathname === link.path
                  ? 'bg-surface-container-high text-primary font-title-sm'
                  : 'text-label-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Search + Bell + Avatar */}
        ...
      </div>
    </header>
  );
};
```

---

## Step 5 — New Component: `CircularProgress.tsx`

**File:** `src/components/CircularProgress.tsx`

A reusable SVG donut ring (used in dashboard stat cards).

```tsx
interface Props {
  percent: number;      // 0–100
  size?: number;        // default 96
  strokeWidth?: number; // default 3.5
  label?: string;       // centre label e.g. "70%"
}
```

- **Track colour:** `text-surface-variant`
- **Fill colour:** `text-secondary` (i.e. `#cdbdff`)
- Uses SVG `stroke-dasharray` to draw the arc: `${percent}, 100`
- The SVG viewBox is `0 0 36 36` with the circle path from the Stitch design.

---

## Step 6 — New Component: `ActivityCalendar.tsx`

**File:** `src/components/ActivityCalendar.tsx`

### Props:
```typescript
interface Props {
  activity: DayActivity[];          // from DashboardStats
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  month: Date;                      // which month to display
  onMonthChange: (delta: -1 | 1) => void;
}
```

### Day cell colour logic:
```typescript
function getDayCellClass(reviewed: number): string {
  if (reviewed >= 100) return 'bg-surface-container-high/60';  // blue-tinted dot: text-secondary
  if (reviewed >= 50)  return 'bg-surface-container-high/60';  // dot: text-tertiary-container
  if (reviewed > 0)    return 'bg-surface-container-high/60';  // dot: text-error
  return 'bg-surface-container opacity-40';                     // future/empty
}
```

Each completed day cell shows:
- Top-left: day number (`font-label-sm`)
- Bottom row: coloured dot + reviewed count

Today's cell gets `ring-2 ring-primary-container scale-[1.03]`.

### Legend row below the calendar:
- Purple dot → "100+ Goal Reached"
- Orange dot → "50–99 Partial"
- Red dot → "<50 Missed"
- Grey cell → "Scheduled"

---

## Step 7 — New Component: `DayDetailPanel.tsx`

**File:** `src/components/DayDetailPanel.tsx`

### Props:
```typescript
interface Props {
  date: string;
  activity: DayActivity | null;
  streak: number;
  goalMet: boolean;
}
```

Shows:
- Date header (`font-title-lg`)
- 2×2 grid of sub-cards:
  - **Review Streak** (flame icon, `text-tertiary-container`, count + "Goal Met / Not Met" badge)
  - **Creation Streak** (sparkle icon, count + "X created today")

Matches the `lg:col-span-4` right panel from the Stitch dashboard HTML.

---

## Step 8 — New Page: `DashboardPage.tsx`

**File:** `src/pages/DashboardPage.tsx`

### Layout structure:

```
<TopNav />                          ← fixed top nav
<main class="pt-20 ...">
  {/* Hero / Greeting Section */}
  <section class="flex items-end justify-between pt-spacing-lg">
    <div>
      <h1>Hello, {firstName} 👋</h1>
      <p>📅 Monday, September 8</p>
    </div>
    <div class="flex gap-md">
      <button onClick={() => navigate('/quiz')}>▶ Resume Daily Review (32 of 120 done)</button>
      <button onClick={() => { setMode('read'); navigate('/'); }}>📖 Resume Reading: {activeMaterialTitle}</button>
    </div>
  </section>

  {/* Metric Cards */}
  <section class="grid grid-cols-1 md:grid-cols-3 gap-spacing-lg">
    <StatCard label="Daily Goal Progress"    value={reviewed_today} total={review_goal}    ring />
    <StatCard label="Questions Created Today" value={created_today}  total={creation_goal}  ring />
    <StreakCard streak={current_streak} longest={longest_streak} />
  </section>

  {/* Calendar + Day Detail */}
  <section class="grid grid-cols-1 lg:grid-cols-12 gap-spacing-xl">
    <div class="lg:col-span-8">
      <ActivityCalendar ... />
    </div>
    <div class="lg:col-span-4">
      <DayDetailPanel ... />
    </div>
  </section>
</main>
```

### Data fetching:

```tsx
useEffect(() => {
  fetchDashboardStats()
    .then(stats => setDashboardStats(stats))
    .catch(console.error);
}, []);
```

### Resume Reading button:
- Shows `activeMaterialTitle` from the store if it exists.
- If no material is active, shows "Start Reading" and navigates to `/`.

### Resume Review button:
- Shows "(X of Y done)" from `dashboardStats.reviewed_today` / `dashboardStats.review_goal`.
- Navigates to `/quiz`.

---

## Step 9 — New Component: `QuizCard.tsx`

**File:** `src/components/QuizCard.tsx`

This renders the question + answer grid for MCQ type (extend later for other types).

### Props:
```typescript
interface Props {
  card: QuizCard;
  answered: boolean;
  selectedIndex: number | null;
  onSelectAnswer: (index: number) => void;
}
```

### States:

| State | Appearance |
|---|---|
| Default (unanswered) | `bg-surface-container-high hover:bg-surface-bright`, letter badge in `bg-surface-container-low text-outline` |
| Selected (before reveal) | `ring-1 ring-secondary/50 bg-secondary-container/40` |
| Correct (after reveal) | `bg-secondary-container/40 text-secondary ring-1 ring-secondary/50 shadow-[0_0_24px_rgba(124,77,255,0.22)]`, checkmark |
| Wrong (after reveal) | `bg-error-container/30 text-error ring-1 ring-error/50`, X icon |
| Other options (after reveal) | Dimmed, no special ring |

### Answer option layout (from Stitch):
Each answer card is a flex row:
- Letter badge (A/B/C/D) — `w-7 h-7 rounded-lg`
- Answer text + optional subtext (`text-outline font-body-sm`)
- Right: empty circle → filled checkmark or X after reveal

---

## Step 10 — New Component: `SRSAnswerTray.tsx`

**File:** `src/components/SRSAnswerTray.tsx`

Only visible **after** the user has selected an answer (i.e., `answered === true`).

### Props:
```typescript
interface Props {
  onInterval: (interval: SRSInterval) => void;
  isSubmitting: boolean;
}
```

### Four buttons (from DESIGN.md):
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   < 1m       │    12m       │     1d       │     4d       │
│   Again      │    Hard      │    Good      │    Easy      │
│ border-error │ border-tert  │ border-sec   │ border-green │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

- All buttons: `bg-surface-container h-14 rounded-lg text-center`
- Top accent line: `border-t-2` in the respective colour
- Interval label: `font-label-sm` above the difficulty word: `font-label-md`

---

## Step 11 — New Page: `QuizPage.tsx`

**File:** `src/pages/QuizPage.tsx`

### Layout structure:

```
<TopNav />                                      ← shared top nav (Quiz link is active)

{/* Session Sub-header (sticky below TopNav) */}
<div class="sticky top-20 z-40 bg-surface-container-lowest/90 backdrop-blur-md">
  <div class="flex items-center justify-between px-spacing-xl py-3">
    <div class="flex items-center gap-md">
      <a href="/dashboard">✕ Exit</a>
      <span class="chip">Myocardial Infarction</span>   ← card.topic
    </div>
    <div>32 / 120 · 27% Complete</div>
  </div>
  {/* Progress bar */}
  <div class="w-full h-1 bg-surface-variant">
    <div class="h-full bg-primary-container" style={{ width: `${percent}%` }} />
  </div>
</div>

{/* Main content */}
<main class="pt-20 flex justify-center px-4 py-10">
  <div class="w-full max-w-4xl flex flex-col gap-6">

    {/* Question card header */}
    <span>Question {completed+1} of {session_total}</span>

    {/* Question text */}
    <h1 class="font-headline-sm">{card.payload.question}</h1>

    {/* Answer grid */}
    <QuizCard card={card} ... />

    {/* Mastery dots (always visible) */}
    <MasteryDots filled={card.mastery_dots} total={card.mastery_required} />

    {/* Explanation (revealed after answer) */}
    {answered && <ExplanationPanel text={card.payload.explanation} />}

    {/* SRS Tray OR Next button */}
    {answered
      ? <SRSAnswerTray onInterval={handleInterval} />
      : null
    }

  </div>
</main>
```

### State inside `QuizPage`:

```typescript
const [answered, setAnswered] = useState(false);
const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
```

### `handleSelectAnswer(index)`:
1. Set `selectedIndex = index`.
2. Set `answered = true` (reveals correct/wrong states and explanation).
3. Do **not** call the API yet — wait for SRS interval button.

### `handleInterval(interval)`:
1. Set `isSubmitting = true`.
2. Call `submitCardAnswer(card.id, interval)`.
3. On success: call `updateQuizCard(next_card, newCompleted)`.
4. Reset `answered = false`, `selectedIndex = null`.
5. If `next_card === null`, navigate to `/dashboard` or show a completion screen.

### Session complete screen:
- Show a congratulations message: "Session Complete 🎉"
- Show total reviewed count.
- Button: "Back to Dashboard".

---

## Step 12 — Routing (`App.tsx`)

Update [`src/App.tsx`](file:///C:/Users/ANTHONY/Desktop/Hippocrates%20AI/frontend/src/App.tsx):

```tsx
import { DashboardPage } from './pages/DashboardPage';
import { QuizPage }       from './pages/QuizPage';

// Inside <Routes>:
<Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
<Route path="/quiz"      element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
```

> **Note:** The existing `/` route (the `Layout` / reading screen) is **unchanged**.

---

## Step 13 — Navigation from Existing Screen (`Layout.tsx`)

In the existing [`Layout.tsx`](file:///C:/Users/ANTHONY/Desktop/Hippocrates%20AI/frontend/src/components/Layout.tsx) header, the "Hippocrates AI" title should become a link to `/dashboard`. The hamburger menu can gain a "Dashboard" item in the sidebar navigation links:

```tsx
// In the sidebar nav section, add above the materials list:
<Link to="/dashboard" className="px-sm py-xs text-label-md text-on-surface-variant hover:text-primary">
  Dashboard
</Link>
```

---

## Step 14 — Tailwind Config (`tailwind.config.js`)

The Stitch design uses slightly different token names (`spacing-xl`, `spacing-md` etc.) compared to the current config (`xl`, `md`). Check [`tailwind.config.js`](file:///C:/Users/ANTHONY/Desktop/Hippocrates%20AI/frontend/tailwind.config.js) and add any missing tokens the new pages rely on (e.g., `spacing-2xl`, `spacing-3xl`, `font-title-sm`, `text-title-sm`, `font-headline-sm`, `text-headline-sm` etc.).

The Stitch HTML uses these font sizes — cross-check they are in `fontSize` config:
- `headline-sm` — `20px / 28px / 600`
- `title-sm` — `14px / 20px / 600`
- `title-md` — `16px / 22px / 600`
- `label-lg` — `14px / 20px / 500`
- `body-sm` — `12px / 16px / 400`
- `display-sm` — `32px / 40px / 600`

---

## Build Order Checklist

- [ ] **Step 1** — Backend: `DashboardStatsView` + `QuizSessionView` + URL registration
- [ ] **Step 2** — `api.ts`: `fetchDashboardStats`, `fetchQuizSession`, `submitCardAnswer`
- [ ] **Step 3** — `useStore.ts`: add `dashboardStats`, `quizSession`, `updateQuizCard`
- [ ] **Step 4** — `TopNav.tsx`: shared nav bar
- [ ] **Step 5** — `CircularProgress.tsx`: reusable ring SVG
- [ ] **Step 6** — `ActivityCalendar.tsx`: monthly grid + colour logic + legend
- [ ] **Step 7** — `DayDetailPanel.tsx`: selected-day detail card
- [ ] **Step 8** — `DashboardPage.tsx`: assemble all dashboard components
- [ ] **Step 9** — `QuizCard.tsx`: question + answer grid + reveal states
- [ ] **Step 10** — `SRSAnswerTray.tsx`: Again / Hard / Good / Easy buttons
- [ ] **Step 11** — `QuizPage.tsx`: assemble quiz components + session logic
- [ ] **Step 12** — `App.tsx`: add `/dashboard` and `/quiz` routes
- [ ] **Step 13** — `Layout.tsx`: add Dashboard link to sidebar; make title link to `/dashboard`
- [ ] **Step 14** — `tailwind.config.js`: verify all Stitch token names exist

---

## Questions Still Open (Ask Before Building)

1. **Does the quiz session pull from ALL materials or just the currently active one?**  
   _(Suggestion: all approved questions across all materials, sorted by SRS due date.)_

2. **What happens on the Quiz page if there are zero questions due?**  
   _(Suggestion: show an empty state "No questions due — great work! Come back tomorrow." with a button back to Dashboard.)_

3. **Should the "Questions Created Today" metric count ALL question types or only approved ones?**

4. **Is there a daily review goal the user can configure, or is it fixed at 120?**
