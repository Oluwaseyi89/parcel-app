# vendor/urls.py
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    TempVendorRegistrationView, VendorApprovalView, TempVendorListView,
    VendorListView, VendorLoginView, VendorProfileView,
    activate_vendor, vendor_reset
)

# CRITICAL: Links this routing fleet to the 'vendors' block in project urls.py
app_name = 'vendor'

urlpatterns = [
    # Vendor Registration & Activation -> /api/v1/vendors/register/...
    path('register/', TempVendorRegistrationView.as_view(), name="vendor_register"),
    path('register/mobile/', csrf_exempt(TempVendorRegistrationView.as_view()), name="vendor_register_mobile"),
    path('activate/<uidb64>/<token>/', activate_vendor, name="vendor_activate"),
    
    # Vendor Management (Admin only) -> /api/v1/vendors/temp/list/...
    path('temp/list/', TempVendorListView.as_view(), name="temp_vendor_list"),
    path('approve/<int:temp_vendor_id>/', VendorApprovalView.as_view(), name="vendor_approve"),
    path('moderate/<int:temp_vendor_id>/', VendorApprovalView.as_view(), name="vendor_moderate"),
    path('list/', VendorListView.as_view(), name="vendor_list"),
    
    # Vendor Authentication -> /api/v1/vendors/login/...
    path('login/', VendorLoginView.as_view(), name="vendor_login"),
    path('login/mobile/', csrf_exempt(VendorLoginView.as_view()), name="vendor_login_mobile"),
    path('profile/', VendorProfileView.as_view(), name="vendor_profile"),
    
    # Password Reset -> /api/v1/vendors/password-reset/...
    path('password-reset/<uidb64>/<token>/', vendor_reset, name="vendor_password_reset"),
]