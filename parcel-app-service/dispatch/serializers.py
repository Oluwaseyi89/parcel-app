# dispatch/serializers.py
from rest_framework import serializers
from .models import Dispatch, DispatchItem, DispatchStatusHistory, CourierLocation, DispatchRoute
from order.serializers import OrderSerializer, OrderItemSerializer
from authentication.serializers import CourierProfileSerializer, VendorProfileSerializer

class DispatchItemSerializer(serializers.ModelSerializer):
    """Serializer for dispatch items"""
    order_item_details = OrderItemSerializer(source='order_item', read_only=True)
    vendor_details = VendorProfileSerializer(source='order_item.vendor', read_only=True)
    
    class Meta:
        model = DispatchItem
        fields = [
            'id', 'dispatch', 'order_item', 'order_item_details',
            'status', 'is_ready_for_pickup', 'is_picked_up',
            'picked_up_at', 'pickup_confirmation_code',
            'is_delivered', 'delivered_at', 'delivery_confirmation_code',
            'customer_signature', 'vendor_notes', 'courier_notes',
            'vendor_details', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'picked_up_at', 'delivered_at'
        ]
    
    def validate_pickup_confirmation_code(self, value):
        if value and len(value) < 4:
            raise serializers.ValidationError('Confirmation code must be at least 4 characters.')
        return value

class DispatchSerializer(serializers.ModelSerializer):
    """Serializer for dispatches"""
    order_details = OrderSerializer(source='order', read_only=True)
    courier_details = CourierProfileSerializer(source='courier', read_only=True)
    items = DispatchItemSerializer(many=True, read_only=True)
    route_details = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Dispatch
        fields = [
            'id', 'order', 'order_details', 'courier', 'courier_details',
            'status', 'tracking_number', 'estimated_pickup_time',
            'estimated_delivery_time', 'pickup_addresses', 'delivery_address',
            'distance_km', 'estimated_duration_minutes', 'courier_notes',
            'admin_notes', 'assigned_at', 'started_at', 'completed_at',
            'items', 'route_details', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tracking_number', 'created_at', 'updated_at',
            'assigned_at', 'started_at', 'completed_at'
        ]
    
    def get_route_details(self, obj):
        if hasattr(obj, 'route'):
            from .serializers import DispatchRouteSerializer
            return DispatchRouteSerializer(obj.route).data
        return None

class DispatchCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating dispatches"""
    order_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Dispatch
        fields = ['order_id', 'admin_notes']
    
    def validate_order_id(self, value):
        from order.models import Order
        
        try:
            order = Order.objects.get(id=value, status='ready')
            # Check if dispatch already exists
            if hasattr(order, 'dispatch'):
                raise serializers.ValidationError('Dispatch already exists for this order.')
            self.context['order'] = order
            return value
        except Order.DoesNotExist:
            raise serializers.ValidationError('Order not found or not ready for dispatch.')

class DispatchStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating dispatch status"""
    status = serializers.ChoiceField(choices=Dispatch.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    
    def validate(self, data):
        # Validate location for transit statuses
        status = data.get('status')
        if status in ['picking_up', 'in_transit']:
            if not data.get('latitude') or not data.get('longitude'):
                raise serializers.ValidationError(
                    'Location coordinates are required for transit statuses.'
                )
        return data

class DispatchAssignSerializer(serializers.Serializer):
    """Serializer for assigning courier to dispatch"""
    courier_id = serializers.IntegerField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_courier_id(self, value):
        from authentication.models import CourierUser
        
        try:
            courier = CourierUser.objects.get(id=value, is_active=True, is_approved=True)
            if courier.status not in ['active', 'offline']:
                raise serializers.ValidationError('Courier is not available for dispatch.')
            self.context['courier'] = courier
            return value
        except CourierUser.DoesNotExist:
            raise serializers.ValidationError('Courier not found or not approved.')

class DispatchItemUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating dispatch items"""
    class Meta:
        model = DispatchItem
        fields = [
            'is_ready_for_pickup', 'is_picked_up', 'is_delivered',
            'pickup_confirmation_code', 'delivery_confirmation_code',
            'customer_signature', 'vendor_notes', 'courier_notes'
        ]
    
    def validate(self, data):
        # Validate status transitions
        instance = self.instance
        
        if 'is_picked_up' in data and data['is_picked_up']:
            if not instance.is_ready_for_pickup:
                raise serializers.ValidationError(
                    'Item must be marked as ready for pickup before it can be picked up.'
                )
        
        if 'is_delivered' in data and data['is_delivered']:
            if not instance.is_picked_up:
                raise serializers.ValidationError(
                    'Item must be picked up before it can be delivered.'
                )
        
        return data

class CourierLocationSerializer(serializers.ModelSerializer):
    """Serializer for courier locations"""
    courier_details = CourierProfileSerializer(source='courier', read_only=True)
    
    class Meta:
        model = CourierLocation
        fields = [
            'id', 'courier', 'courier_details', 'dispatch',
            'latitude', 'longitude', 'accuracy', 'speed',
            'bearing', 'altitude', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate_latitude(self, value):
        if not -90 <= value <= 90:
            raise serializers.ValidationError('Latitude must be between -90 and 90.')
        return value
    
    def validate_longitude(self, value):
        if not -180 <= value <= 180:
            raise serializers.ValidationError('Longitude must be between -180 and 180.')
        return value

class DispatchRouteSerializer(serializers.ModelSerializer):
    """Serializer for dispatch routes"""
    class Meta:
        model = DispatchRoute
        fields = [
            'id', 'dispatch', 'waypoints', 'optimized_route',
            'total_distance_km', 'estimated_duration_minutes',
            'fuel_estimate_liters', 'traffic_conditions',
            'traffic_delay_minutes', 'created_at', 'updated_at'
        ]
        read_only_fields = fields

class DispatchStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for dispatch status history"""
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = DispatchStatusHistory
        fields = [
            'id', 'dispatch', 'old_status', 'new_status',
            'changed_by', 'changed_by_name', 'notes',
            'location', 'created_at'
        ]
        read_only_fields = fields

class ReadyOrdersSerializer(serializers.Serializer):
    """Serializer for orders ready for dispatch"""
    order_id = serializers.IntegerField()
    order_number = serializers.CharField()
    customer_name = serializers.CharField()
    total_items = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    shipping_address = serializers.DictField()
    items = serializers.ListField(child=serializers.DictField())