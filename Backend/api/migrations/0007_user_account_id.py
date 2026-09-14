from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_alter_maintenancerequest_unit'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='account_id',
            field=models.CharField(max_length=16, unique=True, blank=True, null=True),
        ),
    ]
