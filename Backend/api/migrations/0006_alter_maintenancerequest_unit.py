from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_alter_lease_unit'),
    ]

    operations = [
        migrations.AlterField(
            model_name='maintenancerequest',
            name='unit',
            field=models.ForeignKey(
                to='api.unit',
                on_delete=django.db.models.deletion.CASCADE,
                null=True,
                blank=True,
                related_name='maintenance_requests',
            ),
        ),
    ]
