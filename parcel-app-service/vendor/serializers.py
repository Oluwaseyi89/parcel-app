from rest_framework import serializers
from django.conf import settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from authentication.models import VendorUser
from authentication.serializers import BaseUserSerializer
from core.tokens import account_activation_token

class TempVendorRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for temporary vendor registration"""
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)
    policy_accepted = serializers.BooleanField(write_only=True, required=True)
    
    class Meta:
        model = VendorUser
        fields = [
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone', 'business_country', 'business_state', 'business_street',
            'business_category', 'cac_reg_no', 'nin', 'photo', 'policy_accepted'
        ]
        extra_kwargs = {
            'photo': {'required': True},
            'policy_accepted': {'required': True}
        }
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        
        if not data['policy_accepted']:
            raise serializers.ValidationError({'policy_accepted': 'You must accept the vendor policy.'})
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data.pop('policy_accepted', None)
        password = validated_data.pop('password')
        
        vendor = VendorUser(**validated_data)
        vendor.set_password(password)
        vendor.role = 'vendor'  # Set role for authentication
        vendor.is_approved = False
        vendor.approval_status = 'pending'
        vendor.status = 'inactive'
        vendor.is_email_verified = False
        vendor.is_active = True
        vendor.save()
        
        return vendor

class VendorApprovalSerializer(serializers.ModelSerializer):
    """Serializer for vendor approval"""
    approved_by_email = serializers.EmailField(source='approved_by.email', read_only=True)
    approved_by_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = VendorUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'business_country', 'business_state', 'business_street',
            'business_category', 'cac_reg_no', 'nin', 'is_approved',
            'approval_status', 'rejection_reason', 'submitted_at', 'reviewed_at',
            'approved_by_email', 'approved_by_name', 'approved_at',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'submitted_at', 'reviewed_at', 'approved_at']
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None


class VendorModerationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=['approve', 'reject', 'suspend', 'reactivate', 'request_changes'],
        required=False,
        default='approve'
    )
    comments = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        action = data.get('action', 'approve')
        comments = (data.get('comments') or '').strip()

        if action in ['reject', 'request_changes'] and not comments:
            raise serializers.ValidationError({
                'comments': 'Comments are required for reject and request_changes actions.'
            })

        return data

class VendorLoginSerializer(serializers.Serializer):
    """Serializer for vendor login"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def _build_dev_verify_url(self, user):
        request = self.context.get('request')
        if not settings.DEBUG or request is None:
            return None

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = account_activation_token.make_token(user)
        path = reverse('dev_verify_email', kwargs={'role': 'vendor', 'uidb64': uid, 'token': token})
        try:
            return request.build_absolute_uri(path)
        except Exception:
            return f'http://localhost:7000{path}'
    
    def validate(self, data):
        email = data['email'].lower()

        try:
            vendor = VendorUser.objects.get(email=email, is_active=True)
        except VendorUser.DoesNotExist:
            raise serializers.ValidationError({'error': 'The email or password you entered is incorrect.'})

        if not vendor.check_password(data['password']):
            raise serializers.ValidationError({'error': 'The email or password you entered is incorrect.'})

        if not vendor.is_email_verified:
            verify_url = self._build_dev_verify_url(vendor)
            message = 'Please verify your email first.'
            if verify_url:
                message = f'{message} For development, open this link: {verify_url}'
            payload = {'error': message}
            if verify_url:
                payload['verify_url'] = verify_url
            raise serializers.ValidationError(payload)

        if not vendor.is_approved:
            raise serializers.ValidationError({'error': 'Your vendor account is still under review. Please try again after approval.'})

        data['vendor'] = vendor
        return data

class VendorProfileSerializer(serializers.ModelSerializer):
    """Serializer for vendor profile"""
    class Meta:
        model = VendorUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'business_name', 'business_country', 'business_state',
            'business_street', 'business_category', 'cac_reg_no',
            'nin', 'photo', 'status', 'is_approved', 'approval_status',
            'rejection_reason', 'submitted_at', 'reviewed_at',
            'created_at', 'last_login'
        ]
        read_only_fields = fields














# from django.contrib.auth.hashers import make_password
# from rest_framework import serializers
# from .models import TempVendor, Vendor


# class TempVendorSerializer(serializers.ModelSerializer):
#     first_name = serializers.CharField(max_length=50)
#     last_name = serializers.CharField(max_length=50)
#     bus_country = serializers.CharField(max_length=50)
#     bus_state = serializers.CharField(max_length=50)
#     bus_street = serializers.CharField(max_length=50)
#     bus_category = serializers.CharField(max_length=25)
#     cac_reg_no = serializers.CharField(max_length=10)
#     nin = serializers.CharField(max_length=11)
#     phone_no = serializers.CharField(max_length=14)
#     email = serializers.EmailField(max_length=70)
#     vend_photo = serializers.ImageField()
#     ven_policy = serializers.BooleanField()
#     password = serializers.CharField(max_length=200)
#     reg_date = serializers.CharField(max_length=100)
#     is_email_verified = serializers.BooleanField()

#     @staticmethod
#     def validate_password(password: str) -> str:
#         return make_password(password)

#     class Meta:
#         model = TempVendor
#         fields = '__all__'


# class VendorSerializer(serializers.ModelSerializer):
#     first_name = serializers.CharField(max_length=50)
#     last_name = serializers.CharField(max_length=50)
#     bus_country = serializers.CharField(max_length=50)
#     bus_state = serializers.CharField(max_length=50)
#     bus_street = serializers.CharField(max_length=50)
#     bus_category = serializers.CharField(max_length=25)
#     cac_reg_no = serializers.CharField(max_length=10)
#     nin = serializers.CharField(max_length=11)
#     phone_no = serializers.CharField(max_length=14)
#     email = serializers.EmailField(max_length=70)
#     vend_photo = serializers.CharField(max_length=200)
#     ven_policy = serializers.BooleanField()
#     password = serializers.CharField(max_length=200)
#     appr_officer = serializers.CharField(max_length=100)
#     appr_date = serializers.CharField(max_length=100)
#     is_email_verified = serializers.BooleanField()

#     class Meta:
#         model = Vendor
#         fields = '__all__'


# class VendorLoginSerializer(serializers.ModelSerializer):
#     email = serializers.CharField(max_length=70)
#     password = serializers.CharField(max_length=200)

#     class Meta:
#         model = Vendor
#         fields = ['email', 'password']


# class VendorResetSerializer(serializers.ModelSerializer):
#     email = serializers.CharField(max_length=70)

#     class Meta:
#         model = Vendor
#         fields = ['email']


# class VendorSaveResetSerializer(serializers.ModelSerializer):
#     email = serializers.CharField(max_length=70)
#     password = serializers.CharField(max_length=200)

#     @staticmethod
#     def validate_password(password: str) -> str:
#         return make_password(password)

#     class Meta:
#         model = Vendor
#         fields = ['email', 'password']