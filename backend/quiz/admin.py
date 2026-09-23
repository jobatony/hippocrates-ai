from django.contrib import admin
from .models import Question, QuestionSchedule, DailyStudyLog

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'question_type', 'status', 'material', 'created_at']
    list_filter = ['question_type', 'status']
    search_fields = ['selected_text']
    readonly_fields = ['id', 'payload', 'prompt_sent', 'raw_ai_response', 'created_at', 'updated_at']

@admin.register(QuestionSchedule)
class QuestionScheduleAdmin(admin.ModelAdmin):
    list_display = ['id', 'question', 'user', 'scheduled_date', 'streak', 'review_count']
    list_filter = ['scheduled_date', 'streak']
    search_fields = ['question__id', 'user__email']
    readonly_fields = ['id']

@admin.register(DailyStudyLog)
class DailyStudyLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'date', 'reviewed', 'review_streak_met', 'created', 'creation_streak_met']
    list_filter = ['date', 'review_streak_met', 'creation_streak_met']
    search_fields = ['user__email']
    readonly_fields = ['id']
