from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta
from django.utils import timezone
from quiz.models import DailyStudyLog

User = get_user_model()

class DashboardStatsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', email='tester@example.com', password='password')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = reverse('dashboard-stats')

    def test_streak_logic_combinations(self):
        # We simulate the past 4 days.
        today = timezone.now().date()
        
        # Day -4: Meet both goals -> streak 1
        d_minus_4 = today - timedelta(days=4)
        DailyStudyLog.objects.create(
            user=self.user, date=d_minus_4,
            reviewed=120, created=50,
            review_streak_met=True, creation_streak_met=True
        )

        # Day -3: Meet both goals -> streak 2
        d_minus_3 = today - timedelta(days=3)
        DailyStudyLog.objects.create(
            user=self.user, date=d_minus_3,
            reviewed=120, created=50,
            review_streak_met=True, creation_streak_met=True
        )
        
        # Day -2: Miss review goal -> streak broken (0)
        d_minus_2 = today - timedelta(days=2)
        DailyStudyLog.objects.create(
            user=self.user, date=d_minus_2,
            reviewed=50, created=50,
            review_streak_met=False, creation_streak_met=True
        )

        # Day -1: Meet both goals -> streak 1
        d_minus_1 = today - timedelta(days=1)
        DailyStudyLog.objects.create(
            user=self.user, date=d_minus_1,
            reviewed=120, created=50,
            review_streak_met=True, creation_streak_met=True
        )
        
        # Today: Not met yet
        DailyStudyLog.objects.create(
            user=self.user, date=today,
            reviewed=10, created=0,
            review_streak_met=False, creation_streak_met=False
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Longest streak should be 2 (from day -4 to day -3)
        self.assertEqual(response.data['longest_review_streak'], 2)
        # Current streak should be 1 (yesterday is met, today is pending)
        self.assertEqual(response.data['current_review_streak'], 1)

    def test_due_count_aggregation(self):
        # The due_count is tested in test_streaks, but we can verify it returns in the API
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('due_count', response.data)
        self.assertEqual(response.data['due_count'], 0)

    def test_monthly_activity_array(self):
        today = timezone.now().date()
        DailyStudyLog.objects.create(
            user=self.user, date=today,
            reviewed=5, created=1,
            review_streak_met=False, creation_streak_met=False
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should contain an entry for each day of the current month up to the end of the month
        activity = response.data['monthly_activity']
        self.assertTrue(len(activity) >= 28)
        
        # Verify today's date exists in the array and has correct stats
        today_str = f"{today.year}-{today.month:02d}-{today.day:02d}"
        today_data = next((a for a in activity if a['date'] == today_str), None)
        
        self.assertIsNotNone(today_data)
        self.assertEqual(today_data['reviewed'], 5)
        self.assertEqual(today_data['created'], 1)
        self.assertFalse(today_data['streak_met'])
