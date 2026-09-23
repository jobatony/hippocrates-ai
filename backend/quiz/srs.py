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
