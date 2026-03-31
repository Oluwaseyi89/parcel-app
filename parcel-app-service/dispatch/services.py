# dispatch/services.py
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Dispatch, DispatchItem, CourierLocation, DispatchStatusHistory, DispatchRoute
from order.models import Order, OrderItem
from order.services import OrderService
from authentication.models import AuditLog, CourierUser
from product.models import Product

class DispatchService:
    """Service for dispatch operations"""
    
    @staticmethod
    def create_dispatch(order_id, admin_notes='', request=None):
        """Create a new dispatch for an order"""
        try:
            order = Order.objects.get(id=order_id, status='ready')
        except Order.DoesNotExist:
            raise ValidationError('Order not found or not ready for dispatch.')
        
        with transaction.atomic():
            # Create dispatch
            dispatch = Dispatch.objects.create(
                order=order,
                admin_notes=admin_notes
            )
            
            # Create dispatch items for each order item
            for order_item in order.items.all():
                DispatchItem.objects.create(
                    dispatch=dispatch,
                    order_item=order_item
                )
            
            # Update order status
            order.update_status('dispatched', 'Dispatch created')
            
            # Log dispatch creation
            if request:
                AuditLog.log_action(
                    user=request.user if hasattr(request, 'user') else None,
                    action='create',
                    model_name='Dispatch',
                    object_id=dispatch.id,
                    details={
                        'order_number': order.order_number,
                        'tracking_number': dispatch.tracking_number
                    },
                    request=request
                )
            
            return dispatch
    
    @staticmethod
    def assign_courier(dispatch_id, courier_id, notes='', request=None):
        """Assign a courier to a dispatch"""
        try:
            dispatch = Dispatch.objects.get(id=dispatch_id)
            courier = CourierUser.objects.get(id=courier_id, is_active=True, is_approved=True)
        except Dispatch.DoesNotExist:
            raise ValidationError('Dispatch not found.')
        except CourierUser.DoesNotExist:
            raise ValidationError('Courier not found or not approved.')
        
        if dispatch.status != 'pending':
            raise ValidationError(f'Cannot assign courier to dispatch with status: {dispatch.status}')
        
        if courier.status not in ['active', 'offline']:
            raise ValidationError('Courier is not available for dispatch.')
        
        with transaction.atomic():
            # Assign courier
            dispatch.assign_courier(courier, notes)
            
            # Log assignment
            if request:
                AuditLog.log_action(
                    user=request.user if hasattr(request, 'user') else None,
                    action='update',
                    model_name='Dispatch',
                    object_id=dispatch.id,
                    details={
                        'action': 'courier_assignment',
                        'courier_id': courier.id,
                        'courier_name': courier.get_full_name()
                    },
                    request=request
                )
            
            return dispatch
    
    @staticmethod
    def update_dispatch_status(dispatch_id, new_status, user, notes='', location=None):
        """Update dispatch status with validation"""
        try:
            dispatch = Dispatch.objects.get(id=dispatch_id)
        except Dispatch.DoesNotExist:
            raise ValidationError('Dispatch not found.')
        
        # Validate status transition
        valid_transitions = {
            'pending': ['assigned', 'cancelled'],
            'assigned': ['picking_up', 'cancelled'],
            'picking_up': ['in_transit', 'delayed'],
            'in_transit': ['delivered', 'delayed', 'returned'],
            'delivered': [],
            'cancelled': [],
            'delayed': ['picking_up', 'in_transit'],
            'returned': [],
        }
        
        if new_status not in valid_transitions.get(dispatch.status, []):
            raise ValidationError(
                f'Cannot transition from {dispatch.status} to {new_status}.'
            )
        
        with transaction.atomic():
            # Update dispatch status
            dispatch.update_status(new_status, notes)
            
            # Record location if provided
            if location and user.role == 'courier':
                CourierLocation.objects.create(
                    courier=user,
                    dispatch=dispatch,
                    **location
                )
            
            # Log status change
            AuditLog.log_action(
                user=user,
                action='update',
                model_name='Dispatch',
                object_id=dispatch.id,
                details={
                    'old_status': dispatch.status,
                    'new_status': new_status,
                    'notes': notes
                }
            )
            
            return dispatch
    
    @staticmethod
    def update_dispatch_item(item_id, updates, user, request=None):
        """Update a dispatch item (vendor or courier)"""
        try:
            dispatch_item = DispatchItem.objects.get(id=item_id)
        except DispatchItem.DoesNotExist:
            raise ValidationError('Dispatch item not found.')
        
        with transaction.atomic():
            # Apply updates based on user role
            if user.role == 'vendor':
                # Vendor can only mark as ready for pickup
                if 'is_ready_for_pickup' in updates:
                    dispatch_item.mark_ready_for_pickup(updates.get('vendor_notes', ''))
            elif user.role == 'courier':
                # Courier can mark as picked up or delivered
                if 'is_picked_up' in updates:
                    dispatch_item.mark_picked_up(
                        updates.get('pickup_confirmation_code', ''),
                        updates.get('courier_notes', '')
                    )
                elif 'is_delivered' in updates:
                    dispatch_item.mark_delivered(
                        updates.get('delivery_confirmation_code', ''),
                        updates.get('customer_signature', ''),
                        updates.get('courier_notes', '')
                    )
            
            # Log update
            if request:
                AuditLog.log_action(
                    user=user,
                    action='update',
                    model_name='DispatchItem',
                    object_id=dispatch_item.id,
                    details={
                        'order_item_id': dispatch_item.order_item.id,
                        'updates': updates
                    },
                    request=request
                )
            
            return dispatch_item
    
    @staticmethod
    def get_ready_for_dispatch():
        """Get orders ready for dispatch"""
        # Orders that are paid and ready for dispatch
        orders = Order.objects.filter(
            status='ready',
            payment_status='paid'
        ).select_related('customer').prefetch_related('items', 'items__product', 'items__vendor')
        
        result = []
        for order in orders:
            # Check if dispatch already exists
            if hasattr(order, 'dispatch'):
                continue
            
            order_data = {
                'order_id': order.id,
                'order_number': order.order_number,
                'customer_name': order.customer.get_full_name(),
                'total_items': order.items.count(),
                'total_amount': order.total_amount,
                'shipping_address': order.shipping_address,
                'items': []
            }
            
            # Add items with vendor info
            for item in order.items.all():
                item_data = {
                    'product_id': item.product.id if item.product else None,
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'vendor_id': item.vendor.id,
                    'vendor_name': item.vendor.business_name,
                    'vendor_email': item.vendor.email,
                    'vendor_phone': item.vendor.phone,
                    'vendor_address': {
                        'street': item.vendor.business_street,
                        'state': item.vendor.business_state,
                        'country': item.vendor.business_country
                    }
                }
                order_data['items'].append(item_data)
            
            result.append(order_data)
        
        return result
    
    @staticmethod
    def get_available_couriers_for_dispatch(dispatch_id=None, location_filter=None):
        """Get available couriers for dispatch assignment"""
        couriers = CourierUser.objects.filter(
            is_active=True,
            is_approved=True,
            status__in=['active', 'offline']
        )
        
        if location_filter:
            # Filter by service area (simplified)
            couriers = couriers.filter(
                service_area__icontains=location_filter.get('state', '')
            )
        
        # In production, add distance-based filtering
        return couriers
    
    @staticmethod
    def record_courier_location(courier, latitude, longitude, dispatch_id=None, **extra_data):
        """Record courier location"""
        location = CourierLocation.objects.create(
            courier=courier,
            dispatch_id=dispatch_id,
            latitude=latitude,
            longitude=longitude,
            **extra_data
        )
        
        # Update courier's current location
        courier.update_location(latitude, longitude)
        
        return location
    
    @staticmethod
    def calculate_dispatch_stats(time_period='day'):
        """Calculate dispatch statistics"""
        now = timezone.now()
        
        if time_period == 'day':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif time_period == 'week':
            start_date = now - timedelta(days=7)
        elif time_period == 'month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:  # all time
            start_date = None
        
        queryset = Dispatch.objects.all()
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        
        total_dispatches = queryset.count()
        completed_dispatches = queryset.filter(status='delivered').count()
        active_dispatches = queryset.filter(status__in=['assigned', 'picking_up', 'in_transit']).count()
        
        # Average delivery time
        completed = queryset.filter(status='delivered', completed_at__isnull=False)
        avg_delivery_time = None
        if completed.exists():
            total_seconds = sum(
                (d.completed_at - d.assigned_at).total_seconds() 
                for d in completed if d.assigned_at
            )
            avg_delivery_time = total_seconds / completed.count()
        
        return {
            'total_dispatches': total_dispatches,
            'completed_dispatches': completed_dispatches,
            'active_dispatches': active_dispatches,
            'completion_rate': (completed_dispatches / total_dispatches * 100) if total_dispatches > 0 else 0,
            'average_delivery_time_seconds': avg_delivery_time
        }

class RouteOptimizationService:
    """Service for route optimization"""
    
    @staticmethod
    def optimize_route(dispatch_id):
        """Optimize route for dispatch"""
        try:
            dispatch = Dispatch.objects.get(id=dispatch_id)
        except Dispatch.DoesNotExist:
            raise ValidationError('Dispatch not found.')
        
        # In production, integrate with routing API (Google Maps, Mapbox, etc.)
        # For now, create a simple route
        
        pickup_addresses = dispatch.pickup_addresses
        delivery_address = dispatch.delivery_address
        
        if not pickup_addresses or not delivery_address:
            raise ValidationError('Incomplete address information.')
        
        # Simple route calculation (would be API call in production)
        waypoints = []
        for pickup in pickup_addresses:
            if 'address' in pickup:
                waypoints.append({
                    'type': 'pickup',
                    'vendor_id': pickup.get('vendor_id'),
                    'address': pickup['address']
                })
        
        waypoints.append({
            'type': 'delivery',
            'address': delivery_address
        })
        
        # Create or update route
        route_data = {
            'waypoints': waypoints,
            'optimized_route': {'type': 'FeatureCollection', 'features': []},  # Would be actual route
            'total_distance_km': 15.5,  # Would be calculated
            'estimated_duration_minutes': 45,  # Would be calculated
            'traffic_conditions': 'normal',
            'traffic_delay_minutes': 5
        }
        
        route, created = DispatchRoute.objects.update_or_create(
            dispatch=dispatch,
            defaults=route_data
        )
        
        return route