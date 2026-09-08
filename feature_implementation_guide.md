# Feature Implementation Guide

> **Last updated:** September 2026
> This guide documents 4 features to implement in the Hippocrates AI system. Each feature section includes the exact files to edit and precise code-level instructions.

---

## Feature 1 — Include Parent Heading 2 Title in Prompt Context

### Problem
When a block lives under a `heading_3`, the prompt context currently only walks up to the **nearest heading** (`heading_3` itself). The parent `heading_2` title is not included, so the AI misses a layer of context (e.g. "Clinical Features" under "Diabetes Mellitus").

### What needs to change
**File:** `backend/quiz/context_builder.py`

The function `build_heading2_context` already locates the `h2_root` for database FK purposes, but it only prepends the H1 title at the top of the context. We need to **also prepend the H2 title** when the nearest heading is an H3.

### Step-by-Step

**Step 1 — Locate the prepend block (around line 56)**

Find this section in `context_builder.py`:
`python
# Prepend Heading 1 title if the nearest heading isn't already heading 1
context_lines = []
if nearest_heading.block_type != Block.BlockType.HEADING_1:
    h1 = block
    while h1 and h1.block_type != Block.BlockType.HEADING_1:
        h1 = h1.parent
    if h1:
        context_lines.append(f"[HEADING 1] {h1.text}")
`

**Step 2 — Add H2 prepend logic immediately after the H1 prepend block**

Replace the block above with the following expanded version:

`python
# Prepend ancestor headings so the AI understands full topic scope
context_lines = []

if nearest_heading.block_type != Block.BlockType.HEADING_1:
    # Always prepend the H1 (disease / topic name)
    h1 = block
    while h1 and h1.block_type != Block.BlockType.HEADING_1:
        h1 = h1.parent
    if h1:
        context_lines.append(f"[HEADING 1] {h1.text}")

# NEW: If nearest heading is H3, also prepend the parent H2 title
# (we only want the title, NOT all its content)
if nearest_heading.block_type == Block.BlockType.HEADING_3:
    h2 = nearest_heading.parent
    while h2 and h2.block_type != Block.BlockType.HEADING_2:
        h2 = h2.parent
    if h2:
        context_lines.append(f"[HEADING 2] {h2.text}")
`

**Step 3 — No migration needed** — this is a pure logic change. Restart Django to pick it up.

**Step 4 — Verify**
- Select text from a block under an H3 (e.g. a list item under "Clinical Features").
- Generate a question and check `prompt_sent` in the DebugPromptPanel.
- You should now see `[HEADING 1] Diabetes Mellitus` AND `[HEADING 2] Clinical Features` prepended before the H3 content.

---

## Feature 2 — "Applies" Question Type (Select All That Apply)

Full-stack: backend schema → AI service → model → frontend store → renderer → card.

### Data Shape
`json
{
  "question": "Clinical features of Diabetes Mellitus. Select all that apply:",
  "correct_options": ["Polyuria", "Polydipsia", "Polyphagia", "Obesity", "Foot Ulcer", "Tingling Sensation"],
  "wrong_options": ["Headache", "Oliguria", "Hematuria", "Fever"]
}
`

---

### BACKEND

#### Step 1 — Add `AppliesSchema` to `backend/quiz/schemas.py`

Append to the end of the file:

`python
class AppliesSchema(BaseModel):
    question: str = Field(..., description="The 'Select all that apply' question stem")
    correct_options: List[str] = Field(
        ..., description="All items from the list that are correct answers (at least 2)"
    )
    wrong_options: List[str] = Field(
        ..., description="Plausible distractors that do NOT belong (at least 2)"
    )

    @model_validator(mode='after')
    def validate_applies(self):
        if len(self.correct_options) < 2:
            raise ValueError("Must have at least 2 correct options")
        if len(self.wrong_options) < 2:
            raise ValueError("Must have at least 2 wrong options")
        return self
`

#### Step 2 — Register in `backend/quiz/ai_service.py`

**2a.** Update the import:
`python
from .schemas import MCQSchema, TrueFalseSchema, FillInSchema, AppliesSchema
`

**2b.** Add to `schema_map` inside `generate_question()`:
`python
schema_map = {
    'mcq': MCQSchema,
    'true_false': TrueFalseSchema,
    'fill_in': FillInSchema,
    'applies': AppliesSchema,   # ADD THIS
}
`

**2c.** Add to `type_instructions` dict:
`python
'applies': (
    "Generate a 'Select all that apply' question based on the list items in the target text. "
    "All items from the given list are correct options. "
    "Generate at least 2 plausible distractor options that sound medically related but are NOT from the list. "
    "You MUST return a JSON object with exactly THREE fields: 'question', 'correct_options', 'wrong_options'.\n"
    "Example structure:\n"
    '{"question": "Clinical features of Diabetes Mellitus. Select all that apply:", '
    '"correct_options": ["Polyuria", "Polydipsia", "Polyphagia", "Obesity", "Foot Ulcer", "Tingling Sensation"], '
    '"wrong_options": ["Headache", "Oliguria", "Hematuria", "Fever"]}'
),
`

**2d.** Add passthrough normalizer to the `normalizers` dict:
`python
normalizers = {
    'mcq': _normalize_mcq,
    'fill_in': _normalize_fill_in,
    'true_false': _normalize_true_false,
    'applies': lambda d: d,   # ADD THIS
}
`

#### Step 3 — Add `APPLIES` to `backend/quiz/models.py`

`python
class QuestionType(models.TextChoices):
    MCQ = 'mcq', 'MCQ'
    TRUE_FALSE = 'true_false', 'True/False'
    FILL_IN = 'fill_in', 'Fill in the gap'
    APPLIES = 'applies', 'Select All That Apply'   # ADD THIS
`

Then **run migrations**:
`ash
python manage.py makemigrations quiz
python manage.py migrate
`

#### Step 4 — No changes needed to views

`GenerateQuestionView` is already generic — it reads `question_type` from the request and routes through `generate_question()`. The new type works automatically.

---

### FRONTEND

#### Step 5 — Update `frontend/src/store/useStore.ts`

Change the `Question` type union:
`	s
export interface Question {
  id: string;
  type: 'true_false' | 'mcq' | 'fill_in' | 'applies';
  ...
}
`

Add the payload interface:
`	s
export interface AppliesPayload {
  question: string;
  correct_options: string[];
  wrong_options: string[];
}
`

#### Step 6 — Add the "Applies" button to `frontend/src/components/DocumentRenderer.tsx`

**6a.** Update the `handleGenerate` type signature:
`	s
const handleGenerate = (type: 'true_false' | 'mcq' | 'fill_in' | 'applies') => {
`

**6b.** Add `ListChecks` to the lucide-react import:
`	s
import { CheckSquare, Radio, Space, Loader2, FileText, ListChecks } from 'lucide-react';
`

**6c.** Add button in the FAB group (after Fill-in button):
`	sx
<button onClick={() => handleGenerate('applies')} className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors">
  <ListChecks size={16} /> Applies
</button>
`

#### Step 7 — Create `frontend/src/components/AppliesRenderer.tsx`

`	sx
import React, { useState } from 'react';

interface AppliesPayload {
  question: string;
  correct_options: string[];
  wrong_options: string[];
}

interface Props {
  payload: AppliesPayload;
  isEditing: boolean;
  onChange: (updated: AppliesPayload) => void;
}

export const AppliesRenderer: React.FC<Props> = ({ payload, isEditing, onChange }) => {
  const allOptions = [...payload.correct_options, ...payload.wrong_options];
  const [shuffled] = useState(() => [...allOptions].sort(() => Math.random() - 0.5));

  if (isEditing) {
    return (
      <div className="space-y-sm text-body-sm">
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-xs">Question</label>
          <input
            className="w-full bg-surface border border-outline-variant rounded px-sm py-xs text-body-sm"
            value={payload.question}
            onChange={e => onChange({ ...payload, question: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-xs">Correct Options (one per line)</label>
          <textarea
            className="w-full bg-surface border border-outline-variant rounded px-sm py-xs text-body-sm"
            rows={4}
            value={payload.correct_options.join('\n')}
            onChange={e => onChange({ ...payload, correct_options: e.target.value.split('\n').filter(Boolean) })}
          />
        </div>
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-xs">Wrong Options (one per line)</label>
          <textarea
            className="w-full bg-surface border border-outline-variant rounded px-sm py-xs text-body-sm"
            rows={3}
            value={payload.wrong_options.join('\n')}
            onChange={e => onChange({ ...payload, wrong_options: e.target.value.split('\n').filter(Boolean) })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-sm text-body-sm">
      <p className="font-medium text-on-surface">{payload.question}</p>
      <div className="space-y-xs">
        {shuffled.map((opt, i) => {
          const isCorrect = payload.correct_options.includes(opt);
          return (
            <div key={i} className={px-sm py-xs rounded border text-label-sm }>
              {opt}
              <span className="ml-xs text-xs opacity-60">{isCorrect ? 'v' : 'x'}</span>
            </div>
          );
        })}
      </div>
      <p className="text-label-xs text-on-surface-variant">
        {payload.correct_options.length} correct + {payload.wrong_options.length} distractors
      </p>
    </div>
  );
};
`

#### Step 8 — Register in `frontend/src/components/QuestionCard.tsx`

**8a.** Import:
`	s
import { AppliesRenderer } from './AppliesRenderer';
import { ListChecks } from 'lucide-react'; // add to existing import
`

**8b.** Update badge renderer:
`	s
const renderBadge = () => {
  if (type === 'true_false') return <><CheckSquare size={14} /> True / False</>;
  if (type === 'mcq') return <><Radio size={14} /> Multiple Choice</>;
  if (type === 'fill_in') return <><SpaceIcon size={14} /> Fill-in Gap</>;
  if (type === 'applies') return <><ListChecks size={14} /> Select All That Apply</>;
  return null;
};
`

**8c.** Add renderer in payload section:
`	sx
{type === 'applies' && (
  <AppliesRenderer payload={isEditing ? editedPayload : payload} isEditing={isEditing} onChange={setEditedPayload} />
)}
`

#### Step 9 — Create `frontend/src/components/AppliesReview.tsx` (Review Mode interactive)

Follow the pattern of `MCQReview.tsx`:
- Render all options (correct + wrong) shuffled as checkboxes
- On "Check Answer", highlight correct ones green, incorrect selections red
- `is_correct = all correct options selected AND no wrong options selected`
- Call `logAttempt()` with the result

---

## Feature 3 — Error Display in the Review Box (with Retry)

### Problem
Generation failures are currently shown as `console.error` + `alert()`. They should appear as **failed question cards** in the review queue — collapsible error reason + retry button.

### Step 1 — Extend `Question` type in `frontend/src/store/useStore.ts`

Add `'failed'` status and new fields:
`	s
export interface Question {
  id: string;
  type: 'true_false' | 'mcq' | 'fill_in' | 'applies';
  payload: any;
  status: 'pending' | 'approved' | 'rejected' | 'failed';
  prompt_sent?: string;
  block_id?: string;
  // NEW:
  error?: string;
  generationPayload?: {
    blockId: string;
    selectedText: string;
    type: string;
    materialId: string;
  };
}
`

Add a new action to the `AppState` interface:
`	s
addFailedQuestion: (question: Question) => void;
`

Implement it (failed questions do NOT increment `queueCount`):
`	s
addFailedQuestion: (question) => set((state) => ({
  pendingQuestions: [question, ...state.pendingQuestions],
})),
`

Also update `removeQuestion` — it currently always decrements `queueCount`. Guard it:
`	s
removeQuestion: (id) => set((state) => {
  const q = state.pendingQuestions.find(q => q.id === id);
  const wasCountable = q && q.status === 'pending';
  return {
    pendingQuestions: state.pendingQuestions.filter(q => q.id !== id),
    queueCount: wasCountable ? Math.max(0, state.queueCount - 1) : state.queueCount,
  };
}),
`

### Step 2 — Update `frontend/src/hooks/useQuestionGeneration.ts`

Replace the catch block's `alert()` with a failed question dispatch:

`	s
const addFailedQuestion = useStore(state => state.addFailedQuestion);

const generateQuestion = async (
  blockId: string,
  selectedText: string,
  type: 'true_false' | 'mcq' | 'fill_in' | 'applies'
) => {
  try {
    const newQuestion = await apiGenerateQuestion(blockId, selectedText, type, materialId);
    addPendingQuestion(newQuestion);
    if (newQuestion.prompt_sent) setLastPromptSent(newQuestion.prompt_sent);
  } catch (err: any) {
    console.error("Generation failed:", err);
    const failedQuestion: Question = {
      id: ailed--,
      type,
      payload: {},
      status: 'failed',
      error: err.message || 'Unknown error during generation',
      generationPayload: { blockId, selectedText, type, materialId },
    };
    addFailedQuestion(failedQuestion);
  }
};
`

Also **export `generateQuestion` from the hook** so `QuestionCard` can call it for retry.

### Step 3 — Show failed questions in the review queue in `Layout.tsx`

Change the filter from:
`	sx
{pendingQuestions.filter(q => q.status === 'pending').map(...)}
`
To:
`	sx
{pendingQuestions.filter(q => q.status === 'pending' || q.status === 'failed').map((question) => (
  <QuestionCard key={question.id} question={question} />
))}
`

Also update the empty state condition:
`	sx
{pendingQuestions.filter(q => q.status === 'pending' || q.status === 'failed').length === 0 && (
  <div ...>No pending questions.</div>
)}
`

### Step 4 — Handle failed state in `frontend/src/components/QuestionCard.tsx`

Add early return at the top of the component render body:

`	sx
if (question.status === 'failed') {
  return <FailedQuestionCard question={question} />;
}
`

Create `FailedQuestionCard` as a sub-component (or separate file `FailedQuestionCard.tsx`):

`	sx
import { AlertCircle, RefreshCw, X } from 'lucide-react';

const FailedQuestionCard: React.FC<{ question: Question }> = ({ question }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { removeQuestion } = useStore();

  const handleRetry = async () => {
    if (!question.generationPayload) return;
    setIsRetrying(true);
    const { blockId, selectedText, type, materialId } = question.generationPayload;
    removeQuestion(question.id); // Remove the failed card first
    // Import and call the standalone generateQuestion function here
    // (see Step 5 below for how to import it)
    await triggerGeneration(blockId, selectedText, type as any, materialId);
    setIsRetrying(false);
  };

  return (
    <div className="bg-error-container/20 border border-error/30 rounded-xl p-md shadow-sm shrink-0">
      <div className="flex items-start justify-between gap-sm mb-sm">
        <div className="flex items-center gap-xs text-error text-label-sm font-medium">
          <AlertCircle size={14} />
          Generation Failed
          <span className="text-on-surface-variant font-normal ml-xs text-label-xs capitalize">
            ({question.type?.replace('_', ' ')})
          </span>
        </div>
        <button onClick={() => removeQuestion(question.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-error/10 text-error" title="Dismiss">
          <X size={14} />
        </button>
      </div>

      <button onClick={() => setShowDetails(v => !v)} className="text-label-xs text-on-surface-variant underline underline-offset-2 mb-sm">
        {showDetails ? 'Hide reason' : 'Show reason'}
      </button>

      {showDetails && (
        <div className="bg-surface rounded p-sm text-label-xs text-error font-mono mb-sm overflow-auto max-h-32 whitespace-pre-wrap">
          {question.error}
        </div>
      )}

      {question.generationPayload && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full flex items-center justify-center gap-xs bg-error text-on-error py-xs rounded text-label-sm disabled:opacity-50"
        >
          <RefreshCw size={13} className={isRetrying ? 'animate-spin' : ''} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
};
`

### Step 5 — Wire retry to `generateQuestion`

Refactor `useQuestionGeneration.ts` to also export a standalone callable:

`	s
// At module level, outside the hook:
export async function triggerGeneration(
  blockId: string,
  selectedText: string,
  type: 'true_false' | 'mcq' | 'fill_in' | 'applies',
  materialId: string
) {
  const store = useStore.getState();
  // ... same logic as generateQuestion inside the hook
  // Call apiGenerateQuestion, dispatch addPendingQuestion or addFailedQuestion
}
`

Then import `triggerGeneration` in `QuestionCard.tsx` and call it in `handleRetry`.

---

## Feature 4 — Adaptive Concurrency Limiter (Max 7 Requests, Pending-Aware)

### Logic
- Hard cap: **7 simultaneous in-flight requests**
- Smart cap: `queueCount + activeRequests < 20` must be true before firing a new request
- Combined: allow only if `activeRequests < 7 AND (queueCount + activeRequests) < 20`

### Step 1 — Add `activeRequestCount` to `frontend/src/store/useStore.ts`

Add to `AppState` interface:
`	s
activeRequestCount: number;
incrementActiveRequests: () => void;
decrementActiveRequests: () => void;
`

Implement:
`	s
activeRequestCount: 0,
incrementActiveRequests: () => set(state => ({ activeRequestCount: state.activeRequestCount + 1 })),
decrementActiveRequests: () => set(state => ({ activeRequestCount: Math.max(0, state.activeRequestCount - 1) })),
`

### Step 2 — Apply the gate in `frontend/src/hooks/useQuestionGeneration.ts`

`	s
const MAX_CONCURRENT = 7;
const MAX_QUEUE = 20;

const incrementActiveRequests = useStore(state => state.incrementActiveRequests);
const decrementActiveRequests = useStore(state => state.decrementActiveRequests);
const activeRequestCount = useStore(state => state.activeRequestCount);
const queueCount = useStore(state => state.queueCount);

const generateQuestion = async (blockId, selectedText, type) => {
  // Gate check
  if (activeRequestCount >= MAX_CONCURRENT) {
    console.warn('Max concurrent requests reached, ignoring');
    return;
  }
  if (queueCount + activeRequestCount >= MAX_QUEUE) {
    console.warn('Would exceed 20 pending once all in-flight succeed, ignoring');
    return;
  }

  incrementActiveRequests();
  try {
    const newQuestion = await apiGenerateQuestion(blockId, selectedText, type, materialId);
    addPendingQuestion(newQuestion);
    if (newQuestion.prompt_sent) setLastPromptSent(newQuestion.prompt_sent);
  } catch (err: any) {
    // ... dispatch failed question (Feature 3 logic)
  } finally {
    decrementActiveRequests();  // Always decrement, even on failure
  }
};
`

### Step 3 — Update FAB disable logic in `frontend/src/components/DocumentRenderer.tsx`

Replace:
`	s
const isQueueFull = queueCount >= MAX_QUEUE;
`
With:on full s
`	s
const activeRequestCount = useStore(state => state.activeRequestCount);
const MAX_CONCURRENT = 7;
const MAX_QUEUE = 20;
const isBlocked = activeRequestCount >= MAX_CONCURRENT || (queueCount + activeRequestCount) >= MAX_QUEUE;
`

Update the JSX condition from `isQueueFull` to `isBlocked`:
`	sx
{isBlocked ? (
  <div className="px-md py-sm text-error font-label-sm whitespace-nowrap">
    {activeRequestCount >= MAX_CONCURRENT
      ? ${activeRequestCount} requests in progress. Please wait.
      : 'Review pending questions before generating more.'}
  </div>
) : (
  // ... buttons
)}
`

### Step 4 — (Optional) Show live request count in Review Queue header (`Layout.tsx`)

`	sx
const activeRequestCount = useStore(state => state.activeRequestCount);

// In the queue header:
<div className="bg-surface-container-lowest px-sm py-xs rounded border border-outline-variant flex items-center gap-xs">
  <span className="text-label-sm text-on-surface-variant">Pending:</span>
  <span className="text-label-sm font-bold text-primary">{queueCount} / {MAX_QUEUE}</span>
  {activeRequestCount > 0 && (
    <span className="text-label-xs text-on-surface-variant ml-xs">· {activeRequestCount} generating</span>
  )}
</div>
`

---

## Recommended Implementation Order

| Order | Feature | Complexity | Risk |
|-------|---------|-----------|------|
| 1st | Feature 1 — H2 context fix | Low | None — backend only, no migration |
| 2nd | Feature 4 — Concurrency limiter | Medium | Frontend only |
| 3rd | Feature 3 — Error in queue | Medium | Touches store + multiple components |
| 4th | Feature 2 — Applies type | High | Full-stack: backend + frontend + new renderer |

---

## Files Changed Summary

| File | Feature(s) |
|------|-----------|
| `backend/quiz/context_builder.py` | #1 |
| `backend/quiz/schemas.py` | #2 |
| `backend/quiz/ai_service.py` | #2 |
| `backend/quiz/models.py` | #2 |
| `frontend/src/store/useStore.ts` | #2, #3, #4 |
| `frontend/src/hooks/useQuestionGeneration.ts` | #2, #3, #4 |
| `frontend/src/components/DocumentRenderer.tsx` | #2, #4 |
| `frontend/src/components/QuestionCard.tsx` | #2, #3 |
| `frontend/src/components/Layout.tsx` | #3, #4 |
| `frontend/src/components/AppliesRenderer.tsx` | #2 **NEW** |
| `frontend/src/components/AppliesReview.tsx` | #2 **NEW** |
| `frontend/src/components/FailedQuestionCard.tsx` | #3 **NEW** (optional split) |
