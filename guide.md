# 🔐 Authentication & Authorization Implementation Guide
### Hippocrates AI — Full-Stack Auth with Gmail SMTP

> **Gmail SMTP**: `championanthony31@gmail.com` | **App Password**: `bgxa zvss uigu cczp`

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Backend — Django Setup](#2-backend--django-setup)
   - [2.1 Install New Dependencies](#21-install-new-dependencies)
   - [2.2 Update `.env`](#22-update-env)
   - [2.3 Update `settings.py`](#23-update-settingspy)
   - [2.4 Create the `accounts` App](#24-create-the-accounts-app)
   - [2.5 `accounts/models.py`](#25-accountsmodelspy)
   - [2.6 `accounts/serializers.py`](#26-accountsserializerspy)
   - [2.7 `accounts/emails.py`](#27-accountsemailspy)
   - [2.8 `accounts/views.py`](#28-accountsviewspy)
   - [2.9 `accounts/urls.py`](#29-accountsurlspy)
   - [2.10 Update Root `hippocrates/urls.py`](#210-update-root-hippocrasurlspy)
   - [2.11 Protect All Existing Views](#211-protect-all-existing-views)
   - [2.12 Run Migrations](#212-run-migrations)
3. [Frontend — React Setup](#3-frontend--react-setup)
   - [3.1 Install New Dependencies](#31-install-new-dependencies)
   - [3.2 Update `api.ts` — Add Auth Header Injection](#32-update-apits--add-auth-header-injection)
   - [3.3 Update `useStore.ts` — Add Auth State](#33-update-usestorets--add-auth-state)
   - [3.4 Create `RegisterPage.tsx`](#34-create-registerpagetsxy)
   - [3.5 Create `VerifyEmailPage.tsx`](#35-create-verifyemailpagetsx)
   - [3.6 Create `LoginPage.tsx`](#36-create-loginpagetsx)
   - [3.7 Create `ForgotPasswordPage.tsx`](#37-create-forgotpasswordpagetsx)
   - [3.8 Create `ResetPasswordPage.tsx`](#38-create-resetpasswordpagetsx)
   - [3.9 Create `ProtectedRoute.tsx`](#39-create-protectedroutetsx)
   - [3.10 Update `App.tsx` — Add Router](#310-update-apptsx--add-router)
   - [3.11 Update `Layout.tsx` — Wire User Avatar & Logout](#311-update-layouttsx--wire-user-avatar--logout)
4. [Where Auth Is Required — Map](#4-where-auth-is-required--map)
5. [Email Flow Diagrams](#5-email-flow-diagrams)
6. [Security Checklist](#6-security-checklist)

---

## 1. Overview & Architecture

### Tech Stack Decisions

| Layer | Library | Reason |
|---|---|---|
| Backend auth tokens | `djangorestframework-simplejwt` | Stateless JWTs, refresh tokens |
| Email | Django SMTP via Gmail | Simple, no 3rd-party service needed |
| Frontend routing | `react-router-dom` v7 | Pages for login/register/verify/reset |
| Frontend auth state | `zustand` (already used) | Consistent with existing store |

### Auth Flow Summary

```
Register → Verify Email (6-digit code) → Login → JWT tokens stored in localStorage
                                                        ↓
                                              All API calls send Authorization: Bearer <token>
                                                        ↓
                                              Backend validates JWT on every protected endpoint
```

---

## 2. Backend — Django Setup

### 2.1 Install New Dependencies

```bash
# From inside the backend/ directory, with venv activated:
pip install djangorestframework-simplejwt==5.3.1
```

Then add to `requirements.txt`:

```
djangorestframework-simplejwt>=5.3.1
```

---

### 2.2 Update `.env`

Add these lines to `backend/.env`:

```env
# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=championanthony31@gmail.com
EMAIL_HOST_PASSWORD=bgxa zvss uigu cczp
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Hippocrates AI <championanthony31@gmail.com>

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

---

### 2.3 Update `settings.py`

**File**: `backend/hippocrates/settings.py`

Add/replace these sections:

```python
# ─── Installed Apps ───────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',      # NEW
    'corsheaders',
    # Local
    'documents',
    'quiz',
    'accounts',                      # NEW
]

# ─── Custom User Model ────────────────────────────────────────────────────────
AUTH_USER_MODEL = 'accounts.User'   # NEW — must be set before first migration

# ─── DRF — now requires JWT by default ────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',   # NEW
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',                  # NEW (global default)
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.JSONParser',
    ],
}

# ─── JWT settings ─────────────────────────────────────────────────────────────
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ─── Email (Gmail SMTP) ───────────────────────────────────────────────────────
EMAIL_BACKEND   = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST      = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT      = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS   = config('EMAIL_USE_TLS', default=True, cast=bool)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Hippocrates AI <noreply@hippocrates.ai>')
```

---

### 2.4 Create the `accounts` App

```bash
# From backend/ directory:
python manage.py startapp accounts
```

---

### 2.5 `accounts/models.py`

**File**: `backend/accounts/models.py`

```python
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
```

---

### 2.6 `accounts/serializers.py`

**File**: `backend/accounts/serializers.py`

```python
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm Password')

    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'email', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        # Derive a username from the email (before @)
        base_username = validated_data['email'].split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        validated_data['username'] = username
        validated_data['is_active'] = False  # inactive until email verified

        user = User.objects.create_user(**validated_data)
        return user


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code  = serializers.CharField(max_length=6, min_length=6)


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email     = serializers.EmailField()
    code      = serializers.CharField(max_length=6, min_length=6)
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'first_name', 'last_name', 'email', 'is_email_verified', 'created_at']
        read_only_fields = fields
```

---

### 2.7 `accounts/emails.py`

**File**: `backend/accounts/emails.py`

```python
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
```

---

### 2.8 `accounts/views.py`

**File**: `backend/accounts/views.py`

```python
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailVerificationCode, PasswordResetCode
from .serializers import (
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
    ResetPasswordSerializer,
    UserProfileSerializer,
    VerifyEmailSerializer,
)
from .emails import send_verification_email, send_password_reset_email

User = get_user_model()


class RegisterView(APIView):
    """POST /api/auth/register/ — create account, send verification email."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Generate and send verification code
        code = EmailVerificationCode.generate_code()
        EmailVerificationCode.objects.create(user=user, code=code)
        try:
            send_verification_email(user, code)
        except Exception as e:
            # Don't block registration if email fails — log and continue
            print(f"[WARN] Failed to send verification email: {e}")

        return Response(
            {'detail': 'Account created. Check your email for a 6-digit verification code.'},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """POST /api/auth/verify-email/ — submit 6-digit code to activate account."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        code  = serializer.validated_data['code']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        verification = (
            EmailVerificationCode.objects
            .filter(user=user, code=code, is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not verification:
            return Response({'detail': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)

        if verification.is_expired:
            return Response({'detail': 'Code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # Activate the user
        verification.is_used = True
        verification.save()
        user.is_active = True
        user.is_email_verified = True
        user.save()

        # Issue JWT tokens immediately after verification
        refresh = RefreshToken.for_user(user)
        return Response({
            'detail': 'Email verified successfully.',
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    """POST /api/auth/resend-verification/ — resend a new code."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't leak whether email exists
            return Response({'detail': 'If this email is registered, a new code has been sent.'})

        if user.is_email_verified:
            return Response({'detail': 'Email is already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        code = EmailVerificationCode.generate_code()
        EmailVerificationCode.objects.create(user=user, code=code)
        send_verification_email(user, code)

        return Response({'detail': 'A new verification code has been sent to your email.'})


class LoginView(APIView):
    """POST /api/auth/login/ — returns JWT access + refresh tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email    = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_email_verified:
            return Response(
                {'detail': 'Please verify your email before logging in.',
                 'email_unverified': True},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_active:
            return Response({'detail': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user).data,
        })


class LogoutView(APIView):
    """POST /api/auth/logout/ — blacklists the refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass  # Already invalid — that's fine
        return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_205_RESET_CONTENT)


class ForgotPasswordView(APIView):
    """POST /api/auth/forgot-password/ — send password reset code."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Security: don't reveal whether email is registered
            return Response({'detail': 'If this email is registered, a reset code has been sent.'})

        code = PasswordResetCode.generate_code()
        PasswordResetCode.objects.create(user=user, code=code)
        send_password_reset_email(user, code)

        return Response({'detail': 'If this email is registered, a reset code has been sent.'})


class ResetPasswordView(APIView):
    """POST /api/auth/reset-password/ — verify code and set new password."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email    = serializer.validated_data['email']
        code     = serializer.validated_data['code']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid request.'}, status=status.HTTP_400_BAD_REQUEST)

        reset = (
            PasswordResetCode.objects
            .filter(user=user, code=code, is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not reset:
            return Response({'detail': 'Invalid or expired code.'}, status=status.HTTP_400_BAD_REQUEST)

        if reset.is_expired:
            return Response({'detail': 'Code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        reset.is_used = True
        reset.save()
        user.set_password(password)
        user.save()

        return Response({'detail': 'Password reset successfully. You can now log in.'})


class MeView(APIView):
    """GET /api/auth/me/ — returns the current authenticated user's profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
```

---

### 2.9 `accounts/urls.py`

**File**: `backend/accounts/urls.py`

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ForgotPasswordView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    ResendVerificationView,
    ResetPasswordView,
    VerifyEmailView,
)

urlpatterns = [
    path('register/',            RegisterView.as_view(),           name='auth-register'),
    path('verify-email/',        VerifyEmailView.as_view(),        name='auth-verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='auth-resend-verification'),
    path('login/',               LoginView.as_view(),              name='auth-login'),
    path('logout/',              LogoutView.as_view(),             name='auth-logout'),
    path('token/refresh/',       TokenRefreshView.as_view(),       name='auth-token-refresh'),
    path('forgot-password/',     ForgotPasswordView.as_view(),     name='auth-forgot-password'),
    path('reset-password/',      ResetPasswordView.as_view(),      name='auth-reset-password'),
    path('me/',                  MeView.as_view(),                 name='auth-me'),
]
```

---

### 2.10 Update Root `hippocrates/urls.py`

**File**: `backend/hippocrates/urls.py`

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/',          admin.site.urls),
    path('api/auth/',       include('accounts.urls')),       # NEW
    path('api/',            include('documents.urls')),
    path('api/questions/',  include('quiz.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

### 2.11 Protect All Existing Views

Since you set `IsAuthenticated` as the global default in `REST_FRAMEWORK`, all existing views in `documents/views.py` and `quiz/views.py` are **automatically protected**.

However, you must explicitly allow anonymous access to the auth endpoints (already handled with `permission_classes = [AllowAny]` on each auth view).

**Verify this is in place** — open `quiz/views.py` and confirm there is no `permission_classes = [AllowAny]` override on any view. The global default (`IsAuthenticated`) will apply to:

| Endpoint | File | Auth Required |
|---|---|---|
| `GET /api/materials/` | `documents/views.py` | YES |
| `POST /api/materials/` | `documents/views.py` | YES |
| `GET /api/materials/<id>/` | `documents/views.py` | YES |
| `DELETE /api/materials/<id>/` | `documents/views.py` | YES |
| `GET /api/questions/` | `quiz/views.py` | YES |
| `POST /api/questions/generate/` | `quiz/views.py` | YES |
| `POST /api/questions/attempts/log/` | `quiz/views.py` | YES |
| `PATCH /api/questions/<id>/` | `quiz/views.py` | YES |
| `DELETE /api/questions/<id>/` | `quiz/views.py` | YES |
| `POST /api/questions/<id>/regenerate/` | `quiz/views.py` | YES |

---

### 2.12 Run Migrations

```bash
# From backend/ with venv activated:

# IMPORTANT: Since we're adding a custom User model, delete the existing db.sqlite3
# (only in dev) and run fresh migrations.

# Step 1: Delete all migration files (keep __init__.py)
# - backend/documents/migrations/ (delete all files except __init__.py)
# - backend/quiz/migrations/ (delete all files except __init__.py)

# Step 2: Create and apply fresh migrations
python manage.py makemigrations accounts
python manage.py makemigrations documents quiz
python manage.py migrate

# Step 3: Create a superuser for Django admin
python manage.py createsuperuser
```

> **WARNING**: Adding a custom `AUTH_USER_MODEL` to an existing project with data
> requires a fresh migration reset in development. Delete `db.sqlite3`, delete all
> migration files (except `__init__.py`) in `documents/migrations/` and
> `quiz/migrations/`, then run the commands above.

Also register models in `accounts/admin.py`:

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EmailVerificationCode, PasswordResetCode

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'is_email_verified', 'is_active', 'created_at']
    list_filter  = ['is_email_verified', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Hippocrates', {'fields': ('is_email_verified',)}),
    )

admin.site.register(EmailVerificationCode)
admin.site.register(PasswordResetCode)
```

---

## 3. Frontend — React Setup

### 3.1 Install New Dependencies

```bash
# From frontend/ directory:
npm install react-router-dom@7
```

---

### 3.2 Update `api.ts` — Add Auth Header Injection

**File**: `frontend/src/api.ts`

Replace the entire file with:

```typescript
// frontend/src/api.ts
// Central API client for the Hippocrates Django backend

import type { Question } from './store/useStore';

const BASE_URL = 'http://localhost:8000/api';

// ─── Auth Token Helpers ───────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return null;

  const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  localStorage.setItem('access_token', data.access);
  return data.access;
}

/** Authenticated fetch — auto-refreshes token on 401 */
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();

  const makeRequest = (tkn: string | null) =>
    fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}),
      },
    });

  let res = await makeRequest(token);

  // Token expired — try refreshing once
  if (res.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) {
      res = await makeRequest(token);
    } else {
      // Refresh also failed — force logout
      window.location.href = '/login';
    }
  }

  return res;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_email_verified: boolean;
  created_at: string;
}

export async function register(data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password2: string;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
}

export async function verifyEmail(email: string, code: string): Promise<{ access: string; refresh: string }> {
  const res = await fetch(`${BASE_URL}/auth/verify-email/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Verification failed');
  }
  return res.json();
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/resend-verification/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Could not resend code');
  }
}

export async function login(email: string, password: string): Promise<{ access: string; refresh: string; user: AuthUser }> {
  const res = await fetch(`${BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function logout(refreshToken: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/auth/logout/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok && res.status !== 205) {
    throw new Error('Logout failed');
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/forgot-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Request failed');
  }
}

export async function resetPassword(data: {
  email: string;
  code: string;
  password: string;
  password2: string;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/reset-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Reset failed');
  }
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await authFetch(`${BASE_URL}/auth/me/`);
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiMaterial {
  id: string;
  title: string;
  status: 'pending' | 'parsing' | 'ready' | 'failed';
  created_at: string;
}

export interface ApiBlock {
  id: string;
  parent_id: string | null;
  order: number;
  block_type: 'heading_1' | 'heading_2' | 'heading_3' | 'paragraph' | 'list_item';
  text: string;
}

export interface ApiMaterialDetail extends ApiMaterial {
  blocks: ApiBlock[];
}

export interface ApiUploadResponse {
  id: string;
  title: string;
  status: string;
  blocks_created: number;
}

// ─── Materials API ────────────────────────────────────────────────────────────

export async function fetchMaterials(): Promise<ApiMaterial[]> {
  const res = await authFetch(`${BASE_URL}/materials/`);
  if (!res.ok) throw new Error(`Failed to fetch materials: ${res.statusText}`);
  return res.json();
}

export async function fetchMaterialDetail(id: string): Promise<ApiMaterialDetail> {
  const res = await authFetch(`${BASE_URL}/materials/${id}/`);
  if (!res.ok) throw new Error(`Failed to fetch material: ${res.statusText}`);
  return res.json();
}

export async function uploadMaterial(title: string, file: File): Promise<ApiUploadResponse> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);

  const res = await authFetch(`${BASE_URL}/materials/`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || `Upload failed: ${res.statusText}`);
  }

  return res.json();
}

export async function deleteMaterial(id: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/materials/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
}

// ─── Question API ─────────────────────────────────────────────────────────────

export async function generateQuestion(
  blockId: string,
  selectedText: string,
  questionType: string,
  materialId: string
): Promise<Question> {
  const res = await authFetch(`${BASE_URL}/questions/generate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      block_id: blockId,
      selected_text: selectedText,
      question_type: questionType,
      material_id: materialId,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to generate question');
  }

  const data = await res.json();
  return { ...data, type: data.question_type };
}

export async function fetchQuestions(materialId: string): Promise<Question[]> {
  const res = await authFetch(`${BASE_URL}/questions/?material_id=${materialId}`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  const data = await res.json();
  return data.map((q: any) => ({ ...q, type: q.question_type }));
}

export async function approveQuestion(id: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/questions/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
  });
  if (!res.ok) throw new Error('Failed to approve question');
}

export async function deleteQuestion(id: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/questions/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete question');
}

export async function updateQuestionPayload(id: string, payload: any): Promise<Question> {
  const res = await authFetch(`${BASE_URL}/questions/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) throw new Error('Failed to update question');
  const data = await res.json();
  return { ...data, type: data.question_type };
}

export async function regenerateQuestion(id: string, extraInstruction: string): Promise<Question> {
  const res = await authFetch(`${BASE_URL}/questions/${id}/regenerate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ extra_instruction: extraInstruction }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to regenerate question');
  }

  const data = await res.json();
  return { ...data, type: data.question_type };
}

export async function logAttempt(
  questionId: string,
  isCorrect: boolean,
  userAnswer: object = {}
): Promise<void> {
  await authFetch(`${BASE_URL}/questions/attempts/log/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: questionId,
      is_correct: isCorrect,
      user_answer: userAnswer,
    }),
  }).catch(() => {
    console.warn('Failed to log attempt to backend');
  });
}
```

---

### 3.3 Update `useStore.ts` — Add Auth State

**File**: `frontend/src/store/useStore.ts`

Add the following to the existing file. Insert the import at the top and add the auth state to the interface and implementation:

```typescript
// At the TOP of useStore.ts, add this import:
import type { AuthUser } from '../api';

// Add these fields to the AppState interface:
  // ─── Auth ──────────────────────────────────────────────────────────────────
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;

// Add these to the useStore create() function body (inside persist()):
  // Auth
  currentUser: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      currentUser: null,
      isAuthenticated: false,
      materials: [],
      activeMaterialId: null,
      activeMaterialTitle: '',
      documentBlocks: [],
      pendingQuestions: [],
      queueCount: 0,
    });
  },
```

---

### 3.4 Create `RegisterPage.tsx`

Create directory: `frontend/src/pages/`

**File**: `frontend/src/pages/RegisterPage.tsx`

```tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';
import { Loader2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', password2: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await register(form);
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        const messages = Object.values(parsed).flat();
        setError((messages as string[]).join(' '));
      } catch {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">Create your account</h1>
          <p className="text-on-surface-variant text-label-md mt-xs">
            Join Hippocrates AI to start learning smarter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container rounded-2xl p-xl space-y-md shadow-sm border border-outline-variant">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-xs">First Name</label>
              <input type="text" name="first_name" required value={form.first_name} onChange={handleChange}
                placeholder="John"
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-xs">Last Name</label>
              <input type="text" name="last_name" required value={form.last_name} onChange={handleChange}
                placeholder="Doe"
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              placeholder="john@example.com"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange}
              placeholder="Min. 8 characters"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Confirm Password</label>
            <input type="password" name="password2" required value={form.password2} onChange={handleChange}
              placeholder="Repeat your password"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          {error && <p className="text-error text-label-sm">{error}</p>}

          <button type="submit" disabled={isLoading}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 hover:bg-primary-container transition-all">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
          </button>

          <p className="text-center text-label-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
```

---

### 3.5 Create `VerifyEmailPage.tsx`

**File**: `frontend/src/pages/VerifyEmailPage.tsx`

```tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail, resendVerification, setTokens, fetchMe } from '../api';
import { useStore } from '../store/useStore';
import { Loader2, MailCheck } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setCurrentUser = useStore(s => s.setCurrentUser);

  const emailFromState = (location.state as { email?: string })?.email || '';
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await verifyEmail(email, code);
      setTokens(data.access, data.refresh);
      const user = await fetchMe();
      setCurrentUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { setError('Please enter your email.'); return; }
    setIsResending(true);
    setError(null);
    try {
      await resendVerification(email);
      setSuccess('A new code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Could not resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <MailCheck size={48} className="text-primary mx-auto mb-md" />
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">Check your email</h1>
          <p className="text-on-surface-variant text-label-md mt-xs">
            We sent a 6-digit code to <strong>{email || 'your email'}</strong>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="bg-surface-container rounded-2xl p-xl space-y-md shadow-sm border border-outline-variant">
          {!emailFromState && (
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-xs">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
          )}

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Verification Code</label>
            <input type="text" required maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary tracking-widest text-center text-xl" />
          </div>

          {error   && <p className="text-error text-label-sm">{error}</p>}
          {success && <p className="text-primary text-label-sm">{success}</p>}

          <button type="submit" disabled={isLoading || code.length !== 6}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 hover:bg-primary-container transition-all">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Verify Email'}
          </button>

          <button type="button" onClick={handleResend} disabled={isResending}
            className="w-full text-label-sm text-on-surface-variant hover:text-primary transition-colors">
            {isResending ? 'Sending...' : "Didn't get a code? Resend"}
          </button>
        </form>
      </div>
    </div>
  );
};
```

---

### 3.6 Create `LoginPage.tsx`

**File**: `frontend/src/pages/LoginPage.tsx`

```tsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login, setTokens } from '../api';
import { useStore } from '../store/useStore';
import { Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setCurrentUser = useStore(s => s.setCurrentUser);

  const successMessage = (location.state as { message?: string })?.message;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      setTokens(data.access, data.refresh);
      setCurrentUser(data.user);
      navigate('/');
    } catch (err: any) {
      if (err.message?.includes('verify your email')) {
        navigate('/verify-email', { state: { email } });
      } else {
        setError(err.message || 'Login failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">Welcome back</h1>
          <p className="text-on-surface-variant text-label-md mt-xs">Sign in to continue to Hippocrates AI.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container rounded-2xl p-xl space-y-md shadow-sm border border-outline-variant">
          {successMessage && <p className="text-primary text-label-sm bg-primary/10 px-md py-sm rounded-lg">{successMessage}</p>}

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-label-sm text-primary hover:underline">Forgot password?</Link>
          </div>

          {error && <p className="text-error text-label-sm">{error}</p>}

          <button type="submit" disabled={isLoading}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 hover:bg-primary-container transition-all">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>

          <p className="text-center text-label-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
```

---

### 3.7 Create `ForgotPasswordPage.tsx`

**File**: `frontend/src/pages/ForgotPasswordPage.tsx`

```tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api';
import { Loader2, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-md">
        <div className="w-full max-w-md text-center bg-surface-container rounded-2xl p-xl border border-outline-variant">
          <KeyRound size={48} className="text-primary mx-auto mb-md" />
          <h2 className="font-headline-md text-on-surface font-bold text-xl mb-sm">Check your email</h2>
          <p className="text-on-surface-variant text-label-md mb-lg">
            If <strong>{email}</strong> is registered, you'll receive a reset code shortly.
          </p>
          <button onClick={() => navigate('/reset-password', { state: { email } })}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md hover:bg-primary-container transition-all">
            Enter Reset Code
          </button>
          <Link to="/login" className="block mt-md text-label-sm text-on-surface-variant hover:text-primary transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">Forgot password?</h1>
          <p className="text-on-surface-variant text-label-md mt-xs">
            Enter your email and we'll send you a recovery code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container rounded-2xl p-xl space-y-md shadow-sm border border-outline-variant">
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          {error && <p className="text-error text-label-sm">{error}</p>}

          <button type="submit" disabled={isLoading}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 hover:bg-primary-container transition-all">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Code'}
          </button>

          <Link to="/login" className="block text-center text-label-sm text-on-surface-variant hover:text-primary transition-colors">
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};
```

---

### 3.8 Create `ResetPasswordPage.tsx`

**File**: `frontend/src/pages/ResetPasswordPage.tsx`

```tsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resetPassword } from '../api';
import { Loader2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || '';

  const [form, setForm] = useState({ email: emailFromState, code: '', password: '', password2: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(form);
      navigate('/login', { state: { message: 'Password reset successfully! Please log in.' } });
    } catch (err: any) {
      setError(err.message || 'Reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">Reset your password</h1>
          <p className="text-on-surface-variant text-label-md mt-xs">
            Enter the code from your email and choose a new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container rounded-2xl p-xl space-y-md shadow-sm border border-outline-variant">
          {!emailFromState && (
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-xs">Email</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange}
                placeholder="your@email.com"
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
          )}

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Reset Code</label>
            <input type="text" name="code" required maxLength={6}
              value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '') }))}
              placeholder="000000"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary tracking-widest text-center text-xl" />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">New Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange}
              placeholder="Min. 8 characters"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Confirm New Password</label>
            <input type="password" name="password2" required value={form.password2} onChange={handleChange}
              placeholder="Repeat new password"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          {error && <p className="text-error text-label-sm">{error}</p>}

          <button type="submit" disabled={isLoading || form.code.length !== 6}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 hover:bg-primary-container transition-all">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : 'Reset Password'}
          </button>

          <Link to="/login" className="block text-center text-label-sm text-on-surface-variant hover:text-primary transition-colors">
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};
```

---

### 3.9 Create `ProtectedRoute.tsx`

**File**: `frontend/src/components/ProtectedRoute.tsx`

```tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken } from '../api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps any route that requires authentication.
 * Redirects unauthenticated users to /login, preserving the intended URL.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

---

### 3.10 Update `App.tsx` — Add Router

**File**: `frontend/src/App.tsx`  
Replace the entire file:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/verify-email"    element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* Protected main app route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

### 3.11 Update `Layout.tsx` — Wire User Avatar & Logout

**File**: `frontend/src/components/Layout.tsx`

In `Layout.tsx`, make the following changes:

**1. Add new imports at the top:**
```tsx
import { logout as logoutApi } from '../api';
```

**2. Add to the destructured store values inside the component:**
```tsx
const { currentUser, logout: logoutStore } = useStore();
```

**3. Add the logout handler function inside the component:**
```tsx
const handleLogout = async () => {
  const refreshToken = localStorage.getItem('refresh_token') || '';
  try { await logoutApi(refreshToken); } catch { /* ignore */ }
  logoutStore();
  window.location.href = '/login';
};
```

**4. Replace the User avatar div (around line 195-197):**

Find this block:
```tsx
<div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
  <User size={18} className="text-on-primary" />
</div>
```

Replace with:
```tsx
<div className="relative group">
  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer select-none">
    {currentUser?.first_name ? (
      <span className="text-on-primary text-xs font-bold uppercase">
        {currentUser.first_name[0]}{currentUser.last_name?.[0] ?? ''}
      </span>
    ) : (
      <User size={18} className="text-on-primary" />
    )}
  </div>
  {/* Dropdown */}
  <div className="absolute right-0 top-full mt-xs bg-surface-container border border-outline-variant rounded-lg shadow-lg py-xs min-w-[180px] hidden group-hover:block z-50">
    <div className="px-md py-xs border-b border-outline-variant">
      <p className="text-label-sm font-medium text-on-surface truncate">
        {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'User'}
      </p>
      <p className="text-label-sm text-on-surface-variant truncate">{currentUser?.email}</p>
    </div>
    <button
      onClick={handleLogout}
      className="w-full text-left px-md py-sm text-label-sm text-error hover:bg-surface-container-high transition-colors"
    >
      Sign Out
    </button>
  </div>
</div>
```

---

## 4. Where Auth Is Required — Map

```
User visits app
     |
     v
Has valid JWT in localStorage?
     |
   NO ---> /login page
   YES ---> Layout (main app) loads normally

/login
  -> POST /api/auth/login/
  -> Success: store tokens, redirect to /
  -> email_unverified: redirect to /verify-email

/register
  -> POST /api/auth/register/
  -> Success: redirect to /verify-email

/verify-email
  -> POST /api/auth/verify-email/
  -> Success: get JWT tokens, redirect to /
  -> "Resend" button: POST /api/auth/resend-verification/

/forgot-password
  -> POST /api/auth/forgot-password/
  -> Always shows "check email" (anti-enumeration)
  -> "Enter Reset Code" button: redirect to /reset-password

/reset-password
  -> POST /api/auth/reset-password/
  -> Success: redirect to /login

All protected API calls (materials, questions):
  -> authFetch() auto-injects Authorization: Bearer <token>
  -> On 401: silent token refresh via /api/auth/token/refresh/
  -> On refresh failure: redirect to /login
```

---

## 5. Email Flow Diagrams

### Registration & Verification

```
1. User fills Register form
   → POST /api/auth/register/
   → Backend creates User (is_active=False) + 6-digit code (10 min TTL)
   → Gmail SMTP sends: "Your code is: 123456"

2. User receives email, enters code at /verify-email
   → POST /api/auth/verify-email/ { email, code }
   → Backend validates code, sets is_active=True, is_email_verified=True
   → Backend issues JWT access + refresh tokens
   → Frontend stores tokens, fetches /me, redirects to /
```

### Password Recovery

```
1. User visits /forgot-password, enters email
   → POST /api/auth/forgot-password/
   → Backend generates 6-digit reset code (15 min TTL)
   → Gmail SMTP sends: "Your reset code is: 654321"

2. User enters code + new password at /reset-password
   → POST /api/auth/reset-password/ { email, code, password, password2 }
   → Backend validates code, marks is_used=True, sets new password
   → User redirected to /login with success message
```

---

## 6. Security Checklist

| Item | Status |
|---|---|
| Passwords hashed with Django PBKDF2 | DONE (built-in AbstractUser) |
| JWT tokens short-lived (60 min access) | DONE — configured in SIMPLE_JWT |
| Refresh token rotation + blacklisting | DONE — ROTATE_REFRESH_TOKENS=True |
| All API endpoints require authentication | DONE — global IsAuthenticated |
| Auth endpoints explicitly allow anonymous access | DONE — AllowAny on each auth view |
| Email enumeration protection | DONE — generic messages in forgot-password, resend |
| Verification codes expire (10 min) | DONE — in EmailVerificationCode.save() |
| Reset codes expire (15 min) | DONE — in PasswordResetCode.save() |
| Codes are single-use | DONE — is_used flag checked and set |
| Gmail App Password used (not real password) | DONE — using App Password |
| SMTP uses TLS | DONE — EMAIL_USE_TLS=True |
| Token auto-refresh on 401 | DONE — in authFetch() |
| User avatar shows initials and logout dropdown | DONE — in Layout.tsx |
| CORS configured | DONE — already in settings |
| DEBUG=False in production | TODO — must set in production .env |
| Set ALLOWED_HOSTS properly in production | TODO — must configure before deploy |
| Use HTTPS in production | TODO — use nginx + certbot |
