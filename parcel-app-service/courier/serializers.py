# from rest_framework import serializers
# from authentication.models import TempCourierUser, CourierUser

# class TempCourierRegistrationSerializer(serializers.ModelSerializer):
#     """Serializer for temporary courier registration"""
#     password = serializers.CharField(write_only=True, required=True, min_length=8)
#     confirm_password = serializers.CharField(write_only=True, required=True)
#     accepted_policy = serializers.BooleanField(required=True)
    
#     class Meta:
#         model = TempCourierUser
#         fields = [
#             'email', 'password', 'confirm_password', 'first_name', 'last_name',
#             'phone_number', 'business_country', 'business_state', 'business_street',
#             'cac_registration_no', 'nin', 'photo', 'accepted_policy'
#         ]
#         extra_kwargs = {
#             'photo': {'required': True},
#             'accepted_policy': {'required': True}
#         }
    
#     def validate(self, data):
#         if data['password'] != data['confirm_password']:
#             raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        
#         if not data['accepted_policy']:
#             raise serializers.ValidationError({'accepted_policy': 'You must accept the courier policy.'})
        
#         return data
    
#     def create(self, validated_data):
#         validated_data.pop('confirm_password')
#         password = validated_data.pop('password')
        
#         courier = TempCourierUser(**validated_data)
#         courier.set_password(password)
#         courier.save()
        
#         return courier

# class CourierApprovalSerializer(serializers.ModelSerializer):
#     """Serializer for courier approval"""
#     approved_by_email = serializers.EmailField(source='approved_by.email', read_only=True)
#     approved_by_name = serializers.SerializerMethodField(read_only=True)
    
#     class Meta:
#         model = CourierUser
#         fields = [
#             'id', 'email', 'first_name', 'last_name', 'phone_number',
#             'business_country', 'business_state', 'business_street',
#             'cac_registration_no', 'nin', 'is_active', 'verified',
#             'approved_by_email', 'approved_by_name', 'approved_at', 
#             'created_at', 'rating', 'total_deliveries', 'successful_deliveries'
#         ]
#         read_only_fields = ['id', 'created_at', 'approved_at']
    
#     def get_approved_by_name(self, obj):
#         if obj.approved_by:
#             return obj.approved_by.get_full_name()
#         return None

# class CourierLoginSerializer(serializers.Serializer):
#     """Serializer for courier login"""
#     email = serializers.EmailField(required=True)
#     password = serializers.CharField(write_only=True, required=True)
    
#     def validate(self, data):
#         email = data['email'].lower()
        
#         # First check approved couriers
#         try:
#             courier = CourierUser.objects.get(email=email)
#             if not courier.check_password(data['password']):
#                 raise serializers.ValidationError({'error': 'Invalid credentials.'})
            
#             if not courier.is_active:
#                 raise serializers.ValidationError({'error': 'Courier account is not active.'})
            
#             if not courier.verified:
#                 raise serializers.ValidationError({'error': 'Courier account not yet verified.'})
            
#             data['courier'] = courier
#             return data
            
#         except CourierUser.DoesNotExist:
#             # Check temp couriers
#             try:
#                 temp_courier = TempCourierUser.objects.get(email=email)
#                 if not temp_courier.check_password(data['password']):
#                     raise serializers.ValidationError({'error': 'Invalid credentials.'})
                
#                 if not temp_courier.is_email_verified:
#                     raise serializers.ValidationError({'error': 'Please verify your email first.'})
                
#                 raise serializers.ValidationError({'error': 'Your account is pending approval.'})
                
#             except TempCourierUser.DoesNotExist:
#                 raise serializers.ValidationError({'error': 'Invalid credentials.'})

# class CourierProfileSerializer(serializers.ModelSerializer):
#     """Serializer for courier profile"""
#     delivery_success_rate = serializers.SerializerMethodField(read_only=True)
#     full_name = serializers.SerializerMethodField(read_only=True)
    
#     class Meta:
#         model = CourierUser
#         fields = [
#             'id', 'email', 'first_name', 'last_name', 'full_name', 'phone_number',
#             'business_country', 'business_state', 'business_street',
#             'cac_registration_no', 'nin', 'photo', 'is_active', 'verified',
#             'total_deliveries', 'successful_deliveries', 'delivery_success_rate', 
#             'rating', 'active_vehicles', 'approved_at', 'verified_at',
#             'created_at', 'last_login'
#         ]
#         read_only_fields = fields
    
#     def get_delivery_success_rate(self, obj):
#         return obj.success_rate
    
#     def get_full_name(self, obj):
#         return obj.get_full_name()

# class CourierLocationUpdateSerializer(serializers.Serializer):
#     """Serializer for courier location updates"""
#     latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
#     longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    
#     def validate_latitude(self, value):
#         if not -90 <= value <= 90:
#             raise serializers.ValidationError('Latitude must be between -90 and 90.')
#         return value
    
#     def validate_longitude(self, value):
#         if not -180 <= value <= 180:
#             raise serializers.ValidationError('Longitude must be between -180 and 180.')
#         return value

# class CourierStatusUpdateSerializer(serializers.Serializer):
#     """Serializer for courier status updates"""
#     is_active = serializers.BooleanField(required=True)
    
#     def validate_is_active(self, value):
#         # Additional validation for status transitions
#         return value













# courier/serializers.py
from rest_framework import serializers
from authentication.models import TempCourierUser, CourierUser
from authentication.serializers import BaseUserSerializer

class TempCourierRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for temporary courier registration"""
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)
    policy_accepted = serializers.BooleanField(write_only=True, required=True)
    
    class Meta:
        model = CourierUser
        fields = [
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone', 'business_country', 'business_state', 'business_street',
            'cac_reg_no', 'nin', 'photo', 'policy_accepted',
            'vehicle_type', 'vehicle_registration', 'service_area'
        ]
        extra_kwargs = {
            'photo': {'required': True},
            'policy_accepted': {'required': True}
        }
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        
        if not data['policy_accepted']:
            raise serializers.ValidationError({'policy_accepted': 'You must accept the courier policy.'})
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data.pop('policy_accepted', None)
        password = validated_data.pop('password')
        
        courier = CourierUser(**validated_data)
        courier.set_password(password)
        courier.role = 'courier'  # Set role for authentication
        courier.is_approved = False
        courier.approval_status = 'pending'
        courier.status = 'inactive'
        courier.is_email_verified = False
        courier.is_active = True
        courier.save()
        
        return courier

class CourierApprovalSerializer(serializers.ModelSerializer):
    """Serializer for courier approval"""
    approved_by_email = serializers.EmailField(source='approved_by.email', read_only=True)
    approved_by_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = CourierUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'business_country', 'business_state', 'business_street',
            'cac_reg_no', 'nin', 'vehicle_type', 'vehicle_registration',
            'service_area', 'is_approved', 'approval_status', 'rejection_reason',
            'submitted_at', 'reviewed_at', 'approved_by_email',
            'approved_by_name', 'approved_at', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'submitted_at', 'reviewed_at', 'approved_at']
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None

class CourierLoginSerializer(serializers.Serializer):
    """Serializer for courier login"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, data):
        # Check both TempCourierUser and CourierUser
        email = data['email'].lower()
        
        # First check approved couriers
        try:
            courier = CourierUser.objects.get(email=email, is_active=True)
            if not courier.check_password(data['password']):
                raise serializers.ValidationError({'error': 'Invalid credentials.'})
            
            if not courier.is_approved:
                raise serializers.ValidationError({'error': 'Courier account not yet approved.'})
            
            data['courier'] = courier
            return data
            
        except CourierUser.DoesNotExist:
            # Check temp couriers
            try:
                temp_courier = TempCourierUser.objects.get(email=email, is_active=True)
                if not temp_courier.check_password(data['password']):
                    raise serializers.ValidationError({'error': 'Invalid credentials.'})
                
                if not temp_courier.is_email_verified:
                    raise serializers.ValidationError({'error': 'Please verify your email first.'})
                
                raise serializers.ValidationError({'error': 'Your account is pending approval.'})
                
            except TempCourierUser.DoesNotExist:
                raise serializers.ValidationError({'error': 'Invalid credentials.'})

class CourierProfileSerializer(serializers.ModelSerializer):
    """Serializer for courier profile"""
    delivery_success_rate = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = CourierUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'business_country', 'business_state', 'business_street',
            'cac_reg_no', 'nin', 'vehicle_type', 'vehicle_registration',
            'service_area', 'photo', 'status', 'is_approved',
            'approval_status', 'rejection_reason', 'submitted_at', 'reviewed_at',
            'total_deliveries', 'successful_deliveries', 'delivery_success_rate', 'rating',
            'current_latitude', 'current_longitude', 'last_location_update',
            'created_at', 'last_login'
        ]
        read_only_fields = fields
    
    def get_delivery_success_rate(self, obj):
        if obj.total_deliveries > 0:
            return (obj.successful_deliveries / obj.total_deliveries) * 100
        return 0

class CourierLocationUpdateSerializer(serializers.Serializer):
    """Serializer for courier location updates"""
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    
    def validate_latitude(self, value):
        if not -90 <= value <= 90:
            raise serializers.ValidationError('Latitude must be between -90 and 90.')
        return value
    
    def validate_longitude(self, value):
        if not -180 <= value <= 180:
            raise serializers.ValidationError('Longitude must be between -180 and 180.')
        return value

class CourierStatusUpdateSerializer(serializers.Serializer):
    """Serializer for courier status updates"""
    status = serializers.ChoiceField(choices=CourierUser.STATUS_CHOICES)
    
    def validate_status(self, value):
        # Additional validation for status transitions
        return value















# from django.contrib.auth.hashers import make_password
# from rest_framework import serializers
# from .models import TempCourier, Courier


# class TempCourierSerializer(serializers.ModelSerializer):
#     first_name = serializers.CharField(max_length=50)
#     last_name = serializers.CharField(max_length=50)
#     bus_country = serializers.CharField(max_length=50)
#     bus_state = serializers.CharField(max_length=50)
#     bus_street = serializers.CharField(max_length=50)
#     cac_reg_no = serializers.CharField(max_length=10)
#     nin = serializers.CharField(max_length=11)
#     phone_no = serializers.CharField(max_length=14)
#     email = serializers.EmailField(max_length=70)
#     cour_photo = serializers.ImageField()
#     cour_policy = serializers.BooleanField()
#     password = serializers.CharField(max_length=200)
#     reg_date = serializers.CharField(max_length=100)
#     is_email_verified = serializers.BooleanField()

#     @staticmethod
#     def validate_password(password: str) -> str:
#         return make_password(password)

#     class Meta:
#         model = TempCourier
#         fields = '__all__'


# class CourierSerializer(serializers.ModelSerializer):
#     first_name = serializers.CharField(max_length=50)
#     last_name = serializers.CharField(max_length=50)
#     bus_country = serializers.CharField(max_length=50)
#     bus_state = serializers.CharField(max_length=50)
#     bus_street = serializers.CharField(max_length=50)
#     cac_reg_no = serializers.CharField(max_length=10)
#     nin = serializers.CharField(max_length=11)
#     phone_no = serializers.CharField(max_length=14)
#     email = serializers.EmailField(max_length=70)
#     cour_photo = serializers.CharField(max_length=200)
#     cour_policy = serializers.BooleanField()
#     password = serializers.CharField(max_length=200)
#     appr_officer = serializers.CharField(max_length=100)
#     appr_date = serializers.CharField(max_length=100)
#     is_email_verified = serializers.BooleanField()

#     class Meta:
#         model = Courier
#         fields = '__all__'


# class CourierLoginSerializer(serializers.ModelSerializer):
#     email = serializers.CharField(max_length=70)
#     password = serializers.CharField(max_length=200)

#     class Meta:
#         model = Courier
#         fields = ['email', 'password']


# class CourierResetSerializer(serializers.ModelSerializer):
#     email = serializers.CharField(max_length=70)

#     class Meta:
#         model = Courier
#         fields = ['email']


# class CourierSaveResetSerializer(serializers.ModelSerializer):
#     email = serializers.CharField(max_length=70)
#     password = serializers.CharField(max_length=200)

#     @staticmethod
#     def validate_password(password: str) -> str:
#         return make_password(password)

#     class Meta:
#         model = Courier
#         fields = ['email', 'password']