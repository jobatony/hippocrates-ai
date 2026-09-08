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


class ReviewAttempt(models.Model):
    """Records every answer attempt during a review session. Used for future spaced repetition."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='attempts')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='attempts')

    # What the user selected (stored as JSON for flexibility across question types)
    user_answer = models.JSONField(default=dict)
    is_correct = models.BooleanField()

    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-attempted_at']

    def __str__(self):
        return f"Attempt on [{self.question_id}] — {'✓' if self.is_correct else '✗'}"
