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
            'options': [
                {'letter': 'A', 'text': 'Option A', 'is_correct': None},
                {'letter': 'B', 'text': 'Option B', 'is_correct': None},
            ]
        }
        res = self.client_up.post('/api/past-questions/uploader/questions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', res.data)

    def test_uploader_cannot_create_with_empty_text(self):
        payload = {
            'exam': self.exam.id,
            'subject': self.subject.id,
            'year': 2022,
            'number': 1,
            'question_text': '   ',
            'options': [
                {'letter': 'A', 'text': 'Opt 1', 'is_correct': None},
                {'letter': 'B', 'text': 'Opt 2', 'is_correct': None},
            ]
        }
        res = self.client_up.post('/api/past-questions/uploader/questions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('question_text', res.data)

    def test_uploader_cannot_create_with_less_than_two_options(self):
        payload = {
            'exam': self.exam.id,
            'subject': self.subject.id,
            'year': 2022,
            'number': 2,
            'question_text': 'Valid text',
            'options': [
                {'letter': 'A', 'text': 'Only one', 'is_correct': None},
            ]
        }
        res = self.client_up.post('/api/past-questions/uploader/questions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('options', res.data)

    def test_uploader_can_delete_pending_question(self):
        q = PastQuestion.objects.create(exam=self.exam, subject=self.subject, year=2022, number=3, question_text="Q3", uploaded_by=self.uploader)
        res = self.client_up.delete(f'/api/past-questions/uploader/questions/{q.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PastQuestion.objects.filter(id=q.id).exists())

    def test_uploader_cannot_delete_approved_question(self):
        q = PastQuestion.objects.create(exam=self.exam, subject=self.subject, year=2022, number=4, question_text="Q4", status='approved', uploaded_by=self.uploader)
        res = self.client_up.delete(f'/api/past-questions/uploader/questions/{q.id}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(PastQuestion.objects.filter(id=q.id).exists())

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

    def test_options_default_to_null_is_correct(self):
        payload = {
            'exam': self.exam.id,
            'subject': self.subject.id,
            'year': 2023,
            'number': 10,
            'question_text': 'What is inertia?',
            'options': [
                {'letter': 'A', 'text': 'Option A'},
                {'letter': 'B', 'text': 'Option B'},
            ]
        }
        res = self.client_up.post('/api/past-questions/uploader/questions/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        q = PastQuestion.objects.get(year=2023, number=10)
        for opt in q.options.all():
            self.assertIsNone(opt.is_correct)
        
        for opt_data in res.data['options']:
            self.assertIsNone(opt_data['is_correct'])

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
            'options': [
                {'letter': 'A', 'text': 'Option A', 'is_correct': None},
                {'letter': 'B', 'text': 'Option B', 'is_correct': None},
            ]
        }, format='json')
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
