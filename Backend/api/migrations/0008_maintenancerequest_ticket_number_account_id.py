from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_user_account_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='maintenancerequest',
            name='ticket_number',
            field=models.CharField(max_length=16, unique=True, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='maintenancerequest',
            name='account_id',
            field=models.CharField(max_length=16, blank=True, null=True),
        ),
    ]
