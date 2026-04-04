# courier/services.py
from datetime import timedelta
import secrets
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType
from email_service.services import EmailService
from authentication.models import TempCourierUser, CourierUser, UserSession, AuditLog
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
        if TempCourierUser.objects.filter(email=email).exists() or \
           CourierUser.objects.filter(email=email).exists():
            raise ValidationError("Courier with this email already exists")
        
        # Create temporary courier
        courier = serializer.save()
        
        # Send activation email
        EmailService.send_activation_email(courier, request, template='parcel_backends/activate_email_cour.html')
        
        # Log registration
        if request:
            AuditLog.log_action(
                user=courier,
                action='create',
                model_name='TempCourierUser',
                object_id=courier.id,
                details={'type': 'temp_courier_registration'},
                request=request
            )
        
        return courier
    
    @staticmethod
    def approve_courier(temp_courier_id, admin_user, request=None):
        """Approve a temporary courier"""
        try:
            temp_courier = TempCourierUser.objects.get(id=temp_courier_id, is_active=True)
        except TempCourierUser.DoesNotExist:
            raise ValidationError("Temporary courier not found")
        
        if not temp_courier.is_email_verified:
            raise ValidationError("Courier email not verified")
        
        # Check if already approved
        if CourierUser.objects.filter(email=temp_courier.email).exists():
            raise ValidationError("Courier already approved")
        
        # Create approved courier
        review_time = timezone.now()
        courier = CourierUser.objects.create(
            email=temp_courier.email,
            first_name=temp_courier.first_name,
            last_name=temp_courier.last_name,
            phone=temp_courier.phone,
            business_country=temp_courier.business_country,
            business_state=temp_courier.business_state,
            business_street=temp_courier.business_street,
            cac_reg_no=temp_courier.cac_reg_no,
            nin=temp_courier.nin,
            photo=temp_courier.photo,
            vehicle_type=temp_courier.vehicle_type,
            vehicle_registration=temp_courier.vehicle_registration,
            service_area=temp_courier.service_area,
            password=temp_courier.password,  # Copy hashed password
            is_approved=True,
            approval_status='approved',
            submitted_at=temp_courier.submitted_at,
            reviewed_at=review_time,
            status='active',
            approved_by=admin_user,
            approved_at=review_time,
            role='courier',
            is_email_verified=True,
            is_active=True
        )
        
        # Deactivate temp courier
        temp_courier.is_active = False
        temp_courier.status = 'approved'
        temp_courier.approval_status = 'approved'
        temp_courier.reviewed_at = review_time
        temp_courier.approved_by = admin_user
        temp_courier.approved_at = review_time
        temp_courier.save()
        
        # Log approval
        AuditLog.log_action(
            user=admin_user,
            action='update',
            model_name='CourierUser',
            object_id=courier.id,
            details={
                'action': 'courier_approval',
                'temp_courier_id': temp_courier_id,
                'approved_by': admin_user.email
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
            
            if not courier.is_approved:
                return None, "Courier account not approved"
            
            return courier, None
            
        except CourierUser.DoesNotExist:
            # Try temp couriers
            try:
                temp_courier = TempCourierUser.objects.get(email=email, is_active=True)
                if not temp_courier.check_password(password):
                    return None, "Invalid credentials"
                
                if not temp_courier.is_email_verified:
                    return None, "Email not verified"
                
                return None, "Account pending approval"
                
            except TempCourierUser.DoesNotExist:
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
            try:
                return TempCourierUser.objects.get(email=email, is_active=True)
            except TempCourierUser.DoesNotExist:
                return None