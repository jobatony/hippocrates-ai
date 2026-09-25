from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from quiz.models import Material, Block, Question, QuestionSchedule, DailyStudyLog

User = get_user_model()

class StreakLogicTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='streak_tester', password='pw')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.material = Material.objects.create(title='Test Material', user=self.user)
        self.block = Block.objects.create(
            material=self.material,
            text='Test block',
            block_type='paragraph',
            order=1
        )
        self.today = timezone.now().date()

    def test_approve_question_increments_created(self):
        # Generate 50 questions
        for i in range(50):
            q = Question.objects.create(
                material=self.material,
                source_block=self.block,
                question_type='mcq',
                status=Question.Status.PENDING,
                payload={}
            )
            # Approve it
            url = reverse('question-detail', kwargs={'pk': q.id})
            res = self.client.patch(url, {'status': Question.Status.APPROVED})
            self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Log should exist
        log = DailyStudyLog.objects.get(user=self.user, date=self.today)
        self.assertEqual(log.created, 50)
        self.assertTrue(log.creation_streak_met)
        
        # We had 0 due cards at the start, so review streak met should also be true
        self.assertTrue(log.review_streak_met)

    def test_zero_due_cards_streaks_upon_review(self):
        # Create a single due card
        q = Question.objects.create(
            material=self.material,
            source_block=self.block,
            question_type='mcq',
            status=Question.Status.APPROVED,
            payload={'options': ['A'], 'correct_index': 0}
        )
        schedule = QuestionSchedule.objects.create(
            user=self.user,
            question=q,
            scheduled_date=self.today,
            review_count=0
        )

        # Mock that we already created 50 questions
        DailyStudyLog.objects.create(user=self.user, date=self.today, created=50, creation_streak_met=True, reviewed=0, review_streak_met=False)

        # Answer the question correctly 3 times to master it (thus due_count becomes 0)
        url = reverse('quiz-session-answer', kwargs={'pk': q.id})
        for _ in range(3):
            res = self.client.post(url, {'correct': True})
            self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Log should be updated to review_streak_met because due_count became 0
        log = DailyStudyLog.objects.get(user=self.user, date=self.today)
        self.assertEqual(log.reviewed, 1) # mastered 1 card
        self.assertTrue(log.review_streak_met) # met because due_count == 0

    def test_dashboard_stats_unified_streak(self):
        # Setup: Yesterday met both streaks
        yesterday = self.today - timedelta(days=1)
        DailyStudyLog.objects.create(
            user=self.user, date=yesterday,
            created=50, creation_streak_met=True,
            reviewed=120, review_streak_met=True
        )

        # Today met only creation streak
        DailyStudyLog.objects.create(
            user=self.user, date=self.today,
            created=50, creation_streak_met=True,
            reviewed=10, review_streak_met=False
        )
        
        url = reverse('dashboard-stats')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        # Unified longest streak should be 1 (yesterday)
        # Unified current streak should be 1 (yesterday is met, today is just not met *yet*)
        self.assertEqual(res.data['longest_review_streak'], 1)
        self.assertEqual(res.data['current_review_streak'], 1)
