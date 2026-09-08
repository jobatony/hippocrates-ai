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
