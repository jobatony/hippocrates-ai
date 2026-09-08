Context:
Here is a comprehensive technical feasibility review, architectural blueprint, and risk evaluation for your AI-powered active recall and document-grounded question generator.

1. Feasibility Assessment
The concept is highly feasible and structurally sound. Splitting the platform into Material Ingestion & Containerization, Asynchronous Question Generation, and Split-Screen Interactive Review solves the biggest flaw of typical AI flashcard tools: lack of traceable source grounding.

Using Django for the backend (data modeling, Celery queues, WebSockets via Django Channels) and React for the frontend (split-pane layouts, text selection overlays, dynamic question rendering) is an ideal, robust stack for this workflow.

2. Recommended System Architecture
[ Frontend: React ]
  ├── Reader View (AST Renderer + Text Selector + FAB)
  ├── Realtime Preview Queue (WebSocket Listener, Max Limit: 20)
  └── Split-Screen Reviewer (Source Highlight Sync)
         │ (HTTP / WebSocket)
         ▼
[ Backend: Django + ASGI ]
  ├── Document Parser Service (.docx -> Hierarchical JSON/AST)
  ├── Extensible Question Registry (Strategy Pattern)
  └── Celery Task Workers + Redis (LLM API Call + Structured JSON Output)
         │
         ▼
[ PostgreSQL (JSONB + Relational Models) ]
A. Document Containerization & Storage Strategy
To allow questions to link directly back to the exact paragraph or section where they originated, avoid saving raw plain text. Convert uploaded .docx files into a Hierarchical Abstract Syntax Tree (AST) stored in PostgreSQL as JSONB.

JSON

{
  "document_id": "doc_123",
  "nodes": [
    {
      "id": "node_A",
      "type": "heading_1",
      "text": "Diabetes Mellitus Overview",
      "children": [
        {
          "id": "node_B",
          "type": "paragraph",
          "text": "Type 1 DM is an autoimmune disease characterized by beta-cell destruction...",
          "order": 1
        }
      ]
    }
  ]
}
Why this works: When highlighting text in React, the selection payload captures container_id: "node_B", start_offset: 12, end_offset: 85. During review, the frontend simply queries container_id to auto-scroll and highlight that exact text block.

B. Extensible Question Engine (Open-Closed Principle)
To add new question types (T/F, Multi-Select, Odd-One-Out, Cloze/Fill-in-the-gap) without altering core components, implement the Strategy Pattern:

                  ┌──────────────────────────────┐
                  │   BaseQuestionStrategy (ABC)  │
                  ├──────────────────────────────┤
                  │ + prompt_template            │
                  │ + pydantic_schema            │
                  │ + validate_response()        │
                  │ + evaluate_answer()          │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ TrueFalseStrategy│    │ MultiMCQStrategy │    │ FillInGapStrategy│
└──────────────────┘    └──────────────────┘    └──────────────────┘
Django Backend: Create a QuestionRegistry. Any new question class registers itself with its unique LLM prompt template, Pydantic schema for structured output (e.g., via OpenAI/Gemini Structured Outputs / JSON Schema), and grading logic.

React Frontend: Use a dynamic component registry (<QuestionRenderer data="{question.payload}" type="{question.type}"/>) mapping types to specific UI cards (drag-and-drop pills, checkboxes, or boolean buttons).

C. Asynchronous Generation & WebSocket Flow
User Action: User highlights text $\rightarrow$ selects question type $\rightarrow$ React sends POST request $\rightarrow$ backend immediately returns task_id (HTTP 202).

Background Task: A Celery worker formats the prompt with the selected text + context, calls the LLM, validates the output against the schema, and saves it in a PendingQuestion state.

Real-Time Push: Django Channels broadcasts the generated question over WebSockets to the client, which injects it into the preview side-panel.

Queue Throttling: If the user's unapproved PendingQuestion count reaches 20, the frontend disables the FAB/generate action and the backend rejects new queue requests until items are approved or dismissed.

3. Critical Bottlenecks & Failure Modes
ComponentPotential BottleneckMitigation StrategyLLM Output ConsistencyLLM generating bad distractors (e.g., ambiguous or actually true options in T/F).Use strict JSON schema validation (e.g., Pydantic / Instructor). Force the LLM to output a rationale field alongside each alternative.Cloze Token CollisionsDuplicate fill-in-the-gap tokens (e.g., two blanks requiring "insulin").Track blank slots by index ({{gap_0}}, {{gap_1}}) rather than string matching, and treat option pills as instances with unique IDs.WebSocket Dropped StateNetwork disconnects while background jobs are running.Maintain a persistent PendingQueue table in Django; fetch unapproved questions on component mount or reconnection.Document Offset DriftIf documents are editable, text changes invalidate highlight coordinates.Treat ingested materials as immutable versions once question generation begins.
4. Blind Spots to Consider
Context Window Starvation: Sending only the highlighted sentence to the LLM often produces generic or nonsensical distractors. The worker must receive both the selected_text and the surrounding_container_text (parent section) for context, while instructing the model to base questions strictly on the selected excerpt.

Distractor Quality in Medical/Factual Topics: For "Odd-one-out" or "Best of 5", distractors must be clinically or contextually plausible. Include a system constraint such as: "Distractors must belong to the same semantic class (e.g., complications of the same disease, organisms of the same family)."

Multi-Selection UI Validation: Disabling incompatible question formats dynamically based on selection length is smart (e.g., single phrase $\rightarrow$ Cloze/MCQ; multiple sentences $\rightarrow$ T/F cluster). Define deterministic rules (e.g., word count $< 5$ vs. $> 30$ words or sentence count) so the user understands why a button is disabled.

Review Session State Management: In "Review Mode", handle partial correctness (e.g., identifying 3 of 4 filarial worms) and spaced-interval flags without mutating the primary question definition.

5. Development Roadmap: MVP vs. Post-MVP
Phase 1: Core MVP
[ ] .docx upload and hierarchical parser (Headings, Paragraphs $\rightarrow$ Container IDs).

[ ] Text selection listener with FAB trigger in React.

[ ] Celery + Redis queue for LLM calls with Pydantic JSON schemas.

[ ] Django Channels WebSocket integration to push questions into the Preview panel.

[ ] Support for MCQ (Single/Multi) and True/False clusters.

[ ] Split-screen reader and review view with bidirectional highlight scrolling.

Phase 2: Advanced Formats & Enhancements
[ ] Fill-in-the-gap / Cloze Engine: Drag-and-drop or clickable word banks supporting duplicate tokens and distractor pools.

[ ] Queue Throttling & Batch Editing: Inline prompt parameter tweaking before approval.

[ ] Tagging System: Many-to-Many tagging on materials and questions.

Phase 3: Mastery & Spaced Repetition
[ ] Spaced repetition scheduling algorithm (e.g., FSRS or SM-2).

[ ] Contextual RAG / chat sidebar for in-depth query drill-downs.


Looking through all ten pages — this is a clear, well-thought-out concept. Let me reflect back what I'm seeing before I get into the evaluation.

**Hippocrates AI**, as I understand it: you upload study materials (docx, medical notes), read them in a split-pane "Reading View," highlight text and add it to a selection set via a FAB, pick a question type (Odd-one-out, Correct-ones, Best-of-N, T/F, Fill-in-the-gap), and an AI model generates a structured question from that selection. It lands in a Preview pane (pushed live via websocket as it finishes generating in the background), you review/edit/approve it, and later you study it in a Review Mode that shows the question first and only reveals the source material region if you ask for it or get it wrong. Post-MVP: spaced repetition, tags, a chatbot.

That's a genuinely coherent product, and it's buildable on React + Django. The AI-generation part is the *easy* part here — the part that will actually determine whether this works is the document-containerization design, which you've correctly identified as unresolved (images 4–5). Everything else — source-linking, highlighting-on-review, context injection, extensibility — hangs off that one decision. So that's where I'd start.That's the whole loop. Now let's get into the substance.

## The one decision to make before writing any code

You already flagged the right question in your own notes (images 4–5): what is the "containerized output" of a material, and how does everything else read from it? Here's a concrete answer:

**Don't store a document as a blob — store it as a table of blocks.**

- `Material` — the uploaded file itself (docx stored for archival, plus title, upload date, status).
- `Block` — one row per paragraph/heading/list-item/table-cell, with: `id` (UUID, stable forever), `material` (FK), `order` (int), `block_type`, `text`. This is the "containerized output." Parse with `python-docx` or `mammoth`, and don't try to preserve every formatting nuance — flatten to structural units.

This single decision answers all four of your open questions at once:

- **Format** → a related DB table, not a new exotic data type. Each block gets a permanent ID.
- **How stored** → Postgres, queryable, FK-able from anywhere.
- **How AI gets context** → when generating, pull the block(s) the user's selection touches, optionally plus a window of neighbouring blocks, serialize to plain text with the selected span wrapped in a marker (`<<SELECTED>>...<</SELECTED>>`), and hand that whole string to the prompt. The model always knows exactly what's "the question" vs. "surrounding context."
- **How it's output to the frontend** → a DRF endpoint returns the material with its ordered blocks as JSON. React renders each block as a DOM node carrying `data-block-id`. This is also what makes your "highlight the source region only on request or if wrong" review behavior possible — you're not diffing text, you're just looking up a block ID.

One thing this forces you to decide now, not later: **can a selection span more than one block?** For MVP I'd restrict selections to a single block. It kills a real feature (some Fill-in-the-gap questions naturally want a whole paragraph), but multi-block character-range selection is a genuinely hard UI problem — you'd be reimplementing something like the Hypothesis.is annotation engine. Get single-block selection working end-to-end first; extend to spans later once you see how much you actually need it.

## Question-type extensibility — this is where your own rule applies

Your `CODING_GUIDELINES.md` says: no abstraction until you have three concrete use cases. You already have five named question types in these notes. That clears your own bar — this is exactly the kind of thing worth designing as a registry *before* you build the first type, not after the third one forces a refactor.

Proposed shape:

- One base `Question` model: `material`, `source_block`, `question_type`, `status` (generating / pending_review / approved / rejected), `payload` (JSONField), `ai_prompt_version`, `raw_ai_response`.
- A `QUESTION_TYPE_REGISTRY = {"true_false": TrueFalseGenerator, "fill_in_gap": FillInGapGenerator, ...}`.
- Each `Generator` implements three methods: `build_prompt()`, `parse_response()` (validated against a Pydantic schema for that type), `validate_rules()` (type-specific business rules — see below).

Adding a sixth question type later means: one new file with one new class, one registry entry, one frontend renderer. Nothing existing gets touched — which is exactly the constraint you wrote in image 1.

The tradeoff you're making: a `JSONField payload` instead of a separate Django model per type means you lose some DB-level query/filter power on type-specific fields (e.g. "find all fill-in-gap questions where option X was used" needs a JSON query, not a plain filter). Given you're one person building an MVP, I'd take that tradeoff — but it's worth knowing you're making it.

## Where each question type actually gets hard

Four of your five types are genuinely straightforward for an LLM to produce and for you to validate — pick the odd one(s), pick the correct one(s), best-of-N, T/F sub-statements. The AI just needs a clear schema and a validator that checks "does this match the shape."

**Fill-in-the-gap is the hard one**, and you've already spotted why in image 7: the constraints aren't just "generate a paragraph with blanks," they're relational — if two gaps share an answer, the option bank needs two copies of it; every gap needs at least one wrong alternative that isn't secretly correct for a *different* gap. That's a constraint-satisfaction problem, not a prompting problem. Don't rely on the model to get this right by instruction alone — write a deterministic validator function that checks the AI's JSON output against these exact rules after generation, and reject/retry if it fails. Treat the LLM as a generator, and your own code as the source of truth for correctness.

## Real-time generation — build less of it first

Websockets + background generation is the right end state, but it's also the single biggest infrastructure lift in this whole spec (Django Channels, a channel layer via Redis, ASGI deployment, Celery for the actual generation tasks). I'd sequence it so you don't have to stand all of that up before you've even seen your first generated question.

- **MVP**: synchronous generation. User picks text + type, request blocks for a couple seconds, question comes back, shows in Preview. No Celery, no Channels. Proves the whole loop.
- **Once that works**: move generation into Celery tasks. For the "push to Preview" step, consider Server-Sent Events before reaching for full Django Channels — you only need one-directional server→client pushes here, not bidirectional messaging, and SSE is a much smaller dependency footprint.
- **Then** add the 20-question cap: a count of `status='pending_review'` questions per material, checked in an atomic transaction before allowing a new generation request, so you're not vulnerable to a race if two generations fire close together.

## Bottlenecks worth flagging plainly

- **Containerization is foundational** — get it wrong and you'll be migrating every Question's source reference later.
- **AI structured-output reliability** — especially fill-in-gap; budget for a validate-and-retry loop, not a single trusting API call.
- **Docx parsing fidelity** — tables, nested lists, and embedded images will not survive a naive parser cleanly. Decide up front what's in scope (probably: headings, paragraphs, lists; tables and images deferred).
- **Cost/latency at concurrency** — "questions building in the background" implies multiple simultaneous LLM calls; worth picking a fast/cheap model for generation and reserving anything heavier for edge cases.
- **Realtime infra** — genuinely the most complex piece to stand up; sequence it last, not first.

## What's not yet on the page

A few things your notes don't cover yet that will bite later if undecided now:

- **Answer-key shape per type** — each type's "correct answer" has a different shape (T/F: per-statement boolean; correct-ones: a list of indices; fill-in-gap: per-blank option id). Worth nailing this down as part of each type's Pydantic schema now, since it's the same schema that has to survive the edit flow.
- **Editing after approval** — if you edit an already-approved question, does that reset its review history? Worth a `revised_at` field even if you don't build the logic yet.
- **Material edited after questions reference it** — since blocks are the anchor for "show me the source," what happens if the underlying material changes? Simplest MVP answer: blocks are immutable once a question references them; re-uploading a material creates new blocks rather than mutating old ones.
- **Duplicate/near-duplicate questions** — regenerating from the same selection could easily produce near-identical questions over time; not urgent, but worth a cheap similarity check later.
- **Difficulty/confidence signal during review** — you don't need the spaced-repetition algorithm yet, but if you add a simple "how did that feel" rating field to the review-event model now, you won't have to retrofit it when you build SM-2/FSRS later.
- **Single-user vs. multi-user** — everything above assumes one user (you). Worth confirming that's the actual scope, since auth changes several of these models (materials/questions need an owner FK if not).

Given how you like to work with your CLI, here's how I'd sequence the actual build:Overall: this is feasible, and it's a stronger spec than most people bring to a first build session — you've already interrogated the two hardest parts yourself (containerization, question-type extensibility) without fully resolving them, which is exactly the right place to be stuck. Nothing here requires exotic infrastructure; the risk is entirely in sequencing (don't build websockets before you've built the thing they'd push) and in the fill-in-the-gap constraint logic (don't trust the prompt alone to satisfy it).

One assumption I made along the way worth flagging: I read "Best of 3,4,5" as a standard single-best-answer MCQ where the option count is configurable (3, 4, or 5 total options), based on your example and the "select a single word/phrase" note. If you meant something else by that type, worth correcting before it shapes the schema.

This resolves one of your own open questions from the earlier sketches — and it's a genuine update to the plan, not just a detail. Here's how it fits.

**What this diagram is actually saying**: containers aren't a flat list of paragraphs, they're a tree. A container can hold either raw content or further sub-containers (B holds C, D holds E, F holds G, I holds J), and siblings sit at the same level (C/D under B, K/L under I). Your outline on the left — circle/dash/square bullets marking depth — is literally the text serialization of that same tree.

That's a better answer to "what format will the containerized output be" than the flat block table I sketched last time. A flat list loses the relationship between a paragraph and the section it belongs to; a tree keeps it, and that relationship is exactly what gives the AI good context and what lets the reading view render nested sections properly.

**How it maps onto the Django model** — an adjacency list is the right level of complexity here (not `django-mptt` or a closure table; those solve problems you don't have — deep trees with heavy subtree queries — a document outline is small):

```python
class Block(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name="blocks")
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="children")
    order = models.PositiveIntegerField()
    block_type = models.CharField(choices=[...])  # section, paragraph, list_item, etc.
    text = models.TextField(blank=True)
```

A node can have both `text` and `children` — a heading like "F" can carry its own label *and* contain "G". Leaf nodes just have text and no children.

**This actually fixes something I flagged last time.** I'd suggested giving the AI "the selected block plus a window of neighbouring blocks" for context, which is a bit arbitrary — how many neighbours is enough? With a tree, you don't need a window: you walk the parent chain. A paragraph's real context isn't its neighbours, it's the section it's nested in. Ancestors-down-to-root gives you that for free.

**One backend gotcha worth knowing now**: DRF doesn't handle self-referential nested serializers cleanly out of the box. Don't fight it — send the frontend a flat array of blocks (`id`, `parent_id`, `order`, `type`, `text`) and let React reconstruct the tree client-side with a simple `parent_id → children` map. It's also simpler for the websocket step later: a new block is just one more row in the array, not a tree patch.

**The `+` next to C** looks like an "add child container" affordance — worth keeping, because it doubles as a correction tool: when the docx parser gets the hierarchy wrong (which it will sometimes), this is how you'd manually fix it before questions get generated from a mis-nested section.

Net effect on the phased plan: Phase 1 ("Materials + reading view") now includes building the tree, not a flat list, and the reading view needs a recursive render for nested containers. Everything else in the plan — selection, generator registry, review loop — stays the same, it just now points at a tree node instead of a flat block.

