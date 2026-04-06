# courier/services.py
from datetime import timedelta
import secrets
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType
from email_service.services import EmailService
from authentication.models import CourierUser, UserSession, AuditLog
from authentication.services import CustomerService

class CourierService:
    """Service layer for courier-related business logic"""
    
    @staticmethod
    def register_temp_courier(courier_data, request=None):
        """Register a new temporary courier"""
        from .serializers import TempCourierRegistrationSerializer
        
        serializer = TempCourierRegistrationSerializer(data=courier_data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)
        
        # Check for existing courier
        email = courier_data.get('email', '').lower()
        if CourierUser.objects.filter(email=email).exists():
            raise ValidationError("Courier with this email already exists")
        
        # Create temporary courier
        courier = serializer.save()
        
        # Send activation email
        EmailService.send_activation_email(
            courier,
            request,
            template_name='emails/email_verification.html',
            email_type='courier',
        )
        
        # Log registration
        if request:
            AuditLog.log_action(
                user=courier,
                action='create',
                model_name='CourierUser',
                object_id=courier.id,
                details={'type': 'courier_registration_pending_approval'},
                request=request
            )
        
        return courier
    
    @staticmethod
    def approve_courier(temp_courier_id, admin_user, request=None):
        """Backward-compatible approve wrapper."""
        return CourierService.moderate_courier(
            temp_courier_id=temp_courier_id,
            action='approve',
            admin_user=admin_user,
            comments='',
            request=request,
        )

    @staticmethod
    def moderate_courier(temp_courier_id, action, admin_user, comments='', request=None):
        """Moderate courier account using supported admin actions."""
        try:
            courier = CourierUser.objects.get(id=temp_courier_id, is_active=True)
        except CourierUser.DoesNotExist:
            raise ValidationError("Courier not found")

        if action in ['approve', 'request_changes'] and not courier.is_email_verified:
            raise ValidationError("Courier email not verified")

        review_time = timezone.now()

        if action == 'approve':
            courier.is_approved = True
            courier.approval_status = 'approved'
            courier.rejection_reason = ''
            courier.status = 'active'
            courier.approved_by = admin_user
            courier.approved_at = review_time
        elif action == 'reject':
            courier.is_approved = False
            courier.approval_status = 'rejected'
            courier.rejection_reason = comments
            courier.status = 'inactive'
            courier.approved_by = admin_user
        elif action == 'request_changes':
            courier.is_approved = False
            courier.approval_status = 'changes_requested'
            courier.rejection_reason = comments
            courier.status = 'inactive'
            courier.approved_by = admin_user
        elif action == 'suspend':
            courier.status = 'suspended'
            courier.approved_by = admin_user
        elif action == 'reactivate':
            courier.status = 'active'
            courier.is_approved = True
            if courier.approval_status in ['rejected', 'changes_requested', 'pending']:
                courier.approval_status = 'approved'
            courier.rejection_reason = ''
            courier.approved_by = admin_user
            if not courier.approved_at:
                courier.approved_at = review_time
        else:
            raise ValidationError("Unsupported moderation action")

        courier.reviewed_at = review_time
        courier.save()

        AuditLog.log_action(
            user=admin_user,
            action='update',
            model_name='CourierUser',
            object_id=courier.id,
            details={
                'action': f'courier_{action}',
                'courier_id': courier.id,
                'approved_by': admin_user.email,
                'comments': comments,
            },
            request=request
        )
        
        return courier
    
    @staticmethod
    def authenticate_courier(email, password):
        """Authenticate courier credentials"""
        email = email.lower()
        
        # Try approved couriers first
        try:
            courier = CourierUser.objects.get(email=email, is_active=True)
            if not courier.check_password(password):
                return None, "Invalid credentials"

            if not courier.is_email_verified:
                return None, "Email not verified"
            
            if not courier.is_approved:
                return None, "Courier account not approved"
            
            return courier, None
            
        except CourierUser.DoesNotExist:
            return None, "Invalid credentials"
    
    @staticmethod
    def create_courier_session(courier, request):
        """Create a session for authenticated courier"""
        session_token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=8)
        
        content_type = ContentType.objects.get_for_model(courier)
        
        session = UserSession.objects.create(
            content_type=content_type,
            object_id=courier.id,
            session_token=session_token,
            ip_address=CustomerService.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            expires_at=expires_at
        )
        
        # Update last login
        courier.last_login = timezone.now()
        courier.save()
        
        return session
    
    @staticmethod
    def update_courier_location(courier, latitude, longitude):
        """Update courier's current location"""
        courier.update_location(latitude, longitude)
        
        # Log location update
        AuditLog.log_action(
            user=courier,
            action='update',
            model_name='CourierUser',
            object_id=courier.id,
            details={
                'action': 'location_update',
                'latitude': float(latitude),
                'longitude': float(longitude)
            }
        )
    
    @staticmethod
    def update_courier_status(courier, status):
        """Update courier's status"""
        old_status = courier.status
        courier.status = status
        courier.save()
        
        # Log status change
        AuditLog.log_action(
            user=courier,
            action='update',
            model_name='CourierUser',
            object_id=courier.id,
            details={
                'action': 'status_change',
                'old_status': old_status,
                'new_status': status
            }
        )
    
    @staticmethod
    def get_available_couriers(latitude=None, longitude=None, radius_km=10):
        """Get available couriers near a location"""
        from django.db.models import Q
        
        # Base queryset for available couriers
        couriers = CourierUser.objects.filter(
            is_active=True,
            is_approved=True,
            status__in=['active', 'offline']  # Available statuses
        )
        
        # If coordinates provided, filter by distance (simplified)
        if latitude and longitude:
            # This is a simplified filter - in production, use geospatial queries
            couriers = couriers.filter(
                current_latitude__isnull=False,
                current_longitude__isnull=False
            )
        
        return couriers
    
    @staticmethod
    def get_courier_by_email(email):
        """Get courier by email"""
        email = email.lower()
        try:
            return CourierUser.objects.get(email=email, is_active=True)
        except CourierUser.DoesNotExist:
            return None