I want to move on to the next stage of generating the questions from highlighted text in the passage and using an LLM to generate.

There are 3 question format for now. The MCQ, T/F and Fill in the gap.

When I highlight text from the frontend, it shows these 3 categories of question format.

When I select one question format, it is to send the selected text and the context to the backend. The context includes the main heading (Heading 1), and every other text in its parent up to the level of the text's heading 2. Hence whether you select a text headed under a heading 2 or heading 3, when feeding the context to the AI, it gives it a well formatted text of the context from the heading 2 that contains that text. Also, there must be a way to transmit the immediate location from which it was transmitted from.

For now, only a single text can be selected, multiple cannot be selected (It will be implemented later). Texts can only be selected within blocks.


---

## ESSENTIAL: How the frontend identifies which block is selected

This is a critical step that must be explicitly built. When the user highlights text on the page, the browser's native selection system gives raw character positions inside a DOM element — it does not automatically tell you which database Block the selection came from. To solve this, every Block rendered on the frontend must carry its database UUID as a data attribute on its HTML element (e.g. data-block-id). When the user highlights and the toolbar appears, there must be a resolver that walks up the DOM from the highlighted text to find the nearest ancestor element carrying that data attribute. That UUID is the block_id that gets sent to the backend alongside the selected text and question type. Without this mechanism, the backend has no reliable way to know which block was selected, and the entire context-building pipeline cannot work.


---

## ESSENTIAL: How the backend builds the heading 2 context

The idea describes sending the "heading 2 context" to the AI, but the exact mechanism for building it needs to be clearly defined. When the backend receives a block_id, it must: look up that block in the database, traverse up its parent chain until it finds the ancestor that is a Heading 2 block, then collect every block that sits under that same Heading 2 — including all paragraphs, list items, and Heading 3 blocks beneath it — and serialize them in order into a single clean text string. The Heading 1 title is prepended to this string to give the AI the broadest orientation. This logic must live as a dedicated backend utility function, not be improvised at the point of the API call. If this is not built correctly, the AI receives incomplete or wrong context and the quality of every generated question suffers.


---

## ESSENTIAL: Structured output schemas must be defined before building anything

The AI output must not be treated as free-form text that is then parsed. For each question type, a strict schema must be defined upfront that describes exactly what fields the Gemini API must return and in what format. The API must be called in structured output / JSON mode so that it is forced to conform to this schema. Validation against the schema happens immediately after the response is received. If the response does not match the schema, the question is not saved and the generation is retried automatically (up to 2 retries). If it still fails, the user is notified that generation failed for that selection.

The schemas for each type should be as follows, described in plain terms:

MCQ — The response must contain: a question string, a list of either 4 or 5 option strings, an integer indicating which option index is the correct answer (zero-based), and an explanation string justifying why the correct answer is right. The explanation serves as a teaching point during review.

T/F — The response must contain: a stem string (the overarching question), and a list of statement objects. Each statement object contains the true version of the statement and its false alternative. Both are always present as a pair for every item in the list.

Fill in the gap — The response must contain: the question text with gaps marked using numbered placeholders (gap_0, gap_1, etc. — not blank underscores or freeform dashes), and an answer bank that is a list of option objects. Each option object contains its display text and a list of which gap numbers it is the correct answer for. This index-based approach is non-negotiable — see the improved Fill-in-the-gap section below.

These schemas also define the structure of the payload JSON field on the Question database model. They must be consistent between the backend validator, the database, and the frontend renderer.


---

For the AI prompts, I think it is best left to AI to write the prompt for me but here are the things I want you to consider when writing the prompts:

This is a Medical Study AI tool. Questions should be structured with the point of view that it is medically related. For example in the context, the heading 2 could be "Epidemiology". This means that the question generated has to be within that scope while still taking into account the other texts under the heading 2 like paragraphs, if there is a heading 3 or list, etc.

MCQ: Most times I could select a word, phrase, statement, numeric value etc. For a single word it might be just that word that I want to be the correct answer. For example, percentage incidence or name of organism or definitive management, etc. If it is a phrase or statement, it could look out for the keyword or the main theme of the selected text within the context and frame the MCQ around it. Let the options not be far off but let there be only one correct answer. Typically, Best of 4/5. Options should be either 4 or 5. In the output for preview, it should indicate which of the answers is correct, and include a brief explanation for why it is correct.


---

## IMPROVED: T/F question format

Most times, I could select a list. From that list, statements are created where each item is turned into a true-false pair. There is the correct statement, and then it is falsified in the alternative. This is done for each item in the list. The overarching stem question could be something like "Clinical Manifestations of Diabetes Mellitus:". When output in the preview, it shows all the correct statements and just below each, in a visually distinct style, it shows the false alternative.

When a long text or paragraph is selected instead of a list, the AI extracts key ideas to form the true statements, then creates a false alternative for each. The false alternative does not need to be the polar opposite — it just has to be clearly and unambiguously false within the context of the text. For example, "hypertension" and "hypotension" work as a pair, but so do "the incidence rate in Nigeria is about 5%" and "the incidence rate in Nigeria is about 13%", as long as one is clearly supported by the text and the other is clearly not. This maintains a necessary level of difficulty.

IMPORTANT — Structural validation after generation: The AI must not be trusted alone to produce valid T/F pairs. After the response is received, the backend must validate that every statement has exactly one true version and exactly one false alternative paired with it, and that all required fields are present. If structural validation fails, the generation is automatically retried. This is not optional — without this check, a malformed T/F response will crash the frontend renderer.

(Not to be done now, but in a later review phase, the T/F question type will only surface 5 randomly chosen items from the full list of pairs per review session, so no two sessions are identical.)


---

## IMPROVED: Fill in the gap

When a text is highlighted for fill in the gap, the entire selected text becomes the question body, with certain keywords, key terms, or numeric values removed and replaced with numbered gap markers (gap_0, gap_1, and so on). Between 2 and 5 gaps should be created.

IMPORTANT — The answer bank must use index-based tracking, not string matching: Each option in the answer bank must carry an explicit field stating which gap number(s) it is the correct answer for. This is essential because it is entirely possible that one option is the correct answer for more than one gap, or that a distractor for one gap looks similar to the answer for another. Determining correctness at answer-checking time must be done by checking whether the selected option's "correct for" list includes the gap index being answered — not by comparing text strings. String comparison is ambiguous and will produce incorrect grading and bugs.

The total number of options in the answer bank is twice the number of gaps. Correct answers account for one per gap (an option may serve more than one gap if appropriate), and the rest are plausible wrong alternatives. The distractors must be medically plausible and contextually close enough to cause genuine consideration, not obviously wrong answers.


---

## How to save the questions in the backend

Each question must save: the block_id of the block the text was selected from, the selected text itself, the heading 2 block_id (so the context can always be reconstructed without re-parsing), and the type-specific payload containing the generated question data. All question types share the same Question model — the question type field distinguishes them and the payload JSON field holds the type-specific content. This design keeps the database clean and means adding a new question type later only requires a new schema definition and a new frontend renderer, not a new table.

All questions should also persist a copy of the exact prompt text that was sent to the LLM, and the raw JSON response received. These are for debugging and auditing and do not need to be surfaced to the user in normal operation.

The questions should have a status field: pending, approved, or rejected. Pending means not yet reviewed. Only 20 questions can be in the pending state at once per material — this must be enforced both on the frontend (the generate action is disabled when the limit is reached) and on the backend via an atomic database check inside the generation endpoint, so that two near-simultaneous requests cannot both slip through when the count is at 19.

If approved, the status changes to approved. A question can be rejected, which offers two options: delete the record entirely, or re-prompt the LLM with a corrective instruction.


---

## ESSENTIAL: The re-prompt pipeline needs its own dedicated endpoint

The rejection and re-prompt flow must be treated as a separate, distinct backend operation from initial generation. It cannot share the same endpoint or logic as the first generation. The re-prompt endpoint receives the existing question's ID, retrieves the original selected text and heading 2 context from the database by re-fetching the stored block references (not from the frontend payload), appends the current bad output so the LLM can see what it previously produced, and then appends the user's corrective instruction. The result overwrites the existing question record — it does not create a new one. The question's status returns to pending after a successful re-prompt.


---

## ESSENTIAL: Inline manual editing must also be supported

There are circumstances where the LLM output is mostly correct but a small thing needs fixing — delete an option, correct a spelling, adjust a numeric value. This must be supported without calling the LLM again. The frontend must allow the user to edit individual fields of a question directly in the preview panel. The backend must have a partial update endpoint that accepts changes to the question payload and saves them without touching any other field. The status remains pending after a manual edit unless the user explicitly approves it.


---

## Debug prompt viewer

For debugging and troubleshooting, the exact text sent to the LLM and the time it was sent should be visible. This does not need to be saved permanently. The cleanest approach: the generation API response includes the prompt text as an extra field alongside the generated question. The frontend holds this in temporary component state and shows it in a collapsible debug panel. If the page is refreshed, it disappears — that is acceptable. This gives clear visibility into whether the right context is being built and sent to the AI without adding permanent storage overhead.


---

## API key

I will need an API key to enable this to work. Please let me know when to provide it. I want to use the Gemini API to start with.


---

## Reliability and crash prevention — four required layers

The AI API output must conform to the defined schema every single time before it is accepted into the system. The following four layers of crosschecks must be in place:

Layer 1 — Forced structured output: All API calls must use Gemini's structured output / JSON mode where the response schema is passed directly to the API, forcing the model to produce a conforming response rather than relying on prompt instructions alone.

Layer 2 — Schema validation: After the response is received, it must be validated against the schema in the backend before the question record is created. If any required field is missing or of the wrong type, the response is rejected.

Layer 3 — Automatic retry: If validation fails, the generation is automatically retried up to two more times with the same inputs. If all retries fail, the endpoint returns a clear error to the frontend stating that generation was unsuccessful for that selection, and no question record is created.

Layer 4 — Type-specific rule checks (fill-in-gap only): After schema validation, a further rules check must confirm that the number of gap markers in the text matches the number of distinct gap indices in the answer bank, that every gap index has at least one correct answer in the bank, and that the total option count is exactly twice the number of gaps. A failure here triggers a retry just like a schema validation failure.

These four layers together ensure that every question that reaches the database is structurally sound and will render on the frontend without a crash.