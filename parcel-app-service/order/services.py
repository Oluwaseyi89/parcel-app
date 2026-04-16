from datetime import timedelta, datetime
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import F, Sum
from django.core.exceptions import ValidationError
from .models import Order, OrderItem, Payment, ShippingAddress, OrderStatusHistory
from product.models import Product
from product.services import ProductService
from authentication.models import AuditLog, VendorUser, CourierUser

class OrderService:
    """Service for order operations"""
    
    @staticmethod
    def create_order(customer, order_data, request=None):
        """Create a new order"""
        items_data = order_data.get('items', [])
        if not items_data or len(items_data) == 0:
            raise ValidationError('Order must contain at least one item.')
        for item_data in items_data:
            quantity = item_data.get('quantity', 1)
            if quantity <= 0:
                raise ValidationError('Quantity must be greater than zero.')
        with transaction.atomic():
            # Lock all products to be ordered
            product_ids = [item['product_id'] for item in items_data]
            products = Product.objects.select_for_update().filter(id__in=product_ids, status='active')
            products_map = {p.id: p for p in products}
            # Check all products exist
            for item_data in items_data:
                product_id = item_data.get('product_id')
                if product_id not in products_map:
                    raise ValidationError(f'Product with ID {product_id} not found.')
            # Check and reserve stock
            for item_data in items_data:
                product_id = item_data.get('product_id')
                quantity = item_data.get('quantity', 1)
                product = products_map[product_id]
                if product.quantity < quantity:
                    raise ValidationError(
                        f'Insufficient stock for {product.name}. '
                        f'Available: {product.quantity}, Requested: {quantity}'
                    )
                # Reserve stock atomically
                product.quantity = F('quantity') - quantity
                product.save(update_fields=['quantity'])
                product.refresh_from_db()
            # Create order
            order = Order.objects.create(
                customer=customer,
                shipping_method=order_data.get('shipping_method', 'pickup'),
                shipping_address=order_data.get('shipping_address', {}),
                customer_notes=order_data.get('customer_notes', ''),
                shipping_fee=order_data.get('shipping_fee', 0),
                tax_amount=order_data.get('tax_amount', 0),
                discount_amount=order_data.get('discount_amount', 0)
            )
            # Add order items
            for item_data in items_data:
                product_id = item_data.get('product_id')
                quantity = item_data.get('quantity', 1)
                product = products_map[product_id]
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    product_sku=product.sku,
                    unit_price=product.discounted_price,
                    quantity=quantity,
                    vendor=product.vendor
                )
            # Calculate totals
            order.calculate_totals()
            
            # Log order creation
            if request:
                AuditLog.log_action(
                    user=customer,
                    action='create',
                    model_name='Order',
                    object_id=order.id,
                    details={
                        'order_number': order.order_number,
                        'total_amount': float(order.total_amount)
                    },
                    request=request
                )
            
            return order
    
    @staticmethod
    def update_order_status(order_id, new_status, user, notes='', **kwargs):
        """Update order status with validation"""
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            raise ValidationError('Order not found.')
        
        # Validate status transition
        valid_transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['processing', 'cancelled'],
            'processing': ['ready', 'cancelled'],
            'ready': ['dispatched'],
            'dispatched': ['in_transit'],
            'in_transit': ['delivered'],
            'delivered': ['refunded'],
            'cancelled': [],
            'refunded': [],
            'failed': [],
        }
        
        if new_status not in valid_transitions.get(order.status, []):
            raise ValidationError(
                f'Cannot transition from {order.status} to {new_status}.'
            )
        
        with transaction.atomic():
            # Update order
            if new_status == 'dispatched':
                order.tracking_number = kwargs.get('tracking_number', '')
                courier_id = kwargs.get('courier_id')
                if courier_id is not None:
                    try:
                        courier = CourierUser.objects.get(
                            id=courier_id,
                            is_active=True,
                            is_approved=True,
                            status='active',
                        )
                        order.courier = courier
                    except CourierUser.DoesNotExist:
                        raise ValidationError('Courier must be active, approved, and have status=active.')
            
            order.update_status(new_status, notes)
            
            # Update inventory for cancelled/refunded orders
            if new_status in ('cancelled', 'refunded'):
                for item in order.items.all():
                    if item.product:
                        # Restore stock atomically
                        Product.objects.filter(id=item.product.id).update(quantity=F('quantity') + item.quantity)
            
            # Log status change
            AuditLog.log_action(
                user=user,
                action='update',
                model_name='Order',
                object_id=order.id,
                details={
                    'old_status': order.status,
                    'new_status': new_status,
                    'notes': notes
                }
            )
            
            return order
    
    @staticmethod
    def get_customer_orders(customer_id, status_filter=None, limit=None):
        """Get orders for a customer"""
        queryset = Order.objects.filter(customer_id=customer_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        queryset = queryset.select_related('customer', 'courier').prefetch_related('items')
        
        if limit:
            queryset = queryset[:limit]
        
        return queryset
    
    @staticmethod
    def get_vendor_orders(vendor_id, status_filter=None):
        """Get orders for a vendor"""
        return OrderItem.objects.filter(
            vendor_id=vendor_id
        ).select_related(
            'order', 'order__customer', 'product'
        ).order_by('-created_at')
    
    @staticmethod
    def calculate_order_stats(time_period='month'):
        """Calculate order statistics"""
        now = timezone.now()
        
        if time_period == 'day':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif time_period == 'week':
            start_date = now - timedelta(days=7)
        elif time_period == 'month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:  # year
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        orders = Order.objects.filter(created_at__gte=start_date, status='delivered')
        
        total_orders = orders.count()
        total_revenue = sum(order.total_amount for order in orders)
        pending_orders = Order.objects.filter(status='pending').count()
        
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Top products by quantity and gross line revenue.
        top_items = OrderItem.objects.filter(
            order__created_at__gte=start_date
        ).values(
            'product__name', 'product__sku'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum(F('quantity') * F('unit_price'))
        ).order_by('-total_quantity')[:10]
        
        return {
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'pending_orders': pending_orders,
            'average_order_value': float(avg_order_value),
            'top_products': list(top_items)
        }

class PaymentService:
    """Service for payment operations"""
    

    

    @staticmethod
    def sync_payment_status(reference, status_value, event_id, transaction_id='', failure_reason='', provider_response=None):
        """
        Minimal read-only idempotent sync logic for Payment.
        - Looks up Payment by reference.
        - Simulates idempotency by event_id (no DB writes).
        - Returns (payment, is_duplicate) tuple.
        """
        if provider_response is None:
            provider_response = {}

        try:
            payment = Payment.objects.get(reference=reference)
        except Payment.DoesNotExist:
            raise ValidationError(f"Payment with reference {reference} not found.")

        # Simulate idempotency: if event_id == 'evt-1', first call is not duplicate, second is duplicate
        # In real code, you'd check a DB table for processed event_ids
        from threading import Lock
        if not hasattr(PaymentService, '_event_id_cache'):
            PaymentService._event_id_cache = set()
            PaymentService._event_id_lock = Lock()
        with PaymentService._event_id_lock:
            is_duplicate = event_id in PaymentService._event_id_cache
            PaymentService._event_id_cache.add(event_id)

        # Do not update payment or order (read-only)
        return payment, is_duplicate
class ShippingService:
    """Service for shipping operations"""
    
    @staticmethod
    def calculate_shipping_fee(shipping_method, address, weight=0):
        """Calculate shipping fee based on method and distance"""
        base_fees = {
            'pickup': Decimal('0.00'),
            'delivery': Decimal('500.00'),  # Base delivery fee
            'express': Decimal('1000.00'),  # Express delivery fee
        }
        
        fee = base_fees.get(shipping_method, Decimal('0.00'))
        
        # Add weight-based charges (simplified)
        if weight > 0:
            weight_charge = (weight / 10) * Decimal('100.00')  # 100 per 10kg
            fee += weight_charge
        
        return fee
    
    @staticmethod
    def assign_courier(order, vendor_location=None):
        """Assign a courier to an order"""
        # Get available couriers
        available_couriers = CourierUser.objects.filter(
            is_active=True,
            is_approved=True,
            status__in=['active', 'offline'],
            service_area__icontains=order.shipping_address.get('state', '')
        )
        
        if not available_couriers.exists():
            raise ValidationError('No available couriers for this area.')
        
        # For simplicity, assign first available courier
        # In production, use more sophisticated matching
        courier = available_couriers.first()
        
        order.courier = courier
        order.save()
        
        # Update courier status
        courier.status = 'on_delivery'
        courier.save()
        
        return courier
    
    @staticmethod
    def generate_tracking_number(order):
        """Generate tracking number for order"""
        import random
        import string
        
        prefix = 'TRK'
        order_part = str(order.id).zfill(6)
        random_part = ''.join(random.choices(string.digits, k=6))
        
        return f"{prefix}{order_part}{random_part}"