from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import Q, F, Count
from .models import Category, Product
from authentication.models import AuditLog

class CategoryService:
    """Service for category operations"""
    
    @staticmethod
    def get_or_create_category(name, description=''):
        """Get existing category or create new one"""
        slug = name.lower().replace(' ', '-')
        
        category, created = Category.objects.get_or_create(
            slug=slug,
            defaults={'name': name, 'description': description}
        )
        
        return category, created
    
    @staticmethod
    def get_categories_with_counts():
        """Get categories with product counts"""
        return Category.objects.annotate(
            product_count=Count('products', filter=Q(products__status='active'))
        ).order_by('name')

class ProductService:
    """Service for product operations"""
    
    @staticmethod
    def create_temp_product(product_data, vendor, request=None):
        """Create a product submission pending approval."""
        from .serializers import TempProductCreateSerializer
        
        serializer = TempProductCreateSerializer(data=product_data, context={'request': request})
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)
        
        pending_product = serializer.save()
        
        # Log creation
        if request:
            AuditLog.log_action(
                user=vendor,
                action='create',
                model_name='Product',
                object_id=pending_product.id,
                details={
                    'product_name': pending_product.name,
                    'approval_status': pending_product.approval_status,
                },
                request=request
            )
        
        return pending_product
    
    @staticmethod
    def approve_temp_product(temp_product_id, admin_user, request=None):
        """Approve a product submission on the primary Product lifecycle."""
        try:
            product = Product.objects.get(id=temp_product_id)
        except Product.DoesNotExist:
            raise ValidationError('Product submission not found')

        if product.approval_status not in ['pending', 'changes_requested', 'rejected']:
            raise ValidationError('Product is already processed')

        review_time = timezone.now()
        product.approval_status = 'approved'
        product.rejection_reason = ''
        product.reviewed_at = review_time
        product.approved_by = admin_user
        product.approved_at = review_time
        product.published_at = review_time
        product.status = 'active'
        product.save()

        AuditLog.log_action(
            user=admin_user,
            action='update',
            model_name='Product',
            object_id=product.id,
            details={
                'action': 'product_approval',
                'product_id': product.id,
                'product_name': product.name,
            },
            request=request
        )

        return product
    
    @staticmethod
    def reject_temp_product(temp_product_id, admin_user, reason, request=None):
        """Reject a product submission on the primary Product lifecycle."""
        try:
            product = Product.objects.get(id=temp_product_id)
        except Product.DoesNotExist:
            raise ValidationError('Product submission not found')

        if product.approval_status not in ['pending', 'changes_requested']:
            raise ValidationError('Product is already processed')

        product.approval_status = 'rejected'
        product.rejection_reason = reason
        product.reviewed_at = timezone.now()
        product.approved_by = admin_user
        product.status = 'archived'
        product.save()

        AuditLog.log_action(
            user=admin_user,
            action='update',
            model_name='Product',
            object_id=product.id,
            details={
                'action': 'product_rejection',
                'reason': reason,
                'product_name': product.name,
            },
            request=request
        )

        return product

    @staticmethod
    def request_product_changes(temp_product_id, admin_user, comments='', request=None):
        """Request changes on a product submission on the primary lifecycle."""
        try:
            product = Product.objects.get(id=temp_product_id)
        except Product.DoesNotExist:
            raise ValidationError('Product submission not found')

        if product.approval_status not in ['pending', 'rejected']:
            raise ValidationError('Product is already processed')

        product.approval_status = 'changes_requested'
        product.rejection_reason = comments
        product.reviewed_at = timezone.now()
        product.approved_by = admin_user
        product.save()

        AuditLog.log_action(
            user=admin_user,
            action='update',
            model_name='Product',
            object_id=product.id,
            details={
                'action': 'product_changes_requested',
                'comments': comments,
                'product_name': product.name,
            },
            request=request
        )

        return product
    
    @staticmethod
    def search_products(search_params):
        """Search products with filters"""
        from .models import Product
        
        queryset = Product.objects.filter(status='active', approval_status='approved')
        
        # Apply filters
        query = search_params.get('query')
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(brand__icontains=query) |
                Q(model__icontains=query)
            )
        
        # Category filter
        category = search_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Price range filter
        min_price = search_params.get('min_price')
        max_price = search_params.get('max_price')
        if min_price is not None:
            queryset = queryset.filter(price__gte=min_price)
        if max_price is not None:
            queryset = queryset.filter(price__lte=max_price)
        
        # Vendor filter
        vendor_id = search_params.get('vendor_id')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        
        # Stock filter
        in_stock = search_params.get('in_stock')
        if in_stock:
            queryset = queryset.filter(quantity__gt=0)
        
        # Sorting
        sort_by = search_params.get('sort_by', 'newest')
        if sort_by == 'price_low':
            queryset = queryset.order_by('price')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-price')
        elif sort_by == 'popular':
            queryset = queryset.order_by('-views_count', '-sold_count')
        else:  # newest
            queryset = queryset.order_by('-created_at')
        
        # Pagination
        page = search_params.get('page', 1)
        page_size = search_params.get('page_size', 20)
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = queryset.count()
        products = queryset[start:end]
        
        return {
            'products': products,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        }
    
    @staticmethod
    def get_vendor_products(vendor_id, include_temp=False):
        """Get all products for a vendor"""
        products = Product.objects.filter(vendor_id=vendor_id, approval_status='approved')
        
        result = {'approved': products}
        
        if include_temp:
            pending_products = Product.objects.filter(
                vendor_id=vendor_id,
                approval_status='pending'
            )
            result['pending'] = pending_products
        
        return result
    
    @staticmethod
    def update_product_inventory(product_id, quantity_change):
        """Update product inventory quantity"""
        try:
            product = Product.objects.get(id=product_id)
            product.update_inventory(quantity_change)
            return product
        except Product.DoesNotExist:
            raise ValidationError('Product not found')
    
    @staticmethod
    def record_product_view(product_id):
        """Record a product view"""
        try:
            product = Product.objects.get(id=product_id)
            product.increment_views()
            return product
        except Product.DoesNotExist:
            pass

class InventoryService:
    """Service for inventory management"""
    
    @staticmethod
    def check_low_stock(threshold=10):
        """Get products with low stock"""
        return Product.objects.filter(
            quantity__lte=threshold,
            quantity__gt=0,
            status='active'
        )
    
    @staticmethod
    def check_out_of_stock():
        """Get out of stock products"""
        return Product.objects.filter(
            quantity=0,
            status='active'
        )
    
    @staticmethod
    def update_bulk_inventory(inventory_changes):
        """Update multiple products' inventory at once"""
        from django.db import transaction
        
        with transaction.atomic():
            for change in inventory_changes:
                product_id = change['product_id']
                quantity_change = change['quantity_change']
                
                try:
                    product = Product.objects.get(id=product_id)
                    product.update_inventory(quantity_change)
                except Product.DoesNotExist:
                    continue
        
        return True