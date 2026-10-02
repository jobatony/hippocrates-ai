from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExamViewSet, SubjectViewSet, UploaderQuestionViewSet, ValidatorQuestionViewSet

router = DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'uploader/questions', UploaderQuestionViewSet, basename='uploader-question')
router.register(r'validator/questions', ValidatorQuestionViewSet, basename='validator-question')

urlpatterns = [
    path('', include(router.urls)),
]
