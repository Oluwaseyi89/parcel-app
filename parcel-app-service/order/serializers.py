# order/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Order, OrderItem, Payment, ShippingAddress, OrderStatusHistory
from product.serializers import ProductSerializer
from authentication.serializers import CustomerProfileSerializer, VendorProfileSerializer, CourierProfileSerializer

class ShippingAddressSerializer(serializers.ModelSerializer):
    """Serializer for shipping addresses"""
    formatted_address = serializers.CharField(read_only=True)
    
    class Meta:
        model = ShippingAddress
        fields = [
            'id', 'full_name', 'phone', 'email',
            'street_address', 'apartment', 'city',
            'state', 'country', 'postal_code',
            'is_default', 'is_active', 'formatted_address',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        # Ensure at least one default address exists
        if not data.get('is_default', False):
            customer = self.context.get('customer')
            if customer and not ShippingAddress.objects.filter(
                customer=customer, is_default=True, is_active=True
            ).exists():
                data['is_default'] = True
        return data

class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    product_details = ProductSerializer(source='product', read_only=True)
    vendor_details = VendorProfileSerializer(source='vendor', read_only=True)
    discounted_unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'order', 'product', 'product_details',
            'product_name', 'product_sku', 'unit_price',
            'discounted_unit_price', 'discount_percentage',
            'quantity', 'total_price', 'vendor', 'vendor_details',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'product_name', 'product_sku', 'unit_price',
            'vendor', 'created_at', 'updated_at'
        ]
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than zero.')
        
        # Check product availability
        product = self.context.get('product')
        if product and value > product.quantity:
            raise serializers.ValidationError(
                f'Only {product.quantity} units available in stock.'
            )
        
        return value
    
    def create(self, validated_data):
        # Set product details from context
        product = self.context.get('product')
        if product:
            validated_data['product_name'] = product.name
            validated_data['product_sku'] = product.sku
            validated_data['unit_price'] = product.discounted_price
            validated_data['vendor'] = product.vendor
        
        return super().create(validated_data)

class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders"""
    customer_details = CustomerProfileSerializer(source='customer', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    courier_details = CourierProfileSerializer(source='courier', read_only=True)
    delivery_address = serializers.CharField(read_only=True)
    is_paid = serializers.BooleanField(read_only=True)
    can_be_cancelled = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_details',
            'status', 'shipping_method', 'shipping_address', 'delivery_address',
            'shipping_fee', 'subtotal', 'tax_amount', 'discount_amount',
            'total_amount', 'payment_status', 'payment_method',
            'payment_reference', 'courier', 'courier_details',
            'tracking_number', 'estimated_delivery', 'delivered_at',
            'customer_notes', 'internal_notes', 'items', 'is_paid',
            'can_be_cancelled', 'created_at', 'updated_at',
            'confirmed_at', 'cancelled_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'total_amount',
            'created_at', 'updated_at', 'confirmed_at', 'cancelled_at'
        ]
    
    def validate_shipping_address(self, value):
        """Validate shipping address JSON"""
        required_fields = ['street', 'city', 'state', 'country', 'postal_code']
        for field in required_fields:
            if field not in value or not value[field].strip():
                raise serializers.ValidationError(f'{field} is required in shipping address.')
        return value
    
    def create(self, validated_data):
        # Set customer from context if not provided
        if 'customer' not in validated_data:
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                validated_data['customer'] = request.user
        
        order = super().create(validated_data)
        
        # Calculate initial totals
        order.calculate_totals()
        
        return order

class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new orders"""
    items = OrderItemSerializer(many=True, write_only=True)
    shipping_address_id = serializers.IntegerField(required=False)
    
    class Meta:
        model = Order
        fields = [
            'shipping_method', 'shipping_address', 'shipping_address_id',
            'customer_notes', 'items'
        ]
    
    def validate(self, data):
        # Validate items exist and are available
        items = data.get('items', [])
        if not items:
            raise serializers.ValidationError({'items': 'Order must contain at least one item.'})
        
        # Load shipping address if ID provided
        shipping_address_id = data.get('shipping_address_id')
        if shipping_address_id:
            try:
                address = ShippingAddress.objects.get(
                    id=shipping_address_id,
                    customer=self.context['request'].user,
                    is_active=True
                )
                data['shipping_address'] = {
                    'street': address.street_address,
                    'apartment': address.apartment,
                    'city': address.city,
                    'state': address.state,
                    'country': address.country,
                    'postal_code': address.postal_code,
                    'full_name': address.full_name,
                    'phone': address.phone,
                    'email': address.email
                }
            except ShippingAddress.DoesNotExist:
                raise serializers.ValidationError(
                    {'shipping_address_id': 'Shipping address not found.'}
                )
        
        return data
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        
        # Create order
        order = Order.objects.create(
            customer=request.user,
            **validated_data
        )
        
        # Create order items
        for item_data in items_data:
            product = item_data.get('product')
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                product_sku=product.sku,
                unit_price=product.discounted_price,
                quantity=item_data['quantity'],
                vendor=product.vendor
            )
        
        # Calculate totals
        order.calculate_totals()
        
        return order

class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments"""
    order_details = OrderSerializer(source='order', read_only=True)
    customer_details = CustomerProfileSerializer(source='customer', read_only=True)
    is_successful = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_details', 'customer', 'customer_details',
            'payment_method', 'payment_provider', 'transaction_id',
            'reference', 'amount', 'fees', 'net_amount', 'status',
            'failure_reason', 'provider_response', 'is_successful',
            'initiated_at', 'completed_at', 'refunded_at'
        ]
        read_only_fields = [
            'id', 'reference', 'net_amount', 'initiated_at',
            'completed_at', 'refunded_at'
        ]

class PaymentInitiateSerializer(serializers.Serializer):
    """Serializer for initiating payments"""
    order_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHOD_CHOICES)
    save_card = serializers.BooleanField(default=False)
    
    def validate_order_id(self, value):
        try:
            order = Order.objects.get(id=value)
            if order.payment_status == 'paid':
                raise serializers.ValidationError('Order is already paid.')
            self.context['order'] = order
            return value
        except Order.DoesNotExist:
            raise serializers.ValidationError('Order not found.')


class PaymentStatusSyncSerializer(serializers.Serializer):
    """Serializer for trusted internal payment status synchronization."""
    status = serializers.ChoiceField(choices=['completed', 'failed', 'processing', 'refunded'])
    event_id = serializers.CharField(max_length=128)
    transaction_id = serializers.CharField(max_length=100, required=False, allow_blank=True)
    failure_reason = serializers.CharField(required=False, allow_blank=True)
    provider_response = serializers.DictField(required=False)

    def validate(self, data):
        status_value = data.get('status')
        failure_reason = (data.get('failure_reason') or '').strip()

        if status_value == 'failed' and not failure_reason:
            raise serializers.ValidationError({
                'failure_reason': 'failure_reason is required when status is failed.'
            })

        return data

class OrderStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating order status"""
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    tracking_number = serializers.CharField(required=False, allow_blank=True)
    courier_id = serializers.IntegerField(required=False)
    
    def validate(self, data):
        order = self.context.get('order')
        new_status = data.get('status')
        
        if order and new_status == 'dispatched':
            if not data.get('tracking_number'):
                raise serializers.ValidationError({
                    'tracking_number': 'Tracking number is required when dispatching order.'
                })
            if not data.get('courier_id'):
                raise serializers.ValidationError({
                    'courier_id': 'Courier ID is required when dispatching order.'
                })
        
        return data

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for order status history"""
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = OrderStatusHistory
        fields = [
            'id', 'order', 'old_status', 'new_status',
            'changed_by', 'changed_by_name', 'notes',
            'created_at'
        ]
        read_only_fields = fields

class OrderStatsSerializer(serializers.Serializer):
    """Serializer for order statistics"""
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_orders = serializers.IntegerField()
    average_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    top_products = serializers.ListField(child=serializers.DictField())