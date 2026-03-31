from rest_framework import serializers
from django.utils import timezone
from .models import (
    MessageTemplate, EmailMessage, EmailAttachment,
    Unsubscribe, EmailQueue, Notification, SMTPSettings
)
from authentication.serializers import AdminUserSerializer

class MessageTemplateSerializer(serializers.ModelSerializer):
    """Serializer for message templates"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    variable_list = serializers.ListField(read_only=True)
    
    class Meta:
        model = MessageTemplate
        fields = [
            'id', 'name', 'template_type', 'subject',
            'body_html', 'body_text', 'variables', 'variable_list',
            'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'variable_list']
    
    def validate_name(self, value):
        """Ensure template name is unique"""
        qs = MessageTemplate.objects.filter(name=value)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError('A template with this name already exists.')
        return value

class EmailMessageSerializer(serializers.ModelSerializer):
    """Serializer for email messages"""
    sender_details = AdminUserSerializer(source='sender', read_only=True)
    template_details = MessageTemplateSerializer(source='template', read_only=True)
    recipient_emails = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = EmailMessage
        fields = [
            'id', 'message_id', 'sender', 'sender_details', 'sender_email', 'sender_name',
            'recipients', 'recipient_groups', 'recipient_emails', 'subject',
            'body_html', 'body_text', 'template', 'template_details', 'template_variables',
            'status', 'status_display', 'priority', 'priority_display',
            'sent_at', 'delivered_at', 'opened_at', 'open_count', 'click_count',
            'provider', 'provider_message_id', 'provider_response',
            'attachments', 'scheduled_for', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'message_id', 'sent_at', 'delivered_at', 'opened_at',
            'open_count', 'click_count', 'provider_response', 'created_at', 'updated_at'
        ]
    
    def get_recipient_emails(self, obj):
        return obj.get_recipient_emails()
    
    def validate_recipients(self, value):
        """Validate recipient list"""
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        
        if not isinstance(value, list):
            raise serializers.ValidationError('Recipients must be a list.')
        
        for recipient in value:
            if 'email' not in recipient:
                raise serializers.ValidationError('Each recipient must have an email address.')
            
            try:
                validate_email(recipient['email'])
            except ValidationError:
                raise serializers.ValidationError(f"Invalid email address: {recipient['email']}")
        
        return value
    
    def validate(self, data):
        """Validate email message data"""
        # Ensure either body or template is provided
        if not data.get('body_html') and not data.get('template'):
            raise serializers.ValidationError({
                'body_html': 'Either body_html or template must be provided.'
            })
        
        return data

class EmailMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating email messages"""
    recipient_emails = serializers.ListField(
        child=serializers.EmailField(),
        write_only=True,
        required=True
    )
    recipient_names = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        write_only=True,
        required=False
    )
    template_id = serializers.IntegerField(write_only=True, required=False)
    template_data = serializers.DictField(write_only=True, required=False)
    
    class Meta:
        model = EmailMessage
        fields = [
            'subject', 'body_html', 'body_text',
            'recipient_emails', 'recipient_names',
            'template_id', 'template_data',
            'priority', 'scheduled_for'
        ]
        extra_kwargs = {
            'body_html': {'required': False},
            'body_text': {'required': False},
        }
    
    def validate(self, data):
        # Check if template exists
        template_id = data.get('template_id')
        if template_id:
            try:
                template = MessageTemplate.objects.get(id=template_id, is_active=True)
                data['template'] = template
            except MessageTemplate.DoesNotExist:
                raise serializers.ValidationError({
                    'template_id': 'Template not found or inactive.'
                })
        
        # If no template and no body, error
        if not data.get('template') and not data.get('body_html'):
            raise serializers.ValidationError({
                'body_html': 'Message body is required when not using a template.'
            })
        
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        
        # Extract recipient data
        recipient_emails = validated_data.pop('recipient_emails', [])
        recipient_names = validated_data.pop('recipient_names', [])
        template_data = validated_data.pop('template_data', {})
        
        # Format recipients
        recipients = []
        for i, email in enumerate(recipient_emails):
            recipient = {
                'email': email,
                'type': 'to',
                'name': recipient_names[i] if i < len(recipient_names) else ''
            }
            recipients.append(recipient)
        
        # Set sender info
        validated_data['sender'] = request.user
        validated_data['sender_email'] = request.user.email
        validated_data['recipients'] = recipients
        
        # Apply template if provided
        template = validated_data.get('template')
        if template:
            # Render template with variables (simplified)
            body_html = template.body_html
            for key, value in template_data.items():
                body_html = body_html.replace(f'{{{key}}}', str(value))
            validated_data['body_html'] = body_html
            validated_data['template_variables'] = template_data
        
        return super().create(validated_data)

class EmailAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for email attachments"""
    file_url = serializers.SerializerMethodField(read_only=True)
    file_size_formatted = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = EmailAttachment
        fields = [
            'id', 'email', 'file_name', 'file_size', 'file_size_formatted',
            'mime_type', 'storage_path', 'file_url', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'file_size_formatted']
    
    def get_file_url(self, obj):
        # In production, generate signed URL
        return f"/api/messaging/attachments/{obj.id}/download/"
    
    def get_file_size_formatted(self, obj):
        """Format file size in human readable format"""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

class UnsubscribeSerializer(serializers.ModelSerializer):
    """Serializer for unsubscribes"""
    class Meta:
        model = Unsubscribe
        fields = [
            'id', 'email', 'reason', 'category',
            'unsubscribed_at', 'ip_address', 'user_agent'
        ]
        read_only_fields = ['id', 'unsubscribed_at']

class EmailQueueSerializer(serializers.ModelSerializer):
    """Serializer for email queues"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    template_details = MessageTemplateSerializer(source='template', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    progress_percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = EmailQueue
        fields = [
            'id', 'name', 'description', 'template', 'template_details',
            'template_variables', 'recipient_filter', 'total_recipients',
            'processed_recipients', 'status', 'status_display', 'scheduled_for',
            'started_at', 'completed_at', 'success_count', 'failure_count',
            'progress_percentage', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_recipients', 'processed_recipients',
            'started_at', 'completed_at', 'success_count', 'failure_count',
            'progress_percentage', 'created_at', 'updated_at'
        ]

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    recipient_email = serializers.EmailField(source='recipient.email', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_email', 'recipient_name',
            'title', 'message', 'notification_type', 'type_display',
            'action_url', 'action_label', 'is_read', 'is_archived',
            'related_model', 'related_id', 'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']

class SMTPSettingsSerializer(serializers.ModelSerializer):
    """Serializer for SMTP settings"""
    class Meta:
        model = SMTPSettings
        fields = [
            'id', 'name', 'host', 'port', 'username',
            'password', 'use_tls', 'use_ssl',
            'default_from_email', 'default_from_name',
            'max_emails_per_hour', 'max_emails_per_day',
            'is_active', 'is_default', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_password(self, value):
        """In production, encrypt password"""
        # For now, just return as is
        # In production: encrypt with Django's cryptography or AWS KMS
        return value

class BulkEmailSerializer(serializers.Serializer):
    """Serializer for bulk email operations"""
    template_id = serializers.IntegerField(required=True)
    recipient_filter = serializers.DictField(required=False, default={})
    recipient_emails = serializers.ListField(
        child=serializers.EmailField(),
        required=False
    )
    template_data = serializers.DictField(required=False, default={})
    scheduled_for = serializers.DateTimeField(required=False)
    name = serializers.CharField(max_length=100, required=True)
    description = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        # Check template exists
        try:
            template = MessageTemplate.objects.get(id=data['template_id'], is_active=True)
            data['template'] = template
        except MessageTemplate.DoesNotExist:
            raise serializers.ValidationError({
                'template_id': 'Template not found or inactive.'
            })
        
        # Either recipient_filter or recipient_emails must be provided
        if not data.get('recipient_filter') and not data.get('recipient_emails'):
            raise serializers.ValidationError(
                'Either recipient_filter or recipient_emails must be provided.'
            )
        
        return data

class EmailStatsSerializer(serializers.Serializer):
    """Serializer for email statistics"""
    total_sent = serializers.IntegerField()
    total_delivered = serializers.IntegerField()
    total_opened = serializers.IntegerField()
    total_clicked = serializers.IntegerField()
    open_rate = serializers.FloatField()
    click_rate = serializers.FloatField()
    bounce_rate = serializers.FloatField()
    top_templates = serializers.ListField(child=serializers.DictField())
    recent_activity = serializers.ListField(child=serializers.DictField())