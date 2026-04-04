from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone

# Add this base abstract model
class BaseUser(models.Model):
    """Abstract base model for all user types"""
    email = models.EmailField(unique=True, max_length=80)
    password = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        abstract = True
    
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    def get_full_name(self):
        raise NotImplementedError("Subclasses must implement this method")

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

# Update AdminUser to inherit from BaseUser
class AdminUser(BaseUser):
    """
    Admin/Staff user model for system administration
    """
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrator'),
        ('admin', 'Administrator'),
        ('staff', 'Staff Member'),
        ('operator', 'System Operator'),
    ]
    
    # Personal Information
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=14, blank=True, null=True)
    
    # Authorization
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    
    # Profile
    photo = models.ImageField(upload_to='staff-photo/', blank=True, null=True)
    
    # Add GenericRelation for sessions (optional)
    sessions = GenericRelation('UserSession', related_query_name='admin_user')
    reset_tokens = GenericRelation('PasswordResetToken', related_query_name='admin_user')
    
    class Meta:
        verbose_name = "Admin User"
        verbose_name_plural = "Admin Users"
        ordering = ['-created_at']
    
    def set_password(self, raw_password):
        """Hash and set the password"""
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Verify the password"""
        return check_password(raw_password, self.password)
    
    @classmethod
    def create_super_admin(cls, email, password, first_name="Super", last_name="Admin", phone=None):
        """Create initial super admin (run once via management command)"""
        admin = cls(
            email=email,
            role='super_admin',
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            is_active=True,
            is_email_verified=True  # Super admin doesn't need email verification
        )
        admin.set_password(password)
        admin.save()
        return admin
    
    def get_full_name(self):
        """Return the full name of the admin"""
        return f"{self.first_name} {self.last_name}"
    
    def has_perm(self, perm):
        """Check if user has specific permission based on role"""
        role_permissions = {
            'super_admin': ['manage_all', 'create_admin', 'manage_users', 'view_reports'],
            'admin': ['manage_users', 'view_reports'],
            'staff': ['view_reports'],
            'operator': ['basic_operations'],
        }
        return perm in role_permissions.get(self.role, [])
    
    def is_super_admin(self):
        """Check if user is super admin"""
        return self.role == 'super_admin'
    
    def is_admin(self):
        """Check if user is admin or super admin"""
        return self.role in ['super_admin', 'admin']
    
    def deactivate(self):
        """Deactivate user account"""
        self.is_active = False
        self.save()
    
    def activate(self):
        """Activate user account"""
        self.is_active = True
        self.save()
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email}) - {self.role}"


class CustomerUser(BaseUser):
    """Customer user model"""
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('premium_customer', 'Premium Customer'),
        ('anonymous', 'Anonymous Customer'),
    ]
    
    # Personal Information
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=14, blank=True, null=True)
    
    # Location
    country = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=50, blank=True)
    street = models.CharField(max_length=50, blank=True)
    
    # Authorization
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    
    # Add GenericRelation for sessions
    sessions = GenericRelation('UserSession', related_query_name='customer_user')
    reset_tokens = GenericRelation('PasswordResetToken', related_query_name='customer_user')
    
    class Meta:
        verbose_name = "Customer User"
        verbose_name_plural = "Customer Users"
        ordering = ['-created_at']
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

class UserSession(models.Model):
    """
    Generic session model for all user types
    """
    # Generic foreign key to any user model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    user = GenericForeignKey('content_type', 'object_id')
    
    session_token = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "User Session"
        verbose_name_plural = "User Sessions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session_token']),
            models.Index(fields=['content_type', 'object_id', 'is_active']),
        ]
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def invalidate(self):
        self.is_active = False
        self.save()
    
    def __str__(self):
        return f"{self.user.email} - {self.created_at} ({'Active' if self.is_active else 'Inactive'})"

class PasswordResetToken(models.Model):
    """
    Generic password reset tokens for all user types
    """
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    user = GenericForeignKey('content_type', 'object_id')
    
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Password Reset Token"
        verbose_name_plural = "Password Reset Tokens"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['content_type', 'object_id', 'is_used']),
        ]
    
    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and timezone.now() < self.expires_at
    
    def mark_as_used(self):
        self.is_used = True
        self.save()
    
    def __str__(self):
        return f"Reset token for {self.user.email}"

# Update AuditLog to be generic (optional)
class AuditLog(models.Model):
    """
    Audit trail for user actions
    """
    ACTION_CHOICES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('create', 'Create Record'),
        ('update', 'Update Record'),
        ('delete', 'Delete Record'),
        ('password_change', 'Password Change'),
        ('permission_change', 'Permission Change'),
    ]
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    user = GenericForeignKey('content_type', 'object_id')
    
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100, blank=True)
    object_id_ref = models.CharField(max_length=100, blank=True)  # Renamed to avoid conflict
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id', 'action']),
            models.Index(fields=['created_at']),
        ]
    
    @classmethod
    def log_action(cls, user, action, model_name='', object_id='', details=None, request=None):
        """Helper method to create audit log entries"""
        content_type = ContentType.objects.get_for_model(user) if user else None
        
        log = cls(
            content_type=content_type,
            object_id=user.id if user else None,
            action=action,
            model_name=model_name,
            object_id_ref=str(object_id) if object_id else '',
            details=details or {}
        )
        
        if request:
            log.ip_address = cls.get_client_ip(request)
            log.user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        log.save()
        return log
    
    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def __str__(self):
        return f"{self.user.email if self.user else 'System'} - {self.action} at {self.created_at}"


class BaseVendorUser(BaseUser):
    """Abstract base model for vendor users"""
    ROLE_CHOICES = [
        ('vendor', 'Vendor'),
    ]

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=14)
    
    # Business Information
    business_name = models.CharField(max_length=100, blank=True)
    business_country = models.CharField(max_length=50, blank=True)
    business_state = models.CharField(max_length=50, blank=True)
    business_street = models.CharField(max_length=50, blank=True)
    business_category = models.CharField(max_length=50, blank=True)
    
    # Business Documents
    cac_reg_no = models.CharField(max_length=20, blank=True)
    nin = models.CharField(max_length=11, blank=True)
    photo = models.ImageField(upload_to='vendor-photos/', blank=True, null=True)

    # Authorization
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='vendor')
    
    # Vendor-specific fields
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('changes_requested', 'Changes Requested'),
    ]
    is_approved = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_vendors')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        abstract = True
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

# class TempVendorUser(BaseVendorUser):
#     """Temporary vendor during registration/approval process"""
#     STATUS_CHOICES = [
#         ('pending', 'Pending Approval'),
#         ('verified', 'Email Verified'),
#         ('rejected', 'Rejected'),
#     ]
    
#     photo = models.ImageField(upload_to='vendor-photos/', blank=True, null=True)
#     policy_accepted = models.BooleanField(default=False)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
#     class Meta:
#         verbose_name = "Temporary Vendor"
#         verbose_name_plural = "Temporary Vendors"
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return f"{self.get_full_name()} - {self.status}"


# class VendorUser(BaseVendorUser):
#     """Approved vendor user"""
#     STATUS_CHOICES = [
#         ('active', 'Active'),
#         ('suspended', 'Suspended'),
#         ('inactive', 'Inactive'),
#     ]
    
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
#     photo = models.CharField(max_length=200, blank=True)  # Store path to uploaded photo
    
#     class Meta:
#         verbose_name = "Vendor"
#         verbose_name_plural = "Vendors"
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return f"{self.get_full_name()} - {self.business_name}"


class VendorUser(BaseVendorUser):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('inactive', 'Inactive'),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    approved_by = models.ForeignKey(
        AdminUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_vendors'  # Keep this
    )


class BaseCourierUser(BaseUser):
    """Abstract base model for courier users"""
    ROLE_CHOICES = [
        ('courier', 'Courier'),
    ]

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=14)
    
    # Business Information
    business_country = models.CharField(max_length=50, blank=True)
    business_state = models.CharField(max_length=50, blank=True)
    business_street = models.CharField(max_length=50, blank=True)
    
    # Business Documents
    cac_reg_no = models.CharField(max_length=20, blank=True)
    nin = models.CharField(max_length=11, blank=True)
    photo = models.ImageField(upload_to='courier-photos/', blank=True, null=True)

    # Authorization
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='courier')
    
    # Courier-specific fields
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('changes_requested', 'Changes Requested'),
    ]
    is_approved = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_couriers')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Vehicle/Service Details
    vehicle_type = models.CharField(max_length=50, blank=True)
    vehicle_registration = models.CharField(max_length=20, blank=True)
    service_area = models.CharField(max_length=100, blank=True)
    
    class Meta:
        abstract = True
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

# class TempCourierUser(BaseCourierUser):
#     """Temporary courier during registration/approval process"""
#     STATUS_CHOICES = [
#         ('pending', 'Pending Approval'),
#         ('verified', 'Email Verified'),
#         ('rejected', 'Rejected'),
#     ]
    
#     photo = models.ImageField(upload_to='courier-photos/', blank=True, null=True)
#     policy_accepted = models.BooleanField(default=False)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
#     class Meta:
#         verbose_name = "Temporary Courier"
#         verbose_name_plural = "Temporary Couriers"
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return f"{self.get_full_name()} - {self.status}"


# class CourierUser(BaseCourierUser):
#     """Approved courier user"""
#     STATUS_CHOICES = [
#         ('active', 'Active'),
#         ('on_delivery', 'On Delivery'),
#         ('offline', 'Offline'),
#         ('suspended', 'Suspended'),
#         ('inactive', 'Inactive'),
#     ]
    
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
#     photo = models.CharField(max_length=200, blank=True)  # Store path to uploaded photo
    
#     # Delivery metrics
#     total_deliveries = models.IntegerField(default=0)
#     successful_deliveries = models.IntegerField(default=0)
#     rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    
#     # Location tracking
#     current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
#     current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
#     last_location_update = models.DateTimeField(null=True, blank=True)
    
#     class Meta:
#         verbose_name = "Courier"
#         verbose_name_plural = "Couriers"
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return f"{self.get_full_name()} - {self.status}"
    
#     def update_location(self, latitude, longitude):
#         """Update courier's current location"""
#         self.current_latitude = latitude
#         self.current_longitude = longitude
#         self.last_location_update = timezone.now()
#         self.save()
    
#     def update_delivery_stats(self, success=True):
#         """Update delivery statistics"""
#         self.total_deliveries += 1
#         if success:
#             self.successful_deliveries += 1
#         self.save()


class CourierUser(BaseCourierUser):

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('on_delivery', 'On Delivery'),
        ('offline', 'Offline'),
        ('suspended', 'Suspended'),
        ('inactive', 'Inactive'),
    ]
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')

    # Delivery metrics used by profile serializers and dashboards
    total_deliveries = models.IntegerField(default=0)
    successful_deliveries = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)

    # Location tracking for dispatch allocation and live updates
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_location_update = models.DateTimeField(null=True, blank=True)

    approved_by = models.ForeignKey(
        AdminUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_couriers'  # Keep this
    )

    def update_location(self, latitude, longitude):
        self.current_latitude = latitude
        self.current_longitude = longitude
        from django.utils import timezone
        self.last_location_update = timezone.now()
        self.save(update_fields=['current_latitude', 'current_longitude', 'last_location_update'])

    def update_delivery_stats(self, success=True):
        self.total_deliveries += 1
        if success:
            self.successful_deliveries += 1
        self.save(update_fields=['total_deliveries', 'successful_deliveries'])



# from django.db import models
# from django.contrib.auth.hashers import make_password, check_password


# class AdminUser(models.Model):
#     """
#     Admin/Staff user model for system administration
#     Replaces the old Staff model with enhanced features
#     """
#     ROLE_CHOICES = [
#         ('super_admin', 'Super Administrator'),
#         ('admin', 'Administrator'),
#         ('staff', 'Staff Member'),
#         ('operator', 'System Operator'),
#     ]
    
#     # Personal Information
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     phone = models.CharField(max_length=14, blank=True, null=True)
#     email = models.EmailField(unique=True, max_length=80)
    
#     # Authentication & Authorization
#     password = models.CharField(max_length=200)  # Hashed password
#     role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
#     is_active = models.BooleanField(default=True)
#     is_email_verified = models.BooleanField(default=False)
    
#     # Profile
#     photo = models.ImageField(upload_to='staff-photo/', blank=True, null=True)
    
#     # Timestamps
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     last_login = models.DateTimeField(null=True, blank=True)
    
#     class Meta:
#         verbose_name = "Admin User"
#         verbose_name_plural = "Admin Users"
#         ordering = ['-created_at']
    
#     def set_password(self, raw_password):
#         """Hash and set the password"""
#         self.password = make_password(raw_password)
    
#     def check_password(self, raw_password):
#         """Verify the password"""
#         return check_password(raw_password, self.password)
    
#     @classmethod
#     def create_super_admin(cls, email, password, first_name="Super", last_name="Admin", phone=None):
#         """Create initial super admin (run once via management command)"""
#         admin = cls(
#             email=email,
#             role='super_admin',
#             first_name=first_name,
#             last_name=last_name,
#             phone=phone,
#             is_active=True,
#             is_email_verified=True  # Super admin doesn't need email verification
#         )
#         admin.set_password(password)
#         admin.save()
#         return admin
    
#     def get_full_name(self):
#         """Return the full name of the admin"""
#         return f"{self.first_name} {self.last_name}"
    
#     def has_perm(self, perm):
#         """Check if user has specific permission based on role"""
#         role_permissions = {
#             'super_admin': ['manage_all', 'create_admin', 'manage_users', 'view_reports'],
#             'admin': ['manage_users', 'view_reports'],
#             'staff': ['view_reports'],
#             'operator': ['basic_operations'],
#         }
#         return perm in role_permissions.get(self.role, [])
    
#     def is_super_admin(self):
#         """Check if user is super admin"""
#         return self.role == 'super_admin'
    
#     def is_admin(self):
#         """Check if user is admin or super admin"""
#         return self.role in ['super_admin', 'admin']
    
#     def deactivate(self):
#         """Deactivate user account"""
#         self.is_active = False
#         self.save()
    
#     def activate(self):
#         """Activate user account"""
#         self.is_active = True
#         self.save()
    
#     def __str__(self):
#         return f"{self.get_full_name()} ({self.email}) - {self.role}"


# class AdminSession(models.Model):
#     """
#     Track admin sessions for security and audit purposes
#     """
#     admin = models.ForeignKey(AdminUser, on_delete=models.CASCADE, related_name='sessions')
#     session_token = models.CharField(max_length=255, unique=True)
#     ip_address = models.GenericIPAddressField(null=True, blank=True)
#     user_agent = models.TextField(blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     expires_at = models.DateTimeField()
#     is_active = models.BooleanField(default=True)
    
#     class Meta:
#         verbose_name = "Admin Session"
#         verbose_name_plural = "Admin Sessions"
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['session_token']),
#             models.Index(fields=['admin', 'is_active']),
#         ]
    
#     def is_expired(self):
#         """Check if session has expired"""
#         from django.utils import timezone
#         return timezone.now() > self.expires_at
    
#     def invalidate(self):
#         """Invalidate the session"""
#         self.is_active = False
#         self.save()
    
#     def __str__(self):
#         return f"{self.admin.email} - {self.created_at} ({'Active' if self.is_active else 'Inactive'})"


# class PasswordResetToken(models.Model):
#     """
#     Store password reset tokens for admin users
#     """
#     admin = models.ForeignKey(AdminUser, on_delete=models.CASCADE, related_name='reset_tokens')
#     token = models.CharField(max_length=100, unique=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     expires_at = models.DateTimeField()
#     is_used = models.BooleanField(default=False)
    
#     class Meta:
#         verbose_name = "Password Reset Token"
#         verbose_name_plural = "Password Reset Tokens"
#         ordering = ['-created_at']
    
#     def is_valid(self):
#         """Check if token is valid (not used and not expired)"""
#         from django.utils import timezone
#         return not self.is_used and timezone.now() < self.expires_at
    
#     def mark_as_used(self):
#         """Mark token as used"""
#         self.is_used = True
#         self.save()
    
#     def __str__(self):
#         return f"Reset token for {self.admin.email}"


# class AuditLog(models.Model):
#     """
#     Audit trail for admin actions
#     """
#     ACTION_CHOICES = [
#         ('login', 'User Login'),
#         ('logout', 'User Logout'),
#         ('create', 'Create Record'),
#         ('update', 'Update Record'),
#         ('delete', 'Delete Record'),
#         ('password_change', 'Password Change'),
#         ('permission_change', 'Permission Change'),
#     ]
    
#     admin = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
#     action = models.CharField(max_length=50, choices=ACTION_CHOICES)
#     model_name = models.CharField(max_length=100, blank=True)  # Which model was affected
#     object_id = models.CharField(max_length=100, blank=True)   # ID of affected object
#     details = models.JSONField(default=dict, blank=True)       # Additional details
#     ip_address = models.GenericIPAddressField(null=True, blank=True)
#     user_agent = models.TextField(blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         verbose_name = "Audit Log"
#         verbose_name_plural = "Audit Logs"
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['admin', 'action']),
#             models.Index(fields=['created_at']),
#         ]
    
#     @classmethod
#     def log_action(cls, admin, action, model_name='', object_id='', details=None, request=None):
#         """Helper method to create audit log entries"""
#         log = cls(
#             admin=admin,
#             action=action,
#             model_name=model_name,
#             object_id=str(object_id) if object_id else '',
#             details=details or {}
#         )
        
#         if request:
#             log.ip_address = cls.get_client_ip(request)
#             log.user_agent = request.META.get('HTTP_USER_AGENT', '')
        
#         log.save()
#         return log
    
#     @staticmethod
#     def get_client_ip(request):
#         """Extract client IP from request"""
#         x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#         if x_forwarded_for:
#             ip = x_forwarded_for.split(',')[0]
#         else:
#             ip = request.META.get('REMOTE_ADDR')
#         return ip
    
#     def __str__(self):
#         return f"{self.admin.email if self.admin else 'System'} - {self.action} at {self.created_at}"

# class CustomerUser(models.Model):
#     """Customer user model extending the authentication system"""
#     ROLE_CHOICES = [
#         ('customer', 'Customer'),
#         ('premium_customer', 'Premium Customer'),
#         ('anonymous', 'Anonymous Customer'),
#     ]
    
#     # Personal Information
#     first_name = models.CharField(max_length=50)
#     last_name = models.CharField(max_length=50)
#     phone = models.CharField(max_length=14, blank=True, null=True)
#     email = models.EmailField(unique=True, max_length=80)
    
#     # Location
#     country = models.CharField(max_length=50, blank=True)
#     state = models.CharField(max_length=50, blank=True)
#     street = models.CharField(max_length=50, blank=True)
    
#     # Authentication & Authorization
#     password = models.CharField(max_length=200)
#     role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
#     is_active = models.BooleanField(default=True)
#     is_email_verified = models.BooleanField(default=False)
    
#     # Timestamps
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     last_login = models.DateTimeField(null=True, blank=True)
    
#     class Meta:
#         verbose_name = "Customer User"
#         verbose_name_plural = "Customer Users"
#         ordering = ['-created_at']
    
#     def set_password(self, raw_password):
#         self.password = make_password(raw_password)
    
#     def check_password(self, raw_password):
#         return check_password(raw_password, self.password)
    
#     def get_full_name(self):
#         return f"{self.first_name} {self.last_name}"
    
#     def __str__(self):
#         return f"{self.get_full_name()} ({self.email})"