import logging
from email.utils import formataddr, parseaddr
from datetime import timedelta
from typing import List, Dict, Optional
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.core.exceptions import ValidationError
from django.db import transaction
from django.conf import settings
from django.template.loader import render_to_string
from .models import (
    MessageTemplate, EmailMessage, EmailQueue,
    Unsubscribe, Notification
)
from authentication.models import AuditLog, CustomerUser, VendorUser, CourierUser, AdminUser
from order.models import Order

logger = logging.getLogger(__name__)

class EmailService:
    """Service for email operations"""
    
    @staticmethod
    def send_email(
        subject: str,
        body_html: str,
        recipient_emails: List[str],
        sender_email: str = None,
        sender_name: str = None,
        body_text: str = None,
        template: MessageTemplate = None,
        template_data: Dict = None,
        priority: str = 'normal',
        attachments: List = None,
        request = None,
        sender: AdminUser = None
    ) -> EmailMessage:
        """Send an email with tracking. sender defaults to the requesting admin."""
        from .models import EmailMessage
        
        # Default to the configured sender; it must match what the SMTP provider will accept.
        if not sender_email:
            default_name, sender_email = parseaddr(settings.DEFAULT_FROM_EMAIL)
            sender_name = sender_name or default_name
        
        # Format recipients
        recipients = []
        for email in recipient_emails:
            # Check unsubscribe list
            if Unsubscribe.objects.filter(email=email).exists():
                logger.warning(f"Email {email} is unsubscribed, skipping.")
                continue
            
            recipients.append({
                'email': email,
                'type': 'to',
                'name': ''
            })
        
        if not recipients:
            raise ValidationError('No valid recipients after unsubscribe filtering.')
        
        # Create email message record
        email_message = EmailMessage.objects.create(
            sender=sender or (request.user if request and hasattr(request, 'user') else None),
            sender_email=sender_email,
            sender_name=sender_name or '',
            recipients=recipients,
            subject=subject,
            body_html=body_html,
            body_text=body_text or '',
            template=template,
            template_variables=template_data or {},
            priority=priority,
            attachments=attachments or [],
            status='queued'
        )
        
        # Deliver now; delivery updates the stored row, so refresh to return the final status.
        EmailService._send_email_async(email_message.id)
        email_message.refresh_from_db(fields=['status', 'sent_at', 'provider_response'])
        
        # Log the action
        if request:
            AuditLog.log_action(
                user=request.user if hasattr(request, 'user') else None,
                action='create',
                model_name='EmailMessage',
                object_id=email_message.id,
                details={
                    'subject': subject,
                    'recipient_count': len(recipients),
                    'template': template.name if template else None
                },
                request=request
            )
        
        return email_message
    
    @staticmethod
    def _send_email_async(email_message_id: int):
        """Deliver a recorded EmailMessage through Django's configured mail backend (SMTP settings
        from the environment). Failures are logged and recorded on the message, not raised."""
        try:
            email_message = EmailMessage.objects.get(id=email_message_id)
        except EmailMessage.DoesNotExist:
            logger.error(f"EmailMessage {email_message_id} not found")
            return

        email = EmailMultiAlternatives(
            subject=email_message.subject,
            body=email_message.body_text,
            from_email=formataddr((email_message.sender_name, email_message.sender_email)),
            to=[r['email'] for r in email_message.recipients],
        )
        email.attach_alternative(email_message.body_html, "text/html")

        try:
            email.send()
        except Exception as e:
            logger.exception(f"Failed to send email {email_message.id}: {e}")
            email_message.status = 'failed'
            email_message.provider_response = {'error': str(e)}
            email_message.save(update_fields=['status', 'provider_response', 'updated_at'])
            return

        email_message.mark_as_sent(provider_response={'backend': settings.EMAIL_BACKEND})

    @staticmethod
    def send_template_email(
        template_name: str,
        recipient_emails: List[str],
        template_data: Dict,
        sender_email: str = None,
        sender_name: str = None,
        request = None,
        sender: AdminUser = None
    ) -> EmailMessage:
        """Send email using a template"""
        try:
            template = MessageTemplate.objects.get(name=template_name, is_active=True)
        except MessageTemplate.DoesNotExist:
            raise ValidationError(f"Template '{template_name}' not found or inactive.")
        
        # Render template with variables (subject placeholders too, e.g. "Hello {name}")
        subject = template.subject
        body_html = template.body_html
        for key, value in template_data.items():
            subject = subject.replace(f'{{{key}}}', str(value))
            body_html = body_html.replace(f'{{{key}}}', str(value))
        
        # Generate plain text version (simplified)
        body_text = template.body_text or EmailService._html_to_text(body_html)
        
        return EmailService.send_email(
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            recipient_emails=recipient_emails,
            sender_email=sender_email,
            sender_name=sender_name,
            template=template,
            template_data=template_data,
            request=request,
            sender=sender
        )
    
    @staticmethod
    def send_order_confirmation(order_id: int, request=None) -> EmailMessage:
        """Send order confirmation email"""
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            raise ValidationError(f"Order {order_id} not found.")
        
        template_data = {
            'order_number': order.order_number,
            'customer_name': order.customer.get_full_name(),
            'order_date': order.created_at.strftime('%Y-%m-%d'),
            'total_amount': order.total_amount,
            'items': [
                {
                    'name': item.product_name,
                    'quantity': item.quantity,
                    'price': item.unit_price
                }
                for item in order.items.all()
            ]
        }
        
        return EmailService.send_template_email(
            template_name='Order Confirmation',
            recipient_emails=[order.customer.email],
            template_data=template_data,
            request=request
        )
    
    @staticmethod
    def _html_to_text(html: str) -> str:
        """Convert HTML to plain text (simplified)"""
        import re
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', html)
        # Collapse multiple spaces
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    @staticmethod
    def process_email_queue(queue_id: int):
        """Process an email queue"""
        try:
            queue = EmailQueue.objects.get(id=queue_id, status='pending')
        except EmailQueue.DoesNotExist:
            raise ValidationError(f"Queue {queue_id} not found or not pending.")
        
        queue.status = 'processing'
        queue.started_at = timezone.now()
        queue.save()
        
        try:
            # Get recipients based on filter
            recipients = EmailService._get_recipients_from_filter(queue.recipient_filter)
            queue.total_recipients = len(recipients)
            queue.save()
            
            # Process each recipient
            success_count = 0
            failure_count = 0
            
            for recipient in recipients:
                try:
                    email_message = EmailService.send_template_email(
                        template_name=queue.template.name,
                        recipient_emails=[recipient['email']],
                        template_data={**queue.template_variables, **recipient},
                        sender=queue.created_by
                    )
                    sent = email_message.status == 'sent'
                except Exception as e:
                    logger.error(f"Failed to send to {recipient['email']}: {e}")
                    sent = False
                if sent:
                    success_count += 1
                else:
                    failure_count += 1
                
                queue.processed_recipients += 1
                queue.save()
            
            queue.success_count = success_count
            queue.failure_count = failure_count
            queue.status = 'completed'
            queue.completed_at = timezone.now()
            queue.save()
            
        except Exception as e:
            logger.error(f"Failed to process queue {queue_id}: {e}")
            queue.status = 'failed'
            queue.save()
            raise
    
    @staticmethod
    def _get_recipients_from_filter(filter_data: Dict) -> List[Dict]:
        """Get recipients based on filter criteria"""
        recipients = []
        
        # Filter by user type
        user_type = filter_data.get('user_type')
        if user_type == 'all_customers':
            customers = CustomerUser.objects.filter(is_active=True, is_email_verified=True)
            recipients.extend([
                {'email': c.email, 'name': c.get_full_name(), 'user_id': c.id}
                for c in customers
            ])
        elif user_type == 'active_vendors':
            vendors = VendorUser.objects.filter(is_active=True, is_approved=True)
            recipients.extend([
                {'email': v.email, 'name': v.get_full_name(), 'user_id': v.id}
                for v in vendors
            ])
        elif user_type == 'couriers':
            couriers = CourierUser.objects.filter(is_active=True, is_approved=True)
            recipients.extend([
                {'email': c.email, 'name': c.get_full_name(), 'user_id': c.id}
                for c in couriers
            ])
        
        # Explicit addresses (from the bulk email endpoint's recipient_emails)
        for email in filter_data.get('emails', []):
            recipients.append({'email': email, 'name': ''})

        # One message per address, even if it matched several groups
        unique = {}
        for recipient in recipients:
            unique.setdefault(recipient['email'].lower(), recipient)
        recipients = list(unique.values())

        # Additional filtering (simplified)
        if filter_data.get('has_orders'):
            # Would filter users with orders
            pass
        
        return recipients

class NotificationService:
    """Service for in-app notifications"""
    
    @staticmethod
    def create_notification(
        recipient,
        title: str,
        message: str,
        notification_type: str = 'info',
        action_url: str = '',
        action_label: str = '',
        related_model: str = '',
        related_id: str = '',
        request = None
    ) -> Notification:
        """Create an in-app notification"""
        from .models import Notification
        
        notification = Notification.objects.create(
            **Notification.recipient_fields(recipient),
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url,
            action_label=action_label,
            related_model=related_model,
            related_id=related_id
        )
        
        # Log the action
        if request:
            AuditLog.log_action(
                user=request.user if hasattr(request, 'user') else None,
                action='create',
                model_name='Notification',
                object_id=notification.id,
                details={
                    'recipient': recipient.email,
                    'title': title,
                    'type': notification_type
                },
                request=request
            )
        
        return notification
    
    @staticmethod
    def send_order_notifications(order_id: int, notification_type: str, request=None):
        """Send notifications related to an order"""
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            raise ValidationError(f"Order {order_id} not found.")
        
        notifications = []
        
        # Notify customer
        if notification_type == 'order_confirmed':
            notification = NotificationService.create_notification(
                recipient=order.customer,
                title='Order Confirmed',
                message=f'Your order #{order.order_number} has been confirmed.',
                notification_type='success',
                action_url=f'/orders/{order.id}',
                action_label='View Order',
                related_model='Order',
                related_id=str(order.id),
                request=request
            )
            notifications.append(notification)
        
        # Notify vendors
        for item in order.items.all():
            if notification_type == 'order_confirmed':
                vendor_notification = NotificationService.create_notification(
                    recipient=item.vendor,
                    title='New Order',
                    message=f'You have a new order for {item.product_name}.',
                    notification_type='info',
                    action_url=f'/vendor/orders/{order.id}',
                    action_label='View Order',
                    related_model='Order',
                    related_id=str(order.id),
                    request=request
                )
                notifications.append(vendor_notification)
        
        return notifications
    
    @staticmethod
    def get_unread_count(user) -> int:
        """Get count of unread notifications for user"""
        return Notification.for_recipient(user).filter(is_read=False).count()
    
    @staticmethod
    def mark_all_as_read(user):
        """Mark all notifications as read for user"""
        Notification.for_recipient(user).filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )

class MessageTemplateService:
    """Service for message template operations"""
    
    @staticmethod
    def create_template(
        name: str,
        subject: str,
        body_html: str,
        template_type: str = 'custom',
        body_text: str = '',
        variables: List = None,
        created_by=None,
        request=None
    ) -> MessageTemplate:
        """Create a new message template"""
        template = MessageTemplate.objects.create(
            name=name,
            template_type=template_type,
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            variables=variables or [],
            created_by=created_by,
            is_active=True
        )
        
        # Log the action
        if request:
            AuditLog.log_action(
                user=created_by,
                action='create',
                model_name='MessageTemplate',
                object_id=template.id,
                details={
                    'name': name,
                    'type': template_type
                },
                request=request
            )
        
        return template
    
    @staticmethod
    def preview_template(template_id: int, variables: Dict) -> str:
        """Preview template with variables"""
        try:
            template = MessageTemplate.objects.get(id=template_id)
        except MessageTemplate.DoesNotExist:
            raise ValidationError(f"Template {template_id} not found.")
        
        # Apply variables to template
        preview_html = template.body_html
        for key, value in variables.items():
            preview_html = preview_html.replace(f'{{{key}}}', str(value))
        
        return preview_html

class StatsService:
    """Service for messaging statistics"""
    
    @staticmethod
    def get_email_stats(start_date=None, end_date=None):
        """Get email statistics for a period"""
        if not start_date:
            start_date = timezone.now() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now()
        
        emails = EmailMessage.objects.filter(
            created_at__range=[start_date, end_date]
        )
        
        # Status only holds the latest event (an opened email is no longer 'sent'), so count each
        # stage from its timestamp/counter, falling back to status for older records.
        from django.db.models import Q
        total_sent = emails.filter(sent_at__isnull=False).count()
        total_delivered = emails.filter(Q(delivered_at__isnull=False) | Q(status__in=['opened', 'clicked'])).count()
        total_opened = emails.filter(Q(opened_at__isnull=False) | Q(status__in=['opened', 'clicked'])).count()
        total_clicked = emails.filter(Q(click_count__gt=0) | Q(status='clicked')).count()
        total_bounced = emails.filter(status='bounced').count()
        
        def rate(count):
            return round(count / total_sent * 100, 2) if total_sent else 0.0
        
        # Top templates
        from django.db.models import Count
        top_templates = EmailMessage.objects.filter(
            template__isnull=False,
            created_at__range=[start_date, end_date]
        ).values('template__name').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        # Recent activity
        recent_activity = emails.order_by('-created_at')[:10].values(
            'id', 'subject', 'status', 'sent_at', 'open_count'
        )
        
        return {
            'total_sent': total_sent,
            'total_delivered': total_delivered,
            'total_opened': total_opened,
            'total_clicked': total_clicked,
            'open_rate': rate(total_opened),
            'click_rate': rate(total_clicked),
            'bounce_rate': rate(total_bounced),
            'top_templates': list(top_templates),
            'recent_activity': list(recent_activity)
        }