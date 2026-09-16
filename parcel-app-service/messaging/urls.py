from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    message, MessageTemplateListView, MessageTemplateDetailView,
    EmailMessageListView, SendOrderConfirmationView, BulkEmailView,
    NotificationListView, NotificationDetailView, SMTPSettingsView,
    EmailStatsView, TemplatePreviewView
)

# CRITICAL: Links this routing fleet to the 'messaging' block in project urls.py
app_name = 'messaging'

urlpatterns = [
    # Template view (legacy dashboard) -> /api/v1/messaging/view/
    path('view/', message, name="message"),
    
    # Message templates -> /api/v1/messaging/templates/
    path('templates/', MessageTemplateListView.as_view(), name="template_list"),
    path('templates/<int:template_id>/', MessageTemplateDetailView.as_view(), name="template_detail"),
    path('templates/<int:template_id>/preview/', TemplatePreviewView.as_view(), name="template_preview"),
    
    # Email messages -> /api/v1/messaging/emails/
    path('emails/', EmailMessageListView.as_view(), name="email_list"),
    path('orders/<int:order_id>/send-confirmation/', SendOrderConfirmationView.as_view(), name="send_order_confirmation"),
    path('bulk-email/', BulkEmailView.as_view(), name="bulk_email"),
    
    # Notifications -> /api/v1/messaging/notifications/
    path('notifications/', NotificationListView.as_view(), name="notification_list"),
    path('notifications/<int:notification_id>/', NotificationDetailView.as_view(), name="notification_detail"),
    
    # SMTP configurations -> /api/v1/messaging/smtp-settings/
    path('smtp-settings/', SMTPSettingsView.as_view(), name="smtp_settings"),
    
    # Statistics -> /api/v1/messaging/stats/
    path('stats/', EmailStatsView.as_view(), name="email_stats"),
    
    # Legacy URLs for backward compatibility
    path('legacy/send/', EmailMessageListView.as_view(), name="legacy_send_email"),
]