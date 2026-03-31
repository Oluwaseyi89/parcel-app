# from django.db import models
# from django.utils import timezone
# from django.core.validators import MinLengthValidator
# from authentication.models import BaseUser

# class TempCourierUser(BaseUser):
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     business_country = models.CharField(max_length=50)
#     business_state = models.CharField(max_length=50)
#     business_street = models.CharField(max_length=100)
#     cac_registration_no = models.CharField(max_length=20, unique=True)
#     nin = models.CharField(
#         max_length=11, 
#         unique=True,
#         validators=[MinLengthValidator(11)]
#     )
#     phone_number = models.CharField(max_length=15)
#     photo = models.ImageField(
#         upload_to='courier_profiles/temp/',
#         null=True,
#         blank=True
#     )
#     accepted_policy = models.BooleanField(default=False)
#     documents_verified = models.BooleanField(default=False)
#     verification_note = models.TextField(blank=True)
#     approved_by = models.ForeignKey(
#         'AdminUser',
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='approved_temp_couriers'  # CHANGED
#     )
#     approved_at = models.DateTimeField(null=True, blank=True)
    
#     class Meta:
#         verbose_name = "Temporary Courier"
#         verbose_name_plural = "Temporary Couriers"
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return f"{self.first_name} {self.last_name} ({self.email})"
    
#     def get_full_name(self):
#         return f"{self.first_name} {self.last_name}"
    
#     @property
#     def is_pending_approval(self):
#         return not self.is_active and self.approved_by is None
    
#     @property
#     def is_rejected(self):
#         return not self.is_active and self.approved_by is not None

# class CourierUser(BaseUser):
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     business_country = models.CharField(max_length=50)
#     business_state = models.CharField(max_length=50)
#     business_street = models.CharField(max_length=100)
#     cac_registration_no = models.CharField(max_length=20, unique=True)
#     nin = models.CharField(
#         max_length=11,
#         unique=True,
#         validators=[MinLengthValidator(11)]
#     )
#     phone_number = models.CharField(max_length=15)
#     photo = models.ImageField(
#         upload_to='courier_profiles/',
#         null=True,
#         blank=True
#     )
#     rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
#     total_deliveries = models.PositiveIntegerField(default=0)
#     successful_deliveries = models.PositiveIntegerField(default=0)
#     active_vehicles = models.PositiveIntegerField(default=0)
#     verified = models.BooleanField(default=False)
#     verified_at = models.DateTimeField(null=True, blank=True)
#     approved_by = models.ForeignKey(
#         'AdminUser',
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='approved_couriers'  # CHANGED
#     )
#     approved_at = models.DateTimeField(default=timezone.now)
    
#     class Meta:
#         verbose_name = "Courier"
#         verbose_name_plural = "Couriers"
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return f"{self.first_name} {self.last_name} ({self.email})"
    
#     def get_full_name(self):
#         return f"{self.first_name} {self.last_name}"
    
#     @property
#     def success_rate(self):
#         if self.total_deliveries == 0:
#             return 0
#         return (self.successful_deliveries / self.total_deliveries) * 100
    
#     def approve(self, admin_user):
#         """Approve courier and mark as active"""
#         self.is_active = True
#         self.verified = True
#         self.approved_by = admin_user
#         self.verified_at = timezone.now()
#         self.save()
    
#     def create_from_temp(self, temp_courier, admin_user):
#         """Create permanent courier from temporary registration"""
#         self.email = temp_courier.email
#         self.first_name = temp_courier.first_name
#         self.last_name = temp_courier.last_name
#         self.business_country = temp_courier.business_country
#         self.business_state = temp_courier.business_state
#         self.business_street = temp_courier.business_street
#         self.cac_registration_no = temp_courier.cac_registration_no
#         self.nin = temp_courier.nin
#         self.phone_number = temp_courier.phone_number
#         self.photo = temp_courier.photo
#         self.password = temp_courier.password
#         self.is_active = True
#         self.verified = True
#         self.approved_by = admin_user
#         self.approved_at = timezone.now()
#         self.save()
























# from django.db import models

# class TempCourier(models.Model):
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     bus_country = models.CharField(max_length=50)
#     bus_state = models.CharField(max_length=50)
#     bus_street = models.CharField(max_length=50)
#     cac_reg_no = models.CharField(max_length=10)
#     nin = models.CharField(max_length=11, default='11111111111')
#     phone_no = models.CharField(max_length=14)
#     email = models.EmailField(max_length=70)
#     cour_photo = models.ImageField(upload_to='courier_images/')
#     cour_policy = models.BooleanField()
#     password = models.CharField(max_length=200)
#     reg_date = models.CharField(max_length=100, default="2022-04-23T12:25:32.355Z")
#     is_email_verified = models.BooleanField(default=False)

#     def __str__(self):
#         return self.first_name


# class Courier(models.Model):
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     bus_country = models.CharField(max_length=50)
#     bus_state = models.CharField(max_length=50)
#     bus_street = models.CharField(max_length=50)
#     cac_reg_no = models.CharField(max_length=10)
#     nin = models.CharField(max_length=11, default='11111111111')
#     phone_no = models.CharField(max_length=14)
#     email = models.EmailField(max_length=70)
#     cour_photo = models.CharField(max_length=200)
#     cour_policy = models.BooleanField()
#     password = models.CharField(max_length=200)
#     appr_officer = models.CharField(max_length=100)
#     appr_date = models.CharField(max_length=100, default="2022-04-23T12:25:32.355Z")
#     is_email_verified = models.BooleanField(default=False)

#     def __str__(self):
#         return self.first_name