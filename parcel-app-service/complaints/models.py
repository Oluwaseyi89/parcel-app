from django.db import models

class CustomerComplaint(models.Model):
    customer_email = models.CharField(max_length=70)
    complaint_subject = models.CharField(max_length=125)
    courier_involved = models.CharField(max_length=125, default="Anonymous")
    complaint_detail = models.TextField(max_length=1000)
    is_resolved = models.BooleanField()
    is_satisfied = models.BooleanField()
    created_at = models.CharField(default="dummy_date", max_length=50)
    updated_at = models.CharField(default="dummy_date", max_length=50)

    def __str__(self):
        return self.complaint_subject