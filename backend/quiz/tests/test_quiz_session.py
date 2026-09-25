from rest_framework.test import APITestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from documents.models import Material, Block
from quiz.models import Question, QuestionSchedule, DailyStudyLog
from datetime import timedelta

User = get_user_model()

class QuizSessionAnswerTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pw')
        self.client.force_authenticate(user=self.user)
        self.material = Material.objects.create(title="Test", user=self.user)
        self.block = Block.objects.create(
            material=self.material,
            text="Test block",
            block_type="paragraph",
            order=1
        )
        self.question = Question.objects.create(
            material=self.material,
            source_block=self.block,
            question_type="mcq",
            status="approved",
            payload={}
        )
        self.schedule = QuestionSchedule.objects.create(
            user=self.user,
            question=self.question,
            scheduled_date=timezone.now().date()
        )
        self.url = reverse('quiz-session-answer', args=[self.question.id])

    def test_missing_correct_payload(self):
        response = self.client.post(self.url, {}, content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_invalid_schedule_id(self):
        url = reverse('quiz-session-answer', args=['00000000-0000-0000-0000-000000000000'])
        response = self.client.post(url, {'correct': True}, content_type='application/json')
        self.assertEqual(response.status_code, 404)

    def test_incorrect_answer_resets_streak_and_delays(self):
        self.schedule.streak = 2
        self.schedule.save()
        
        response = self.client.post(self.url, {'correct': False}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        self.schedule.refresh_from_db()
        self.assertEqual(self.schedule.streak, 0)
        self.assertIsNotNone(self.schedule.available_at)
        
        # Ensure delay is between 3 to 5 minutes
        now = timezone.now()
        delay = (self.schedule.available_at - now).total_seconds() / 60
        self.assertTrue(2.9 <= delay <= 5.1, f"Delay {delay} out of bounds")

    def test_correct_answer_increments_streak_and_delays(self):
        self.schedule.streak = 1
        self.schedule.save()
        
        response = self.client.post(self.url, {'correct': True}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        self.schedule.refresh_from_db()
        self.assertEqual(self.schedule.streak, 2)
        self.assertIsNotNone(self.schedule.available_at)
        
        # Ensure delay is between 5 to 10 minutes
        now = timezone.now()
        delay = (self.schedule.available_at - now).total_seconds() / 60
        self.assertTrue(4.9 <= delay <= 10.1, f"Delay {delay} out of bounds")

    def test_correct_answer_achieves_mastery(self):
        self.schedule.streak = 2
        self.schedule.review_count = 0
        self.schedule.save()
        
        response = self.client.post(self.url, {'correct': True}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        self.schedule.refresh_from_db()
        self.assertEqual(self.schedule.streak, 3)
        self.assertIsNotNone(self.schedule.mastered_at)
        self.assertIsNone(self.schedule.available_at)
        self.assertEqual(self.schedule.review_count, 1)
        
        # Scheduled date should be today + 3 days (review_count=0 when passed in)
        self.assertEqual(self.schedule.scheduled_date, timezone.now().date() + timedelta(days=3))
        
        # Check DailyStudyLog
        log = DailyStudyLog.objects.get(user=self.user, date=timezone.now().date())
        self.assertEqual(log.reviewed, 1)

class QuizSessionTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester2', password='pw')
        self.client.force_authenticate(user=self.user)
        self.material = Material.objects.create(title='Test2', user=self.user)
        self.block = Block.objects.create(
            material=self.material,
            text='Test block',
            block_type='paragraph',
            order=1
        )
        self.url = reverse('quiz-session')

    def test_quota_pooling_exact(self):
        schedules = []
        today = timezone.now().date()
        for i in range(100):
            q1 = Question.objects.create(material=self.material, source_block=self.block, question_type='mcq', status='approved', payload={})
            q2 = Question.objects.create(material=self.material, source_block=self.block, question_type='mcq', status='approved', payload={})
            q3 = Question.objects.create(material=self.material, source_block=self.block, question_type='mcq', status='approved', payload={})
            schedules.append(QuestionSchedule(user=self.user, question=q1, scheduled_date=today, review_count=0))
            schedules.append(QuestionSchedule(user=self.user, question=q2, scheduled_date=today, review_count=2))
            schedules.append(QuestionSchedule(user=self.user, question=q3, scheduled_date=today, review_count=5))
        QuestionSchedule.objects.bulk_create(schedules)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        
        queue = response.data['queue']
        self.assertEqual(len(queue), 30)
        
        new_c = sum(1 for q in queue if q['review_count'] == 0)
        young_c = sum(1 for q in queue if 0 < q['review_count'] <= 3)
        mature_c = sum(1 for q in queue if q['review_count'] > 3)
        
        self.assertEqual(new_c, 12)
        self.assertEqual(young_c, 10)
        self.assertEqual(mature_c, 8)

    def test_quota_pooling_reallocation(self):
        # Create 0 new, 100 young, 100 mature cards due today
        schedules = []
        today = timezone.now().date()
        for i in range(100):
            q2 = Question.objects.create(material=self.material, source_block=self.block, question_type='mcq', status='approved', payload={})
            q3 = Question.objects.create(material=self.material, source_block=self.block, question_type='mcq', status='approved', payload={})
            schedules.append(QuestionSchedule(user=self.user, question=q2, scheduled_date=today, review_count=2))
            schedules.append(QuestionSchedule(user=self.user, question=q3, scheduled_date=today, review_count=5))
        QuestionSchedule.objects.bulk_create(schedules)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        
        queue = response.data['queue']
        self.assertEqual(len(queue), 30)
        
        new_c = sum(1 for q in queue if q['review_count'] == 0)
        young_c = sum(1 for q in queue if 0 < q['review_count'] <= 3)
        mature_c = sum(1 for q in queue if q['review_count'] > 3)
        
        self.assertEqual(new_c, 0)
        self.assertEqual(young_c + mature_c, 30)
