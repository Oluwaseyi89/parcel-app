# product/serializers.py
from rest_framework import serializers
from django.utils.text import slugify
from django.utils import timezone
from .models import Category, Product
from authentication.serializers import SimpleAdminSerializer

class CategorySerializer(serializers.ModelSerializer):
    """Serializer for product categories"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        if 'slug' not in validated_data:
            validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)

class TempProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products pending approval."""
    vendor_email = serializers.EmailField(write_only=True, required=False)
    image = serializers.ImageField(source='main_image', write_only=True, required=True)
    
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'model', 'brand', 'category',
            'price', 'quantity', 'discount_percentage', 'image',
            'weight', 'dimensions', 'vendor_email'
        ]
        extra_kwargs = {
            'image': {'required': True},
            'category': {'required': True},
        }
    
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Price must be greater than zero.')
        return value
    
    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError('Quantity cannot be negative.')
        return value
    
    def create(self, validated_data):
        vendor_email = validated_data.pop('vendor_email', None)
        request = self.context.get('request')
        
        if request and hasattr(request, 'user'):
            # Use authenticated vendor
            validated_data['vendor'] = request.user
        elif vendor_email:
            # Look up vendor by email
            from authentication.models import VendorUser
            try:
                vendor = VendorUser.objects.get(email=vendor_email, is_active=True)
                validated_data['vendor'] = vendor
            except VendorUser.DoesNotExist:
                raise serializers.ValidationError({'vendor_email': 'Vendor not found or inactive.'})
        else:
            raise serializers.ValidationError({'vendor_email': 'Vendor email is required.'})

        # Create pending product on primary table (single-record lifecycle).
        validated_data['approval_status'] = 'pending'
        validated_data['status'] = 'active'
        validated_data['submitted_at'] = timezone.now()

        if not validated_data.get('slug'):
            base_slug = slugify(validated_data['name'])[:180] or 'product'
            validated_data['slug'] = f"{base_slug}-{int(timezone.now().timestamp())}"

        if not validated_data.get('sku'):
            vendor_prefix = (validated_data['vendor'].business_name[:3] if validated_data['vendor'].business_name else 'VEN').upper()
            category_obj = validated_data.get('category')
            category_prefix = (category_obj.name[:3] if category_obj else 'GEN').upper()
            timestamp = str(int(timezone.now().timestamp()))[-6:]
            validated_data['sku'] = f"{vendor_prefix}-{category_prefix}-{timestamp}"
        
        return super().create(validated_data)

class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating approved products"""
    class Meta:
        model = Product
        fields = [
            'vendor', 'name', 'description', 'model', 'brand',
            'category', 'price', 'quantity', 'discount_percentage',
            'cost_price', 'main_image', 'weight', 'dimensions',
            'attributes', 'meta_title', 'meta_description'
        ]
    
    def validate(self, data):
        # Ensure vendor is approved
        vendor = data.get('vendor')
        if vendor and not vendor.is_approved:
            raise serializers.ValidationError({'vendor': 'Vendor must be approved to create products.'})
        
        # Auto-generate slug if not provided
        if 'slug' not in data and 'name' in data:
            data['slug'] = slugify(data['name'])
        
        return data
    
    def create(self, validated_data):
        product = super().create(validated_data)
        
        # Set approved_by if admin is approving
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(request.user, 'role') and request.user.role in ['super_admin', 'admin']:
                product.approved_by = request.user
                product.approved_at = timezone.now()
                product.status = 'active'
                product.published_at = timezone.now()
                product.save()
        
        return product

class ProductSerializer(serializers.ModelSerializer):
    """Serializer for approved products"""
    vendor_name = serializers.CharField(source='vendor.get_full_name', read_only=True)
    vendor_business = serializers.CharField(source='vendor.business_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock_status = serializers.CharField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'model', 'brand',
            'category', 'category_name', 'price', 'quantity',
            'discount_percentage', 'discounted_price', 'cost_price',
            'main_image', 'image_url', 'additional_images',
            'sku', 'weight', 'dimensions', 'attributes',
            'vendor', 'vendor_name', 'vendor_business',
            'status', 'approval_status', 'rejection_reason', 'submitted_at', 'reviewed_at',
            'stock_status', 'is_available', 'is_featured',
            'views_count', 'sold_count', 'meta_title', 'meta_description',
            'approved_by', 'approved_by_name', 'approved_at',
            'created_at', 'updated_at', 'published_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ProductUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating products"""
    class Meta:
        model = Product
        fields = [
            'price', 'quantity', 'discount_percentage', 'cost_price',
            'status', 'is_featured', 'meta_title', 'meta_description'
        ]
        extra_kwargs = {
            'price': {'required': False},
            'quantity': {'required': False},
        }
    
    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError('Quantity cannot be negative.')
        return value
    
    def update(self, instance, validated_data):
        # Track inventory changes
        if 'quantity' in validated_data:
            old_quantity = instance.quantity
            new_quantity = validated_data['quantity']
            
            # You could log inventory changes here
        
        return super().update(instance, validated_data)

class ProductApprovalSerializer(serializers.Serializer):
    """Serializer for product approval decisions"""
    action = serializers.ChoiceField(choices=['approve', 'reject', 'request_changes', 'suspend', 'reactivate'])
    comments = serializers.CharField(required=False, allow_blank=True)
    product_id = serializers.IntegerField(required=False)
    
    def validate(self, data):
        action = data.get('action')
        comments = data.get('comments', '')
        
        if action in ['reject', 'request_changes'] and not comments.strip():
            raise serializers.ValidationError({
                'comments': 'Comments are required for reject and request_changes actions.'
            })
        
        return data

class ProductSearchSerializer(serializers.Serializer):
    """Serializer for product search"""
    query = serializers.CharField(required=False)
    category = serializers.CharField(required=False)
    min_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    max_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    vendor_id = serializers.IntegerField(required=False)
    in_stock = serializers.BooleanField(required=False)
    sort_by = serializers.ChoiceField(
        choices=[
            ('newest', 'Newest'),
            ('price_low', 'Price: Low to High'),
            ('price_high', 'Price: High to Low'),
            ('popular', 'Most Popular'),
        ],
        required=False,
        default='newest'
    )
    page = serializers.IntegerField(min_value=1, default=1)
    page_size = serializers.IntegerField(min_value=1, max_value=100, default=20)