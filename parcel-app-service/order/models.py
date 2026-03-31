# order/models.py
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from authentication.models import CustomerUser, CourierUser
from product.models import Product

class Order(models.Model):
    """Main order model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('ready', 'Ready for Dispatch'),
        ('dispatched', 'Dispatched'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('failed', 'Failed'),
    ]
    
    SHIPPING_METHOD_CHOICES = [
        ('pickup', 'Pick Up'),
        ('delivery', 'Delivery'),
        ('express', 'Express Delivery'),
    ]
    
    # Customer relationship
    customer = models.ForeignKey(CustomerUser, on_delete=models.PROTECT, related_name='orders')
    
    # Order details
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    shipping_method = models.CharField(max_length=20, choices=SHIPPING_METHOD_CHOICES, default='pickup')
    shipping_address = models.JSONField(default=dict)  # Store address details
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Pricing
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Payment
    payment_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ], default='pending')
    
    payment_method = models.CharField(max_length=50, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    
    # Delivery
    courier = models.ForeignKey(CourierUser, on_delete=models.SET_NULL, 
                               null=True, blank=True, related_name='deliveries')
    tracking_number = models.CharField(max_length=50, blank=True)
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    # Notes
    customer_notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['payment_status']),
        ]
    
    def __str__(self):
        return f"Order #{self.order_number} - {self.customer.get_full_name()}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate order number: ORD-YYYYMMDD-XXXXX
            date_prefix = timezone.now().strftime('%Y%m%d')
            last_order = Order.objects.filter(
                order_number__startswith=f'ORD-{date_prefix}-'
            ).order_by('order_number').last()
            
            if last_order:
                last_num = int(last_order.order_number.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            self.order_number = f"ORD-{date_prefix}-{new_num:05d}"
        
        # Calculate totals if not set
        if not self.total_amount and self.pk:
            self.calculate_totals()
        
        super().save(*args, **kwargs)
    
    def calculate_totals(self):
        """Calculate order totals from order items"""
        items = self.items.all()
        self.subtotal = sum(item.total_price for item in items)
        self.total_amount = self.subtotal + self.shipping_fee + self.tax_amount - self.discount_amount
        self.save(update_fields=['subtotal', 'total_amount'])
    
    @property
    def is_paid(self):
        return self.payment_status == 'paid'
    
    @property
    def can_be_cancelled(self):
        return self.status in ['pending', 'confirmed', 'processing']
    
    @property
    def delivery_address(self):
        """Format delivery address from JSON"""
        addr = self.shipping_address
        parts = [
            addr.get('street', ''),
            addr.get('city', ''),
            addr.get('state', ''),
            addr.get('country', ''),
            addr.get('postal_code', '')
        ]
        return ', '.join(filter(None, parts))
    
    def update_status(self, new_status, notes=''):
        """Update order status with history tracking"""
        old_status = self.status
        self.status = new_status
        
        # Set timestamps for specific status changes
        if new_status == 'confirmed' and old_status == 'pending':
            self.confirmed_at = timezone.now()
        elif new_status == 'delivered':
            self.delivered_at = timezone.now()
        elif new_status == 'cancelled':
            self.cancelled_at = timezone.now()
        
        self.save()
        
        # Create status history entry
        OrderStatusHistory.objects.create(
            order=self,
            old_status=old_status,
            new_status=new_status,
            notes=notes
        )
        
        return self

class OrderItem(models.Model):
    """Individual items within an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='order_items')
    
    # Item details
    product_name = models.CharField(max_length=200)
    product_sku = models.CharField(max_length=50)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Vendor information
    vendor = models.ForeignKey('authentication.VendorUser', on_delete=models.PROTECT, 
                              related_name='order_items')
    
    # Status
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ], default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"
        unique_together = ['order', 'product']
        indexes = [
            models.Index(fields=['order', 'vendor']),
            models.Index(fields=['vendor', 'status']),
        ]
    
    def __str__(self):
        return f"{self.quantity}x {self.product_name} (Order #{self.order.order_number})"
    
    @property
    def discounted_unit_price(self):
        """Calculate discounted unit price"""
        discount_amount = (self.discount_percentage / 100) * self.unit_price
        return self.unit_price - discount_amount
    
    @property
    def total_price(self):
        """Calculate total price for this line item"""
        return self.discounted_unit_price * self.quantity
    
    def update_inventory(self):
        """Update product inventory when item status changes"""
        if self.status == 'confirmed' and self.product:
            # Reserve inventory
            self.product.update_inventory(-self.quantity)
        elif self.status == 'cancelled' and self.product:
            # Return inventory
            self.product.update_inventory(self.quantity)

class OrderStatusHistory(models.Model):
    """Track order status changes"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey('authentication.AdminUser', on_delete=models.SET_NULL, 
                                  null=True, blank=True, related_name='order_status_changes')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Order Status History"
        verbose_name_plural = "Order Status Histories"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.order.order_number}: {self.old_status} → {self.new_status}"

class Payment(models.Model):
    """Payment information for orders"""
    PAYMENT_METHOD_CHOICES = [
        ('card', 'Credit/Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash_on_delivery', 'Cash on Delivery'),
        ('wallet', 'Digital Wallet'),
        ('payment_link', 'Payment Link'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]
    
    # Relationships
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    customer = models.ForeignKey(CustomerUser, on_delete=models.PROTECT, related_name='payments')
    
    # Payment details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_provider = models.CharField(max_length=50, blank=True)  # e.g., 'Paystack', 'Flutterwave'
    transaction_id = models.CharField(max_length=100, unique=True, blank=True)
    reference = models.CharField(max_length=100, unique=True)
    
    # Amounts
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    failure_reason = models.TextField(blank=True)
    
    # Provider response data
    provider_response = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['transaction_id']),
            models.Index(fields=['reference']),
            models.Index(fields=['order', 'status']),
            models.Index(fields=['customer', 'initiated_at']),
        ]
    
    def __str__(self):
        return f"Payment {self.reference} - {self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.reference:
            # Generate reference: PAY-YYYYMMDD-XXXXXX
            date_prefix = timezone.now().strftime('%Y%m%d')
            import random
            random_suffix = random.randint(100000, 999999)
            self.reference = f"PAY-{date_prefix}-{random_suffix}"
        
        # Calculate net amount
        self.net_amount = self.amount - self.fees
        
        super().save(*args, **kwargs)
    
    @property
    def is_successful(self):
        return self.status == 'completed'
    
    def mark_as_completed(self, transaction_id='', provider_response=None):
        """Mark payment as completed"""
        self.status = 'completed'
        self.transaction_id = transaction_id
        self.completed_at = timezone.now()
        
        if provider_response:
            self.provider_response = provider_response
        
        self.save()
        
        # Update order payment status
        self.order.payment_status = 'paid'
        self.order.save()
        
        return self

class ShippingAddress(models.Model):
    """Customer shipping addresses"""
    customer = models.ForeignKey(CustomerUser, on_delete=models.CASCADE, related_name='shipping_addresses')
    
    # Address details
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    
    street_address = models.CharField(max_length=200)
    apartment = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    
    # Flags
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Shipping Address"
        verbose_name_plural = "Shipping Addresses"
        ordering = ['-is_default', '-created_at']
        indexes = [
            models.Index(fields=['customer', 'is_default']),
        ]
    
    def __str__(self):
        return f"{self.full_name} - {self.city}, {self.country}"
    
    def save(self, *args, **kwargs):
        # Ensure only one default address per customer
        if self.is_default:
            ShippingAddress.objects.filter(
                customer=self.customer, 
                is_default=True
            ).update(is_default=False)
        
        super().save(*args, **kwargs)
    
    @property
    def formatted_address(self):
        """Get formatted address string"""
        parts = [
            self.street_address,
            self.apartment,
            self.city,
            self.state,
            self.country,
            self.postal_code
        ]
        return ', '.join(filter(None, parts))