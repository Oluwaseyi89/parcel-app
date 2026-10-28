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


class DistanceCalculationSerializer(serializers.Serializer):
    """Two coordinate pairs in decimal degrees."""
    origin_lat = serializers.FloatField(min_value=-90, max_value=90)
    origin_lng = serializers.FloatField(min_value=-180, max_value=180)
    destination_lat = serializers.FloatField(min_value=-90, max_value=90)
    destination_lng = serializers.FloatField(min_value=-180, max_value=180)
