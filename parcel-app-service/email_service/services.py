from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from core.tokens import account_activation_token

class EmailService:
    """Centralized email service for the application"""
    
    @staticmethod
    def send_activation_email(user, request, template_name, email_type='vendor'):
        """
        Send activation email to user
        Args:
            user: User model instance (Vendor, Courier, or AdminUser)
            request: HttpRequest object
            template_name: Email template path
            email_type: Type of user ('vendor', 'courier', 'admin')
        """
        current_site = get_current_site(request)
        
        if email_type == 'vendor':
            mail_subject = "Activate your Vendor Account"
        elif email_type == 'courier':
            mail_subject = "Activate your Courier Account"
        elif email_type == 'admin':
            mail_subject = "Activate your Admin Account"
        else:
            mail_subject = "Activate your Account"
        
        message = render_to_string(template_name, {
            'user': user,
            'domain': current_site.domain,
            'uid': urlsafe_base64_encode(force_bytes(user.pk)),
            'token': account_activation_token.make_token(user),
            'email_type': email_type,
        })
        
        to_email = user.email
        email = EmailMessage(mail_subject, message, to=[to_email])
        
        try:
            email.send()
            return True, "Activation email sent successfully"
        except Exception as e:
            return False, f"Failed to send activation email: {str(e)}"
    
    @staticmethod
    def send_password_reset_email(user, request, template_name, email_type='vendor'):
        """
        Send password reset email
        Args:
            user: User model instance
            request: HttpRequest object
            template_name: Email template path
            email_type: Type of user
        """
        current_site = get_current_site(request)
        
        if email_type == 'vendor':
            mail_subject = "Reset your Vendor Password"
        elif email_type == 'courier':
            mail_subject = "Reset your Courier Password"
        elif email_type == 'admin':
            mail_subject = "Reset your Admin Password"
        else:
            mail_subject = "Reset your Password"
        
        message = render_to_string(template_name, {
            'user': user,
            'domain': current_site.domain,
            'uid': urlsafe_base64_encode(force_bytes(user.pk)),
            'token': account_activation_token.make_token(user),
            'email_type': email_type,
        })
        
        to_email = user.email
        email = EmailMessage(mail_subject, message, to=[to_email])
        
        try:
            email.send()
            return True, "Password reset email sent successfully"
        except Exception as e:
            return False, f"Failed to send password reset email: {str(e)}"
    
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
