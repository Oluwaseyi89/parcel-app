from django.urls import path
from .views import (
    CustomerComplaintFormViews, CustomerComplaintUpdateViews,
    GetDistinctCustomerComplaintViews, GetAllCustomerComplaintsViews
)

urlpatterns = [
    # Complaint Submission
    path('submit/', CustomerComplaintFormViews.as_view(), name="complaint_submit"),
    path('update/<int:complaint_id>/', CustomerComplaintUpdateViews.as_view(), name="complaint_update"),
    
    # Complaint Retrieval
    path('customer/<str:customer_email>/', GetDistinctCustomerComplaintViews.as_view(), name="customer_complaints"),
    path('all/', GetAllCustomerComplaintsViews.as_view(), name="all_complaints"),
]