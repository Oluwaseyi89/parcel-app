import logging

from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from core.tokens import account_activation_token

logger = logging.getLogger(__name__)


class EmailService:
    """Centralized email service for the application"""

    @staticmethod
    def _send_html(subject, template_name, context, to_email):
        """Render an HTML template and send it. Never raises: callers treat delivery as best-effort,
        so failures (missing template, SMTP errors) are logged and reported as (False, message)."""
        try:
            email = EmailMessage(subject, render_to_string(template_name, context), to=[to_email])
            email.content_subtype = 'html'
            email.send()
            return True, "Email sent successfully"
        except Exception as exc:
            logger.exception("Failed to send '%s' email using %s", subject, template_name)
            return False, f"Failed to send email: {exc}"

    @staticmethod
    def _resolve_email_type(user, email_type=None):
        if email_type:
            return email_type
        return getattr(user, 'role', 'user')

    @staticmethod
    def _activation_path(email_type, uid, token):
        activation_urls = {
            'vendor': 'v1:vendors:vendor_activate',
            'courier': 'v1:couriers:courier_activate',
            'customer': 'v1:auth:activate_customer',
        }
        url_name = activation_urls.get(email_type, 'v1:auth:activate_customer')
        return reverse(url_name, kwargs={'uidb64': uid, 'token': token})
    
    @staticmethod
    def send_activation_email(user, request, template_name='emails/email_verification.html', email_type=None):
        """
        Send activation email to user
        Args:
            user: User model instance (Vendor, Courier, or AdminUser)
            request: HttpRequest object
            template_name: Email template path
            email_type: Type of user ('vendor', 'courier', 'admin')
        """
        current_site = get_current_site(request) if request else None
        domain = current_site.domain if current_site else 'localhost:7000'
        resolved_email_type = EmailService._resolve_email_type(user, email_type)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = account_activation_token.make_token(user)
        activation_path = EmailService._activation_path(resolved_email_type, uid, token)
        # build_absolute_uri honours SECURE_PROXY_SSL_HEADER, so links are https behind Render's proxy.
        activation_url = request.build_absolute_uri(activation_path) if request else f"http://{domain}{activation_path}"
        
        if resolved_email_type == 'vendor':
            mail_subject = "Activate your Vendor Account"
        elif resolved_email_type == 'courier':
            mail_subject = "Activate your Courier Account"
        elif resolved_email_type == 'admin':
            mail_subject = "Activate your Admin Account"
        elif resolved_email_type == 'customer':
            mail_subject = "Activate your Customer Account"
        else:
            mail_subject = "Activate your Account"
        
        return EmailService._send_html(mail_subject, template_name, {
            'user': user,
            'domain': domain,
            'uid': uid,
            'token': token,
            'email_type': resolved_email_type,
            'activation_path': activation_path,
            'activation_url': activation_url,
        }, user.email)

    @staticmethod
    def send_password_reset_email(user, reset_url, email_type='customer', expires_in_minutes=60):
        """
        Send a password reset email linking to the web app's reset page.
        Args:
            user: User model instance
            reset_url: Absolute URL of the reset page, including the reset token
            email_type: Type of user (customer, vendor, courier, admin)
            expires_in_minutes: Token lifetime shown in the email
        """
        subjects = {
            'vendor': "Reset your Vendor Password",
            'courier': "Reset your Courier Password",
            'admin': "Reset your Admin Password",
        }
        return EmailService._send_html(subjects.get(email_type, "Reset your Password"), 'emails/password_reset.html', {
            'user': user,
            'reset_url': reset_url,
            'email_type': email_type,
            'expires_in_minutes': expires_in_minutes,
        }, user.email)

    @staticmethod
    def send_welcome_email(user, request, email_type='vendor'):
        """
        Send welcome email after successful activation
        """
        current_site = get_current_site(request)
        
        if email_type == 'vendor':
            mail_subject = "Welcome to Parcel Delivery - Vendor Portal"
            template = 'parcel_backends/welcome_vendor.html'
        elif email_type == 'courier':
            mail_subject = "Welcome to Parcel Delivery - Courier Portal"
            template = 'parcel_backends/welcome_courier.html'
        else:
            mail_subject = "Welcome to Parcel Delivery"
            template = 'parcel_backends/welcome_general.html'
        
        message = render_to_string(template, {
            'user': user,
            'domain': current_site.domain,
            'support_email': 'support@parceldelivery.com',
        })
        
        email = EmailMessage(mail_subject, message, to=[user.email])
        
        try:
            email.send()
            return True, "Welcome email sent successfully"
        except Exception as e:
            return False, f"Failed to send welcome email: {str(e)}"
    
    @staticmethod
    def send_notification_email(recipient_email, subject, template_name, context):
        """
        Generic method to send notification emails
        Args:
            recipient_email: Email address of recipient
            subject: Email subject
            template_name: Template path
            context: Dictionary of template variables
        """
        message = render_to_string(template_name, context)
        email = EmailMessage(subject, message, to=[recipient_email])
        
        try:
            email.send()
            return True, "Notification email sent successfully"
        except Exception as e:
            return False, f"Failed to send notification email: {str(e)}"
    
    @staticmethod
    def send_bulk_email(recipients, subject, template_name, context_list):
        """
        Send emails to multiple recipients with personalized content
        Args:
            recipients: List of email addresses
            subject: Email subject
            template_name: Template path
            context_list: List of context dictionaries (one per recipient)
        """
        results = []
        
        for i, recipient in enumerate(recipients):
            context = context_list[i] if i < len(context_list) else {}
            message = render_to_string(template_name, context)
            email = EmailMessage(subject, message, to=[recipient])
            
            try:
                email.send()
                results.append({
                    'recipient': recipient,
                    'status': 'success',
                    'message': 'Email sent successfully'
                })
            except Exception as e:
                results.append({
                    'recipient': recipient,
                    'status': 'error',
                    'message': str(e)
                })
        
        return results
