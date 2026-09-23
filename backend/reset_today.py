import os
import django
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hippocrates.settings')
django.setup()

from quiz.models import QuestionSchedule, DailyStudyLog

def reset_today():
    today = timezone.now().date()
    
    print("--- Resetting Today's Progress ---")
    
    # 1. Reset Daily Study Logs for today
    logs = DailyStudyLog.objects.filter(date=today)
    for log in logs:
        log.reviewed = 0
        log.review_streak_met = False
        log.save(update_fields=['reviewed', 'review_streak_met'])
    print(f"Reset {logs.count()} DailyStudyLog records for today back to 0.")

    # 2. Reset cards mastered today back to 0 and set their scheduled date to today
    mastered_today = QuestionSchedule.objects.filter(mastered_at__date=today)
    mastered_count = mastered_today.count()
    for schedule in mastered_today:
        schedule.streak = 0
        schedule.mastered_at = None
        schedule.scheduled_date = today
        schedule.available_at = None
        schedule.save(update_fields=['streak', 'mastered_at', 'scheduled_date', 'available_at'])
    print(f"Reset {mastered_count} cards that were mastered today. They are now un-mastered and due today.")

    # 3. Reset any partially reviewed cards from today
    touched_today = QuestionSchedule.objects.filter(last_reviewed__date=today).exclude(mastered_at__date=today)
    touched_count = touched_today.count()
    for schedule in touched_today:
        schedule.streak = 0
        schedule.scheduled_date = today
        schedule.available_at = None
        schedule.save(update_fields=['streak', 'scheduled_date', 'available_at'])
    print(f"Reset {touched_count} partially-completed cards touched today. Their streak is 0 and they are due today.")
    
    # 4. Set ALL questions in the database to be due today
    all_schedules = QuestionSchedule.objects.all()
    all_count = all_schedules.update(scheduled_date=today, available_at=None)
    print(f"Set {all_count} total cards to be due today.")
    
    print("\nDone! You can now test the session from a completely clean slate.")

if __name__ == '__main__':
    reset_today()
