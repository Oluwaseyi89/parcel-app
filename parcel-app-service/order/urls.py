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

# CRITICAL: Links this routing fleet to the 'order' block in project urls.py
app_name = 'order'

urlpatterns = [
    # Template view (legacy dashboard) -> /api/v1/order/view/
    path('view/', order, name="order"),
    
    # Order management -> /api/v1/order/
    path('', OrderListView.as_view(), name="order_list"),
    path('create/', OrderCreateView.as_view(), name="order_create"),
    path('create/mobile/', csrf_exempt(OrderCreateView.as_view()), name="order_create_mobile"),
    path('<int:order_id>/', OrderDetailView.as_view(), name="order_detail"),
    path('<int:order_id>/status/', OrderStatusUpdateView.as_view(), name="order_status_update"),
    
    # Payments Gateway Integration -> /api/v1/order/payments/...
    path('payments/register/', PaymentRegistrationView.as_view(), name="payment_register"),
    path('payments/<str:reference>/context/', PaymentContextView.as_view(), name="payment_context"),
    path('payments/internal/sync/<str:reference>/', InternalPaymentStatusSyncView.as_view(), name="payment_internal_sync"),
    path('payments/webhooks/paystack/', PaystackWebhookView.as_view(), name="payment_paystack_webhook"),
    
    # Shipping addresses -> /api/v1/order/shipping-addresses/
    path('shipping-addresses/', ShippingAddressListView.as_view(), name="shipping_addresses"),
    
    # Vendor-specific views -> /api/v1/order/vendor/
    path('vendor/', VendorOrdersView.as_view(), name="vendor_orders"),
    
    # Courier-specific views -> /api/v1/order/courier/
    path('courier/', CourierOrdersView.as_view(), name="courier_orders"),
    
    # Statistics (admin only) -> /api/v1/order/stats/
    path('stats/', OrderStatsView.as_view(), name="order_stats"),
    
    # Legacy fallback routing hooks
    path('legacy/create/', OrderCreateView.as_view(), name="order_create_legacy"),
]