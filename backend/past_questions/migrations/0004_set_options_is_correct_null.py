from django.db import migrations


def set_is_correct_null(apps, schema_editor):
    QuestionOption = apps.get_model('past_questions', 'QuestionOption')
    updated = QuestionOption.objects.filter(is_correct__isnull=False).update(is_correct=None)
    print(f"\n[Migration 0004] Successfully set {updated} QuestionOption rows to is_correct=null.")


class Migration(migrations.Migration):

    dependencies = [
        ('past_questions', '0003_questionauditlog'),
    ]

    operations = [
        migrations.RunPython(set_is_correct_null, reverse_code=migrations.RunPython.noop),
    ]

