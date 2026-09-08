import uuid
import random
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """
    Custom user extending Django's AbstractUser.
    Adds email-verification and profile fields.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Use email as the login field instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email


class EmailVerificationCode(models.Model):
    """
    Stores a 6-digit code sent to a user's email to verify their account.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.pk:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    @classmethod
    def generate_code(cls):
        return str(random.randint(100000, 999999))

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Code for {self.user.email} — {'used' if self.is_used else 'active'}"


class PasswordResetCode(models.Model):
    """
    Stores a 6-digit code sent to recover a forgotten password.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_codes')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.pk:
            self.expires_at = timezone.now() + timedelta(minutes=15)
        super().save(*args, **kwargs)

    @classmethod
    def generate_code(cls):
        return str(random.randint(100000, 999999))

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Password reset for {self.user.email}"
