from rest_framework import serializers
from .models import CustomerComplaint


class CustomerComplaintSerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(max_length=70)
    complaint_subject = serializers.CharField(max_length=125)
    courier_involved = serializers.CharField(max_length=125)
    complaint_detail = serializers.CharField(max_length=1000)
    is_resolved = serializers.BooleanField()
    is_satisfied = serializers.BooleanField()
    created_at = serializers.CharField(max_length=50)
    updated_at = serializers.CharField(max_length=50)

    class Meta:
        model = CustomerComplaint
        fields = '__all__'