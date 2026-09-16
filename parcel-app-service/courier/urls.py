from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    TempCourierRegistrationView, CourierApprovalView, TempCourierListView,
    CourierListView, CourierLoginView, CourierProfileView,
    CourierLocationUpdateView, CourierStatusUpdateView, AvailableCouriersView,
    activate_courier, courier_reset
)

# CRITICAL: Links this routing fleet to the 'couriers' block in project urls.py
app_name = 'courier'

urlpatterns = [
    # Courier Registration & Activation -> /api/v1/couriers/register/...
    path('register/', TempCourierRegistrationView.as_view(), name="courier_register"),
    path('register/mobile/', csrf_exempt(TempCourierRegistrationView.as_view()), name="courier_register_mobile"),
    path('activate/<uidb64>/<token>/', activate_courier, name="courier_activate"),
    
    # Courier Management (Admin only) -> /api/v1/couriers/temp/list/...
    path('temp/list/', TempCourierListView.as_view(), name="temp_courier_list"),
    path('approve/<int:temp_courier_id>/', CourierApprovalView.as_view(), name="courier_approve"),
    path('moderate/<int:temp_courier_id>/', CourierApprovalView.as_view(), name="courier_moderate"),
    path('list/', CourierListView.as_view(), name="courier_list"),
    
    # Courier Authentication -> /api/v1/couriers/login/...
    path('login/', CourierLoginView.as_view(), name="courier_login"),
    path('login/mobile/', csrf_exempt(CourierLoginView.as_view()), name="courier_login_mobile"),
    path('profile/', CourierProfileView.as_view(), name="courier_profile"),
    
    # Courier Operations & Live Telemetry -> /api/v1/couriers/location/update/...
    path('location/update/', CourierLocationUpdateView.as_view(), name="courier_location_update"),
    path('status/update/', CourierStatusUpdateView.as_view(), name="courier_status_update"),
    path('available/', AvailableCouriersView.as_view(), name="available_couriers"),
    
    # Password Reset -> /api/v1/couriers/password-reset/...
    path('password-reset/<uidb64>/<token>/', courier_reset, name="courier_password_reset"),
]