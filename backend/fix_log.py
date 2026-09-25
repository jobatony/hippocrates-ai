import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hippocrates.settings')
django.setup()

from quiz.models import Question, DailyStudyLog
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()
today = timezone.now().date()

for user in User.objects.all():
    created_today = Question.objects.filter(material__user=user, created_at__date=today, status=Question.Status.APPROVED).count()
    log, _ = DailyStudyLog.objects.get_or_create(user=user, date=today, defaults={'reviewed': 0, 'created': 0})
    log.created = created_today
    log.creation_streak_met = log.created >= 50
    
    # Check if due_count is 0
    from quiz.models import QuestionSchedule
    due_count = QuestionSchedule.objects.filter(
        user=user, scheduled_date__lte=today
    ).exclude(mastered_at__date=today).count()
    
    REVIEW_STREAK_MINIMUM = 120
    log.review_streak_met = log.reviewed >= REVIEW_STREAK_MINIMUM or due_count == 0
    log.save(update_fields=['created', 'creation_streak_met', 'review_streak_met'])
    print(f"Fixed DailyStudyLog for {user.username}: created = {created_today}")
