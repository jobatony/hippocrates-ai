from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Exam, Subject, PastQuestion
from .serializers import ExamSerializer, SubjectSerializer, PastQuestionSerializer

class IsUploader(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Uploader').exists()

class IsValidator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Validator').exists()

class ExamViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Exam.objects.all().order_by('name')
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]

class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.all().order_by('name')
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

class UploaderQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = PastQuestionSerializer
    permission_classes = [permissions.IsAuthenticated, IsUploader]

    def get_queryset(self):
        # Allow uploaders to see their own questions, or potentially filter by exam/subject/year
        queryset = PastQuestion.objects.all()
        
        exam = self.request.query_params.get('exam')
        subject = self.request.query_params.get('subject')
        year = self.request.query_params.get('year')
        
        if exam:
            queryset = queryset.filter(exam_id=exam)
        if subject:
            queryset = queryset.filter(subject_id=subject)
        if year:
            queryset = queryset.filter(year=year)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user, status='pending')

class ValidatorQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = PastQuestionSerializer
    permission_classes = [permissions.IsAuthenticated, IsValidator]

    def get_queryset(self):
        # Validators generally want to see pending questions
        queryset = PastQuestion.objects.filter(status='pending')
        
        exam = self.request.query_params.get('exam')
        subject = self.request.query_params.get('subject')
        
        if exam:
            queryset = queryset.filter(exam_id=exam)
        if subject:
            queryset = queryset.filter(subject_id=subject)
            
        return queryset

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        question = self.get_object()
        action_type = request.data.get('action') # 'approve' or 'request_changes'
        feedback = request.data.get('feedback', '')
        
        if action_type == 'approve':
            question.status = 'approved'
            question.validated_by = request.user
            question.validator_feedback = ''
            question.save()
            return Response({'status': 'approved'})
            
        elif action_type == 'request_changes':
            if not feedback:
                return Response({'error': 'Feedback is required when requesting changes.'}, status=status.HTTP_400_BAD_REQUEST)
            question.status = 'changes_requested'
            question.validated_by = request.user
            question.validator_feedback = feedback
            question.save()
            return Response({'status': 'changes_requested'})
            
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
