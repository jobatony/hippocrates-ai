from django.db import models
from django.conf import settings

class Exam(models.Model):
    name = models.CharField(max_length=50, unique=True) # e.g. WAEC, NECO

    def __str__(self):
        return self.name

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True) # e.g. PHYSICS, MATHEMATICS

    def __str__(self):
        return self.name

class PastQuestion(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('changes_requested', 'Changes Requested'),
    ]

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    year = models.IntegerField()
    number = models.IntegerField()
    
    question_text = models.TextField()
    has_diagram = models.BooleanField(default=False)
    image = models.ImageField(upload_to='past_questions/', null=True, blank=True)
    
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_questions')
    validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='validated_questions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    validator_feedback = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('exam', 'subject', 'year', 'number')
        ordering = ['-year', 'number']

    def __str__(self):
        return f"{self.exam.name} {self.year} {self.subject.name} - Q{self.number}"

class QuestionOption(models.Model):
    question = models.ForeignKey(PastQuestion, on_delete=models.CASCADE, related_name='options')
    letter = models.CharField(max_length=1) # A, B, C, D, E
    text = models.TextField()
    is_correct = models.BooleanField(null=True, blank=True, default=None)

    class Meta:
        unique_together = ('question', 'letter')
        ordering = ['letter']

    def __str__(self):
        return f"{self.letter}. {self.text[:20]}"
