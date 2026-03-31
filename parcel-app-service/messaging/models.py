from django.db import models
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from authentication.models import AdminUser, CustomerUser, VendorUser, CourierUser
from django.conf import settings

class MessageTemplate(models.Model):
    """Reusable email templates"""
    TEMPLATE_TYPE_CHOICES = [
        ('order_confirmation', 'Order Confirmation'),
        ('order_shipped', 'Order Shipped'),
        ('order_delivered', 'Order Delivered'),
        ('payment_received', 'Payment Received'),
        ('account_verification', 'Account Verification'),
        ('password_reset', 'Password Reset'),
        ('promotional', 'Promotional'),
        ('notification', 'System Notification'),
        ('custom', 'Custom'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    template_type = models.CharField(max_length=30, choices=TEMPLATE_TYPE_CHOICES, default='custom')
    subject = models.CharField(max_length=200)
    body_html = models.TextField()
    body_text = models.TextField(blank=True)  # Plain text fallback
    variables = models.JSONField(default=list, blank=True)  # Template variables like {customer_name}, {order_number}
    
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Message Template"
        verbose_name_plural = "Message Templates"
        ordering = ['name']
        indexes = [
            models.Index(fields=['template_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"
    
    def get_variable_list(self):
        """Extract template variables from body"""
        import re
        variables = set(re.findall(r'\{(\w+)\}', self.body_html))
        return list(variables)

class EmailMessage(models.Model):
    """Enhanced email message model with tracking"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('queued', 'Queued for Sending'),
        ('sending', 'Sending'),
        ('sent', 'Sent Successfully'),
        ('failed', 'Failed to Send'),
        ('bounced', 'Bounced'),
        ('opened', 'Opened by Recipient'),
        ('clicked', 'Link Clicked'),
        ('unsubscribed', 'Unsubscribed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    # Sender information
    sender = models.ForeignKey(AdminUser, on_delete=models.PROTECT, related_name='sent_messages')
    sender_email = models.EmailField()
    sender_name = models.CharField(max_length=100, blank=True)
    
    # Recipients
    recipients = models.JSONField(default=list)  # List of dicts: [{'email': '', 'name': '', 'type': 'to/cc/bcc'}]
    recipient_groups = models.JSONField(default=list, blank=True)  # ['all_customers', 'active_vendors', etc.]
    
    # Message content
    subject = models.CharField(max_length=200)
    body_html = models.TextField()
    body_text = models.TextField(blank=True)
    
    # Template reference
    template = models.ForeignKey(MessageTemplate, on_delete=models.SET_NULL, 
                                null=True, blank=True, related_name='instances')
    template_variables = models.JSONField(default=dict, blank=True)  # Variables used in template
    
    # Message metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    message_id = models.CharField(max_length=100, unique=True, blank=True)  # Email message ID
    
    # Tracking
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    open_count = models.IntegerField(default=0)
    click_count = models.IntegerField(default=0)
    
    # Provider information
    provider = models.CharField(max_length=50, blank=True)  # 'sendgrid', 'mailgun', 'ses', etc.
    provider_message_id = models.CharField(max_length=100, blank=True)
    provider_response = models.JSONField(default=dict, blank=True)
    
    # Attachments (stored separately in storage)
    attachments = models.JSONField(default=list, blank=True)  # List of attachment metadata
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)  # For scheduled emails
    
    class Meta:
        verbose_name = "Email Message"
        verbose_name_plural = "Email Messages"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'scheduled_for']),
            models.Index(fields=['sender', 'created_at']),
            models.Index(fields=['sent_at']),
        ]
    
    def __str__(self):
        return f"Email: {self.subject} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        if not self.message_id:
            import uuid
            self.message_id = f"msg_{uuid.uuid4().hex[:16]}"
        
        if not self.sender_name and self.sender:
            self.sender_name = self.sender.get_full_name()
        
        super().save(*args, **kwargs)
    
    def get_recipient_emails(self, recipient_type='to'):
        """Get emails by recipient type (to/cc/bcc)"""
        return [r['email'] for r in self.recipients if r.get('type', 'to') == recipient_type]
    
    def mark_as_sent(self, provider_message_id='', provider_response=None):
        """Mark message as sent"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.provider_message_id = provider_message_id
        if provider_response:
            self.provider_response = provider_response
        self.save()
    
    def record_open(self):
        """Record email open"""
        if not self.opened_at:
            self.opened_at = timezone.now()
        self.open_count += 1
        self.status = 'opened'
        self.save()
    
    def record_click(self):
        """Record link click"""
        self.click_count += 1
        self.status = 'clicked'
        self.save()

class EmailAttachment(models.Model):
    """Email attachments model"""
    email = models.ForeignKey(EmailMessage, on_delete=models.CASCADE, related_name='email_attachments')
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField()  # in bytes
    mime_type = models.CharField(max_length=100)
    storage_path = models.CharField(max_length=500)  # Path in storage (S3, local, etc.)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Email Attachment"
        verbose_name_plural = "Email Attachments"
    
    def __str__(self):
        return f"{self.file_name} ({self.email.subject})"

class Unsubscribe(models.Model):
    """Track unsubscribed recipients"""
    email = models.EmailField(unique=True)
    reason = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=50, blank=True)  # 'promotional', 'all', etc.
    unsubscribed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Unsubscribe"
        verbose_name_plural = "Unsubscribes"
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['unsubscribed_at']),
        ]
    
    def __str__(self):
        return f"Unsubscribed: {self.email}"

class EmailQueue(models.Model):
    """Queue for scheduled/bulk emails"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Content
    template = models.ForeignKey(MessageTemplate, on_delete=models.PROTECT, related_name='queues')
    template_variables = models.JSONField(default=dict, blank=True)
    
    # Recipients
    recipient_filter = models.JSONField(default=dict, blank=True)  # Filter criteria
    total_recipients = models.IntegerField(default=0)
    processed_recipients = models.IntegerField(default=0)
    
    # Scheduling
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scheduled_for = models.DateTimeField()
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Progress tracking
    success_count = models.IntegerField(default=0)
    failure_count = models.IntegerField(default=0)
    
    created_by = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True, related_name='created_queues')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Email Queue"
        verbose_name_plural = "Email Queues"
        ordering = ['-scheduled_for']
        indexes = [
            models.Index(fields=['status', 'scheduled_for']),
        ]
    
    def __str__(self):
        return f"Queue: {self.name} ({self.get_status_display()})"
    
    @property
    def progress_percentage(self):
        if self.total_recipients > 0:
            return (self.processed_recipients / self.total_recipients) * 100
        return 0

# class Notification(models.Model):
#     """In-app notifications"""
#     TYPE_CHOICES = [
#         ('info', 'Information'),
#         ('success', 'Success'),
#         ('warning', 'Warning'),
#         ('error', 'Error'),
#         ('order_update', 'Order Update'),
#         ('payment', 'Payment'),
#         ('dispatch', 'Dispatch'),
#         ('system', 'System'),
#     ]
    
#     recipient = models.ForeignKey('authentication.BaseUser', on_delete=models.CASCADE, related_name='notifications')
#     title = models.CharField(max_length=200)
#     message = models.TextField()
#     notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    
#     # Action/redirect
#     action_url = models.URLField(blank=True)
#     action_label = models.CharField(max_length=50, blank=True)
    
#     # Status
#     is_read = models.BooleanField(default=False)
#     is_archived = models.BooleanField(default=False)
    
#     # Metadata
#     related_model = models.CharField(max_length=50, blank=True)  # e.g., 'Order', 'Payment'
#     related_id = models.CharField(max_length=100, blank=True)
    
#     created_at = models.DateTimeField(auto_now_add=True)
#     read_at = models.DateTimeField(null=True, blank=True)
    
#     class Meta:
#         verbose_name = "Notification"
#         verbose_name_plural = "Notifications"
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['recipient', 'is_read', 'created_at']),
#             models.Index(fields=['created_at']),
#         ]
    
#     def __str__(self):
#         return f"Notification: {self.title} for {self.recipient.email}"
    
#     def mark_as_read(self):
#         """Mark notification as read"""
#         if not self.is_read:
#             self.is_read = True
#             self.read_at = timezone.now()
#             self.save()
    
#     def mark_as_unread(self):
#         """Mark notification as unread"""
#         self.is_read = False
#         self.read_at = None
#         self.save()




class Notification(models.Model):
    """In-app notifications"""
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('order_update', 'Order Update'),
        ('payment', 'Payment'),
        ('dispatch', 'Dispatch'),
        ('system', 'System'),
    ]
    
    USER_TYPE_CHOICES = [
        ('admin', 'Admin'),
        ('customer', 'Customer'),
        ('vendor', 'Vendor'),
        ('courier', 'Courier'),
    ]
    
    # Use Django's AUTH_USER_MODEL or separate foreign keys for each user type
    recipient_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    
    # Separate foreign keys for each user type (flexible approach)
    admin_recipient = models.ForeignKey(
        'authentication.AdminUser', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='admin_notifications'
    )
    customer_recipient = models.ForeignKey(
        'authentication.CustomerUser', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='customer_notifications'
    )
    vendor_recipient = models.ForeignKey(
        'authentication.VendorUser', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='vendor_notifications'
    )
    courier_recipient = models.ForeignKey(
        'authentication.CourierUser', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='courier_notifications'
    )
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    
    # Action/redirect
    action_url = models.URLField(blank=True)
    action_label = models.CharField(max_length=50, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    # Metadata
    related_model = models.CharField(max_length=50, blank=True)  # e.g., 'Order', 'Payment'
    related_id = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient_type', 'is_read', 'created_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        recipient = self.get_recipient()
        return f"Notification: {self.title} for {recipient.email if recipient else 'Unknown'}"
    
    def get_recipient(self):
        """Get the actual recipient based on recipient_type"""
        if self.recipient_type == 'admin' and self.admin_recipient:
            return self.admin_recipient
        elif self.recipient_type == 'customer' and self.customer_recipient:
            return self.customer_recipient
        elif self.recipient_type == 'vendor' and self.vendor_recipient:
            return self.vendor_recipient
        elif self.recipient_type == 'courier' and self.courier_recipient:
            return self.courier_recipient
        return None
    
    def set_recipient(self, user):
        """Set recipient based on user type"""
        if hasattr(user, 'adminuser'):
            self.recipient_type = 'admin'
            self.admin_recipient = user
        elif hasattr(user, 'customeruser'):
            self.recipient_type = 'customer'
            self.customer_recipient = user
        elif hasattr(user, 'vendoruser'):
            self.recipient_type = 'vendor'
            self.vendor_recipient = user
        elif hasattr(user, 'courieruser'):
            self.recipient_type = 'courier'
            self.courier_recipient = user
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    def mark_as_unread(self):
        """Mark notification as unread"""
        self.is_read = False
        self.read_at = None
        self.save()
    
    def save(self, *args, **kwargs):
        """Ensure only one recipient field is set"""
        # Count how many recipient fields are set
        recipients = [
            self.admin_recipient, 
            self.customer_recipient, 
            self.vendor_recipient, 
            self.courier_recipient
        ]
        set_count = sum(1 for r in recipients if r is not None)
        
        if set_count != 1:
            raise ValueError("Exactly one recipient must be set for a notification")
        
        super().save(*args, **kwargs)



class SMTPSettings(models.Model):
    """SMTP configuration for email sending"""
    name = models.CharField(max_length=100, unique=True)
    host = models.CharField(max_length=200)
    port = models.IntegerField(default=587)
    username = models.EmailField()
    password = models.CharField(max_length=500)  # Encrypted in production
    use_tls = models.BooleanField(default=True)
    use_ssl = models.BooleanField(default=False)
    default_from_email = models.EmailField()
    default_from_name = models.CharField(max_length=100, blank=True)
    
    # Rate limiting
    max_emails_per_hour = models.IntegerField(default=100)
    max_emails_per_day = models.IntegerField(default=1000)
    
    is_active = models.BooleanField(default=False)  # Only one active at a time
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "SMTP Settings"
        verbose_name_plural = "SMTP Settings"
        ordering = ['-is_active', 'name']
    
    def __str__(self):
        return f"SMTP: {self.name} ({'Active' if self.is_active else 'Inactive'})"
    
    def save(self, *args, **kwargs):
        # Ensure only one active SMTP configuration
        if self.is_active:
            SMTPSettings.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)