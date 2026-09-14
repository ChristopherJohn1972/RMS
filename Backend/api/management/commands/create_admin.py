# api/management/commands/create_admin.py
import uuid
from django.core.management.base import BaseCommand
from api.models import User


class Command(BaseCommand):
    help = 'Create an admin user for the RMS system'

    def add_arguments(self, parser):
        parser.add_argument('--email', default='curlsjamin@gmail.com')
        parser.add_argument('--password', default='Jamin$&2222')
        parser.add_argument('--first_name', default='System')
        parser.add_argument('--last_name', default='Admin')
        parser.add_argument('--phone', default='')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']
        phone = options['phone']

        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            user.password_hash = password
            user.role = 'admin'
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Admin user updated: {email}"))
        else:
            uid = str(uuid.uuid4())
            user = User.objects.create(
                uid=uid, email=email, first_name=first_name,
                last_name=last_name, phone=phone, role='admin',
                password_hash=password,
            )
            self.stdout.write(self.style.SUCCESS(f"Admin user created: {email}"))

        self.stdout.write(f"  UID:      {user.uid}")
        self.stdout.write(f"  Role:     {user.role}")
