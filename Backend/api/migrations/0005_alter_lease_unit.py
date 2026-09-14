from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_alter_property_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lease',
            name='unit',
            field=models.ForeignKey(
                to='api.unit',
                on_delete=django.db.models.deletion.CASCADE,
                null=True,
                blank=True,
            ),
        ),
    ]
