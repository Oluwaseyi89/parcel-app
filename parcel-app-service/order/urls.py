# order/urls.py
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    order, OrderListView, OrderCreateView, OrderDetailView,
    OrderStatusUpdateView, PaymentRegistrationView,
    PaymentContextView,
    InternalPaymentStatusSyncView, PaystackWebhookView,
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
    path('payments/register/', PaymentRegistrationView.as_view(), name="payment_register"),
    path('payments/<str:reference>/context/', PaymentContextView.as_view(), name="payment_context"),
    path('payments/internal/sync/<str:reference>/', InternalPaymentStatusSyncView.as_view(), name="payment_internal_sync"),
    path('payments/webhooks/paystack/', csrf_exempt(PaystackWebhookView.as_view()), name="payment_paystack_webhook"),
    
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