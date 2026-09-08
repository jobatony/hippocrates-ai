import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hippocrates.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute('DROP SCHEMA public CASCADE;')
    cursor.execute('CREATE SCHEMA public;')
    cursor.execute('GRANT ALL ON SCHEMA public TO postgres;')
    cursor.execute('GRANT ALL ON SCHEMA public TO public;')
print('Schema dropped and recreated successfully.')
