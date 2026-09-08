"""
Django settings for hippocrates project.
"""

from pathlib import Path
from decouple import config
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-kw@x!#)ps2v4_=ttoq%q3ie6(3u_nn436q%hlsso+-=)(m(m@7')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Local
    'documents',
    'quiz',
    'accounts',
]

AUTH_USER_MODEL = 'accounts.User'

GEMINI_API_KEY = config('GEMINI_API_KEY', default='')

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',   # must be FIRST
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'hippocrates.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hippocrates.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='hippocrates'),
        'USER': config('DB_USER', default='hippo_user'),
        'PASSWORD': config('DB_PASSWORD', default='hippo_pass'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

# Media files (uploaded .docx files)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS — allow the React dev server
CORS_ALLOW_ALL_ORIGINS = True

# DRF defaults
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.MultiPartParser',   # for file uploads
        'rest_framework.parsers.JSONParser',
    ],
}

# JWT settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Email (Gmail SMTP)
EMAIL_BACKEND   = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST      = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT      = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS   = config('EMAIL_USE_TLS', default=True, cast=bool)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Hippocrates AI <noreply@hippocrates.ai>')
