from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Exam, Subject, PastQuestion, QuestionAuditLog
from .serializers import ExamSerializer, SubjectSerializer, PastQuestionSerializer

class IsUploader(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Uploader').exists()

class IsValidator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Validator').exists()

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and (request.user.is_staff or request.user.is_superuser)

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all().order_by('name')
    serializer_class = ExamSerializer
    permission_classes = [IsAdminOrReadOnly]

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().order_by('name')
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminOrReadOnly]

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
        question = serializer.save(uploaded_by=self.request.user, status='pending')
        QuestionAuditLog.objects.create(
            question=question,
            user=self.request.user,
            action='uploaded'
        )

    def perform_update(self, serializer):
        question = serializer.save()
        QuestionAuditLog.objects.create(
            question=question,
            user=self.request.user,
            action='edited'
        )

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
            QuestionAuditLog.objects.create(
                question=question,
                user=request.user,
                action='approved'
            )
            return Response({'status': 'approved'})
            
        elif action_type == 'request_changes':
            if not feedback:
                return Response({'error': 'Feedback is required when requesting changes.'}, status=status.HTTP_400_BAD_REQUEST)
            question.status = 'changes_requested'
            question.validated_by = request.user
            question.validator_feedback = feedback
            question.save()
            QuestionAuditLog.objects.create(
                question=question,
                user=request.user,
                action='changes_requested',
                notes=feedback
            )
            return Response({'status': 'changes_requested'})
            
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        question = serializer.save()
        QuestionAuditLog.objects.create(
            question=question,
            user=self.request.user,
            action='edited'
        )

class QuestionListViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PastQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
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

    @action(detail=False, methods=['get'])
    def available_years(self, request):
        exam = request.query_params.get('exam')
        subject = request.query_params.get('subject')
        
        if not exam or not subject:
            return Response({'error': 'Exam and subject are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        years = PastQuestion.objects.filter(exam_id=exam, subject_id=subject).values_list('year', flat=True).distinct().order_by('-year')
        return Response(list(years))

from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils.dateparse import parse_datetime

User = get_user_model()

class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        users = User.objects.all()
        audit_filter = Q()
        if start_date:
            parsed_start = parse_datetime(start_date)
            if parsed_start:
                audit_filter &= Q(questionauditlog__timestamp__gte=parsed_start)
        if end_date:
            parsed_end = parse_datetime(end_date)
            if parsed_end:
                audit_filter &= Q(questionauditlog__timestamp__lte=parsed_end)
            
        users = users.annotate(
            total_uploaded=Count('questionauditlog', filter=audit_filter & Q(questionauditlog__action='uploaded')),
            total_approved=Count('questionauditlog', filter=audit_filter & Q(questionauditlog__action='approved')),
            total_changes_requested=Count('questionauditlog', filter=audit_filter & Q(questionauditlog__action='changes_requested')),
            total_edited=Count('questionauditlog', filter=audit_filter & Q(questionauditlog__action='edited')),
        )
        
        users = users.filter(
            Q(total_uploaded__gt=0) | 
            Q(total_approved__gt=0) | 
            Q(total_changes_requested__gt=0) | 
            Q(total_edited__gt=0)
        )
        
        users = users.order_by('-total_approved', '-total_uploaded')
        
        data = []
        for u in users:
            roles = [g.name for g in u.groups.all()]
            data.append({
                'id': u.id,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'roles': roles,
                'total_uploaded': u.total_uploaded,
                'total_approved': u.total_approved,
                'total_changes_requested': u.total_changes_requested,
                'total_edited': u.total_edited,
            })
            
        return Response(data)

class UserAnalyticsDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get(self, request, user_id):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        logs = QuestionAuditLog.objects.filter(user_id=user_id).select_related('question', 'question__exam', 'question__subject')
        
        if start_date:
            parsed_start = parse_datetime(start_date)
            if parsed_start:
                logs = logs.filter(timestamp__gte=parsed_start)
        if end_date:
            parsed_end = parse_datetime(end_date)
            if parsed_end:
                logs = logs.filter(timestamp__lte=parsed_end)
                
        logs = logs.order_by('-timestamp')
        
        # Paginate if needed, but for now we can just return a fixed limit or all
        logs = logs[:500] # Cap at 500 for safety
        
        data = []
        for log in logs:
            data.append({
                'id': log.id,
                'action': log.action,
                'timestamp': log.timestamp,
                'notes': log.notes,
                'question_info': f"{log.question.exam.name} {log.question.year} {log.question.subject.name} - Q{log.question.number}"
            })
            
        return Response(data)
