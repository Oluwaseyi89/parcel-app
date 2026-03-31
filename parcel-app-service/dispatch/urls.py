# dispatch/urls.py
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    dispatch, ReadyForDispatchView, DispatchListView,
    DispatchCreateView, DispatchDetailView, DispatchAssignView,
    DispatchStatusUpdateView, VendorDispatchItemsView,
    DispatchItemUpdateView, CourierLocationUpdateView,
    DispatchStatsView, RouteOptimizationView
)

urlpatterns = [
    # Template view
    path('', dispatch, name="dispatch"),
    
    # Dispatch management
    path('dispatches/', DispatchListView.as_view(), name="dispatch_list"),
    path('dispatches/create/', DispatchCreateView.as_view(), name="dispatch_create"),
    path('dispatches/<int:dispatch_id>/', DispatchDetailView.as_view(), name="dispatch_detail"),
    path('dispatches/<int:dispatch_id>/assign/', DispatchAssignView.as_view(), name="dispatch_assign"),
    path('dispatches/<int:dispatch_id>/status/', DispatchStatusUpdateView.as_view(), name="dispatch_status_update"),
    path('dispatches/<int:dispatch_id>/optimize-route/', RouteOptimizationView.as_view(), name="dispatch_optimize_route"),
    
    # Ready orders for dispatch
    path('ready-orders/', ReadyForDispatchView.as_view(), name="ready_orders"),
    
    # Vendor-specific
    path('vendor/items/', VendorDispatchItemsView.as_view(), name="vendor_dispatch_items"),
    path('items/<int:item_id>/update/', DispatchItemUpdateView.as_view(), name="dispatch_item_update"),
    
    # Courier operations
    path('courier/location/', CourierLocationUpdateView.as_view(), name="courier_location_update"),
    
    # Statistics
    path('stats/', DispatchStatsView.as_view(), name="dispatch_stats"),
    
    # Legacy URLs for backward compatibility
    path('legacy/ready/', ReadyForDispatchView.as_view(), name="legacy_ready_orders"),
]