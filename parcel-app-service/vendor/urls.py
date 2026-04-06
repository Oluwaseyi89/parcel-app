# vendor/urls.py
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    TempVendorRegistrationView, VendorApprovalView, TempVendorListView,
    VendorListView, VendorLoginView, VendorProfileView,
    activate_vendor, vendor_reset
)

urlpatterns = [
    # Vendor Registration & Activation
    path('register/', TempVendorRegistrationView.as_view(), name="vendor_register"),
    path('register/mobile/', csrf_exempt(TempVendorRegistrationView.as_view()), name="vendor_register_mobile"),
    path('activate/<uidb64>/<token>/', activate_vendor, name="vendor_activate"),
    
    # Vendor Management (Admin only)
    path('temp/list/', TempVendorListView.as_view(), name="temp_vendor_list"),
    path('approve/<int:temp_vendor_id>/', VendorApprovalView.as_view(), name="vendor_approve"),
    path('moderate/<int:temp_vendor_id>/', VendorApprovalView.as_view(), name="vendor_moderate"),
    path('list/', VendorListView.as_view(), name="vendor_list"),
    
    # Vendor Authentication
    path('login/', VendorLoginView.as_view(), name="vendor_login"),
    path('login/mobile/', csrf_exempt(VendorLoginView.as_view()), name="vendor_login_mobile"),
    path('profile/', VendorProfileView.as_view(), name="vendor_profile"),
    
    # Password Reset
    path('password-reset/<uidb64>/<token>/', vendor_reset, name="vendor_password_reset"),
]











# from django.urls import path
# from django.views.decorators.csrf import csrf_exempt
# from .views import (
#     TempVendorViews, VendorViews, DelTempVendorViews,
#     GetTempVendorViews, GetVendorViews, GetVendorByEmailViews,
#     VendorLoginViews, VendorResetViews, VendorSaveResetViews,
#     activate_vendor, vendor_reset
# )

# urlpatterns = [
#     # Temporary Vendor Registration
#     path('temp/register/', TempVendorViews.as_view(), name="temp_vendor_register"),
#     path('temp/register/mobile/', csrf_exempt(TempVendorViews.as_view()), name="temp_vendor_register_mobile"),
#     path('temp/list/', GetTempVendorViews.as_view(), name="temp_vendor_list"),
#     path('temp/delete/<int:id>/', DelTempVendorViews.as_view(), name="temp_vendor_delete"),
    
#     # Vendor Management
#     path('approve/', VendorViews.as_view(), name="vendor_approve"),
#     path('list/', GetVendorViews.as_view(), name="vendor_list"),
#     path('get/<str:email>/', GetVendorByEmailViews.as_view(), name="vendor_by_email"),
    
#     # Vendor Authentication
#     path('login/', VendorLoginViews.as_view(), name="vendor_login"),
#     path('login/mobile/', csrf_exempt(VendorLoginViews.as_view()), name="vendor_login_mobile"),
    
#     # Password Reset
#     path('reset/request/', VendorResetViews.as_view(), name="vendor_reset_request"),
#     path('reset/save/', VendorSaveResetViews.as_view(), name="vendor_reset_save"),
    
#     # Activation
#     path('activate/<uidb64>/<token>/', activate_vendor, name="vendor_activate"),
#     path('password-reset/<uidb64>/<token>/', vendor_reset, name="vendor_password_reset"),
# ]