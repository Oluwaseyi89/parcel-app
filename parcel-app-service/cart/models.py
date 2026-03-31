# cart/models.py
from django.db import models
from authentication.models import CustomerUser

class CartSession(models.Model):
    SHIPPING_CHOICES = [
        ('pick_up', 'Pick Up'),
        ('delivery', 'Delivery'),
    ]
    
    customer = models.ForeignKey(CustomerUser, on_delete=models.CASCADE, related_name='carts', null=True, blank=True)
    customer_name = models.CharField(max_length=100)
    total_items = models.IntegerField(default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shipping_method = models.CharField(max_length=25, choices=SHIPPING_CHOICES, default='pick_up')
    zip_code = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Cart Session"
        verbose_name_plural = "Cart Sessions"
        ordering = ['-created_at']
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

class CartDetail(models.Model):
    session = models.ForeignKey(CartSession, on_delete=models.CASCADE, related_name='items')
    product_id = models.IntegerField()
    product_name = models.CharField(max_length=100)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Cart Detail"
        verbose_name_plural = "Cart Details"
        unique_together = ['session', 'product_id']
        ordering = ['created_at']
    
    @property
    def total_price(self):
        return self.unit_price * self.quantity