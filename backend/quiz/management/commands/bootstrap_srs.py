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
