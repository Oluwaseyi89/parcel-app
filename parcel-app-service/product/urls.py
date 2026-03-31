# product/urls.py
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    product, ProductListView, ProductDetailView, ProductCreateView,
    TempProductListView, ProductApprovalView, VendorProductsView,
    ProductUpdateView, CategoryListView, CategoryCreateView,
    InventoryStatusView
)

urlpatterns = [
    # Template view (legacy)
    path('', product, name="product"),
    
    # Product listings
    path('products/', ProductListView.as_view(), name="product_list"),
    path('products/<int:product_id>/', ProductDetailView.as_view(), name="product_detail"),
    
    # Product creation and approval workflow
    path('products/create/', ProductCreateView.as_view(), name="product_create"),
    path('products/create/mobile/', csrf_exempt(ProductCreateView.as_view()), name="product_create_mobile"),
    
    # Temporary product management (admin)
    path('temp-products/', TempProductListView.as_view(), name="temp_product_list"),
    path('temp-products/<int:temp_product_id>/approve/', ProductApprovalView.as_view(), name="product_approval"),
    
    # Vendor product management
    path('vendor/products/', VendorProductsView.as_view(), name="vendor_products"),
    path('products/<int:product_id>/update/', ProductUpdateView.as_view(), name="product_update"),
    path('products/<int:product_id>/update/mobile/', csrf_exempt(ProductUpdateView.as_view()), name="product_update_mobile"),
    
    # Category management
    path('categories/', CategoryListView.as_view(), name="category_list"),
    path('categories/create/', CategoryCreateView.as_view(), name="category_create"),
    
    # Inventory management
    path('inventory/status/', InventoryStatusView.as_view(), name="inventory_status"),
    
    # Legacy URLs for backward compatibility
    path('upload/', ProductCreateView.as_view(), name="product_upload_legacy"),
    path('approve/', ProductApprovalView.as_view(), name="product_approve_legacy"),
]