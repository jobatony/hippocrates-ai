# Review Mode — Step-by-Step Implementation Guide

This guide maps every feature in `review_idea.md` to exact files and code changes
in the existing codebase. Follow the steps in order.

---

## Overview of What Will Be Built

```
review_idea.md Feature          → Implementation
─────────────────────────────────────────────────────────────────
Toggle button (existing)        → Wire up mode state in useStore
Layout shift (doc → side)       → Update Layout.tsx conditionally
Random question ordering        → Shuffle in useStore / ReviewMode
Question counter 1/45           → State in ReviewMode component
MCQ interactive answer UI       → New MCQReview.tsx component
T/F interactive answer UI       → New TrueFalseReview.tsx component
Fill-in-Gap drag-and-drop UI    → New FillInReview.tsx component
Edit question via modal         → New EditQuestionModal.tsx component
Backend attempt log model       → New AttemptLog model in Django
Log API endpoint                → New view + URL in Django
Session results summary         → End screen in ReviewMode component
Side panel auto-scroll to block → useRef + scrollIntoView in Layout
```

---

## Step 1 — Add `mode` state to the global store

**File:** `frontend/src/store/useStore.ts`

Add a `mode` field (`'read' | 'review'`) and a `setMode` action to `AppState`.
This is the single source of truth for which mode the app is in.

```ts
// In the AppState interface, add:
mode: 'read' | 'review';
setMode: (mode: 'read' | 'review') => void;

// In the create() call, add:
mode: 'read',
setMode: (mode) => set({ mode }),
```

---

## Step 2 — Wire the existing toggle buttons in Layout.tsx

**File:** `frontend/src/components/Layout.tsx`

The `Read` and `Review` buttons already exist around line 152–154 but are not wired up.

1. Import `setMode` and `mode` from `useStore`.
2. On click of `Read`, call `setMode('read')`.
3. On click of `Review`, call `setMode('review')`.
4. Apply `bg-surface-container text-on-surface` (active style) conditionally based on `mode`.

```tsx
const { mode, setMode, ... } = useStore();

// Buttons:
<button
  onClick={() => setMode('read')}
  className={`px-lg py-1 rounded-full text-label-md ${mode === 'read' ? 'bg-surface-container text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
>Read</button>
<button
  onClick={() => setMode('review')}
  className={`px-lg py-1 rounded-full text-label-md ${mode === 'review' ? 'bg-surface-container text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
>Review</button>
```

---

## Step 3 — Update Layout.tsx to render Review Mode conditionally

**File:** `frontend/src/components/Layout.tsx`

In the `<main>` tag (around line 171), conditionally render either:
- **Read mode:** The existing `<DocumentRenderer />` + right review queue panel.
- **Review mode:** A new `<ReviewMode />` component (center) + the document as a narrow side panel (right).

```tsx
<main className="flex-1 flex min-h-0 relative">
  {mode === 'read' ? (
    <>
      <DocumentRenderer />
      {/* Existing right panel (Review Queue) */}
      <aside ...>...</aside>
    </>
  ) : (
    <>
      {/* Review mode: questions in center, document on right */}
      <ReviewMode />
      <aside className="w-80 shrink-0 border-l border-outline-variant overflow-y-auto">
        <DocumentRenderer readOnly scrollToBlockId={activeBlockId} />
      </aside>
    </>
  )}
</main>
```

> **Note:** `activeBlockId` will be a piece of state you add in Step 10.

---

## Step 4 — Create the ReviewMode component (shell + question counter)

**File:** `frontend/src/components/ReviewMode.tsx` *(new file)*

This is the central orchestrator for the quiz experience.

Responsibilities:
1. On mount, take `pendingQuestions` from the store, filter to `status === 'approved'`, and shuffle them randomly.
2. Track `currentIndex` (which question you're on).
3. Track `results` — an array of `{ questionId, correct: boolean }`.
4. Track `sessionDone` boolean.

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { MCQReview } from './MCQReview';
import { TrueFalseReview } from './TrueFalseReview';
import { FillInReview } from './FillInReview';
import { ResultsSummary } from './ResultsSummary';

// Fisher-Yates shuffle helper
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const ReviewMode: React.FC = () => {
  const { pendingQuestions, setActiveBlockId } = useStore();

  const approved = useMemo(
    () => shuffle(pendingQuestions.filter(q => q.status === 'approved')),
    [] // only shuffle once on mount
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ questionId: string; correct: boolean }[]>([]);
  const [sessionDone, setSessionDone] = useState(false);

  const currentQuestion = approved[currentIndex];

  // When question changes, notify Layout to auto-scroll the document panel
  useEffect(() => {
    if (currentQuestion) {
      setActiveBlockId(currentQuestion.source_block_id ?? null);
    }
  }, [currentIndex]);

  const handleAnswer = (correct: boolean) => {
    // Log attempt to backend (Step 9)
    logAttempt(currentQuestion.id, correct);

    setResults(prev => [...prev, { questionId: currentQuestion.id, correct }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= approved.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  if (approved.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant">
        <p>No approved questions to review. Approve questions in Read mode first.</p>
      </div>
    );
  }

  if (sessionDone) {
    return <ResultsSummary results={results} total={approved.length} />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-xl gap-lg">
      {/* Counter */}
      <div className="text-label-sm text-on-surface-variant">
        {currentIndex + 1} / {approved.length}
      </div>

      {/* Question card — no scrolling allowed */}
      <div className="w-full max-w-2xl">
        {currentQuestion.type === 'mcq' && (
          <MCQReview question={currentQuestion} onAnswer={handleAnswer} onNext={handleNext} />
        )}
        {currentQuestion.type === 'true_false' && (
          <TrueFalseReview question={currentQuestion} onAnswer={handleAnswer} onNext={handleNext} />
        )}
        {currentQuestion.type === 'fill_in' && (
          <FillInReview question={currentQuestion} onAnswer={handleAnswer} onNext={handleNext} />
        )}
      </div>
    </div>
  );
};
```

> **Note:** `source_block_id` must be added to the `Question` type. The backend already stores it as `source_block_id`. Update the `Question` interface in `useStore.ts` to include it.

---

## Step 5 — Create MCQReview.tsx

**File:** `frontend/src/components/MCQReview.tsx` *(new file)*

State to track:
- `selectedIndex: number | null`
- `checked: boolean`

Logic:
- Before check: clicking an option sets `selectedIndex`. Selected option shows green stroke.
- On Check Answer:
  - Set `checked = true`.
  - Call `onAnswer(selectedIndex === payload.correct_index)`.
  - If wrong: selected option gets red fill, correct option gets green fill. Show `explanation`.
  - If right: selected option gets green fill. Show Next Question button.

```tsx
// Pseudocode for option class logic:
const getOptionClass = (index: number) => {
  if (!checked) {
    return selectedIndex === index
      ? 'ring-2 ring-green-500'     // selected but not yet checked
      : 'hover:bg-surface-container-high';
  }
  if (index === payload.correct_index) return 'bg-green-100 border-green-500'; // correct
  if (index === selectedIndex) return 'bg-red-100 border-red-500';              // wrong choice
  return '';
};
```

Props: `{ question: Question, onAnswer: (correct: boolean) => void, onNext: () => void }`

---

## Step 6 — Create TrueFalseReview.tsx

**File:** `frontend/src/components/TrueFalseReview.tsx` *(new file)*

State to track:
- `shownStatements` — 4 randomly selected from `payload.statements` on mount.
- `selections: Record<number, 'true' | 'false' | null>` — user's T/F choice per statement index.
- `checked: boolean`

Logic:
- T circle: clicking gives it a green stroke. Deselects F.
- F circle: clicking gives it a red stroke. Deselects T.
- Check Answer button is disabled until all 4 selections are filled.
- On Check Answer:
  - For each statement, the correct answer is always `true_statement` = True, `false_alternative` = False.
  - A statement shown is either the true_statement or the false_alternative — you need to decide which one is displayed. Best approach: randomly show either the `true_statement` or `false_alternative` for each slot, and track which one is shown.
  - Compare `selections[i]` against what is actually shown. Green stroke if correct, red stroke if wrong. T/F circle gets green fill if the correct answer was True, red fill if the correct answer was False.
  - Call `onAnswer(allCorrect)`.

> **Design note:** When you pick the 4 statements, for each chosen `TrueFalseStatementPayload`, randomly decide to show either the `true_statement` (correct answer = True) or the `false_alternative` (correct answer = False). Store this in the component so you can evaluate correctness.

---

## Step 7 — Create FillInReview.tsx (Drag and Drop)

**File:** `frontend/src/components/FillInReview.tsx` *(new file)*

Use the native HTML5 drag-and-drop API (`draggable`, `onDragStart`, `onDrop`, `onDragOver`).

State to track:
- `gapValues: Record<number, string | null>` — what's in each gap slot.
- `bankItems: string[]` — items still in the answer bank (start with all `answer_bank` texts).
- `checked: boolean`
- `postCheckState: Record<number, 'correct' | 'wrong' | null>`

Logic:
- Drag from bank → drop into gap slot: remove from bank, set in gapValues.
- Click on a filled gap to remove: return item to bank, clear gapValues for that gap.
- Check Answer button is enabled only when all gaps are filled.
- On Check Answer:
  - For each gap `i`, find the `answer_bank` item where `correct_for_gaps` includes `i`.
  - Compare with `gapValues[i]`.
  - Correct: gap stays filled, shown in green container. Slot marked `'correct'`.
  - Wrong: the wrong answer is removed from the gap and returned to the bank displayed in a **red container**. The correct answer is inserted into the gap in a **green container**. Slot marked `'wrong'`.
  - Call `onAnswer(allCorrect)`.

---

## Step 8 — Create ResultsSummary.tsx

**File:** `frontend/src/components/ResultsSummary.tsx` *(new file)*

Simple component that receives `results[]` and `total`.

```tsx
const correct = results.filter(r => r.correct).length;

return (
  <div className="flex-1 flex flex-col items-center justify-center gap-lg">
    <h1 className="font-headline-lg text-on-surface">Session Complete!</h1>
    <p className="font-display-sm text-primary">{correct} / {total}</p>
    <p className="text-body-md text-on-surface-variant">questions answered correctly</p>
    <button onClick={onRestart} className="...">Review Again</button>
  </div>
);
```

---

## Step 9 — Create the backend AttemptLog model

**File:** `backend/quiz/models.py`

Add a new model below the existing `Question` model:

```python
class ReviewAttempt(models.Model):
    """Records every answer attempt during a review session. Used for future spaced repetition."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='attempts')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='attempts')

    # What the user selected (stored as JSON for flexibility across question types)
    user_answer = models.JSONField(default=dict)
    is_correct = models.BooleanField()

    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-attempted_at']

    def __str__(self):
        return f"Attempt on [{self.question_id}] — {'✓' if self.is_correct else '✗'}"
```

After adding the model, run:
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## Step 10 — Create the backend AttemptLog API endpoint

**File:** `backend/quiz/views.py`

Add a new view:

```python
class LogAttemptView(generics.CreateAPIView):
    """Logs a single review attempt. Called by the frontend after each Check Answer."""
    queryset = ReviewAttempt.objects.all()

    def post(self, request):
        question_id = request.data.get('question_id')
        user_answer = request.data.get('user_answer', {})
        is_correct = request.data.get('is_correct')

        question = get_object_or_404(Question, pk=question_id)

        attempt = ReviewAttempt.objects.create(
            question=question,
            material=question.material,
            user_answer=user_answer,
            is_correct=is_correct,
        )
        return Response({'id': str(attempt.id)}, status=status.HTTP_201_CREATED)
```

**File:** `backend/quiz/urls.py`

Add the new URL pattern:
```python
path('attempts/log/', LogAttemptView.as_view(), name='attempt-log'),
```

---

## Step 11 — Add `logAttempt` function to the frontend API module

**File:** `frontend/src/api.ts`

```ts
export async function logAttempt(
  questionId: string,
  isCorrect: boolean,
  userAnswer: object = {}
): Promise<void> {
  await fetch(`${BASE_URL}/questions/attempts/log/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: questionId,
      is_correct: isCorrect,
      user_answer: userAnswer,
    }),
  });
  // Silently fail — logging is non-critical
}
```

Then call `logAttempt` inside the `handleAnswer` function in `ReviewMode.tsx` (Step 4).

---

## Step 12 — Auto-scroll the document panel to the question's source block

**File:** `frontend/src/store/useStore.ts`

Add `activeBlockId` and `setActiveBlockId` to the store (similar to Step 1):
```ts
activeBlockId: string | null;
setActiveBlockId: (id: string | null) => void;
```

**File:** `frontend/src/components/DocumentRenderer.tsx`

Accept an optional `scrollToBlockId` prop. When it changes, find the DOM element with that block's ID and call `.scrollIntoView({ behavior: 'smooth', block: 'center' })`.

```tsx
useEffect(() => {
  if (scrollToBlockId) {
    const el = document.getElementById(`block-${scrollToBlockId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [scrollToBlockId]);
```

Make sure each block element in `DocumentRenderer.tsx` already has `id={`block-${block.id}`}`. If not, add this attribute.

---

## Step 13 — Create EditQuestionModal.tsx

**File:** `frontend/src/components/EditQuestionModal.tsx` *(new file)*

This modal is opened from the question card in Review Mode (a small edit icon button on the card).

It receives the `question` object and renders a form appropriate to the type:
- **MCQ:** Text inputs for `question`, each option, `correct_index` (radio buttons), and `explanation`.
- **T/F:** Text inputs for each `true_statement` and `false_alternative` pair. Ability to add/remove pairs.
- **Fill-in:** Text input for `question_text` (with gap placeholders), list of answer bank items.

On Save, call `updateQuestionPayload(id, newPayload)` from `api.ts` and close the modal.

```tsx
interface Props {
  question: Question;
  onClose: () => void;
}

export const EditQuestionModal: React.FC<Props> = ({ question, onClose }) => {
  // ... form state initialized from question.payload
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface-container rounded-2xl p-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2>Edit Question</h2>
        {/* Render form based on question.type */}
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};
```

---

## Summary Build Order

| Step | What | Where |
|------|------|--------|
| 1 | Add `mode` to store | `useStore.ts` |
| 2 | Wire toggle buttons | `Layout.tsx` |
| 3 | Conditional layout rendering | `Layout.tsx` |
| 4 | `ReviewMode.tsx` shell | New file |
| 5 | `MCQReview.tsx` | New file |
| 6 | `TrueFalseReview.tsx` | New file |
| 7 | `FillInReview.tsx` | New file |
| 8 | `ResultsSummary.tsx` | New file |
| 9 | `ReviewAttempt` Django model | `models.py` + migrations |
| 10 | Log attempt API endpoint | `views.py` + `urls.py` |
| 11 | `logAttempt` in frontend | `api.ts` |
| 12 | Auto-scroll document panel | `useStore.ts` + `DocumentRenderer.tsx` |
| 13 | `EditQuestionModal.tsx` | New file |

**Recommended order to implement:** Steps 1 → 2 → 3 → 9 → 10 → 4 → 8 → 5 → 6 → 7 → 11 → 12 → 13
