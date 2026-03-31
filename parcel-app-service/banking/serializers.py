from rest_framework import serializers
from .models import VendorBankDetail, CourierBankDetail


class VendorBankDetailSerializer(serializers.ModelSerializer):
    bank_name = serializers.CharField(max_length=70)
    account_type = serializers.CharField(max_length=20)
    account_name = serializers.CharField(max_length=70)
    vendor_email = serializers.EmailField(max_length=70)
    account_no = serializers.CharField(max_length=15)
    added_at = serializers.CharField(max_length=50)
    updated_at = serializers.CharField(max_length=50)

    class Meta:
        model = VendorBankDetail
        fields = '__all__'


class CourierBankDetailSerializer(serializers.ModelSerializer):
    bank_name = serializers.CharField(max_length=70)
    account_type = serializers.CharField(max_length=20)
    account_name = serializers.CharField(max_length=70)
    courier_email = serializers.EmailField(max_length=70)
    account_no = serializers.CharField(max_length=15)
    added_at = serializers.CharField(max_length=50)
    updated_at = serializers.CharField(max_length=50)

    class Meta:
        model = CourierBankDetail
        fields = '__all__'