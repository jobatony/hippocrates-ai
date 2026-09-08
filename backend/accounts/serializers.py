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
