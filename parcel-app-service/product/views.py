# product/views.py
from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from authentication.permissions import IsAdminOrSuperAdmin, IsVendorOrAdmin
from .services import ProductService, CategoryService, InventoryService
from .serializers import (
    CategorySerializer, TempProductCreateSerializer,
    ProductSerializer, ProductUpdateSerializer, ProductApprovalSerializer,
    ProductSearchSerializer
)
from .models import Category, Product

class StandardPagination(PageNumberPagination):
    """Standard pagination for product listings"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProductListView(APIView):
    """List all approved products with filters"""
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    
    def get(self, request):
        serializer = ProductSearchSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        search_params = serializer.validated_data
        result = ProductService.search_products(search_params)
        
        product_serializer = ProductSerializer(result['products'], many=True, context={'request': request})
        
        return Response({
            "status": "success",
            "data": product_serializer.data,
            "pagination": {
                "page": result['page'],
                "page_size": result['page_size'],
                "total_count": result['total_count'],
                "total_pages": result['total_pages']
            }
        })

class ProductDetailView(APIView):
    """Get single product details"""
    permission_classes = [AllowAny]
    
    def get(self, request, product_id):
        product = get_object_or_404(Product, id=product_id, status='active', approval_status='approved')
        
        # Record view
        ProductService.record_product_view(product_id)
        
        serializer = ProductSerializer(product, context={'request': request})
        return Response({
            "status": "success",
            "data": serializer.data
        })

class ProductCreateView(APIView):
    """Create a new product (temporary for approval)"""
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]
    parser_classes = (MultiPartParser,)
    
    def post(self, request):
        try:
            pending_product = ProductService.create_temp_product(
                request.data, 
                request.user,
                request
            )
            
            return Response({
                "status": "success",
                "message": "Product created successfully and submitted for approval",
                "data": ProductSerializer(pending_product, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class TempProductListView(APIView):
    """List temporary products (admin only)"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request):
        status_filter = request.query_params.get('status', 'pending')
        
        temp_products = Product.objects.filter(
            approval_status=status_filter
        ).select_related('vendor', 'category')

        serializer = ProductSerializer(temp_products, many=True, context={'request': request})
        return Response({
            "status": "success",
            "data": serializer.data
        })

class ProductApprovalView(APIView):
    """Approve or reject temporary products"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def post(self, request, temp_product_id):
        serializer = ProductApprovalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        comments = serializer.validated_data.get('comments', '')
        
        try:
            product = ProductService.moderate_product(
                temp_product_id=temp_product_id,
                action=action,
                admin_user=request.user,
                comments=comments,
                request=request,
            )

            action_message = {
                'approve': 'approved',
                'reject': 'rejected',
                'request_changes': 'marked for changes',
                'suspend': 'suspended',
                'reactivate': 'reactivated',
            }.get(action, 'updated')
            message = f"Product {action_message} successfully"
            data = ProductSerializer(product, context={'request': request}).data
            
            return Response({
                "status": "success",
                "message": message,
                "data": data
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class VendorProductsView(APIView):
    """Get products for a specific vendor"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        include_temp = request.query_params.get('include_temp', 'false').lower() == 'true'
        
        try:
            products_data = ProductService.get_vendor_products(
                request.user.id,
                include_temp=include_temp
            )
            
            approved_serializer = ProductSerializer(products_data['approved'], many=True, context={'request': request})
            
            response_data = {
                "approved": approved_serializer.data
            }
            
            if include_temp:
                pending_serializer = ProductSerializer(products_data['pending'], many=True, context={'request': request})
                response_data["pending"] = pending_serializer.data
            
            return Response({
                "status": "success",
                "data": response_data
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class ProductUpdateView(APIView):
    """Update product details"""
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]
    
    def patch(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        
        # Check permission: vendor can only update their own products
        if request.user.role == 'vendor' and product.vendor != request.user:
            return Response({
                "status": "error",
                "message": "You can only update your own products"
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ProductUpdateSerializer(product, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        updated_product = serializer.save()
        
        return Response({
            "status": "success",
            "message": "Product updated successfully",
            "data": ProductSerializer(updated_product, context={'request': request}).data
        })

class CategoryListView(APIView):
    """List all product categories"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })

class CategoryCreateView(APIView):
    """Create a new category (admin only)"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        category = serializer.save()
        
        return Response({
            "status": "success",
            "message": "Category created successfully",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)

class InventoryStatusView(APIView):
    """Check inventory status (vendor/admin only)"""
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]
    
    def get(self, request):
        if request.user.role == 'vendor':
            low_stock = Product.objects.filter(
                vendor=request.user,
                quantity__lte=10,
                quantity__gt=0,
                status='active'
            )
            out_of_stock = Product.objects.filter(
                vendor=request.user,
                quantity=0,
                status='active'
            )
        else:  # admin
            low_stock = InventoryService.check_low_stock()
            out_of_stock = InventoryService.check_out_of_stock()
        
        low_stock_serializer = ProductSerializer(low_stock, many=True, context={'request': request})
        out_of_stock_serializer = ProductSerializer(out_of_stock, many=True, context={'request': request})
        
        return Response({
            "status": "success",
            "data": {
                "low_stock": low_stock_serializer.data,
                "out_of_stock": out_of_stock_serializer.data
            }
        })

# Template views (keep these for backward compatibility)
def product(request):
    """Product page template"""
    return render(request, "parcel_product/product.html")