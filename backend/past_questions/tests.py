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
