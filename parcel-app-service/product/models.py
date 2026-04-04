# product/models.py
from django.db import models
from django.utils import timezone
from authentication.models import VendorUser

class Category(models.Model):
    """Product category model"""
    CATEGORY_CHOICES = [
        ('clothing', 'Clothing & Fashion'),
        ('electronics', 'Electronics'),
        ('furniture', 'Furniture'),
        ('home_appliances', 'Home Appliances'),
        ('groceries', 'Groceries'),
        ('books', 'Books & Stationery'),
        ('beauty', 'Beauty & Personal Care'),
        ('sports', 'Sports & Outdoors'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Product(models.Model):
    """Approved product for sale"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('out_of_stock', 'Out of Stock'),
        ('discontinued', 'Discontinued'),
        ('archived', 'Archived'),
    ]
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('changes_requested', 'Changes Requested'),
    ]
    
    # Vendor relationship
    vendor = models.ForeignKey(VendorUser, on_delete=models.CASCADE, related_name='products')
    
    # Product Information
    name = models.CharField(max_length=100)
    description = models.TextField()
    model = models.CharField(max_length=50, blank=True)
    brand = models.CharField(max_length=50, blank=True)
    
    # Category relationship
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    
    # Pricing and Inventory
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Vendor cost
    
    # Images (multiple images support)
    main_image = models.ImageField(upload_to='product_images/')
    image_url = models.URLField(blank=True)
    additional_images = models.JSONField(default=list, blank=True)  # List of image URLs
    
    # Metadata
    sku = models.CharField(max_length=50, unique=True)
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions = models.CharField(max_length=50, blank=True)
    
    # Product attributes (for variations)
    attributes = models.JSONField(default=dict, blank=True)  # e.g., {"color": "red", "size": "M"}
    
    # SEO
    slug = models.SlugField(unique=True, max_length=200)
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.TextField(blank=True)
    
    # Status and timestamps
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)
    views_count = models.IntegerField(default=0)
    sold_count = models.IntegerField(default=0)
    
    # Approval info
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey('authentication.AdminUser', on_delete=models.SET_NULL, 
                                   null=True, related_name='approved_products')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['sku']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.vendor.business_name}"
    
    @property
    def discounted_price(self):
        """Calculate discounted price"""
        discount_amount = (self.discount_percentage / 100) * self.price
        return float(self.price - discount_amount)
    
    @property
    def is_available(self):
        """Check if product is available for purchase"""
        return self.status == 'active' and self.quantity > 0
    
    @property
    def stock_status(self):
        """Get stock status label"""
        if self.quantity <= 0:
            return 'Out of Stock'
        elif self.quantity <= 10:
            return f'Only {self.quantity} left'
        return 'In Stock'
    
    def update_inventory(self, quantity_change):
        """Update product inventory"""
        self.quantity += quantity_change
        
        if self.quantity <= 0:
            self.status = 'out_of_stock'
            self.quantity = 0
        
        self.save()
    
    def increment_views(self):
        """Increment view count"""
        self.views_count += 1
        self.save(update_fields=['views_count'])