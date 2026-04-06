# order/urls.py
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    order, OrderListView, OrderCreateView, OrderDetailView,
    OrderStatusUpdateView, PaymentInitiateView, PaymentVerifyView,
    InternalPaymentStatusSyncView,
    ShippingAddressListView, VendorOrdersView, OrderStatsView,
    CourierOrdersView
)

urlpatterns = [
    # Template view
    path('', order, name="order"),
    
    # Order management
    path('orders/', OrderListView.as_view(), name="order_list"),
    path('orders/create/', OrderCreateView.as_view(), name="order_create"),
    path('orders/create/mobile/', csrf_exempt(OrderCreateView.as_view()), name="order_create_mobile"),
    path('orders/<int:order_id>/', OrderDetailView.as_view(), name="order_detail"),
    path('orders/<int:order_id>/status/', OrderStatusUpdateView.as_view(), name="order_status_update"),
    
    # Payment
    path('payments/initiate/', PaymentInitiateView.as_view(), name="payment_initiate"),
    path('payments/verify/<str:reference>/', PaymentVerifyView.as_view(), name="payment_verify"),
    path('payments/internal/sync/<str:reference>/', InternalPaymentStatusSyncView.as_view(), name="payment_internal_sync"),
    
    # Shipping addresses
    path('shipping-addresses/', ShippingAddressListView.as_view(), name="shipping_addresses"),
    
    # Vendor-specific
    path('vendor/orders/', VendorOrdersView.as_view(), name="vendor_orders"),
    
    # Courier-specific
    path('courier/orders/', CourierOrdersView.as_view(), name="courier_orders"),
    
    # Statistics (admin only)
    path('stats/', OrderStatsView.as_view(), name="order_stats"),
    
    # Legacy URLs for backward compatibility (optional)
    path('legacy/create/', OrderCreateView.as_view(), name="order_create_legacy"),
]