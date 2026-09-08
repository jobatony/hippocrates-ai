# Enabling Asynchronous Question Generation

Currently, your frontend prevents you from generating a new question while another one is processing. This document explains how to safely remove that restriction so you can queue multiple AI generation requests concurrently without breaking any system logic.

## 1. System Safety Analysis

Before implementing this, let's verify that the system can handle concurrent background requests safely:

- **Backend (Django + PostgreSQL):** 
  The `/api/questions/generate/` endpoint is fully stateless. Each request operates independently, calls the Gemini API, and inserts a new row into the PostgreSQL database. Since you use UUIDs for primary keys, there are no ID collision risks. PostgreSQL safely handles concurrent inserts.
- **Frontend State (Zustand):** 
  When a question finishes generating in the background, the `useQuestionGeneration` hook calls `addPendingQuestion(newQuestion)`. Your Zustand store correctly uses an updater function `(state => ({ ... }))` rather than direct mutation, which means multiple background requests finishing at the same time will safely append their questions to the queue without race conditions.

**Conclusion:** It is 100% safe to fire multiple requests concurrently.

---

## 2. Implementation Steps

We need to modify the `DocumentRenderer.tsx` component to completely ignore the `isGenerating` state, allowing the action buttons to remain active at all times.

### Step 1: Update `DocumentRenderer.tsx`

**File:** `frontend/src/components/DocumentRenderer.tsx`

Locate the `useQuestionGeneration` hook initialization at the top of the component (around line 21). You can remove `isGenerating` from the destructured variables.

```tsx
  // BEFORE
  const { generateQuestion, isGenerating } = useQuestionGeneration(activeMaterialId || '');

  // AFTER
  const { generateQuestion } = useQuestionGeneration(activeMaterialId || '');
```

### Step 2: Remove the Blocking UI

Further down in the same file (around line 101), locate the Floating Action Button (FAB) code that displays the highlight menu. Remove the `isGenerating` ternary branch completely.

**BEFORE:**
```tsx
              {isQueueFull ? (
                <div className="px-md py-sm text-error font-label-sm whitespace-nowrap">
                  Review pending questions before generating more.
                </div>
              ) : isGenerating ? (
                <div className="px-md py-sm text-on-surface-variant font-label-sm whitespace-nowrap flex items-center gap-xs">
                  <Loader2 size={16} className="animate-spin" /> Generating...
                </div>
              ) : (
                <>
                  <button onClick={() => handleGenerate('true_false')} className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors">
                    <CheckSquare size={16} /> T/F
                  </button>
                  <button onClick={() => handleGenerate('mcq')} className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors">
                    <Radio size={16} /> MCQ
                  </button>
                  <button onClick={() => handleGenerate('fill_in')} className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors">
                    <Space size={16} /> Fill-in
                  </button>
                </>
              )}
```

**AFTER:**
```tsx
              {isQueueFull ? (
                <div className="px-md py-sm text-error font-label-sm whitespace-nowrap">
                  Review pending questions before generating more.
                </div>
              ) : (
                <>
                  <button onClick={() => handleGenerate('true_false')} className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors">
                    <CheckSquare size={16} /> T/F
                  </button>
                  <button onClick={() => handleGenerate('mcq')} className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors">
                    <Radio size={16} /> MCQ
                  </button>
                  <button onClick={() => handleGenerate('fill_in')} className="px-md py-sm bg-surface-container hover:bg-surface-container-low text-on-surface rounded-lg font-label-sm whitespace-nowrap flex items-center gap-xs transition-colors">
                    <Space size={16} /> Fill-in
                  </button>
                </>
              )}
```

## 3. Recommended Optional Cleanup

Since `isGenerating` is no longer blocking the UI, you can safely ignore it, but if you want to keep your codebase completely clean, you can also remove it from the hook itself.

**File:** `frontend/src/hooks/useQuestionGeneration.ts`

```typescript
// frontend/src/hooks/useQuestionGeneration.ts
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateQuestion as apiGenerateQuestion, fetchQuestions } from '../api';

export const useQuestionGeneration = (materialId: string) => {
  const addPendingQuestion = useStore(state => state.addPendingQuestion);
  const setQuestions = useStore(state => state.setQuestions);
  const setLoadingQuestions = useStore(state => state.setLoadingQuestions);
  const setLastPromptSent = useStore(state => state.setLastPromptSent);

  useEffect(() => {
    if (!materialId) return;
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const questions = await fetchQuestions(materialId);
        setQuestions(questions);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      }
    };
    loadQuestions();
  }, [materialId, setQuestions, setLoadingQuestions]);

  const generateQuestion = async (blockId: string, selectedText: string, type: 'true_false' | 'mcq' | 'fill_in') => {
    try {
      // API call runs completely in the background
      const newQuestion = await apiGenerateQuestion(blockId, selectedText, type, materialId);
      
      // Zustand safely handles concurrent updates
      addPendingQuestion(newQuestion);
      if (newQuestion.prompt_sent) {
        setLastPromptSent(newQuestion.prompt_sent);
      }
    } catch (err: any) {
      console.error("Generation failed:", err);
      alert(`Generation failed: ${err.message || 'Unknown error'}`);
    }
  };

  return { generateQuestion };
};
```
