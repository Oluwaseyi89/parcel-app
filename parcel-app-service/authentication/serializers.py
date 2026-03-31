from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import (
    AdminUser, UserSession, PasswordResetToken, 
    AuditLog, CustomerUser, VendorUser, CourierUser,
    TempCourierUser, TempVendorUser
)
import secrets
from datetime import datetime, timedelta, timezone

from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password

class BaseUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = None  # Will be set in subclass
        fields = [
            'id', 'email', 'is_active', 'is_email_verified',
            'created_at', 'updated_at', 'last_login', 
            'password', 'password_confirm'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']

    def validate_email(self, value):
        if self.Meta.model.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, data):
        if 'password' in data and 'password_confirm' in data:
            if data['password'] != data['password_confirm']:
                raise serializers.ValidationError({
                    "password": "Passwords do not match."
                })
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        user = self.Meta.model.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        validated_data.pop('password_confirm', None)
        
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


# class AdminUserSerializer(serializers.ModelSerializer):
class AdminUserSerializer(BaseUserSerializer):
    """Serializer for AdminUser model (replaces StaffSerializer)"""
    full_name = serializers.SerializerMethodField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = AdminUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'role_display', 'photo', 'is_active',
            'is_email_verified', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'is_active': {'default': True},
        }
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new admin users (with password validation)"""
    password = serializers.CharField(write_only=True, min_length=8, required=True, 
                                     style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=True, 
                                            style={'input_type': 'password'})
    
    class Meta:
        model = AdminUser
        fields = [
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone', 'role', 'photo', 'is_active', 'is_email_verified'
        ]
        extra_kwargs = {
            'is_active': {'default': True},
            'is_email_verified': {'default': False},
            'role': {'default': 'staff'},
        }
    
    def validate_email(self, value):
        """Ensure email is unique"""
        if AdminUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("An admin with this email already exists.")
        return value
    
    def validate(self, data):
        """Validate password confirmation and role permissions"""
        # Check password match
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        
        # Check role permissions (only super admin can create other admins)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            if user.is_authenticated:
                if user.role != 'super_admin' and data.get('role') in ['super_admin', 'admin']:
                    raise serializers.ValidationError({
                        'role': 'Only super admin can create admin users.'
                    })
        
        return data
    
    def create(self, validated_data):
        """Create admin user with hashed password"""
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        admin = AdminUser(**validated_data)
        admin.set_password(password)
        admin.save()
        
        # Log the action
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            AuditLog.log_action(
                user=request.user,
                action='create',
                model_name='AdminUser',
                object_id=admin.id,
                details={'email': admin.email, 'role': admin.role},
                request=request
            )
        
        return admin


class AdminUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating admin users"""
    class Meta:
        model = AdminUser
        fields = [
            'first_name', 'last_name', 'phone', 'role', 
            'photo', 'is_active', 'is_email_verified'
        ]
        extra_kwargs = {
            'role': {'required': False},
        }
    
    def validate_role(self, value):
        """Validate role changes (only super admin can change roles)"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            instance = self.instance
            
            # If role is being changed and user is not super admin
            if instance and value != instance.role and user.role != 'super_admin':
                raise serializers.ValidationError(
                    'Only super admin can change user roles.'
                )
        
        return value
    
    def update(self, instance, validated_data):
        """Update admin user with audit logging"""
        old_role = instance.role
        updated_admin = super().update(instance, validated_data)
        
        # Log role changes
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if 'role' in validated_data and validated_data['role'] != old_role:
                AuditLog.log_action(
                    user=request.user,
                    action='permission_change',
                    model_name='AdminUser',
                    object_id=instance.id,
                    details={
                        'old_role': old_role,
                        'new_role': validated_data['role'],
                        'admin_email': instance.email
                    },
                    request=request
                )
        
        return updated_admin


class AdminLoginSerializer(serializers.Serializer):
    """Serializer for admin login (replaces StaffLoginSerializer)"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, 
                                     style={'input_type': 'password'})
    
    def validate(self, data):
        """Validate login credentials"""
        email = data.get('email')
        password = data.get('password')
        
        try:
            admin = AdminUser.objects.get(email=email, is_active=True)
        except AdminUser.DoesNotExist:
            raise serializers.ValidationError({
                'error': 'Invalid email or password.'
            })
        
        # Verify password
        if not admin.check_password(password):
            raise serializers.ValidationError({
                'error': 'Invalid email or password.'
            })
        
        # Check if user has permission to access admin panel
        if admin.role not in ['super_admin', 'admin', 'staff', 'operator']:
            raise serializers.ValidationError({
                'error': 'Insufficient permissions to access admin panel.'
            })
        
        data['admin'] = admin
        return data


class AdminSessionSerializer(serializers.ModelSerializer):
    """Serializer for admin sessions"""
    user_email = serializers.SerializerMethodField(read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)
    user_role = serializers.SerializerMethodField(read_only=True)
    is_expired = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = UserSession
        fields = [
            'session_token', 'user_email', 'user_name', 'user_role',
            'ip_address', 'user_agent', 'created_at', 'expires_at',
            'is_active', 'is_expired'
        ]
        read_only_fields = fields
    
    def get_user_email(self, obj):
        return getattr(obj.user, 'email', None)

    def get_user_name(self, obj):
        if obj.user and hasattr(obj.user, 'get_full_name'):
            return obj.user.get_full_name()
        return None

    def get_user_role(self, obj):
        return getattr(obj.user, 'role', None)
    
    def get_is_expired(self, obj):
        return obj.is_expired()


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password (replaces AdminChangePasswordSerializer)"""
    current_password = serializers.CharField(
        required=True, write_only=True, 
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True, write_only=True, min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        required=True, write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_current_password(self, value):
        """Verify current password"""
        user = self.context.get('user')
        if user and not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value
    
    def validate(self, data):
        """Validate new password"""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'New password and confirmation do not match.'
            })
        
        if data['current_password'] == data['new_password']:
            raise serializers.ValidationError({
                'new_password': 'New password must be different from current password.'
            })
        
        return data


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password request"""
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Verify email exists"""
        try:
            admin = AdminUser.objects.get(email=value, is_active=True)
        except AdminUser.DoesNotExist:
            raise serializers.ValidationError('No active admin found with this email.')
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for resetting password"""
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True, write_only=True, min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        required=True, write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, data):
        """Validate reset token and passwords"""
        token = data.get('token')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        # Check password match
        if new_password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        
        # Validate token
        try:
            reset_token = PasswordResetToken.objects.get(
                token=token, is_used=False, expires_at__gt=datetime.now()
            )
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({
                'token': 'Invalid or expired reset token.'
            })
        
        data['reset_token'] = reset_token
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs"""
    user_email = serializers.SerializerMethodField(read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_email', 'user_name', 'action', 'action_display',
            'model_name', 'object_id_ref', 'details', 'ip_address',
            'user_agent', 'created_at'
        ]
        read_only_fields = fields
    
    def get_user_email(self, obj):
        return getattr(obj.user, 'email', None)

    def get_user_name(self, obj):
        if obj.user and hasattr(obj.user, 'get_full_name'):
            return obj.user.get_full_name()
        return 'System'


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for admin profile (read-only)"""
    full_name = serializers.SerializerMethodField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = AdminUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'role_display', 'photo', 'is_email_verified',
            'created_at', 'last_login'
        ]
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class SimpleAdminSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns and basic info"""
    full_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = AdminUser
        fields = ['id', 'email', 'full_name', 'role', 'is_active']
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class CustomerRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for customer registration"""
    password = serializers.CharField(
        write_only=True, 
        required=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = CustomerUser
        fields = [
            'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'phone',
            'country', 'state', 'street'
        ]
        extra_kwargs = {
            'country': {'required': False},
            'state': {'required': False},
            'street': {'required': False},
            'phone': {'required': False}
        }
    
    def validate_email(self, value):
        """Ensure email is unique"""
        if CustomerUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A customer with this email already exists.")
        return value.lower()  # Normalize email to lowercase
    
    def validate(self, data):
        """Validate password confirmation"""
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        
        # Password strength validation (optional)
        if len(data['password']) < 8:
            raise serializers.ValidationError({
                'password': 'Password must be at least 8 characters long.'
            })
        
        return data
    
    def create(self, validated_data):
        """Create customer with hashed password"""
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        customer = CustomerUser(**validated_data)
        customer.set_password(password)
        customer.save()
        
        return customer


class CustomerLoginSerializer(serializers.Serializer):
    """Serializer for customer login"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True, 
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, data):
        """Validate login credentials"""
        email = data.get('email').lower()  # Normalize email
        password = data.get('password')
        
        try:
            customer = CustomerUser.objects.get(email=email, is_active=True)
        except CustomerUser.DoesNotExist:
            raise serializers.ValidationError({
                'error': 'Invalid email or password.'
            })
        
        if not customer.is_email_verified:
            raise serializers.ValidationError({
                'error': 'Please verify your email before logging in.'
            })
        
        if not customer.check_password(password):
            raise serializers.ValidationError({
                'error': 'Invalid email or password.'
            })
        
        data['customer'] = customer
        return data


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Serializer for customer profile (read-only)"""
    full_name = serializers.SerializerMethodField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = CustomerUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'country', 'state', 'street', 'role',
            'role_display', 'is_email_verified', 'created_at',
            'updated_at', 'last_login'
        ]
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class CustomerUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating customer profile"""
    class Meta:
        model = CustomerUser
        fields = [
            'first_name', 'last_name', 'phone',
            'country', 'state', 'street'
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate_phone(self, value):
        """Optional phone validation"""
        if value and len(value) < 10:
            raise serializers.ValidationError("Phone number must be at least 10 digits.")
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password request (for customers)"""
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Verify email exists and is active"""
        try:
            customer = CustomerUser.objects.get(email=value.lower(), is_active=True)
        except CustomerUser.DoesNotExist:
            raise serializers.ValidationError('No active customer found with this email.')
        
        self.context['customer'] = customer
        return value


class CustomerPasswordResetSerializer(serializers.Serializer):
    """Serializer for customer password reset"""
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True, write_only=True, min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        required=True, write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, data):
        """Validate reset token and passwords"""
        token = data.get('token')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        # Check password match
        if new_password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        
        # Validate token
        try:
            reset_token = PasswordResetToken.objects.get(
                token=token,
                is_used=False,
                expires_at__gt=timezone.now()
            )
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({
                'token': 'Invalid or expired reset token.'
            })
        
        # Verify the user is a customer
        if reset_token.admin.role not in ['customer', 'premium_customer']:
            raise serializers.ValidationError({
                'token': 'Invalid token for customer reset.'
            })
        
        data['reset_token'] = reset_token
        return data


class VendorProfileSerializer(serializers.ModelSerializer):
    """Serializer for vendor profile"""
    full_name = serializers.SerializerMethodField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = VendorUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
            'business_name', 'business_country', 'business_state', 'business_street',
            'business_category', 'cac_reg_no', 'nin', 'photo', 'status', 'status_display',
            'is_approved', 'approved_by', 'approved_at', 'role', 'role_display',
            'is_active', 'is_email_verified', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.get_full_name()

class SimpleVendorSerializer(serializers.ModelSerializer):
    """Lightweight serializer for vendor dropdowns and basic info"""
    full_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = VendorUser
        fields = ['id', 'email', 'full_name', 'business_name', 'phone', 'is_approved', 'status']
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.get_full_name()

class CourierProfileSerializer(serializers.ModelSerializer):
    """Serializer for courier profile"""
    full_name = serializers.SerializerMethodField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    delivery_success_rate = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = CourierUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
            'business_country', 'business_state', 'business_street',
            'cac_reg_no', 'nin', 'vehicle_type', 'vehicle_registration',
            'service_area', 'photo', 'status', 'status_display',
            'total_deliveries', 'successful_deliveries', 'delivery_success_rate', 'rating',
            'current_latitude', 'current_longitude', 'last_location_update',
            'is_approved', 'approved_by', 'approved_at', 'role', 'role_display',
            'is_active', 'is_email_verified', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_delivery_success_rate(self, obj):
        if obj.total_deliveries > 0:
            return (obj.successful_deliveries / obj.total_deliveries) * 100
        return 0

class SimpleCourierSerializer(serializers.ModelSerializer):
    """Lightweight serializer for courier dropdowns and basic info"""
    full_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = CourierUser
        fields = ['id', 'email', 'full_name', 'phone', 'vehicle_type', 'service_area', 'is_approved', 'status']
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.get_full_name()

class TempVendorUserSerializer(serializers.ModelSerializer):
    """Serializer for temporary vendor users"""
    full_name = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TempVendorUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
            'business_name', 'business_country', 'business_state', 'business_street',
            'business_category', 'cac_reg_no', 'nin', 'photo', 'policy_accepted',
            'status', 'status_display', 'is_active', 'is_email_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.get_full_name()

class TempCourierUserSerializer(serializers.ModelSerializer):
    """Serializer for temporary courier users"""
    full_name = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TempCourierUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
            'business_country', 'business_state', 'business_street',
            'cac_reg_no', 'nin', 'photo', 'policy_accepted',
            'vehicle_type', 'vehicle_registration', 'service_area',
            'status', 'status_display', 'is_active', 'is_email_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.get_full_name()

# Also add these to the existing AdminUserSerializer if not already present
class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for AdminUser model"""
    full_name = serializers.SerializerMethodField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = AdminUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'role_display', 'photo', 'is_active',
            'is_email_verified', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']
    
    def get_full_name(self, obj):
        return obj.get_full_name()

class CustomerProfileSerializer(serializers.ModelSerializer):
    """Serializer for customer profile (read-only)"""
    full_name = serializers.SerializerMethodField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = CustomerUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'country', 'state', 'street', 'role',
            'role_display', 'is_email_verified', 'created_at',
            'updated_at', 'last_login'
        ]
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return obj.get_full_name()