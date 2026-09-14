from django.core.management.base import BaseCommand
from api.models import Property


class Command(BaseCommand):
    help = 'Remove duplicate properties, keeping the oldest one'

    def handle(self, *args, **kwargs):
        seen = {}
        removed = 0
        for p in Property.objects.order_by('created_at'):
            key = (p.name.lower().strip(), p.address.lower().strip())
            if key in seen:
                p.delete()
                removed += 1
                self.stdout.write(f'  Deleted duplicate: {p.name} ({p.address})')
            else:
                seen[key] = p.id
        self.stdout.write(self.style.SUCCESS(f'Removed {removed} duplicate(s)'))
