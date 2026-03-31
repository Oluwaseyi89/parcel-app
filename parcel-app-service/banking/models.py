from django.db import models

class VendorBankDetail(models.Model):
    bank_name = models.CharField(max_length=70)
    AccountType = models.TextChoices('AccountType', 'Savings Current')
    account_type = models.CharField(blank=False, choices=AccountType.choices, max_length=20)
    account_name = models.CharField(max_length=70)
    vendor_email = models.EmailField(max_length=70)
    account_no = models.CharField(max_length=15)
    added_at = models.CharField(max_length=50)
    updated_at = models.CharField(max_length=50)

    def __str__(self):
        return self.account_name


class CourierBankDetail(models.Model):
    bank_name = models.CharField(max_length=70)
    AccountType = models.TextChoices('AccountType', 'Savings Current')
    account_type = models.CharField(blank=False, choices=AccountType.choices, max_length=20)
    account_name = models.CharField(max_length=70)
    courier_email = models.EmailField(max_length=70)
    account_no = models.CharField(max_length=15)
    added_at = models.CharField(max_length=50)
    updated_at = models.CharField(max_length=50)

    def __str__(self):
        return self.account_name