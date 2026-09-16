from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    dispatch, ReadyForDispatchView, DispatchListView,
    DispatchCreateView, DispatchDetailView, DispatchAssignView,
    DispatchStatusUpdateView, VendorDispatchItemsView,
    DispatchItemUpdateView, CourierLocationUpdateView,
    DispatchStatsView, RouteOptimizationView
)

# CRITICAL: Links this routing fleet to the 'dispatch' block in project urls.py
app_name = 'dispatch'

urlpatterns = [
    # Template view (legacy dashboard) -> /api/v1/dispatch/view/
    path('view/', dispatch, name="dispatch"),
    
    # Dispatch management -> /api/v1/dispatch/
    path('', DispatchListView.as_view(), name="dispatch_list"),
    path('create/', DispatchCreateView.as_view(), name="dispatch_create"),
    path('<int:dispatch_id>/', DispatchDetailView.as_view(), name="dispatch_detail"),
    path('<int:dispatch_id>/assign/', DispatchAssignView.as_view(), name="dispatch_assign"),
    path('<int:dispatch_id>/status/', DispatchStatusUpdateView.as_view(), name="dispatch_status_update"),
    path('<int:dispatch_id>/optimize-route/', RouteOptimizationView.as_view(), name="dispatch_optimize_route"),
    
    # Ready orders for dispatch -> /api/v1/dispatch/ready-orders/
    path('ready-orders/', ReadyForDispatchView.as_view(), name="ready_orders"),
    
    # Vendor-specific views -> /api/v1/dispatch/vendor/items/
    path('vendor/items/', VendorDispatchItemsView.as_view(), name="vendor_dispatch_items"),
    path('items/<int:item_id>/update/', DispatchItemUpdateView.as_view(), name="dispatch_item_update"),
    
    # Courier operations -> /api/v1/dispatch/courier/location/
    path('courier/location/', CourierLocationUpdateView.as_view(), name="courier_location_update"),
    
    # Statistics -> /api/v1/dispatch/stats/
    path('stats/', DispatchStatsView.as_view(), name="dispatch_stats"),
    
    # Legacy URLs for backward compatibility
    path('legacy/ready/', ReadyForDispatchView.as_view(), name="legacy_ready_orders"),
]