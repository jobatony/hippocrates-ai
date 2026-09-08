from django.urls import path
from .views import (
    GenerateQuestionView,
    RegenerateQuestionView,
    QuestionDetailView,
    QuestionListView,
    LogAttemptView
)

urlpatterns = [
    path('generate/', GenerateQuestionView.as_view(), name='question-generate'),
    path('attempts/log/', LogAttemptView.as_view(), name='attempt-log'),
    path('<uuid:pk>/regenerate/', RegenerateQuestionView.as_view(), name='question-regenerate'),
    path('<uuid:pk>/', QuestionDetailView.as_view(), name='question-detail'),
    path('', QuestionListView.as_view(), name='question-list'),
]
