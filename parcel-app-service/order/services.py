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
    def register_payment(
        order,
        reference,
        payment_method,
        amount,
        payment_provider='paystack',
        fees=Decimal('0.00'),
        status='pending',
        transaction_id='',
        failure_reason='',
        provider_response=None,
        customer=None,
    ):
        """Create or update a canonical payment record idempotently by reference."""
        if provider_response is None:
            provider_response = {}

        if customer is None:
            customer = order.customer

        with transaction.atomic():
            payment, created = Payment.objects.select_for_update().get_or_create(
                reference=reference,
                defaults={
                    'order': order,
                    'customer': customer,
                    'payment_method': payment_method,
                    'payment_provider': payment_provider,
                    'transaction_id': transaction_id,
                    'amount': amount,
                    'fees': fees,
                    'status': status,
                    'failure_reason': failure_reason,
                    'provider_response': provider_response,
                },
            )

            if not created:
                updates = []

                if payment.order_id != order.id:
                    payment.order = order
                    updates.append('order')
                if payment.customer_id != customer.id:
                    payment.customer = customer
                    updates.append('customer')
                if payment.payment_method != payment_method:
                    payment.payment_method = payment_method
                    updates.append('payment_method')
                if payment.payment_provider != payment_provider:
                    payment.payment_provider = payment_provider
                    updates.append('payment_provider')
                if payment.amount != amount:
                    payment.amount = amount
                    updates.append('amount')
                if payment.fees != fees:
                    payment.fees = fees
                    updates.append('fees')
                if payment.status != status:
                    payment.status = status
                    updates.append('status')
                if failure_reason and payment.failure_reason != failure_reason:
                    payment.failure_reason = failure_reason
                    updates.append('failure_reason')
                if transaction_id and payment.transaction_id != transaction_id:
                    duplicate_txn = Payment.objects.filter(transaction_id=transaction_id).exclude(pk=payment.pk).exists()
                    if duplicate_txn:
                        raise ValidationError(f"transaction_id {transaction_id} already belongs to another payment.")
                    payment.transaction_id = transaction_id
                    updates.append('transaction_id')
                if isinstance(provider_response, dict) and provider_response:
                    merged_response = payment.provider_response if isinstance(payment.provider_response, dict) else {}
                    merged_response = dict(merged_response)
                    merged_response.update(provider_response)
                    payment.provider_response = merged_response
                    updates.append('provider_response')

                if updates:
                    payment.save(update_fields=updates)

            order_updates = []
            if order.payment_reference != reference:
                order.payment_reference = reference
                order_updates.append('payment_reference')
            if not order.payment_method or order.payment_method != payment_method:
                order.payment_method = payment_method
                order_updates.append('payment_method')
            if order_updates:
                order.save(update_fields=order_updates + ['updated_at'])

            return payment, (not created)

    @staticmethod
    def sync_payment_status(reference, status_value, event_id, transaction_id='', failure_reason='', provider_response=None):
        """
        Idempotent payment status synchronization.
        - Looks up and locks Payment by reference.
        - Persists status and provider data updates.
        - Applies order payment status transitions.
        - Returns (payment, is_duplicate) tuple.
        """
        if provider_response is None:
            provider_response = {}

        with transaction.atomic():
            try:
                payment = Payment.objects.select_for_update().select_related('order').get(reference=reference)
            except Payment.DoesNotExist:
                raise ValidationError(f"Payment with reference {reference} not found.")

            existing_response = payment.provider_response if isinstance(payment.provider_response, dict) else {}
            sync_meta = existing_response.get('_sync_meta', {}) if isinstance(existing_response.get('_sync_meta', {}), dict) else {}
            processed_event_ids = sync_meta.get('event_ids', [])
            if not isinstance(processed_event_ids, list):
                processed_event_ids = []

            if event_id in processed_event_ids:
                return payment, True

            if transaction_id:
                duplicate_txn = Payment.objects.filter(transaction_id=transaction_id).exclude(pk=payment.pk).exists()
                if duplicate_txn:
                    raise ValidationError(f"transaction_id {transaction_id} already belongs to another payment.")
                payment.transaction_id = transaction_id

            payment.status = status_value

            if status_value == 'failed':
                payment.failure_reason = failure_reason or payment.failure_reason or 'Payment failed'
            else:
                payment.failure_reason = ''

            now = timezone.now()
            if status_value == 'completed' and payment.completed_at is None:
                payment.completed_at = now
            if status_value in ('refunded', 'partially_refunded') and payment.refunded_at is None:
                payment.refunded_at = now

            merged_response = dict(existing_response)
            if isinstance(provider_response, dict):
                merged_response.update(provider_response)

            processed_event_ids.append(event_id)
            sync_meta['event_ids'] = processed_event_ids[-50:]
            sync_meta['last_event_id'] = event_id
            sync_meta['last_synced_at'] = now.isoformat()
            merged_response['_sync_meta'] = sync_meta

            payment.provider_response = merged_response
            payment.save()

            order = payment.order
            order_status_map = {
                'completed': 'paid',
                'failed': 'failed',
                'refunded': 'refunded',
            }
            next_order_payment_status = order_status_map.get(status_value)
            if next_order_payment_status:
                order.payment_status = next_order_payment_status
                if not order.payment_reference:
                    order.payment_reference = payment.reference
                if not order.payment_method:
                    order.payment_method = payment.payment_method
                order.save(update_fields=['payment_status', 'payment_reference', 'payment_method', 'updated_at'])

            return payment, False
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