from rest_framework import serializers
from .models import Measurement


class MeasurementSerializer(serializers.ModelSerializer):
    location = serializers.CharField(max_length=200)
    destination = serializers.CharField(max_length=200)
    distance = serializers.DecimalField(max_digits=10, decimal_places=2)
    created_at = serializers.DateTimeField()

    class Meta:
        model = Measurement
        fields = '__all__'