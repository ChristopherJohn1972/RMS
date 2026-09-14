from django.core.management.base import BaseCommand
from api.models import User


class Command(BaseCommand):
    help = 'Backfill account_id for existing tenants'

    def handle(self, *args, **kwargs):
        tenants = User.objects.filter(role='tenant').order_by('created_at')
        count = 0
        for i, tenant in enumerate(tenants, start=1):
            if not tenant.account_id:
                tenant.account_id = f'TN{i:03d}'
                tenant.save(update_fields=['account_id'])
                count += 1
                self.stdout.write(f'  {tenant.email} -> {tenant.account_id}')
        self.stdout.write(self.style.SUCCESS(f'Updated {count} tenants'))
