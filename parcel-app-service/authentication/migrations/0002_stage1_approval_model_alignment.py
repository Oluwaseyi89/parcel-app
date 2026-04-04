# Generated manually for Stage 1 model stabilization
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="vendoruser",
            name="photo",
            field=models.ImageField(blank=True, null=True, upload_to="vendor-photos/"),
        ),
        migrations.AddField(
            model_name="tempvendoruser",
            name="photo",
            field=models.ImageField(blank=True, null=True, upload_to="vendor-photos/"),
        ),
        migrations.AddField(
            model_name="tempvendoruser",
            name="policy_accepted",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="tempvendoruser",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending Approval"),
                    ("verified", "Email Verified"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="vendoruser",
            name="status",
            field=models.CharField(
                choices=[
                    ("active", "Active"),
                    ("suspended", "Suspended"),
                    ("inactive", "Inactive"),
                ],
                default="active",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="courieruser",
            name="photo",
            field=models.ImageField(blank=True, null=True, upload_to="courier-photos/"),
        ),
        migrations.AddField(
            model_name="tempcourieruser",
            name="photo",
            field=models.ImageField(blank=True, null=True, upload_to="courier-photos/"),
        ),
        migrations.AddField(
            model_name="tempcourieruser",
            name="policy_accepted",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="tempcourieruser",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending Approval"),
                    ("verified", "Email Verified"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="courieruser",
            name="rating",
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=3),
        ),
        migrations.AddField(
            model_name="courieruser",
            name="successful_deliveries",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="courieruser",
            name="total_deliveries",
            field=models.IntegerField(default=0),
        ),
    ]
