from django.contrib import admin
from .models import Question, ReviewAttempt

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'question_type', 'status', 'material', 'created_at']
    list_filter = ['question_type', 'status']
    search_fields = ['selected_text']
    readonly_fields = ['id', 'payload', 'prompt_sent', 'raw_ai_response', 'created_at', 'updated_at']

@admin.register(ReviewAttempt)
class ReviewAttemptAdmin(admin.ModelAdmin):
    list_display = ['id', 'question', 'is_correct', 'attempted_at']
    list_filter = ['is_correct', 'attempted_at']
    search_fields = ['question__id']
    readonly_fields = ['id', 'question', 'is_correct', 'user_answer', 'attempted_at']
