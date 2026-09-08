# Hippocrates AI — Spaced Repetition Review App: Structural Breakdown

## What You Want to Achieve

You want a **mobile flashcard/quiz app** built around a **Spaced Repetition System (SRS)** that intelligently decides *which* questions to show you, *when* to show them, and *how many times* you must answer them correctly before they are considered reviewed for that session. The system is split into two clearly defined layers:

---

## The Two-Layer SRS Architecture

### Layer 1 — Backend SRS (Session Selection Engine)
This runs **server-side** and is triggered once per day when you tap **"Start for Today"**. Its job is to decide *which 120 questions* you should review that day.

**How scheduling and the 120-question cap work:**
- **Absolute Dates, Not Slots:** The algorithm assigns each question an absolute `next_review_date` (e.g., Sept 10). It does *not* assign them to fixed daily "slots" of 120.
- **Handling Missed Days:** If you do not open the app for 3 days, questions don't get skipped. They simply become "overdue." 
- **The Selection Query:** When you start a session, the backend queries the database for: `"All questions where next_review_date is TODAY OR EARLIER."` 
- **The Cap:** If you have 300 questions due/overdue, the backend sorts them by *most overdue first*, and cuts the list off at exactly 120. The remaining 180 stay in the queue for your next session. If you have only 80 due, it can pull the 40 "closest to due" to pad it out to 120, or you can choose to just review 80.

**The Algorithm (SM-2):**
To ensure the backend knows your "historical performance", it relies on data sent from the frontend. The frontend doesn't just say "Reviewed: Yes". It sends the **number of mistakes** made during the session.
- 0 mistakes = "Easy" (Interval grows significantly)
- 1-2 mistakes = "Good" / "Hard" (Interval grows slightly)
- 3+ mistakes = "Failed" (Interval resets to 1 day)

---

### Layer 2 — Frontend SRS (In-Session Review Engine)
This runs **client-side** (on the device) and governs what happens *within* the session.

**The rule:**
> Every question requires **3 consecutive correct answers** to be marked as reviewed.

The mechanics:
- The session starts with the 120 questions (downloaded from the backend) in an **active pool**.
- When a question hits 3 consecutive correct answers, it is **removed from the active pool**.
- Answer **options are randomized** every single time a question appears.
- If you answer incorrectly, the consecutive counter resets to 0.
- **Crucially for tracking:** The frontend tracks how many *total incorrect attempts* you make on each question before it is finally removed from the pool.

---

## Offline Support & Data Synchronization (The Sync Cycle)

Handling offline behavior, cross-day syncing, and historical performance requires a strict synchronization flow. 

### 1. The Review Payload
When a question is completed (answered correctly 3 times consecutively), the frontend logs a local record containing:
- `question_id`
- `incorrect_attempts` (Count of how many times you got it wrong today)
- `completed_timestamp` (The exact date/time you finished it, e.g., Tuesday 11:45 PM)

### 2. Cross-Day & Offline Syncing
**Scenario:** You download Tuesday's 120 questions, go offline, finish the session at 11:45 PM, and don't connect to Wi-Fi until Wednesday afternoon.
- Because the frontend logged the `completed_timestamp` locally, it knows you finished the work on Tuesday.
- When you open the app on Wednesday, **the app strictly enforces a "Sync Before Fetch" rule.**
- **Step A (Sync):** It pushes the cached Tuesday payload to the backend. The backend updates the SM-2 algorithm treating the reviews as having happened on Tuesday. It also credits your Tuesday streak.
- **Step B (Fetch):** Only after a successful sync does the frontend request Wednesday's new 120 questions. 

### 3. Session Timing Logic
- **Midnight Reset:** A "day" is defined locally by the device clock (e.g., resets at 12:00 AM or a custom time like 4:00 AM). 
- When the reset time passes, the "Start for Today" button becomes active again, but *only* if the previous session is completed and synced.

---

## App Structure & Navigation

### Bottom Tab Navigation (4 tabs):

#### 1. Home Tab
The daily dashboard. It shows:
- **"Hello, {Name}"** greeting
- **Today's date and day of the week**
- **Progress ring or bar** — e.g., *84 / 120 reviewed*
- **Streak counter** — streak only increments if 100 or more of 120 questions are reviewed that day. (Calculated retroactively if synced late).
- **Last few days' performance**
- **CTA Button** — "Start for Today" (if not started) or "Continue" (if session is in progress)

#### 2. Quiz Tab
Where the actual review session happens:
- Displays one question at a time
- Shows multiple-choice options in **randomized order every appearance**
- Shows session progress (e.g., *32 of 120 completed*)
- Failing a question keeps it in rotation; passing 3 consecutive times retires it for the session
- Visual feedback on correct/incorrect answers

#### 3. Calendar Tab
Historical performance view:
- A calendar view showing each past day
- Color-coded: green (100+), yellow (50-99), red (below 50 or 0)
- Tapping a day shows: total reviewed, accuracy %, streak status for that day

#### 4. Account Tab
- Login / logout
- User profile info
- Settings (notifications, timezone settings for midnight resets)

---

## Technical Stack Recommendation

| Layer | Recommended Tech |
|---|---|
| Mobile App | **React Native** or **Flutter** |
| Backend | **Node.js + Express** or **Django** |
| Database | **PostgreSQL** |
| SRS Algorithm | **SM-2** (Calculated server-side based on frontend mistake logs) |
| Sync & Offline | **WatermelonDB** or **SQLite** (Stores pending sync payloads and downloaded sessions offline) |

---

## Summary Flow (End-to-End with Offline Tolerance)

```
User opens app
       ?
App checks for local unsynced data. If found ? Syncs to Backend.
       ?
User taps "Start for Today"
       ?
Backend checks overdue questions ? Sorts by most overdue ? Sends top 120
       ?
Frontend saves session to local SQLite database (ready for offline)
       ?
User answers questions (frontend tracks incorrect attempts per question)
       ?
Session completed (offline or online) ? Saves payload with local timestamps
       ?
App connects to internet ? Pushes payload to backend
       ?
Backend calculates new SM-2 interval for each question based on attempt counts
       ?
Home dashboard updates: streak checked, calendar updated
```
