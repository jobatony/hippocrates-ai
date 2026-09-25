from datetime import date
from django.test import TestCase
from django.contrib.auth import get_user_model
from quiz.srs import find_next_review_date
from quiz.models import QuestionSchedule, Question, DailyStudyLog
from documents.models import Material, Block

User = get_user_model()

class SRSTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pw')
        self.base_date = date(2026, 1, 1)

    def test_interval_scaling_by_review_count(self):
        # 1st mastery (review_count = 0) -> 3 days
        next_date = find_next_review_date(self.user, self.base_date, review_count=0)
        self.assertEqual(next_date, date(2026, 1, 4))
        
        # 2nd mastery (review_count = 1) -> 3 days
        next_date = find_next_review_date(self.user, self.base_date, review_count=1)
        self.assertEqual(next_date, date(2026, 1, 4))
        
        # 3rd mastery (review_count = 2) -> 3 days
        next_date = find_next_review_date(self.user, self.base_date, review_count=2)
        self.assertEqual(next_date, date(2026, 1, 4))

        # 4th mastery (review_count = 3) -> 5 days
        next_date = find_next_review_date(self.user, self.base_date, review_count=3)
        self.assertEqual(next_date, date(2026, 1, 6))

        # 5th mastery (review_count = 4) -> 5 days
        next_date = find_next_review_date(self.user, self.base_date, review_count=4)
        self.assertEqual(next_date, date(2026, 1, 6))


