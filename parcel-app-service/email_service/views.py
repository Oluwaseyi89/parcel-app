from django.shortcuts import render
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.contrib.sites.shortcuts import get_current_site
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from core.tokens import account_activation_token

def email_msg_view(request):
    """
    Preview email templates for testing purposes
    """
    current_site = get_current_site(request)
    
    # Example data for preview
    example_data = {
        'user': {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'johndoe@example.com',
        },
        'domain': current_site.domain,
        'uid': urlsafe_base64_encode(force_bytes(1)),
        'token': 'example-token-12345',
    }
    
    # Render different email templates
    context = {
        'activate_vendor_email': render_to_string(
            'parcel_backends/activate_email_vend.html', 
            example_data
        ),
        'activate_courier_email': render_to_string(
            'parcel_backends/activate_email_cour.html', 
            example_data
        ),
        'vendor_reset_email': render_to_string(
            'parcel_backends/vendor_reset.html', 
            example_data
        ),
        'courier_reset_email': render_to_string(
            'parcel_backends/courier_reset.html', 
            example_data
        ),
    }
    
    return render(request, "parcel_backends/email_preview.html", context)


class SendTestEmailView(APIView):
    """API endpoint to send test emails"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email_type = request.data.get('type', 'test')
        recipient = request.data.get('recipient', '')
        
        if not recipient:
            return Response({
                "status": "error",
                "message": "Recipient email is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if email_type == 'test':
                subject = "Test Email from Parcel Delivery"
                message = "This is a test email from the Parcel Delivery system."
                email = EmailMessage(subject, message, to=[recipient])
                email.send()
                
                return Response({
                    "status": "success",
                    "message": f"Test email sent to {recipient}"
                })
            else:
                return Response({
                    "status": "error",
                    "message": f"Unknown email type: {email_type}"
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                "status": "error",
                "message": f"Failed to send email: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailTemplateListView(APIView):
    """List available email templates"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        templates = [
            {
                "name": "Vendor Activation",
                "template": "parcel_backends/activate_email_vend.html",
                "description": "Sent to vendors when they register",
                "variables": ["user", "domain", "uid", "token"]
            },
            {
                "name": "Courier Activation",
                "template": "parcel_backends/activate_email_cour.html",
                "description": "Sent to couriers when they register",
                "variables": ["user", "domain", "uid", "token"]
            },
            {
                "name": "Vendor Password Reset",
                "template": "parcel_backends/vendor_reset.html",
                "description": "Sent to vendors when resetting password",
                "variables": ["user", "domain", "uid", "token"]
            },
            {
                "name": "Courier Password Reset",
                "template": "parcel_backends/courier_reset.html",
                "description": "Sent to couriers when resetting password",
                "variables": ["user", "domain", "uid", "token"]
            },
        ]
        
        return Response({
            "status": "success",
            "data": templates
        })