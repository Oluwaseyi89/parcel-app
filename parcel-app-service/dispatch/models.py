from django.db import models
from django.utils import timezone
from authentication.models import CourierUser, VendorUser
from order.models import Order, OrderItem

class Dispatch(models.Model):
    """Main dispatch tracking model"""
    STATUS_CHOICES = [
        ('pending', 'Pending Assignment'),
        ('assigned', 'Assigned to Courier'),
        ('picking_up', 'Picking Up from Vendors'),
        ('in_transit', 'In Transit to Customer'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('delayed', 'Delayed'),
        ('returned', 'Returned to Vendor'),
    ]
    
    # Relationships
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='dispatch')
    courier = models.ForeignKey(CourierUser, on_delete=models.SET_NULL, 
                               null=True, blank=True, related_name='dispatches')
    
    # Dispatch details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    tracking_number = models.CharField(max_length=50, unique=True, blank=True)
    estimated_pickup_time = models.DateTimeField(null=True, blank=True)
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    
    # Route information
    pickup_addresses = models.JSONField(default=list)  # List of vendor addresses
    delivery_address = models.JSONField(default=dict)   # Customer delivery address
    
    # Metrics
    distance_km = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    estimated_duration_minutes = models.IntegerField(null=True, blank=True)
    
    # Notes
    courier_notes = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    
    # Timestamps
    assigned_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Dispatch"
        verbose_name_plural = "Dispatches"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tracking_number']),
            models.Index(fields=['order', 'status']),
            models.Index(fields=['courier', 'status']),
            models.Index(fields=['status', 'estimated_delivery_time']),
        ]
    
    def __str__(self):
        return f"Dispatch #{self.tracking_number} - Order {self.order.order_number}"
    
    def save(self, *args, **kwargs):
        if not self.tracking_number:
            # Generate tracking number: DISP-YYYYMMDD-XXXXXX
            date_prefix = timezone.now().strftime('%Y%m%d')
            import random
            random_suffix = random.randint(100000, 999999)
            self.tracking_number = f"DISP-{date_prefix}-{random_suffix}"
        
        # Auto-populate addresses from order
        if not self.delivery_address and self.order:
            self.delivery_address = self.order.shipping_address
        
        if not self.pickup_addresses and self.order:
            # Collect unique vendor addresses from order items
            vendor_addresses = []
            for item in self.order.items.all():
                if hasattr(item.vendor, 'business_street'):
                    vendor_addr = {
                        'vendor_id': item.vendor.id,
                        'vendor_name': item.vendor.business_name,
                        'address': {
                            'street': item.vendor.business_street,
                            'city': item.vendor.business_state,
                            'state': item.vendor.business_state,
                            'country': item.vendor.business_country
                        },
                        'contact': {
                            'phone': item.vendor.phone,
                            'email': item.vendor.email
                        }
                    }
                    if vendor_addr not in vendor_addresses:
                        vendor_addresses.append(vendor_addr)
            self.pickup_addresses = vendor_addresses
        
        super().save(*args, **kwargs)
    
    def assign_courier(self, courier, notes=''):
        """Assign a courier to this dispatch"""
        self.courier = courier
        self.status = 'assigned'
        self.assigned_at = timezone.now()
        self.courier_notes = notes
        self.save()
        
        # Update courier status
        courier.status = 'on_delivery'
        courier.save()
        
        return self
    
    def update_status(self, new_status, notes=''):
        """Update dispatch status"""
        old_status = self.status
        self.status = new_status
        
        # Update timestamps based on status
        if new_status == 'picking_up' and old_status == 'assigned':
            self.started_at = timezone.now()
        elif new_status == 'delivered':
            self.completed_at = timezone.now()
            # Update order status
            self.order.update_status('delivered', 'Dispatch completed')
        
        self.save()
        
        # Create status history
        DispatchStatusHistory.objects.create(
            dispatch=self,
            old_status=old_status,
            new_status=new_status,
            notes=notes
        )
        
        return self

class DispatchItem(models.Model):
    """Track individual items within a dispatch"""
    STATUS_CHOICES = [
        ('pending', 'Pending Pickup'),
        ('picked_up', 'Picked Up from Vendor'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered to Customer'),
        ('cancelled', 'Cancelled'),
        ('returned', 'Returned to Vendor'),
    ]
    
    # Relationships
    dispatch = models.ForeignKey(Dispatch, on_delete=models.CASCADE, related_name='items')
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='dispatch_items')
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Vendor interaction
    is_ready_for_pickup = models.BooleanField(default=False)
    is_picked_up = models.BooleanField(default=False)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    pickup_confirmation_code = models.CharField(max_length=10, blank=True)
    
    # Delivery to customer
    is_delivered = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(null=True, blank=True)
    delivery_confirmation_code = models.CharField(max_length=10, blank=True)
    customer_signature = models.TextField(blank=True)  # Base64 encoded signature
    
    # Notes
    vendor_notes = models.TextField(blank=True)
    courier_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Dispatch Item"
        verbose_name_plural = "Dispatch Items"
        unique_together = ['dispatch', 'order_item']
        indexes = [
            models.Index(fields=['dispatch', 'status']),
            models.Index(fields=['order_item', 'status']),
        ]
    
    def __str__(self):
        return f"{self.order_item.product_name} - {self.status}"
    
    def mark_ready_for_pickup(self, vendor_notes=''):
        """Mark item as ready for pickup by vendor"""
        self.is_ready_for_pickup = True
        self.vendor_notes = vendor_notes
        self.save()
        return self
    
    def mark_picked_up(self, confirmation_code='', courier_notes=''):
        """Mark item as picked up by courier"""
        self.is_picked_up = True
        self.picked_up_at = timezone.now()
        self.pickup_confirmation_code = confirmation_code
        self.courier_notes = courier_notes
        self.status = 'picked_up'
        self.save()
        return self
    
    def mark_delivered(self, confirmation_code='', signature='', notes=''):
        """Mark item as delivered to customer"""
        self.is_delivered = True
        self.delivered_at = timezone.now()
        self.delivery_confirmation_code = confirmation_code
        self.customer_signature = signature
        self.courier_notes = notes
        self.status = 'delivered'
        self.save()
        
        # Update order item status
        self.order_item.status = 'delivered'
        self.order_item.save()
        
        return self

class DispatchStatusHistory(models.Model):
    """Track dispatch status changes"""
    dispatch = models.ForeignKey(Dispatch, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey('authentication.AdminUser', on_delete=models.SET_NULL, 
                                  null=True, blank=True, related_name='dispatch_status_changes')
    notes = models.TextField(blank=True)
    location = models.JSONField(default=dict, blank=True)  # GPS coordinates
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Dispatch Status History"
        verbose_name_plural = "Dispatch Status Histories"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['dispatch', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.dispatch.tracking_number}: {self.old_status} → {self.new_status}"

class CourierLocation(models.Model):
    """Track courier locations during dispatch"""
    courier = models.ForeignKey(CourierUser, on_delete=models.CASCADE, related_name='locations')
    dispatch = models.ForeignKey(Dispatch, on_delete=models.CASCADE, related_name='locations', 
                                null=True, blank=True)
    
    # GPS coordinates
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # in meters
    
    # Additional data
    speed = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # km/h
    bearing = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # degrees
    altitude = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)  # meters
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Courier Location"
        verbose_name_plural = "Courier Locations"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['courier', 'created_at']),
            models.Index(fields=['dispatch', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.courier.get_full_name()} - {self.latitude}, {self.longitude}"

class DispatchRoute(models.Model):
    """Optimized route for dispatch"""
    dispatch = models.OneToOneField(Dispatch, on_delete=models.CASCADE, related_name='route')
    
    # Route points (GeoJSON format simplified)
    waypoints = models.JSONField(default=list)
    optimized_route = models.JSONField(default=dict, blank=True)
    
    # Route metrics
    total_distance_km = models.DecimalField(max_digits=8, decimal_places=2)
    estimated_duration_minutes = models.IntegerField()
    fuel_estimate_liters = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Traffic data
    traffic_conditions = models.CharField(max_length=50, blank=True)
    traffic_delay_minutes = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Dispatch Route"
        verbose_name_plural = "Dispatch Routes"
    
    def __str__(self):
        return f"Route for {self.dispatch.tracking_number}"