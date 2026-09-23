from django.core.management.base import BaseCommand
from django.db.models.functions import TruncDate
from django.db.models import Count
from quiz.models import Question, DailyStudyLog


class Command(BaseCommand):
    help = 'Seed DailyStudyLog.created from existing Question.created_at history'

    def handle(self, *args, **options):
        # Group approved questions by (user, date)
        rows = (
            Question.objects
            .filter(status='approved')
            .annotate(date=TruncDate('created_at'))
            .values('material__user', 'date')
            .annotate(count=Count('id'))
        )
        created = 0
        for row in rows:
            user_id = row['material__user']
            date    = row['date']
            count   = row['count']
            if not user_id or not date:
                continue
            log, _ = DailyStudyLog.objects.get_or_create(
                user_id=user_id, date=date,
                defaults={'reviewed': 0, 'created': 0}
            )
            log.created += count
            log.save(update_fields=['created'])
            created += 1
        self.stdout.write(self.style.SUCCESS(f'Seeded {created} DailyStudyLog rows.'))
