# from django.db import models

# class TempVendor(models.Model):
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     bus_country = models.CharField(max_length=50)
#     bus_state = models.CharField(max_length=50)
#     bus_street = models.CharField(max_length=50)
#     BusCategories = models.TextChoices('BusCategory', 'Clothing Electronics Chemicals Educative_Materials Furniture '
#                                                       'Kitchen_Utensils Plastics Spare_Parts General_Merchandise')
#     bus_category = models.CharField(blank=True, choices=BusCategories.choices, max_length=25)
#     cac_reg_no = models.CharField(max_length=10)
#     nin = models.CharField(max_length=11, default='11111111111')
#     phone_no = models.CharField(max_length=14)
#     email = models.EmailField(max_length=70)
#     vend_photo = models.ImageField(upload_to='vendor_images/')
#     ven_policy = models.BooleanField()
#     password = models.CharField(max_length=200)
#     reg_date = models.CharField(max_length=100, default="2022-04-23T12:25:32.355Z")
#     is_email_verified = models.BooleanField(default=False)

#     def __str__(self):
#         return self.first_name


# class Vendor(models.Model):
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     bus_country = models.CharField(max_length=50)
#     bus_state = models.CharField(max_length=50)
#     bus_street = models.CharField(max_length=50)
#     bus_category = models.CharField(max_length=25)
#     cac_reg_no = models.CharField(max_length=10)
#     nin = models.CharField(max_length=11, default='11111111111')
#     phone_no = models.CharField(max_length=14)
#     email = models.EmailField(max_length=70)
#     vend_photo = models.CharField(max_length=200)
#     ven_policy = models.BooleanField()
#     password = models.CharField(max_length=200)
#     appr_officer = models.CharField(max_length=100)
#     appr_date = models.CharField(max_length=100, default="2022-04-23T12:25:32.355Z")
#     is_email_verified = models.BooleanField(default=False)

#     def __str__(self):
#         return self.first_name