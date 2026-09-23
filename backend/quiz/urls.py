from django.urls import path
from .views import (
    GenerateQuestionView,
    RegenerateQuestionView,
    QuestionDetailView,
    QuestionListView,
    DashboardStatsView,
    QuizSessionView,
    QuizSessionAnswerView
)

urlpatterns = [
    path('generate/', GenerateQuestionView.as_view(), name='question-generate'),
    path('<uuid:pk>/regenerate/', RegenerateQuestionView.as_view(), name='question-regenerate'),
    path('<uuid:pk>/', QuestionDetailView.as_view(), name='question-detail'),
    path('', QuestionListView.as_view(), name='question-list'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('session/', QuizSessionView.as_view(), name='quiz-session'),
    path('session/<uuid:pk>/answer/', QuizSessionAnswerView.as_view(), name='quiz-session-answer'),
]
