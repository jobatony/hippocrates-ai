# Review Mode — Feature Specification

## Overview
Move to a Review/Quiz Mode using the existing (currently non-functional) toggle button in the frontend.
In this mode, the material document shifts to the side panel while questions take center stage in the main area.

---

## Layout
- The document panel moves to the side.
- Questions are displayed one at a time in the main central area.
- When a question is shown, the side panel auto-scrolls to the exact document block the question came from.

---

## Question Navigation
- Questions are displayed in **random order** each session.
- A counter shows progress, e.g. `1/45` (current question out of total).
- Questions are **editable** (no AI involved) — editing opens in a **modal**.

---

## Answer Interaction & Feedback

### MCQ
- Click an option to select it — selected option gets a **green stroke** around its container.
- Changing selection moves the green stroke to the newly selected option.
- Click **Check Answer**:
  - **Wrong:** Selected option shows a **red container fill**. The correct option shows a **green container fill**. Explanation is displayed below.
  - **Right:** Selected option shows a **green container fill**. A **Next Question** button appears.

### True / False
- 4 statements are randomly selected from all T/F alternatives for that question.
- Each statement has a **T** and **F** circle in front of it to select your answer.
  - Selecting **T** gives the circle a **green stroke**.
  - Selecting **F** gives the circle a **red stroke**.
  - Selecting one deselects the other.
- **Check Answer** button is only enabled once T/F has been selected for **all** shown statements.
- After clicking Check Answer:
  - Statements answered **correctly**: green stroke on the statement container. The T/F circle shows **green fill** if True was correct, **red fill** if False was correct.
  - Statements answered **wrongly**: red stroke on the statement container. The correct answer is indicated by the fill of the T/F circles.
- **Scoring:** You must get **all** selected statements correct to count the question as correct.

### Fill in the Gap
- Answer mechanism is **drag and drop** from an answer bank.
- To deselect/remove an answer already dropped into a gap, simply **click it**.
- After clicking **Check Answer**:
  - **Correct answers** stay in their gap shown in a **green box container**.
  - **Wrong answers** are removed from the gap and returned to the answer bank shown in a **red box container**. The correct answer is placed into the gap in a **green box container**.
- **Scoring:** You must fill **all** gaps correctly to count the question as correct.

---

## Display Rule
- The question card must be designed so that **no scrolling is required** to see any part of a question.

---

## Backend — Attempt Log
- A backend model records every question attempt in a review session, capturing:
  - Which question was attempted.
  - What the user answered.
  - Whether the result was correct or incorrect.
- This log is for **future use** when implementing a **spaced repetition algorithm**.

---

## Session End
- After the last question in a session, show a **results summary** displaying how many questions were answered correctly out of the total (e.g. `You got 32/45 correct`).

---

## Open Items (Already Addressed)
- Question ordering: Random
- Attempt log: Backend model (for spaced repetition)
- Results summary: Show score after last question
- T/F scoring: Must get all shown statements correct
- Fill-in-gap wrong answer behaviour: Correct answer fills gap (green), wrong answer returns to bank (red)
- Edit flow: Modal