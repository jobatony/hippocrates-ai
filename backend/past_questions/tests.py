from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient
from rest_framework import status
from .models import Exam, Subject, PastQuestion, QuestionOption

User = get_user_model()

class PastQuestionTests(TestCase):
    def setUp(self):
        self.uploader_group, _ = Group.objects.get_or_create(name='Uploader')
        self.validator_group, _ = Group.objects.get_or_create(name='Validator')

        self.uploader = User.objects.create_user(username='up', email='up@test.com', password='pw')
        self.uploader.groups.add(self.uploader_group)
        
        self.validator = User.objects.create_user(username='val', email='val@test.com', password='pw')
        self.validator.groups.add(self.validator_group)

        self.exam = Exam.objects.create(name='WAEC')
        self.subject = Subject.objects.create(name='PHYSICS')

        self.client_up = APIClient()
        self.client_up.force_authenticate(user=self.uploader)

        self.client_val = APIClient()
        self.client_val.force_authenticate(user=self.validator)

    def test_uploader_can_create_question(self):
        payload = {
            'exam': self.exam.id,
            'subject': self.subject.id,
            'year': 2020,
            'number': 1,
            'question_text': 'What is gravity?',
            'options': [
                {'letter': 'A', 'text': 'A force', 'is_correct': True},
                {'letter': 'B', 'text': 'A myth', 'is_correct': False},
            ]
        }
        res = self.client_up.post('/api/past-questions/uploader/questions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PastQuestion.objects.count(), 1)
        q = PastQuestion.objects.first()
        self.assertEqual(q.status, 'pending')
        self.assertEqual(q.uploaded_by, self.uploader)
        self.assertEqual(q.options.count(), 2)

    def test_validator_cannot_create_question(self):
        payload = {
            'exam': self.exam.id,
            'subject': self.subject.id,
            'year': 2020,
            'number': 2,
            'question_text': 'What is mass?',
            'options': []
        }
        res = self.client_val.post('/api/past-questions/uploader/questions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unique_together_constraint(self):
        PastQuestion.objects.create(exam=self.exam, subject=self.subject, year=2021, number=5, question_text="Q1")
        
        payload = {
            'exam': self.exam.id,
            'subject': self.subject.id,
            'year': 2021,
            'number': 5,
            'question_text': 'Duplicate',
            'options': []
        }
        res = self.client_up.post('/api/past-questions/uploader/questions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', res.data)

    def test_validator_approve(self):
        q = PastQuestion.objects.create(exam=self.exam, subject=self.subject, year=2021, number=5, question_text="Q1", uploaded_by=self.uploader)
        
        res = self.client_val.post(f'/api/past-questions/validator/questions/{q.id}/validate/', {'action': 'approve'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        q.refresh_from_db()
        self.assertEqual(q.status, 'approved')
        self.assertEqual(q.validated_by, self.validator)

    def test_uploader_cannot_approve(self):
        q = PastQuestion.objects.create(exam=self.exam, subject=self.subject, year=2021, number=5, question_text="Q1", uploaded_by=self.uploader)
        
        res = self.client_up.post(f'/api/past-questions/validator/questions/{q.id}/validate/', {'action': 'approve'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

class AnalyticsTests(TestCase):
    def setUp(self):
        self.uploader_group, _ = Group.objects.get_or_create(name='Uploader')
        self.validator_group, _ = Group.objects.get_or_create(name='Validator')

        self.uploader = User.objects.create_user(username='up2', email='up2@test.com', password='pw')
        self.uploader.groups.add(self.uploader_group)
        self.validator = User.objects.create_user(username='val2', email='val2@test.com', password='pw')
        self.validator.groups.add(self.validator_group)
        
        # Make a superuser to view analytics
        self.admin = User.objects.create_superuser(username='admin2', email='admin2@test.com', password='pw')

        self.exam = Exam.objects.create(name='WAEC')
        self.subject = Subject.objects.create(name='Math')
        self.client = APIClient()

    def test_analytics_tracking(self):
        # 1. Uploader uploads a question
        self.client.force_authenticate(user=self.uploader)
        res = self.client.post('/api/past-questions/uploader/questions/', {
            'exam': self.exam.id,
            'subject': self.subject.id,
            'year': 2021,
            'number': 1,
            'question_text': 'Test?',
            'options': []
        }, format='json')
        if res.status_code != status.HTTP_201_CREATED:
            print(res.data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        q_id = res.data['id']
        
        # 2. Validator approves it
        self.client.force_authenticate(user=self.validator)
        res2 = self.client.post(f'/api/past-questions/validator/questions/{q_id}/validate/', {
            'action': 'approve'
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        
        # 3. View analytics as admin
        self.client.force_authenticate(user=self.admin)
        res_summary = self.client.get('/api/past-questions/analytics/summary/')
        self.assertEqual(res_summary.status_code, status.HTTP_200_OK)
        
        # We should see uploader with 1 upload, validator with 1 approve
        summary = res_summary.data
        uploader_stat = next(s for s in summary if s['email'] == 'up2@test.com')
        self.assertEqual(uploader_stat['total_uploaded'], 1)
        
        validator_stat = next(s for s in summary if s['email'] == 'val2@test.com')
        self.assertEqual(validator_stat['total_approved'], 1)
        
        # 4. View detailed log for uploader
        res_detail = self.client.get(f'/api/past-questions/analytics/user/{self.uploader.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_detail.data), 1)
        self.assertEqual(res_detail.data[0]['action'], 'uploaded')
        self.assertIn('WAEC 2021 Math - Q1', res_detail.data[0]['question_info'])
