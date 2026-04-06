# vendor/services.py
from datetime import timedelta
import secrets
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType
from email_service.services import EmailService
from authentication.models import VendorUser, UserSession, AuditLog
from authentication.services import CustomerService

class VendorService:
    """Service layer for vendor-related business logic"""
    
    @staticmethod
    def register_temp_vendor(vendor_data, request=None):
        """Register a new temporary vendor"""
        from .serializers import TempVendorRegistrationSerializer
        
        serializer = TempVendorRegistrationSerializer(data=vendor_data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)
        
        # Check for existing vendor
        email = vendor_data.get('email', '').lower()
        if VendorUser.objects.filter(email=email).exists():
            raise ValidationError("Vendor with this email already exists")
        
        # Create temporary vendor
        vendor = serializer.save()
        
        # Send activation email
        EmailService.send_activation_email(
            vendor,
            request,
            template_name='emails/email_verification.html',
            email_type='vendor',
        )
        
        # Log registration
        if request:
            AuditLog.log_action(
                user=vendor,
                action='create',
                model_name='VendorUser',
                object_id=vendor.id,
                details={'type': 'vendor_registration_pending_approval'},
                request=request
            )
        
        return vendor
    
    @staticmethod
    def approve_vendor(temp_vendor_id, admin_user, request=None):
        """Backward-compatible approve wrapper."""
        return VendorService.moderate_vendor(
            temp_vendor_id=temp_vendor_id,
            action='approve',
            admin_user=admin_user,
            comments='',
            request=request,
        )

    @staticmethod
    def moderate_vendor(temp_vendor_id, action, admin_user, comments='', request=None):
        """Moderate vendor account using supported admin actions."""
        try:
            vendor = VendorUser.objects.get(id=temp_vendor_id, is_active=True)
        except VendorUser.DoesNotExist:
            raise ValidationError("Vendor not found")

        if action in ['approve', 'request_changes'] and not vendor.is_email_verified:
            raise ValidationError("Vendor email not verified")

        review_time = timezone.now()

        if action == 'approve':
            vendor.is_approved = True
            vendor.approval_status = 'approved'
            vendor.rejection_reason = ''
            vendor.status = 'active'
            vendor.approved_by = admin_user
            vendor.approved_at = review_time
        elif action == 'reject':
            vendor.is_approved = False
            vendor.approval_status = 'rejected'
            vendor.rejection_reason = comments
            vendor.status = 'inactive'
            vendor.approved_by = admin_user
        elif action == 'request_changes':
            vendor.is_approved = False
            vendor.approval_status = 'changes_requested'
            vendor.rejection_reason = comments
            vendor.status = 'inactive'
            vendor.approved_by = admin_user
        elif action == 'suspend':
            vendor.status = 'suspended'
            vendor.approved_by = admin_user
        elif action == 'reactivate':
            vendor.status = 'active'
            vendor.is_approved = True
            if vendor.approval_status in ['rejected', 'changes_requested', 'pending']:
                vendor.approval_status = 'approved'
            vendor.rejection_reason = ''
            vendor.approved_by = admin_user
            if not vendor.approved_at:
                vendor.approved_at = review_time
        else:
            raise ValidationError("Unsupported moderation action")

        vendor.reviewed_at = review_time
        vendor.save()

        AuditLog.log_action(
            user=admin_user,
            action='update',
            model_name='VendorUser',
            object_id=vendor.id,
            details={
                'action': f'vendor_{action}',
                'vendor_id': vendor.id,
                'approved_by': admin_user.email,
                'comments': comments,
            },
            request=request
        )

        return vendor
    
    @staticmethod
    def authenticate_vendor(email, password):
        """Authenticate vendor credentials"""
        email = email.lower()
        
        # Try approved vendors first
        try:
            vendor = VendorUser.objects.get(email=email, is_active=True)
            if not vendor.check_password(password):
                return None, "Invalid credentials"

            if not vendor.is_email_verified:
                return None, "Email not verified"
            
            if not vendor.is_approved:
                return None, "Vendor account not approved"
            
            return vendor, None
            
        except VendorUser.DoesNotExist:
            return None, "Invalid credentials"
    
    @staticmethod
    def create_vendor_session(vendor, request):
        """Create a session for authenticated vendor"""
        session_token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=8)
        
        content_type = ContentType.objects.get_for_model(vendor)
        
        session = UserSession.objects.create(
            content_type=content_type,
            object_id=vendor.id,
            session_token=session_token,
            ip_address=CustomerService.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            expires_at=expires_at
        )
        
        # Update last login
        vendor.last_login = timezone.now()
        vendor.save()
        
        return session
    
    @staticmethod
    def get_vendor_by_email(email):
        """Get vendor by email"""
        email = email.lower()
        try:
            return VendorUser.objects.get(email=email, is_active=True)
        except VendorUser.DoesNotExist:
            return None