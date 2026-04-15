# authentication/services.py
from datetime import timedelta
import secrets
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType
from email_service.services import EmailService  
from .models import CustomerUser, UserSession, PasswordResetToken, AuditLog, AdminUser
from core.tokens import account_activation_token


class CustomerService:
    """Service layer for customer-related business logic"""
    
    @staticmethod
    def register_customer(customer_data, request=None):
        """Register a new customer with validation"""
        from .serializers import CustomerRegistrationSerializer
        
        serializer: CustomerRegistrationSerializer = CustomerRegistrationSerializer(data=customer_data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)
        
        # Check for existing customer
        email = customer_data.get('email', '').lower()
        if CustomerUser.objects.filter(email=email).exists():
            raise ValidationError("Customer with this email already exists")
        
        # Create customer
        customer = serializer.save()
        customer.role = 'customer'
        customer.save()  # created_at is auto_now_add=True
        
        # Send activation email using centralized template
        EmailService.send_activation_email(
            customer,
            request,
            template_name='emails/email_verification.html',
            email_type='customer',
        )
        
        # Log registration
        if request:
            AuditLog.log_action(
                user=customer,
                action='create',
                model_name='CustomerUser',
                object_id=customer.id,
                details={'email': customer.email, 'source': 'self_registration'},
                request=request
            )
        
        return customer
    
    @staticmethod
    def authenticate_customer(email, password):
        """Authenticate customer credentials"""
        email = email.lower()
        try:
            customer = CustomerUser.objects.get(email=email, is_active=True)
        except CustomerUser.DoesNotExist:
            return None, "Customer not found or inactive"
        
        if not customer.is_email_verified:
            return None, "Email not verified"
        
        if not customer.check_password(password):
            return None, "Invalid password"
        
        return customer, None
    
    @staticmethod
    def create_customer_session(customer: CustomerUser, request):
        """Create a session for authenticated customer"""
        session_token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=8)
        
        # Get content type for customer
        content_type = ContentType.objects.get_for_model(customer)
        
        session = UserSession.objects.create(
            content_type=content_type,
            object_id=customer.id,
            session_token=session_token,
            ip_address=CustomerService.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            expires_at=expires_at
        )
        
        # Update last login
        customer.last_login = timezone.now()
        customer.save()
        
        return session
    
    @staticmethod
    def get_customer_sessions(customer):
        """Get all active sessions for a customer"""
        content_type = ContentType.objects.get_for_model(customer)
        return UserSession.objects.filter(
            content_type=content_type,
            object_id=customer.id,
            is_active=True
        )
    
    @staticmethod
    def invalidate_customer_sessions(customer):
        """Invalidate all active sessions for a customer"""
        content_type = ContentType.objects.get_for_model(customer)
        UserSession.objects.filter(
            content_type=content_type,
            object_id=customer.id,
            is_active=True
        ).update(is_active=False)
    
    @staticmethod
    def initiate_password_reset(email, request=None):
        """Initiate password reset process"""
        email = email.lower()
        try:
            customer = CustomerUser.objects.get(email=email, is_active=True)
        except CustomerUser.DoesNotExist:
            return False, "Customer not found"
        
        # Generate reset token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=1)
        
        # Get content type for customer
        content_type = ContentType.objects.get_for_model(customer)
        
        PasswordResetToken.objects.create(
            content_type=content_type,
            object_id=customer.id,
            token=token,
            expires_at=expires_at
        )
        
        # Send reset email using existing EmailService. The API contract relies
        # on the persisted PasswordResetToken above; email delivery is best-effort.
        EmailService.send_password_reset_email(
            customer,
            request,
            'emails/password_reset.html',
            email_type='customer',
        )
        
        return True, "Password reset email sent"
    
    @staticmethod
    def reset_password(token, new_password, confirm_password):
        """Reset password using token"""
        if new_password != confirm_password:
            return False, "Passwords do not match"
        
        try:
            reset_token = PasswordResetToken.objects.get(
                token=token,
                is_used=False,
                expires_at__gt=timezone.now()
            )
        except PasswordResetToken.DoesNotExist:
            return False, "Invalid or expired token"
        
        # Update password
        customer = reset_token.user
        customer.set_password(new_password)
        customer.save()
        
        # Mark token as used
        reset_token.is_used = True
        reset_token.save()
        
        # Invalidate existing sessions
        CustomerService.invalidate_customer_sessions(customer)
        
        return True, "Password reset successful"
    
    @staticmethod
    def get_client_ip(request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @staticmethod
    def get_customer_profile(customer_id):
        """Get customer profile by ID"""
        try:
            return CustomerUser.objects.get(id=customer_id, is_active=True)
        except CustomerUser.DoesNotExist:
            return None
    
    @staticmethod
    def update_customer_profile(customer, profile_data):
        """Update customer profile information"""
        allowed_fields = ['first_name', 'last_name', 'phone', 'country', 'state', 'street']
        
        for field in allowed_fields:
            if field in profile_data:
                setattr(customer, field, profile_data[field])
        
        customer.save()
        
        # Log profile update
        AuditLog.log_action(
            user=customer,
            action='update',
            model_name='CustomerUser',
            object_id=customer.id,
            details={'updated_fields': list(profile_data.keys())}
        )
        
        return customer
    
    @staticmethod
    def deactivate_customer(customer_id):
        """Deactivate customer account"""
        try:
            customer = CustomerUser.objects.get(id=customer_id)
            customer.is_active = False
            customer.save()
            
            # Invalidate all active sessions
            CustomerService.invalidate_customer_sessions(customer)
            
            # Log deactivation
            AuditLog.log_action(
                user=customer,
                action='update',
                model_name='CustomerUser',
                object_id=customer.id,
                details={'action': 'account_deactivation'}
            )
            
            return True, "Customer deactivated"
        except CustomerUser.DoesNotExist:
            return False, "Customer not found"
    
    @staticmethod
    def verify_customer_email(customer_id):
        """Verify customer email"""
        try:
            customer = CustomerUser.objects.get(id=customer_id)
            customer.is_email_verified = True
            customer.save()
            
            # Log verification
            AuditLog.log_action(
                user=customer,
                action='update',
                model_name='CustomerUser',
                object_id=customer.id,
                details={'action': 'email_verification'}
            )
            
            return True, "Email verified successfully"
        except CustomerUser.DoesNotExist:
            return False, "Customer not found"
    
    @staticmethod
    def validate_session_token(session_token):
        """Validate customer session token"""
        try:
            session = UserSession.objects.get(
                session_token=session_token,
                is_active=True,
                expires_at__gt=timezone.now()
            )
            
            # Check if user is a customer (not admin)
            if session.content_type.model == 'customeruser':
                customer = CustomerUser.objects.get(id=session.object_id, is_active=True)
                return customer, None
            else:
                session.invalidate()
                return None, "Invalid session type"
                
        except (UserSession.DoesNotExist, CustomerUser.DoesNotExist):
            return None, "Invalid or expired session"


class AdminService:
    """Service layer for admin-related business logic (if needed)"""
    
    @staticmethod
    def create_admin_session(admin, request):
        """Create a session for authenticated admin"""
        session_token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=8)
        
        content_type = ContentType.objects.get_for_model(admin)
        
        session = UserSession.objects.create(
            content_type=content_type,
            object_id=admin.id,
            session_token=session_token,
            ip_address=CustomerService.get_client_ip(request),  # Reuse same method
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            expires_at=expires_at
        )
        
        # Update last login
        admin.last_login = timezone.now()
        admin.save()
        
        return session
    
    @staticmethod
    def validate_admin_session(session_token):
        """Validate admin session token"""
        try:
            session = UserSession.objects.get(
                session_token=session_token,
                is_active=True,
                expires_at__gt=timezone.now()
            )
            
            # Check if user is an admin
            if session.content_type.model == 'adminuser':
                admin = AdminUser.objects.get(id=session.object_id, is_active=True)
                return admin, None
            else:
                session.invalidate()
                return None, "Invalid session type for admin"
                
        except (UserSession.DoesNotExist, AdminUser.DoesNotExist):
            return None, "Invalid or expired session"




















# from datetime import datetime, timedelta
# import secrets
# from django.utils import timezone
# from django.core.exceptions import ValidationError
# from email_service.services import EmailService  
# from .models import CustomerUser, AdminSession, PasswordResetToken, AuditLog
# from core.tokens import account_activation_token

# class CustomerService:
#     """Service layer for customer-related business logic"""
    
#     @staticmethod
#     def register_customer(customer_data, request=None):
#         """Register a new customer with validation"""
#         from .serializers import CustomerRegistrationSerializer
        
#         serializer: CustomerRegistrationSerializer = CustomerRegistrationSerializer(data=customer_data)
#         if not serializer.is_valid():
#             raise ValidationError(serializer.errors)
        
#         # Check for existing customer
#         if CustomerUser.objects.filter(email=customer_data['email']).exists():
#             raise ValidationError("Customer with this email already exists")
        
#         # Create customer
#         customer = serializer.save()
#         customer.role = 'customer'
#         customer.created_at = timezone.now()
#         customer.save()
        
#         # Send activation email using existing EmailService
#         EmailService.send_activation_email(customer, request)
        
#         # Log registration
#         if request:
#             AuditLog.log_action(
#                 admin=None,  # Self-registration, no admin involved
#                 action='create',
#                 model_name='CustomerUser',
#                 object_id=customer.id,
#                 details={'email': customer.email, 'source': 'self_registration'},
#                 request=request
#             )
        
#         return customer
    
#     @staticmethod
#     def authenticate_customer(email, password):
#         """Authenticate customer credentials"""
#         try:
#             customer = CustomerUser.objects.get(email=email, is_active=True)
#         except CustomerUser.DoesNotExist:
#             return None, "Customer not found or inactive"
        
#         if not customer.is_email_verified:
#             return None, "Email not verified"
        
#         if not customer.check_password(password):
#             return None, "Invalid password"
        
#         return customer, None
    
#     @staticmethod
#     def create_customer_session(customer: CustomerUser, request):
#         """Create a session for authenticated customer"""
#         session_token = secrets.token_urlsafe(32)
#         expires_at = timezone.now() + timedelta(hours=8)
        
#         session = AdminSession.objects.create(
#             admin=customer,  # Reusing AdminSession model
#             session_token=session_token,
#             ip_address=CustomerService.get_client_ip(request),
#             user_agent=request.META.get('HTTP_USER_AGENT', ''),
#             expires_at=expires_at
#         )
        
#         # Update last login
#         customer.last_login = timezone.now()
#         customer.save()
        
#         return session
    
#     @staticmethod
#     def initiate_password_reset(email, request=None):
#         """Initiate password reset process"""
#         try:
#             customer = CustomerUser.objects.get(email=email, is_active=True)
#         except CustomerUser.DoesNotExist:
#             return False, "Customer not found"
        
#         # Generate reset token
#         token = secrets.token_urlsafe(32)
#         expires_at = timezone.now() + timedelta(hours=1)
        
#         PasswordResetToken.objects.create(
#             admin=customer,
#             token=token,
#             expires_at=expires_at
#         )
        
#         # Send reset email using existing EmailService
#         EmailService.send_password_reset_email(customer, token, request)
        
#         return True, "Password reset email sent"
    
#     @staticmethod
#     def reset_password(token, new_password, confirm_password):
#         """Reset password using token"""
#         if new_password != confirm_password:
#             return False, "Passwords do not match"
        
#         try:
#             reset_token = PasswordResetToken.objects.get(
#                 token=token,
#                 is_used=False,
#                 expires_at__gt=timezone.now()
#             )
#         except PasswordResetToken.DoesNotExist:
#             return False, "Invalid or expired token"
        
#         # Update password
#         customer = reset_token.admin
#         customer.set_password(new_password)
#         customer.save()
        
#         # Mark token as used
#         reset_token.is_used = True
#         reset_token.save()
        
#         # Invalidate existing sessions
#         customer.sessions.filter(is_active=True).update(is_active=False)
        
#         return True, "Password reset successful"
    
#     @staticmethod
#     def get_client_ip(request):
#         """Extract client IP from request"""
#         x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#         if x_forwarded_for:
#             ip = x_forwarded_for.split(',')[0]
#         else:
#             ip = request.META.get('REMOTE_ADDR')
#         return ip
    
#     @staticmethod
#     def get_customer_profile(customer_id):
#         """Get customer profile by ID"""
#         try:
#             return CustomerUser.objects.get(id=customer_id, is_active=True)
#         except CustomerUser.DoesNotExist:
#             return None
    
#     @staticmethod
#     def update_customer_profile(customer, profile_data):
#         """Update customer profile information"""
#         allowed_fields = ['first_name', 'last_name', 'phone', 'country', 'state', 'street']
        
#         for field in allowed_fields:
#             if field in profile_data:
#                 setattr(customer, field, profile_data[field])
        
#         customer.save()
#         return customer
    
#     @staticmethod
#     def deactivate_customer(customer_id):
#         """Deactivate customer account"""
#         try:
#             customer: CustomerUser = CustomerUser.objects.get(id=customer_id)
#             customer.is_active = False
#             customer.save()
            
#             # Invalidate all active sessions
#             customer.sessions.filter(is_active=True).update(is_active=False)
            
#             return True, "Customer deactivated"
#         except CustomerUser.DoesNotExist:
#             return False, "Customer not found"