from django.urls import path
from .views import email_msg_view, SendTestEmailView, EmailTemplateListView

# CRITICAL: Links this routing fleet to the 'email' block in project urls.py
app_name = 'email_service'

urlpatterns = [
    # Email preview/testing -> /api/v1/email/preview/
    path('preview/', email_msg_view, name="email_preview"),
    
    # API endpoints -> /api/v1/email/send-test/
    path('send-test/', SendTestEmailView.as_view(), name="send_test_email"),
    path('templates/', EmailTemplateListView.as_view(), name="email_templates"),
]