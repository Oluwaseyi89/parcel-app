from django.urls import path
from .views import (
    CustomerComplaintFormViews, CustomerComplaintUpdateViews,
    GetDistinctCustomerComplaintViews, GetAllCustomerComplaintsViews
)

# CRITICAL: Links this routing fleet to the 'complaints' block in project urls.py
app_name = 'complaints'

urlpatterns = [
    # Complaint Submission -> /api/v1/complaints/submit/
    path('submit/', CustomerComplaintFormViews.as_view(), name="complaint_submit"),
    path('update/<int:complaint_id>/', CustomerComplaintUpdateViews.as_view(), name="complaint_update"),
    
    # Complaint Retrieval -> /api/v1/complaints/customer/<email>/
    path('customer/<str:customer_email>/', GetDistinctCustomerComplaintViews.as_view(), name="customer_complaints"),
    path('all/', GetAllCustomerComplaintsViews.as_view(), name="all_complaints"),
]