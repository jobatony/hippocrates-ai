import os
import django
from django.utils import timezone
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hippocrates.settings')
django.setup()

from quiz.models import DailyStudyLog, QuestionSchedule
from django.contrib.auth import get_user_model

User = get_user_model()

def reset_todays_usage():
    today = timezone.localdate()
    print(f"Resetting usage for date: {today}")

    # 1. Reset DailyStudyLogs
    logs = DailyStudyLog.objects.filter(date=today)
    count = logs.update(
        reviewed=0,
        created=0,
        review_streak_met=False,
        creation_streak_met=False
    )
    print(f"Reset {count} DailyStudyLog(s) to 0.")

    # 2. Revert today's QuestionSchedules
    # If a card was mastered today, we unset the mastered_at flag
    # so it can be reviewed and mastered again today.
    # Note: next_review date might still be in the future, 
    # but resetting it strictly might require more complex logic.
    # We will just reset 'streak' and 'mastered_at' for cards reviewed today.
    today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
    schedules = QuestionSchedule.objects.filter(last_reviewed__gte=today_start)
    s_count = schedules.update(
        streak=0,
        mastered_at=None,
        last_reviewed=None,
        scheduled_date=timezone.now() # make them due immediately
    )
    print(f"Reset {s_count} QuestionSchedule(s) to 0 streak and due now.")

    print("Done resetting today's usage.")

if __name__ == '__main__':
    reset_todays_usage()
