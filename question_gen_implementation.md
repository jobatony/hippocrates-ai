
> **Context:** The document upload, parsing, block storage, and reading view are already built and working. This guide covers everything needed to go from a text highlight to a generated, validated, stored question — end to end. Follow the steps in order; each step depends on the one before it.

---

## What is already in place (do not re-build these)

- `Material` and `Block` models with UUID primary keys and the adjacency-list tree structure
- `parse_docx` parser that stores blocks with `parent_id` references
- `BlockNode.tsx` already renders every block with `data-block-id` on its root `div`
- `useTextSelection.ts` already walks up the DOM from the highlighted text, finds the `data-block-id` attribute, and returns `{ blockId, text, rect }` — the block ID resolver is already done
- `DocumentRenderer.tsx` already shows the FAB toolbar with T/F, MCQ, and Fill-in buttons when text is selected
- `useStore.ts` already has the `pendingQuestions` array, `queueCount`, and the 20-item frontend cap
- `useQuestionWebSocket.ts` exists but is fully mocked — it needs to be replaced with a real HTTP call

---

## PART 1 — BACKEND

### Step 1 — Create the quiz Django app

Run `python manage.py startapp quiz` from the backend directory. This creates the `quiz` folder with `models.py`, `views.py`, `admin.py`, `apps.py`, and `migrations/`. Register it immediately in `settings.py` under `INSTALLED_APPS` by adding `'quiz'` to the list. Also add the `quiz` urls to the root `hippocrates/urls.py` under the `/api/` prefix.

---

### Step 2 — Install the Gemini SDK and add it to requirements

Install `google-generativeai` into the virtual environment. Add it to `requirements.txt`. This is the official Python SDK for the Gemini API and supports structured output (JSON schema mode) natively.

---

### Step 3 — Add the Gemini API key to the .env file

Add a new line to `.env`: `GEMINI_API_KEY=your_key_here`. Read it in `settings.py` using `config('GEMINI_API_KEY')` and assign it to a `GEMINI_API_KEY` settings variable. Never hardcode the key anywhere in source files.

---

### Step 4 — Define the Question model

In `quiz/models.py`, create a single `Question` model. It must have the following fields:

- `id` — UUID, primary key, auto-generated, non-editable
- `material` — ForeignKey to `documents.Material`, on_delete CASCADE, with a `related_name` of `questions`
- `source_block` — ForeignKey to `documents.Block`, on_delete PROTECT (not CASCADE — deleting a block should not silently destroy questions), with a `related_name` of `source_questions`
- `heading_2_block` — ForeignKey to `documents.Block`, null=True, blank=True, on_delete SET_NULL, with a `related_name` of `context_questions`. This stores which heading-2 ancestor was used as context so it can always be reconstructed
- `question_type` — CharField with choices: `mcq`, `true_false`, `fill_in`
- `status` — CharField with choices: `pending`, `approved`, `rejected`. Default is `pending`
- `selected_text` — TextField. Stores exactly what the user had highlighted
- `payload` — JSONField. Stores the type-specific question data (options, answers, gaps, etc.). This is the structured AI output after validation
- `prompt_sent` — TextField, blank=True. The exact prompt string sent to the Gemini API. Used for debugging
- `raw_ai_response` — TextField, blank=True. The raw JSON string the API returned before processing
- `created_at` — DateTimeField, auto_now_add=True
- `updated_at` — DateTimeField, auto_now=True

The `Meta` class should set `ordering = ['-created_at']`.

After writing the model, run `python manage.py makemigrations quiz` followed by `python manage.py migrate`.

---

### Step 5 — Build the heading-2 context builder utility

Create a new file `quiz/context_builder.py`. This file contains one function: `build_heading2_context(block)`.

The function receives a `Block` instance (the block the user selected from) and must do the following:

First, it walks up the `parent` chain of the given block, following `block.parent` repeatedly until it either reaches a block whose `block_type` is `heading_2` or reaches a block with no parent (a root block). The last `heading_2` found in that traversal is the context root. If no `heading_2` is found at all (for example, if content is directly under a `heading_1`), fall back to the `heading_1` ancestor.

Second, once the heading-2 block is identified, collect every block in the material that is a descendant of that heading-2 block. Do this by querying all blocks for the same material and filtering recursively — or more efficiently, since the tree is shallow (max 3 levels deep), by fetching all children of the heading-2 block and then all grandchildren (children of children). Order all of them by `order`.

Third, serialize all collected blocks into a single formatted string. Headings should be prefixed with a marker so the AI can understand the structure (e.g. `[HEADING 2] Epidemiology`, `[HEADING 3] Incidence`, `[TEXT] The incidence of...`, `[LIST] item text`). Prepend the `heading_1` title at the very top.

The function should return two things: the context string, and the heading-2 Block instance itself (so the view can save `heading_2_block` on the Question).

This function is the most important piece of the entire backend. Get it right before moving to the AI call.

---

### Step 6 — Define Pydantic schemas for each question type

Create a new file `quiz/schemas.py`. Install `pydantic` explicitly into `requirements.txt` if not already there.

Define one Pydantic model per question type:

**MCQSchema** — Fields: `question` (str), `options` (list of str, min length 4, max length 5), `correct_index` (int), `explanation` (str). Add a validator confirming `correct_index` is within the bounds of the `options` list length.

**TrueFalseStatementSchema** — Fields: `true_statement` (str), `false_alternative` (str). This represents one true/false pair.

**TrueFalseSchema** — Fields: `stem` (str), `statements` (list of TrueFalseStatementSchema, min length 1).

**FillInOptionSchema** — Fields: `text` (str), `correct_for_gaps` (list of int). This is the index-based gap tracking — each option declares which gap numbers it correctly answers.

**FillInSchema** — Fields: `question_text` (str), `answer_bank` (list of FillInOptionSchema), `gap_count` (int, between 2 and 5). Add a model-level validator that checks: the number of `gap_X` placeholders in `question_text` matches `gap_count`, every integer from 0 to `gap_count - 1` appears in at least one option's `correct_for_gaps`, and the total `answer_bank` length is exactly `gap_count * 2`.

---

### Step 7 — Build the Gemini generation service

Create a new file `quiz/ai_service.py`. This file contains all interaction with the Gemini API and has one main function: `generate_question(question_type, selected_text, context_string)`.

The function does the following:

First, it selects the correct prompt template based on `question_type`. Each prompt must instruct the model clearly: this is a medical study tool, the selected text is the focus (wrapped in a clear marker so the model knows exactly what to build the question around), the context is the surrounding section, and the output must conform to a specific JSON structure with exact field names matching the Pydantic schema. The model must be told to produce only those fields and nothing else.

Second, it calls the Gemini SDK using `response_mime_type="application/json"` along with a `response_schema` built from the corresponding Pydantic model. This forces the model into structured JSON output mode. Use `gemini-1.5-flash` as the default model — it is fast and inexpensive for this use case.

Third, after receiving the response, parse the response text as JSON and validate it against the corresponding Pydantic schema. If validation raises a `ValidationError`, the function raises a custom `GenerationValidationError` (define this class in the same file).

Fourth, the function retries automatically up to 2 additional times (3 total attempts) if a `GenerationValidationError` is raised. If all attempts fail, raise the `GenerationValidationError` to the caller.

The function returns a tuple of: the validated Pydantic model instance (the clean question data), the prompt string that was sent, and the raw API response text. All three are needed by the view.

---

### Step 8 — Build the question generation endpoint

In `quiz/views.py`, create a view called `GenerateQuestionView`.

This view handles `POST /api/questions/generate/`. The request body must contain: `block_id` (UUID string), `question_type` (one of `mcq`, `true_false`, `fill_in`), `material_id` (UUID string).

The view does the following steps in order:

1. Validate that `block_id`, `question_type`, and `material_id` are present and valid. Return HTTP 400 if any are missing or invalid.
2. Fetch the `Block` and `Material` from the database. Return HTTP 404 if either is not found.
3. **Check the pending cap inside an atomic transaction**: count `Question` objects for this material with `status='pending'`. If the count is already 20 or more, return HTTP 429 with a message telling the user to review pending questions first. The `atomic()` block ensures two simultaneous requests at count 19 cannot both slip through.
4. Call `build_heading2_context(block)` to get the context string and heading-2 block reference.
5. Call `generate_question(question_type, block.text, context_string)` from `ai_service.py`. If this raises `GenerationValidationError` after all retries, return HTTP 422 with a clear error message. Do not create any database record.
6. Create the `Question` record: set `material`, `source_block`, `heading_2_block`, `question_type`, `status='pending'`, `selected_text`, `payload` (the validated schema serialized to a plain dict), `prompt_sent`, and `raw_ai_response`.
7. Return HTTP 201 with the question's `id`, `question_type`, `status`, `payload`, and `prompt_sent`. The `prompt_sent` field powers the debug panel on the frontend.

---

### Step 9 — Build the re-prompt endpoint

In `quiz/views.py`, create `RegenerateQuestionView` handling `POST /api/questions/<uuid:pk>/regenerate/`. The request body must contain `extra_instruction` (a string from the user).

The view does the following:

1. Fetch the `Question` by ID. Return HTTP 404 if not found.
2. Re-fetch the context by calling `build_heading2_context(question.source_block)`. Never use context from the request — always rebuild from the stored block references.
3. Build a re-prompt string combining: the original selected text, the full heading-2 context, the current bad output (the existing `payload` serialized to a readable string), and the user's `extra_instruction`. The prompt must make it clear to the model that this is a correction pass and it should improve upon the previous attempt.
4. Call the Gemini API with the combined re-prompt and the same question type schema. Apply the same retry logic.
5. On success, update the **existing** `Question` record: overwrite `payload`, `prompt_sent`, and `raw_ai_response`. Set `status` back to `pending`. Do not create a new record.
6. Return HTTP 200 with the updated question in the same response shape as the generate endpoint.

---

### Step 10 — Build the manual edit endpoint

In `quiz/views.py`, create `UpdateQuestionView` handling `PATCH /api/questions/<uuid:pk>/`. The request body can contain `payload` (updated payload dict) and/or `status` (to approve or reject).

The view does the following:

1. Fetch the `Question`. Return HTTP 404 if not found.
2. If `payload` is in the request, validate it against the Pydantic schema for the question's `question_type`. Return HTTP 400 with validation errors if it fails. This prevents the frontend from saving a malformed manual edit.
3. Apply the updates and save.
4. Return HTTP 200 with the updated question.

---

### Step 11 — Build the question list and delete endpoints

Create `QuestionListView` for `GET /api/questions/?material_id=<uuid>`. Returns all questions for a material, ordered by creation date. The serializer returns: `id`, `question_type`, `status`, `payload`, `selected_text`, `prompt_sent`, `created_at`.

Create `QuestionDeleteView` for `DELETE /api/questions/<uuid:pk>/`. Deletes the record and returns HTTP 204. This is the "reject and delete" option.

---

### Step 12 — Wire up the quiz URLs and admin

Create `quiz/urls.py` with paths for all the views above. Include it in the root `hippocrates/urls.py` under the `api/` prefix.

In `quiz/admin.py`, register the `Question` model with `list_display` showing question type, status, material, and creation date. Add `list_filter` on type and status. Make `payload`, `prompt_sent`, and `raw_ai_response` read-only fields in the detail view — they are too complex to safely hand-edit through the admin interface.

---

## PART 2 — FRONTEND

### Step 13 — Update the Zustand store

In `store/useStore.ts`, replace `payload: any` on the `Question` interface with typed payload interfaces (`MCQPayload`, `TrueFalsePayload`, `FillInPayload`) matching the backend Pydantic schemas. Add `promptSent: string` to `Question`. Add `lastPromptSent: string | null` and `setLastPromptSent(prompt)` to the store for the debug panel. Add `updateQuestionPayload(id, payload)` for inline edits, and `setQuestions(questions)` for loading questions when a material opens.

---

### Step 14 — Extend the API layer

In `api.ts`, add the following new functions:

- `generateQuestion(blockId, questionType, materialId)` — POST to `/api/questions/generate/`
- `fetchQuestions(materialId)` — GET to `/api/questions/?material_id=<id>`
- `approveQuestion(id)` — PATCH to `/api/questions/<id>/` with `{ status: 'approved' }`
- `deleteQuestion(id)` — DELETE to `/api/questions/<id>/`
- `updateQuestionPayload(id, payload)` — PATCH to `/api/questions/<id>/` with `{ payload }`
- `regenerateQuestion(id, extraInstruction)` — POST to `/api/questions/<id>/regenerate/`

---

### Step 15 — Replace the mock hook with real HTTP

In `hooks/useQuestionWebSocket.ts` (consider renaming it `useQuestionGeneration.ts`), replace the mock `setTimeout` with a real call to `generateQuestion()` from the API layer. On success, call `addPendingQuestion` with the returned question (including `promptSent`) and call `setLastPromptSent` with the returned `prompt_sent` value. On error, surface a visible message to the user in the FAB area. Also, in the `useEffect` that runs when `documentId` changes, call `fetchQuestions(documentId)` and dispatch the results to `setQuestions` so existing pending questions are restored on page load.

---

### Step 16 — Add a loading state to the FAB

In `DocumentRenderer.tsx`, consume the loading state from the generation hook. While a generation is in flight, replace the three question type buttons with a spinner and the text "Generating…". This prevents double-submissions.

---

### Step 17 — Build the QuestionCard component

Each question in the pending panel renders as a card. The card shows:

- A badge with the question type
- The type-specific rendered content (read-only by default)
- An **Approve** button: calls `approveQuestion(id)` then `updateQuestionStatus(id, 'approved')` in the store
- A **Delete** button: calls `deleteQuestion(id)` then `removeQuestion(id)` in the store
- A **Re-prompt** button: opens an inline text input. On submit, calls `regenerateQuestion(id, instruction)` and on success calls `updateQuestionPayload(id, newPayload)` in the store
- An **Edit** toggle: switches between read-only and edit mode

---

### Step 18 — Build type-specific renderers

**MCQ**: Shows the question text, then 4 or 5 lettered options. The correct option is visually highlighted (green tint or checkmark). The explanation is shown below in a muted style.

**T/F**: Shows the stem question, then each true statement followed immediately by its false alternative in a visually distinct style (e.g. muted red or italicised) labelled "False alternative:".

**Fill-in**: Shows the question text with gap placeholders rendered as styled blank boxes. The answer bank options are shown as pills below. Correct answer pills are visually distinct from distractor pills in preview mode.

---

### Step 19 — Build inline edit mode

When the Edit toggle is active, each field becomes editable:

- MCQ: options become `<input>` fields, correct answer becomes a radio group, explanation becomes a `<textarea>`
- T/F: each true statement and false alternative become separate editable fields; pairs can be added or removed
- Fill-in: question text becomes a `<textarea>`; each option text is editable; gap assignment is a multi-select control

On **Save**, call `updateQuestionPayload(id, updatedPayload)` from the API. On success, update the store and return to read-only mode. On failure, show the error and stay in edit mode.

---

### Step 20 — Build the debug prompt panel

Add `lastPromptSent` and its timestamp to the Zustand store. After every successful `generateQuestion` or `regenerateQuestion` call in the hook, update `lastPromptSent` with the returned `prompt_sent` value and record the current timestamp.

In the UI, add a collapsible panel (collapsed by default) labelled "Debug — Prompt Inspector". When expanded, it shows the timestamp and the full prompt text in a read-only monospace block. Add a small note that this resets on page refresh. This panel should live at the bottom of the right-hand panel or as a floating dev tool overlay.

---

### Step 21 — Load existing questions when opening a material

Wherever the app handles material selection (where `setActiveMaterial` and `fetchMaterialDetail` are called), also call `fetchQuestions(materialId)` and pass the results to `setQuestions`. This ensures previously generated pending questions reappear immediately when a material is reopened, without needing to regenerate them.

---

## PART 3 — END-TO-END VERIFICATION

### Step 22 — Manual test checklist

Work through this checklist before considering the feature complete:

- [ ] Highlight a single word and click MCQ — FAB shows loading state, question appears with options and explanation
- [ ] Highlight a list and click T/F — each list item appears as a true/false pair
- [ ] Highlight a sentence and click Fill-in — gaps are marked, answer bank has twice as many options as gaps
- [ ] Approve a question — status updates in the database and UI
- [ ] Delete a question — removed from panel and database
- [ ] Generate 20 questions — FAB shows the cap message; a 21st backend request returns HTTP 429
- [ ] Re-prompt a question with a correction note — card updates in place with improved content
- [ ] Edit an option manually and save — change persists after closing and reopening the material
- [ ] Open the debug panel — shows exact prompt text from the last generation
- [ ] Refresh the page — debug panel is empty, but pending questions reload from the database

---

## Summary of new files

| Location | File | Purpose |
|---|---|---|
| `backend/quiz/` | `models.py` | Question model |
| `backend/quiz/` | `schemas.py` | Pydantic validation schemas per question type |
| `backend/quiz/` | `context_builder.py` | Heading-2 context builder utility |
| `backend/quiz/` | `ai_service.py` | Gemini API calls with retry logic |
| `backend/quiz/` | `views.py` | Generate, regenerate, update, list, delete views |
| `backend/quiz/` | `serializers.py` | DRF Question serializer |
| `backend/quiz/` | `admin.py` | Django admin registration |
| `backend/quiz/` | `urls.py` | URL routing |
| `frontend/src/` | `api.ts` | Extended with question API functions |
| `frontend/src/hooks/` | `useQuestionGeneration.ts` | Replaces the mock WebSocket hook |
| `frontend/src/store/` | `useStore.ts` | Typed payloads, new actions |
| `frontend/src/components/` | `QuestionCard.tsx` | Per-question card with all actions |
| `frontend/src/components/` | `MCQRenderer.tsx` | Read-only and edit-mode MCQ display |
| `frontend/src/components/` | `TrueFalseRenderer.tsx` | Read-only and edit-mode T/F display |
| `frontend/src/components/` | `FillInRenderer.tsx` | Read-only and edit-mode Fill-in display |
| `frontend/src/components/` | `DebugPromptPanel.tsx` | Collapsible prompt inspector |
