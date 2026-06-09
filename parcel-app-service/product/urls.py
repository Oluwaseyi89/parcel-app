from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    product, ProductListView, ProductDetailView, ProductCreateView,
    TempProductListView, ProductApprovalView, VendorProductsView,
    ProductUpdateView, CategoryListView, CategoryCreateView,
    InventoryStatusView
)

# CRITICAL: Links this routing fleet to the 'product' block in project urls.py
app_name = 'product'

urlpatterns = [
    # Template view (legacy) -> /api/v1/product/view/
    path('view/', product, name="product"),
    
    # Product listings -> /api/v1/product/
    path('', ProductListView.as_view(), name="product_list"),
    path('<int:product_id>/', ProductDetailView.as_view(), name="product_detail"),
    
    # Product creation and approval workflow -> /api/v1/product/create/
    path('create/', ProductCreateView.as_view(), name="product_create"),
    path('create/mobile/', csrf_exempt(ProductCreateView.as_view()), name="product_create_mobile"),
    
    # Temporary product management (admin) -> /api/v1/product/temp-products/
    path('temp-products/', TempProductListView.as_view(), name="temp_product_list"),
    path('temp-products/<int:temp_product_id>/approve/', ProductApprovalView.as_view(), name="product_approval"),
    path('temp-products/<int:temp_product_id>/moderate/', ProductApprovalView.as_view(), name="product_moderate"),
    
    # Vendor product management -> /api/v1/product/vendor/
    path('vendor/', VendorProductsView.as_view(), name="vendor_products"),
    path('<int:product_id>/update/', ProductUpdateView.as_view(), name="product_update"),
    path('<int:product_id>/update/mobile/', csrf_exempt(ProductUpdateView.as_view()), name="product_update_mobile"),
    
    # Category management -> /api/v1/product/categories/
    path('categories/', CategoryListView.as_view(), name="category_list"),
    path('categories/create/', CategoryCreateView.as_view(), name="category_create"),
    
    # Inventory management -> /api/v1/product/inventory/status/
    path('inventory/status/', InventoryStatusView.as_view(), name="inventory_status"),
    
    # Legacy URLs for backward compatibility
    path('upload/', ProductCreateView.as_view(), name="product_upload_legacy"),
    path('approve/', ProductApprovalView.as_view(), name="product_approve_legacy"),
]