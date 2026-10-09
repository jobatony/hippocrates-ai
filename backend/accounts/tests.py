from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class AccountsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@test.com', password='pw')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_default_quiz_ratio(self):
        self.assertEqual(self.user.quiz_ratio, 4)
        
    def test_update_quiz_ratio(self):
        res = self.client.patch('/api/auth/me/', {'quiz_ratio': 6}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['quiz_ratio'], 6)
        
        # Verify in DB
        self.user.refresh_from_db()
        self.assertEqual(self.user.quiz_ratio, 6)

    def test_update_quiz_ratio_invalid(self):
        # Pass a negative value, which should be rejected by PositiveSmallIntegerField
        res = self.client.patch('/api/auth/me/', {'quiz_ratio': -1}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
