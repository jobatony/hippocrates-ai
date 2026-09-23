import uuid
from django.db import models
from documents.models import Material, Block

class Question(models.Model):
    class QuestionType(models.TextChoices):
        MCQ = 'mcq', 'MCQ'
        TRUE_FALSE = 'true_false', 'True/False'
        FILL_IN = 'fill_in', 'Fill in the gap'
        APPLIES = 'applies', 'Select All That Apply'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='questions')
    source_block = models.ForeignKey(Block, on_delete=models.PROTECT, related_name='source_questions')
    heading_2_block = models.ForeignKey(
        Block, on_delete=models.SET_NULL, null=True, blank=True, related_name='context_questions'
    )
    
    question_type = models.CharField(max_length=20, choices=QuestionType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    selected_text = models.TextField()
    payload = models.JSONField(default=dict)
    
    prompt_sent = models.TextField(blank=True)
    raw_ai_response = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_question_type_display()}] {self.status.upper()} - {self.selected_text[:40]}"


from django.conf import settings
from django.utils import timezone
import datetime

class QuestionSchedule(models.Model):
    """
    Stores the Custom SRS state for one question for one user.
    """
    question    = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='schedules'
    )
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='question_schedules'
    )

    # ── Custom SRS fields ─────────────────────────────────────────────────────
    scheduled_date  = models.DateField(db_index=True)       # date this question enters the queue
    streak          = models.PositiveSmallIntegerField(default=0)  # consecutive correct answers in current session
    review_count    = models.PositiveIntegerField(default=0)       # total times previously mastered
    last_reviewed   = models.DateTimeField(null=True, blank=True)
    mastered_at     = models.DateTimeField(null=True, blank=True)  # last time streak hit 3
    available_at    = models.DateTimeField(null=True, blank=True, help_text="Used for intra-session minute delays")

    class Meta:
        unique_together = [('question', 'user')]
        ordering = ['scheduled_date']

    def __str__(self):
        return f"Schedule [{self.question_id}] due {self.scheduled_date}"

class DailyStudyLog(models.Model):
    """
    One row per user per calendar day. Updated in real-time on every answer.
    Used to compute streaks and dashboard metrics efficiently.
    """
    user         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='study_logs'
    )
    date         = models.DateField(db_index=True)
    reviewed     = models.PositiveIntegerField(default=0)   # total answers submitted today
    created      = models.PositiveIntegerField(default=0)   # questions approved today
    review_streak_met    = models.BooleanField(default=False)       # reviewed >= 120
    creation_streak_met  = models.BooleanField(default=False)       # created >= 50

    class Meta:
        unique_together = [('user', 'date')]
        ordering = ['-date']

    def __str__(self):
        return f"Log [{self.user_id}] {self.date} — {self.reviewed} reviewed"
