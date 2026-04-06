from django.urls import path
from .views import (
    VendorBankDetailViews, CourierBankDetailViews,
    VendorBankUpdateViews, CourierBankUpdateViews,
    GetDistinctVendorBankViews, GetDistinctCourierBankViews
)

urlpatterns = [
    # Vendor Bank Details
    path('vendor/save/', VendorBankDetailViews.as_view(), name="vendor_bank_save"),
    path('vendor/update/<str:vendor_email>/', VendorBankUpdateViews.as_view(), name="vendor_bank_update"),
    path('vendor/get/<str:vendor_email>/', GetDistinctVendorBankViews.as_view(), name="vendor_bank_get"),
    
    # Courier Bank Details
    path('courier/save/', CourierBankDetailViews.as_view(), name="courier_bank_save"),
    path('courier/update/<str:courier_email>/', CourierBankUpdateViews.as_view(), name="courier_bank_update"),
    path('courier/get/<str:courier_email>/', GetDistinctCourierBankViews.as_view(), name="courier_bank_get"),
]