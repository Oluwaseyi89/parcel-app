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

class AdminVendorBankUpdateSerializer(serializers.ModelSerializer):
    """Admin edits to a vendor bank record; timestamps are set server-side."""

    class Meta:
        model = VendorBankDetail
        fields = ['bank_name', 'account_type', 'account_name', 'account_no', 'vendor_email']


class AdminCourierBankUpdateSerializer(serializers.ModelSerializer):
    """Admin edits to a courier bank record; timestamps are set server-side."""

    class Meta:
        model = CourierBankDetail
        fields = ['bank_name', 'account_type', 'account_name', 'account_no', 'courier_email']
