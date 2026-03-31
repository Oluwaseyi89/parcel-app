# messaging/views.py
from django.shortcuts import render
from datetime import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from authentication.permissions import IsAdminOrSuperAdmin
from .services import EmailService, NotificationService, MessageTemplateService, StatsService
from .serializers import (
    MessageTemplateSerializer, EmailMessageSerializer, EmailMessageCreateSerializer,
    EmailQueueSerializer, NotificationSerializer, SMTPSettingsSerializer,
    BulkEmailSerializer, EmailStatsSerializer
)
from .models import MessageTemplate, EmailMessage, EmailQueue, Notification, SMTPSettings

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class MessageTemplateListView(APIView):
    """List and create message templates"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request):
        template_type = request.query_params.get('type')
        is_active = request.query_params.get('is_active')
        
        queryset = MessageTemplate.objects.all()
        
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        serializer = MessageTemplateSerializer(queryset, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })
    
    def post(self, request):
        serializer = MessageTemplateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        template = MessageTemplateService.create_template(
            name=serializer.validated_data['name'],
            subject=serializer.validated_data['subject'],
            body_html=serializer.validated_data['body_html'],
            template_type=serializer.validated_data.get('template_type', 'custom'),
            body_text=serializer.validated_data.get('body_text', ''),
            variables=serializer.validated_data.get('variables', []),
            created_by=request.user,
            request=request
        )
        
        return Response({
            "status": "success",
            "message": "Template created successfully",
            "data": MessageTemplateSerializer(template).data
        }, status=status.HTTP_201_CREATED)

class MessageTemplateDetailView(APIView):
    """Retrieve, update, or delete a message template"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request, template_id):
        try:
            template = MessageTemplate.objects.get(id=template_id)
        except MessageTemplate.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Template not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MessageTemplateSerializer(template)
        return Response({
            "status": "success",
            "data": serializer.data
        })
    
    def put(self, request, template_id):
        try:
            template = MessageTemplate.objects.get(id=template_id)
        except MessageTemplate.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Template not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MessageTemplateSerializer(template, data=request.data, partial=True)
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer.save()
        
        return Response({
            "status": "success",
            "message": "Template updated successfully",
            "data": serializer.data
        })
    
    def delete(self, request, template_id):
        try:
            template = MessageTemplate.objects.get(id=template_id)
        except MessageTemplate.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Template not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        template.delete()
        
        return Response({
            "status": "success",
            "message": "Template deleted successfully"
        })

class EmailMessageListView(APIView):
    """List and send email messages"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    pagination_class = StandardPagination
    
    def get(self, request):
        status_filter = request.query_params.get('status')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        search = request.query_params.get('search')
        
        queryset = EmailMessage.objects.all()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) |
                Q(sender_email__icontains=search) |
                Q(recipients__icontains=search)
            )
        
        # Pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        serializer = EmailMessageSerializer(page, many=True)
        return paginator.get_paginated_response({
            "status": "success",
            "data": serializer.data
        })
    
    def post(self, request):
        serializer = EmailMessageCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            email_message = EmailService.send_email(
                subject=serializer.validated_data['subject'],
                body_html=serializer.validated_data.get('body_html', ''),
                recipient_emails=serializer.validated_data['recipient_emails'],
                body_text=serializer.validated_data.get('body_text', ''),
                template=serializer.validated_data.get('template'),
                template_data=serializer.validated_data.get('template_data', {}),
                priority=serializer.validated_data.get('priority', 'normal'),
                request=request
            )
            
            return Response({
                "status": "success",
                "message": "Email queued for sending",
                "data": EmailMessageSerializer(email_message).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class SendOrderConfirmationView(APIView):
    """Send order confirmation email"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def post(self, request, order_id):
        try:
            email_message = EmailService.send_order_confirmation(order_id, request)
            
            return Response({
                "status": "success",
                "message": "Order confirmation email sent",
                "data": EmailMessageSerializer(email_message).data
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class BulkEmailView(APIView):
    """Send bulk emails or create email queues"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def post(self, request):
        serializer = BulkEmailSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create email queue
        queue = EmailQueue.objects.create(
            name=serializer.validated_data['name'],
            description=serializer.validated_data.get('description', ''),
            template=serializer.validated_data['template'],
            template_variables=serializer.validated_data.get('template_data', {}),
            recipient_filter=serializer.validated_data.get('recipient_filter', {}),
            scheduled_for=serializer.validated_data.get('scheduled_for', timezone.now()),
            created_by=request.user
        )
        
        # Process queue immediately if not scheduled for future
        if queue.scheduled_for <= timezone.now():
            from .tasks import process_email_queue_task
            process_email_queue_task.delay(queue.id)
        
        return Response({
            "status": "success",
            "message": f"Email queue '{queue.name}' created",
            "data": EmailQueueSerializer(queue).data
        }, status=status.HTTP_201_CREATED)

class NotificationListView(APIView):
    """List and manage notifications"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        is_read = request.query_params.get('is_read')
        notification_type = request.query_params.get('type')
        limit = request.query_params.get('limit', 50)
        
        queryset = Notification.objects.filter(recipient=request.user)
        
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        queryset = queryset.order_by('-created_at')[:int(limit)]
        
        unread_count = NotificationService.get_unread_count(request.user)
        
        serializer = NotificationSerializer(queryset, many=True)
        return Response({
            "status": "success",
            "data": serializer.data,
            "unread_count": unread_count
        })
    
    def post(self, request):
        # Mark all as read
        if request.data.get('action') == 'mark_all_read':
            NotificationService.mark_all_as_read(request.user)
            return Response({
                "status": "success",
                "message": "All notifications marked as read"
            })
        
        return Response({
            "status": "error",
            "message": "Invalid action"
        }, status=status.HTTP_400_BAD_REQUEST)

class NotificationDetailView(APIView):
    """Manage individual notifications"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, recipient=request.user)
        except Notification.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Notification not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        action = request.data.get('action')
        
        if action == 'mark_read':
            notification.mark_as_read()
        elif action == 'mark_unread':
            notification.mark_as_unread()
        elif action == 'archive':
            notification.is_archived = True
            notification.save()
        else:
            return Response({
                "status": "error",
                "message": "Invalid action"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            "status": "success",
            "message": f"Notification {action.replace('_', ' ')}",
            "data": NotificationSerializer(notification).data
        })

class SMTPSettingsView(APIView):
    """Manage SMTP settings"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request):
        settings = SMTPSettings.objects.all()
        serializer = SMTPSettingsSerializer(settings, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })
    
    def post(self, request):
        serializer = SMTPSettingsSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        smtp_settings = serializer.save()
        
        return Response({
            "status": "success",
            "message": "SMTP settings saved",
            "data": SMTPSettingsSerializer(smtp_settings).data
        }, status=status.HTTP_201_CREATED)

class EmailStatsView(APIView):
    """Get email statistics"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        stats = StatsService.get_email_stats(start_date, end_date)
        serializer = EmailStatsSerializer(stats)
        
        return Response({
            "status": "success",
            "data": serializer.data
        })

class TemplatePreviewView(APIView):
    """Preview template with variables"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def post(self, request, template_id):
        variables = request.data.get('variables', {})
        
        try:
            preview_html = MessageTemplateService.preview_template(template_id, variables)
            
            return Response({
                "status": "success",
                "data": {
                    'preview_html': preview_html
                }
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

# Template views (legacy compatibility)
def message(request):
    return render(request, "messaging/message.html")