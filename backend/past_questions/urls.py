from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExamViewSet, SubjectViewSet, UploaderQuestionViewSet, ValidatorQuestionViewSet, QuestionListViewSet, AnalyticsSummaryView, UserAnalyticsDetailView

router = DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'uploader/questions', UploaderQuestionViewSet, basename='uploader-question')
router.register(r'validator/questions', ValidatorQuestionViewSet, basename='validator-question')
router.register(r'list', QuestionListViewSet, basename='question-list')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('analytics/user/<uuid:user_id>/', UserAnalyticsDetailView.as_view(), name='analytics-user-detail'),
]
