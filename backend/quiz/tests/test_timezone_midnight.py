from datetime import datetime, timedelta, timezone as dt_timezone
from unittest import mock

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from documents.models import Material, Block
from quiz.models import Question, QuestionSchedule

User = get_user_model()

# 00:30 on 10 Oct in Africa/Lagos (UTC+1) == 23:30 UTC on 9 Oct.
# At this moment the UTC date differs from the local date, which used to make
# the SRS think every card had been "reviewed on a previous day".
MIDNIGHT_LAGOS = datetime(2026, 10, 9, 23, 30, tzinfo=dt_timezone.utc)


class MidnightTimezoneTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tz', email='tz@example.com', password='pw')
        self.client.force_authenticate(user=self.user)
        material = Material.objects.create(title='T', user=self.user)
        block = Block.objects.create(material=material, text='b', block_type='paragraph', order=1)
        self.questions = []
        for _ in range(3):
            q = Question.objects.create(
                material=material, source_block=block, question_type='mcq',
                status='approved', payload={},
            )
            QuestionSchedule.objects.create(
                user=self.user, question=q, scheduled_date=datetime(2026, 10, 10).date()
            )
            self.questions.append(q)

    def test_streak_and_cooldown_survive_near_midnight(self):
        q = self.questions[0]
        url = reverse('quiz-session-answer', args=[q.id])
        with mock.patch('django.utils.timezone.now', return_value=MIDNIGHT_LAGOS):
            r1 = self.client.post(url, {'correct': True}, format='json')
            r2 = self.client.post(url, {'correct': True}, format='json')
        self.assertEqual(r1.data['streak'], 1)
        # Previously the streak was wiped on every answer in this window.
        self.assertEqual(r2.data['streak'], 2)

    def test_session_reload_keeps_cooldown_of_answered_cards(self):
        q = self.questions[0]
        url = reverse('quiz-session-answer', args=[q.id])
        with mock.patch('django.utils.timezone.now', return_value=MIDNIGHT_LAGOS):
            self.client.post(url, {'correct': True}, format='json')
            resp = self.client.get(reverse('quiz-session'))
        card = next(c for c in resp.data['queue'] if c['id'] == str(q.id))
        # Answered card must still look like a review (streak>0, cooldown set),
        # not like a brand-new card.
        self.assertEqual(card['streak'], 1)
        self.assertGreater(card['availableAt'], int(MIDNIGHT_LAGOS.timestamp() * 1000))
