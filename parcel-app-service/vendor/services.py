# vendor/services.py
from datetime import timedelta
import secrets
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType
from email_service.services import EmailService
from authentication.models import TempVendorUser, VendorUser, UserSession, AuditLog
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
        if TempVendorUser.objects.filter(email=email).exists() or \
           VendorUser.objects.filter(email=email).exists():
            raise ValidationError("Vendor with this email already exists")
        
        # Create temporary vendor
        vendor = serializer.save()
        
        # Send activation email
        EmailService.send_activation_email(vendor, request, template='parcel_backends/activate_email_vend.html')
        
        # Log registration
        if request:
            AuditLog.log_action(
                user=vendor,
                action='create',
                model_name='TempVendorUser',
                object_id=vendor.id,
                details={'type': 'temp_vendor_registration'},
                request=request
            )
        
        return vendor
    
    @staticmethod
    def approve_vendor(temp_vendor_id, admin_user, request=None):
        """Approve a temporary vendor"""
        try:
            temp_vendor = TempVendorUser.objects.get(id=temp_vendor_id, is_active=True)
        except TempVendorUser.DoesNotExist:
            raise ValidationError("Temporary vendor not found")
        
        if not temp_vendor.is_email_verified:
            raise ValidationError("Vendor email not verified")
        
        # Check if already approved
        if VendorUser.objects.filter(email=temp_vendor.email).exists():
            raise ValidationError("Vendor already approved")
        
        # Create approved vendor
        vendor = VendorUser.objects.create(
            email=temp_vendor.email,
            first_name=temp_vendor.first_name,
            last_name=temp_vendor.last_name,
            phone=temp_vendor.phone,
            business_country=temp_vendor.business_country,
            business_state=temp_vendor.business_state,
            business_street=temp_vendor.business_street,
            business_category=temp_vendor.business_category,
            cac_reg_no=temp_vendor.cac_reg_no,
            nin=temp_vendor.nin,
            photo=temp_vendor.photo,
            password=temp_vendor.password,  # Copy hashed password
            is_approved=True,
            status='active',
            approved_by=admin_user,
            approved_at=timezone.now(),
            role='vendor',
            is_email_verified=True,
            is_active=True
        )
        
        # Deactivate temp vendor
        temp_vendor.is_active = False
        temp_vendor.status = 'approved'
        temp_vendor.save()
        
        # Log approval
        AuditLog.log_action(
            user=admin_user,
            action='update',
            model_name='VendorUser',
            object_id=vendor.id,
            details={
                'action': 'vendor_approval',
                'temp_vendor_id': temp_vendor_id,
                'approved_by': admin_user.email
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
            
            if not vendor.is_approved:
                return None, "Vendor account not approved"
            
            return vendor, None
            
        except VendorUser.DoesNotExist:
            # Try temp vendors
            try:
                temp_vendor = TempVendorUser.objects.get(email=email, is_active=True)
                if not temp_vendor.check_password(password):
                    return None, "Invalid credentials"
                
                if not temp_vendor.is_email_verified:
                    return None, "Email not verified"
                
                return None, "Account pending approval"
                
            except TempVendorUser.DoesNotExist:
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
            try:
                return TempVendorUser.objects.get(email=email, is_active=True)
            except TempVendorUser.DoesNotExist:
                return None