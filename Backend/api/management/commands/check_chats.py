from django.core.management.base import BaseCommand
from api.models import Conversation, Message, User


class Command(BaseCommand):
    help = 'Check existing conversations and messages'

    def handle(self, *args, **options):
        self.stdout.write('=== Users ===')
        for u in User.objects.all():
            self.stdout.write(f'  uid={u.uid} name={u.first_name} {u.last_name} role={u.role}')

        self.stdout.write(f'\n=== Conversations ({Conversation.objects.count()}) ===')
        for c in Conversation.objects.all():
            participants = [(str(p.uid), f'{p.first_name} {p.last_name}') for p in c.participants.all()]
            msg_count = Message.objects.filter(conversation=c).count()
            self.stdout.write(f'  id={c.id} participants={participants} messages={msg_count}')

        self.stdout.write(f'\n=== Messages ({Message.objects.count()}) ===')
        for m in Message.objects.select_related('sender')[:20]:
            sender_name = f'{m.sender.first_name} {m.sender.last_name}' if m.sender else 'Unknown'
            self.stdout.write(f'  id={m.id} conv={m.conversation_id} sender={m.sender_id} ({sender_name}) text="{m.text[:80]}" is_read={m.is_read}')
