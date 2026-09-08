from django.core.mail import send_mail
from django.conf import settings


def send_verification_email(user, code: str):
    """Send a 6-digit verification code to a newly registered user."""
    subject = "Verify your Hippocrates AI account"
    message = f"""
Hi {user.first_name},

Welcome to Hippocrates AI!

Your email verification code is:

    {code}

This code expires in 10 minutes. Enter it on the verification page to activate your account.

If you did not create an account, please ignore this email.

— The Hippocrates AI Team
"""
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


def send_password_reset_email(user, code: str):
    """Send a 6-digit password reset code."""
    subject = "Reset your Hippocrates AI password"
    message = f"""
Hi {user.first_name},

We received a request to reset your password.

Your password reset code is:

    {code}

This code expires in 15 minutes. Enter it on the reset page along with your new password.

If you did not request a password reset, please ignore this email and your password will remain unchanged.

— The Hippocrates AI Team
"""
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
