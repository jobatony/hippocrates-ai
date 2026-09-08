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
