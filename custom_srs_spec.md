# Hippocrates AI — Custom Spaced Repetition System (SRS) Specification

> **Replaces:** SM-2 (previously documented in `SRS_AND_STREAK_IMPLEMENTATION.md`)
> **Status:** Specification — not yet implemented
> **Scope:** Backend scheduling algorithm, bootstrapping script, session queue logic, and streak rules.

---

## 1. Overview

This document specifies a custom SRS algorithm designed for Hippocrates AI. Unlike SM-2 (which relies on user-rated difficulty), this system is **correctness-driven**: scheduling decisions are made entirely based on whether the user answered correctly or not, and how many times consecutively.

### Key differences from SM-2

| Dimension | SM-2 (old) | Custom SRS (this spec) |
|---|---|---|
| User input | 4-button rating (Again / Hard / Good / Easy) | Binary — correct or wrong |
| "Mastered" definition | Ease factor + interval growth | 3 consecutive correct answers |
| Intra-session re-queuing | None | Yes — questions loop back until mastered |
| Re-queue timing | Next day minimum | 5–10 min (correct), 3–5 min (wrong) |
| Post-mastery interval | SM-2 formula | Fixed 3 days, slot-capped |
| Slot cap per day | None | 100 questions max scheduled per day |

---

## 2. Core Concepts

### 2.1 Review Slot Cap

Every calendar day has a **hard cap of 100 questions** that can be scheduled for review on that date. This applies to post-mastery scheduling only (see §4). Intra-session re-queuing does not count toward this cap.

### 2.2 The Consecutive-Correct Counter (`streak`)

Each `QuestionSchedule` row tracks a `streak` field (integer, default 0). This counts how many times in a row the user has answered the question correctly **within the current review session**.

- Answering correctly → `streak += 1`
- Answering wrongly → `streak = 0`

A question is considered **mastered for today** when `streak == 3`. At that point it is removed from the active session queue and scheduled for its next review date (§4).

### 2.3 Re-queue Timing

Questions that have not yet been mastered are re-inserted into the session queue with a **time-based delay**, not immediately:

| Last Answer | Delay Before Re-appearing |
|---|---|
| Correct (streak < 3) | 5–10 minutes |
| Wrong (streak reset) | 3–5 minutes |

The exact delay within the range is randomised each time to avoid a predictable pattern.

> [!NOTE]
> "Re-appearing in 5 minutes" means the question is not presented again until at least 5 minutes have elapsed in the session. The frontend tracks the `available_at` timestamp client-side (or it is stored in the session state in the backend - preferable so that break in network or closing the browser does not affect ) and skips past questions that are not yet available.

### 2.4 Session Question Selection

The pool of questions shown in a daily session is **not** simply all questions due today. It is assembled from multiple buckets in a weighted priority order:

| Priority | Bucket | Description |
|---|---|---|
| 1 | **Outstanding** | Questions whose scheduled date is in the past (overdue) |
| 2 | **Current** | Questions scheduled for today |
| 3 | **Future** | Questions scheduled for upcoming days, pulled in if the session is thin |

Within the combined pool, questions are sub-sorted by **review history** (number of times previously mastered, i.e., `review_count`):

| Sub-priority | Condition |
|---|---|
| Highest | `review_count == 0` (never reviewed — newly assigned questions) |
| Next | `review_count == 1` (reviewed once before) |
| Next | `review_count == 2` |
| Lowest | `review_count >= 3` (well-established questions) |

This means fresh questions are always encountered before older revisits in the same session.

---

## 3. Bootstrapping Script (One-Time)

When this system is deployed to production, all existing `Question` objects in the database must be assigned an initial review date. This script runs **exactly once**.

### Assignment rule

Questions are sorted by `created_at` ascending. They are then batched into groups of 100 and assigned consecutive dates starting from **today**:

```
questions[0..99]   → scheduled_date = today
questions[100..199] → scheduled_date = today + 1 day
questions[200..299] → scheduled_date = today + 2 days
...
```

### Implementation

Create `backend/quiz/management/commands/bootstrap_srs.py`:

```python
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from quiz.models import Question, QuestionSchedule

SLOT_SIZE = 100

class Command(BaseCommand):
    help = (
        "One-time bootstrap: assigns initial review dates to all approved "
        "questions in batches of 100 per day, starting from today. "
        "Safe to run only once — skips questions that already have a schedule."
    )

    def handle(self, *args, **options):
        today = timezone.now().date()

        # Only process approved questions without an existing schedule
        unscheduled = (
            Question.objects
            .filter(status=Question.Status.APPROVED)
            .exclude(schedules__isnull=False)
            .order_by('created_at')
        )

        total = unscheduled.count()
        if total == 0:
            self.stdout.write(self.style.WARNING("No unscheduled questions found. Exiting."))
            return

        schedules = []
        for i, question in enumerate(unscheduled.iterator()):
            offset_days = i // SLOT_SIZE
            assigned_date = today + timedelta(days=offset_days)
            schedules.append(
                QuestionSchedule(
                    question=question,
                    user=question.material.user,
                    scheduled_date=assigned_date,
                    streak=0,
                    review_count=0,
                )
            )

        QuestionSchedule.objects.bulk_create(schedules, ignore_conflicts=True)
        self.stdout.write(
            self.style.SUCCESS(
                f"Bootstrapped {len(schedules)} questions across "
                f"{(len(schedules) - 1) // SLOT_SIZE + 1} days."
            )
        )
```

> [!CAUTION]
> Run this command **once only** on the production database. Re-running will have no effect (due to `ignore_conflicts=True`) but is safe. Add a guard or admin flag if you want to enforce the once-only constraint explicitly.

---

## 4. Post-Mastery Scheduling

When a question reaches `streak == 3` and is marked as mastered for this session, the system must schedule its **next review date**.

### Base rule
Next review date = **today + 3 days**.

### Slot-cap enforcement
Before assigning `today + 3`, check how many questions are already scheduled on that date for this user:

```python
count = QuestionSchedule.objects.filter(
    user=user,
    scheduled_date=candidate_date
).count()
```

- If `count < 100` → assign `candidate_date`
- If `count >= 100` → try `candidate_date + 1 day`, then `+ 2 days`, etc., until a date with a free slot is found

This ensures no single day ever exceeds 100 scheduled questions.

### Algorithm (pseudocode)

```python
def find_next_review_date(user, base_date):
    candidate = base_date + timedelta(days=3)
    while True:
        count = QuestionSchedule.objects.filter(
            user=user, scheduled_date=candidate
        ).count()
        if count < SLOT_SIZE:
            return candidate
        candidate += timedelta(days=1)
```

---

## 5. Streak Rules

There are **two independent streaks**, both tracked via `DailyStudyLog`.

### 5.1 Review Streak

A review streak day is valid if the user **reviews at least 120 questions** in that calendar day.

```python
REVIEW_STREAK_MINIMUM = 120

log.review_streak_met = log.reviewed >= REVIEW_STREAK_MINIMUM
```

> [!NOTE]
> The user may review more than 120 questions — there is no upper cap. The minimum is the threshold for the day to count toward the streak.

### 5.2 Creation Streak

A creation streak day is valid if the user **creates (generates and approves) at least 50 questions** in that calendar day.

```python
CREATION_STREAK_MINIMUM = 50

log.creation_streak_met = log.created >= CREATION_STREAK_MINIMUM
```

### 5.3 Streak Computation

Both streaks are computed identically, using their respective `_met` boolean field. A streak is the count of consecutive days (ending today, or yesterday if today is incomplete) where `_met == True`.

---

## 6. Data Model Changes

The following changes are required to the existing `QuestionSchedule` model (replacing the SM-2 fields):

### 6.1 `QuestionSchedule` — replace SM-2 fields

**Remove:**
- `interval` (SM-2 interval in days)
- `ease_factor` (SM-2 ease multiplier)
- `repetitions` (SM-2 consecutive corrects)

**Add:**

```python
class QuestionSchedule(models.Model):
    question        = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='schedules')
    user            = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='question_schedules')

    # ── Custom SRS fields ─────────────────────────────────────────────────────
    scheduled_date  = models.DateField(db_index=True)       # date this question enters the queue
    streak          = models.PositiveSmallIntegerField(default=0)  # consecutive correct answers in current session
    review_count    = models.PositiveIntegerField(default=0)       # total times previously mastered
    last_reviewed   = models.DateTimeField(null=True, blank=True)
    mastered_at     = models.DateTimeField(null=True, blank=True)  # last time streak hit 3

    class Meta:
        unique_together = [('question', 'user')]
        ordering = ['scheduled_date']
```

### 6.2 `DailyStudyLog` — update streak fields

```python
class DailyStudyLog(models.Model):
    user                 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='study_logs')
    date                 = models.DateField(db_index=True)
    reviewed             = models.PositiveIntegerField(default=0)   # total answers submitted today
    created              = models.PositiveIntegerField(default=0)   # questions approved today
    review_streak_met    = models.BooleanField(default=False)       # reviewed >= 120
    creation_streak_met  = models.BooleanField(default=False)       # created >= 50

    class Meta:
        unique_together = [('user', 'date')]
        ordering = ['-date']
```

> [!IMPORTANT]
> The old `goal_met` boolean field is replaced by the two separate `review_streak_met` and `creation_streak_met` fields. Update all references in views and the frontend accordingly.

---

## 7. Session Queue Logic

### 7.1 Building the session pool (`QuizSessionView`)

```python
REVIEW_STREAK_MINIMUM = 120
SLOT_SIZE = 100

def build_session_pool(user, today):
    """
    Returns an ordered list of QuestionSchedule objects to present in today's session.
    Priority: overdue > current > future.
    Sub-sorted by review_count ascending (newer questions first).
    """
    # Outstanding (overdue) + current
    primary = list(
        QuestionSchedule.objects.filter(
            user=user,
            scheduled_date__lte=today,
            mastered_at__date__lt=today  # exclude already mastered today
        )
        .select_related('question__material')
        .order_by('review_count', 'scheduled_date')
    )

    # If pool is thin, pull from future dates
    if len(primary) < REVIEW_STREAK_MINIMUM:
        future = list(
            QuestionSchedule.objects.filter(
                user=user,
                scheduled_date__gt=today,
            )
            .exclude(id__in=[s.id for s in primary])
            .select_related('question__material')
            .order_by('review_count', 'scheduled_date')
            [:(REVIEW_STREAK_MINIMUM - len(primary))]
        )
        primary += future

    return primary
```

### 7.2 In-session state

The frontend (or a session cache in Redis) tracks the **re-queue state** for each question in the active session:

```typescript
interface ActiveCard {
  scheduleId: string;
  availableAt: Date;   // earliest time the card may be shown again
  streak: number;      // local copy, synced to backend on mastery
}
```

When the user answers a card:
- **Correct + streak < 3** → re-insert with `availableAt = now + random(5, 10) minutes`
- **Wrong** → re-insert with `availableAt = now + random(3, 5) minutes`, reset local `streak = 0`
- **Correct + streak == 3 (mastery)** → remove from active queue, call backend to mark mastered and schedule next date

The frontend presents the next card whose `availableAt <= now`.

### 7.3 Answer endpoint (`QuizSessionAnswerView`)

The endpoint receives answers individually. Mastery is only confirmed (and the next date scheduled) when `streak` reaches 3.

```python
class QuizSessionAnswerView(APIView):
    def post(self, request, pk):
        """
        Body: { "correct": true | false }
        """
        correct = request.data.get('correct')
        user = request.user
        today = timezone.now().date()

        schedule = get_object_or_404(
            QuestionSchedule, question_id=pk, user=user
        )

        if correct:
            schedule.streak += 1
        else:
            schedule.streak = 0

        schedule.last_reviewed = timezone.now()

        mastered = schedule.streak >= 3
        if mastered:
            schedule.mastered_at = timezone.now()
            schedule.review_count += 1
            schedule.streak = 0  # reset for next session
            schedule.scheduled_date = find_next_review_date(user, today)

        schedule.save()

        # Update DailyStudyLog
        log, _ = DailyStudyLog.objects.get_or_create(
            user=user, date=today, defaults={'reviewed': 0, 'created': 0}
        )
        log.reviewed += 1
        log.review_streak_met = log.reviewed >= REVIEW_STREAK_MINIMUM
        log.save(update_fields=['reviewed', 'review_streak_met'])

        return Response({
            "streak": schedule.streak,
            "mastered": mastered,
            "next_scheduled": schedule.scheduled_date.isoformat() if mastered else None,
        })
```

---

## 8. Frontend API Contract Changes

### 8.1 Quiz card response

Remove SM-2 fields; add new fields:

```typescript
export interface QuizCard {
  id: string;
  question_type: 'mcq' | 'true_false' | 'fill_in' | 'applies';
  material_title: string;
  topic: string;
  payload: any;

  // Custom SRS fields (replaces interval/ease_factor/repetitions)
  streak: number;          // current consecutive correct count (0–2)
  review_count: number;    // times previously mastered
  scheduled_date: string;  // ISO date — when this card was due
  mastery_dots: number;    // same as streak (shown in UI)
  mastery_required: number; // always 3
}
```

### 8.2 Answer request body

```typescript
// POST /api/quiz/session/<id>/answer/
{ correct: boolean }
```

### 8.3 Answer response

```typescript
{
  streak: number;         // updated streak (0 if wrong or mastered)
  mastered: boolean;      // true if streak reached 3
  next_scheduled: string | null; // ISO date of next review, if mastered
}
```

### 8.4 Dashboard stats

Replace `review_goal` / `goal_met` with the two separate streak booleans:

```typescript
export interface DashboardStats {
  reviewed_today: number;
  review_streak_minimum: number;   // always 120
  review_streak_met: boolean;

  created_today: number;
  creation_streak_minimum: number; // always 50
  creation_streak_met: boolean;

  current_review_streak: number;
  current_creation_streak: number;
  longest_review_streak: number;
  longest_creation_streak: number;

  monthly_activity: DayActivity[];
  due_count: number;
}

export interface DayActivity {
  date: string;
  reviewed: number;
  created: number;
  review_streak_met: boolean;
  creation_streak_met: boolean;
}
```

---

## 9. SRS Helper Module (`backend/quiz/srs.py`)

Replace the existing SM-2 `calculate_next` function:

```python
"""
Custom SRS algorithm for Hippocrates AI.
Replaces SM-2. Scheduling is correctness-driven, not rating-driven.
"""
import random
from datetime import date, timedelta

STREAK_TARGET = 3          # correct answers needed to master a question
SLOT_SIZE = 100            # max questions scheduled per day
BASE_INTERVAL_DAYS = 3     # days after mastery before next review

REQUEUE_CORRECT_MIN = 5    # minutes before correct (non-mastered) card reappears
REQUEUE_CORRECT_MAX = 10
REQUEUE_WRONG_MIN = 3      # minutes before wrong card reappears
REQUEUE_WRONG_MAX = 5


def requeue_delay_seconds(correct: bool) -> int:
    """Return a randomised re-queue delay in seconds."""
    if correct:
        minutes = random.randint(REQUEUE_CORRECT_MIN, REQUEUE_CORRECT_MAX)
    else:
        minutes = random.randint(REQUEUE_WRONG_MIN, REQUEUE_WRONG_MAX)
    return minutes * 60


def find_next_review_date(user, base_date: date) -> date:
    """
    Find the earliest date >= base_date + BASE_INTERVAL_DAYS that has
    fewer than SLOT_SIZE questions already scheduled for `user`.
    """
    # Import here to avoid circular import
    from quiz.models import QuestionSchedule

    candidate = base_date + timedelta(days=BASE_INTERVAL_DAYS)
    while True:
        count = QuestionSchedule.objects.filter(
            user=user, scheduled_date=candidate
        ).count()
        if count < SLOT_SIZE:
            return candidate
        candidate += timedelta(days=1)
```

---

## 10. Migration Plan

Execute the following in order after implementing the model changes:

Note: Based on the current system, SM-2 has been implemented with scheduling plans and others. Can you ensure all existing scheduling are cleared off as though all questions do not have existing schedules.

```bash
# 1. Remove SM-2 fields, add custom SRS fields
python manage.py makemigrations quiz --name="replace_sm2_with_custom_srs"
python manage.py migrate

# 2. One-time bootstrap of scheduled dates for all existing questions
python manage.py bootstrap_srs

# 3. Seed historical creation counts into DailyStudyLog (if not already done)
python manage.py seed_study_logs

# 4. Restart server
python manage.py runserver
```

> [!WARNING]
> `bootstrap_srs` must be run **before** any user starts a quiz session under the new system, otherwise existing questions will have no `scheduled_date` and will be invisible to the session queue.

---

## 11. Open Questions

- **Session persistence across page refresh**: The in-session re-queue state (which cards are active, their `availableAt`, local `streak`) lives in the frontend. If the user refreshes, this state is lost. Should the session state be persisted in Redis / the DB, or is a page refresh treated as a session reset? It should be persisted in Redis /the DB
- **Multiple users**: This spec assumes the `user` FK is set on `QuestionSchedule`. Confirm that all `Question` → `Material` → `User` relations are correctly set so that the bootstrapping script assigns the right user to each schedule row.
- **Mobile**: Does the mobile app (in `/mobile`) need to implement the same re-queue timer logic, or will it hit the same backend endpoints and manage its own client-side queue? Leave the mobile first. Just for web we are dealing with.
