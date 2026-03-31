from django.urls import path
from .views import email_msg_view, SendTestEmailView, EmailTemplateListView

urlpatterns = [
    # Email preview/testing
    path('preview/', email_msg_view, name="email_preview"),
    
    # API endpoints
    path('api/send-test/', SendTestEmailView.as_view(), name="send_test_email"),
    path('api/templates/', EmailTemplateListView.as_view(), name="email_templates"),
]













# from django.urls import path
# from .views import email_msg_view  # If you have email-related views

# urlpatterns = [
#     # Email preview/testing
#     path('preview/', email_msg_view, name="email_preview"),
    
#     # Add other email-related endpoints as needed
# ]