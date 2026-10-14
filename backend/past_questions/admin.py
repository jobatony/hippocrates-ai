from django.contrib import admin
from .models import Exam, Subject, PastQuestion, QuestionOption

admin.site.register(Exam)
admin.site.register(Subject)

class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 4

@admin.register(PastQuestion)
class PastQuestionAdmin(admin.ModelAdmin):
    list_display = ('exam', 'subject', 'year', 'number', 'status', 'uploaded_by')
    list_filter = ('exam', 'subject', 'year', 'status')
    inlines = [QuestionOptionInline]
