import datetime
from django.shortcuts import render, get_object_or_404
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from authentication.permissions import IsAdminOrSuperAdmin
from authentication.models import AdminUser, UserSession
from .services import VendorService
from .serializers import (
    TempVendorRegistrationSerializer, VendorApprovalSerializer,
    VendorLoginSerializer, VendorProfileSerializer, VendorModerationSerializer
)
from email_service.services import EmailService
from core.tokens import account_activation_token
from authentication.session_contract import attach_session_cookies
from authentication.models import VendorUser

class TempVendorRegistrationView(APIView):
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser,)
    
    def post(self, request):
        try:
            vendor = VendorService.register_temp_vendor(request.data, request)
            return Response({
                "status": "success",
                "message": f"Registration successful. Activation email sent to {vendor.email}"
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class VendorApprovalView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def post(self, request, temp_vendor_id):
        serializer = VendorModerationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        action = serializer.validated_data.get('action', 'approve')
        comments = serializer.validated_data.get('comments', '')

        try:
            vendor = VendorService.moderate_vendor(
                temp_vendor_id=temp_vendor_id,
                action=action,
                admin_user=request.user,
                comments=comments,
                request=request,
            )

            action_message = {
                'approve': 'approved',
                'reject': 'rejected',
                'suspend': 'suspended',
                'reactivate': 'reactivated',
                'request_changes': 'marked for changes',
            }.get(action, 'updated')

            return Response({
                "status": "success",
                "message": f"Vendor {vendor.email} {action_message} successfully",
                "data": VendorApprovalSerializer(vendor).data
            })
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class TempVendorListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request):
        # Stage 3: use primary VendorUser table for pending approvals.
        vendors = VendorUser.objects.filter(is_active=True, is_approved=False)
        serializer = VendorApprovalSerializer(vendors, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })

class VendorListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request):
        from authentication.models import VendorUser
        vendors = VendorUser.objects.filter(is_active=True)
        serializer = VendorApprovalSerializer(vendors, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })

class VendorLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = VendorLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            vendor = serializer.validated_data.get('vendor')
            
            if not vendor:
                return Response({
                    "status": "error",
                    "message": "Invalid credentials or account pending approval"
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Create session
            session = VendorService.create_vendor_session(vendor, request)
            
            response = Response({
                "status": "success",
                "message": "Login successful",
                "data": {
                    "vendor": VendorProfileSerializer(vendor, context={'request': request}).data,
                    "session_token": session.session_token
                }
            })
            attach_session_cookies(response, session_token=session.session_token, role='vendor')
            return response
        
        return Response({
            "status": "error",
            "message": (
                str(next(iter(serializer.errors.values()))[0])
                if serializer.errors and isinstance(next(iter(serializer.errors.values())), (list, tuple))
                else str(next(iter(serializer.errors.values())))
                if serializer.errors
                else "Unable to log in. Please check your email and password and try again."
            ),
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class VendorProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Assuming request.user is authenticated vendor
        serializer = VendorProfileSerializer(request.user, context={'request': request})
        return Response({
            "status": "success",
            "data": serializer.data
        })

# Keep these function-based views for email activation
def activate_vendor(request, uidb64, token):
    """Activate vendor account"""
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        vendor = VendorUser.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, VendorUser.DoesNotExist):
        vendor = None
    
    if vendor is not None and account_activation_token.check_token(vendor, token):
        vendor.is_email_verified = True
        vendor.approval_status = 'pending'
        vendor.save()
        return render(request, "parcel_backends/activation_page.html", {
            "message": "Your vendor account has been activated successfully. Awaiting approval."
        })
    else:
        return render(request, "parcel_backends/activation_page.html", {
            "message": "The activation link is invalid or expired"
        })

def vendor_reset(request, uidb64, token):
    """Vendor password reset confirmation page"""
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        vendor = VendorUser.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, VendorUser.DoesNotExist):
        vendor = None
    
    if vendor is not None and account_activation_token.check_token(vendor, token):
        return render(request, "parcel_backends/password_reset_page.html", {
            "message": "Reset Your Password",
            "type": "vendor",
            "permit": "true",
            "user": vendor.email
        })
    else:
        return render(request, "parcel_backends/password_reset_page.html", {
            "message": "The link has expired",
            "permit": "false"
        })




















# import datetime
# from django.shortcuts import render, get_object_or_404
# from django.core.mail import EmailMessage
# from django.core.files.storage import FileSystemStorage
# from django.template.loader import render_to_string
# from django.contrib.sites.shortcuts import get_current_site
# from django.utils.encoding import force_str, force_bytes
# from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
# from django.contrib.auth.hashers import check_password, make_password
# from rest_framework.views import APIView
# from rest_framework.parsers import MultiPartParser
# from rest_framework.response import Response
# from rest_framework import status
# from .models import TempVendor, Vendor
# from .serializers import TempVendorSerializer, VendorSerializer, VendorLoginSerializer, VendorResetSerializer, VendorSaveResetSerializer
# from email_service.services import EmailService
# from core.tokens import account_activation_token

# class TempVendorViews(APIView):
#     parser_classes = (MultiPartParser,)

#     def post(self, request):
#         serializer = TempVendorSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 prosp_vend = TempVendor.objects.get(email=request.data['email'])
#                 if prosp_vend is not None:
#                     return Response({"status": "error", "data": "Vendor Already Exists"})
#             except TempVendor.DoesNotExist:
#                 upload = request.FILES['vend_photo']
#                 fss = FileSystemStorage()
#                 file = fss.save(upload.name, upload)
#                 file_url = fss.url(file)
#                 print(file_url)
#                 serializer.save()
#                 user = TempVendor.objects.get(email=request.data['email'])
#                 user.reg_date = datetime.datetime.today()
#                 user.save()
                
#                 # Send activation email
#                 EmailService.send_activation_email(user, request, 'parcel_backends/activate_email_vend.html')
                
#                 detail = f"Congratulation {user.first_name}, you have been registered. Check your mail to activate your account while waiting for approval."
#                 return Response({"status": "success", "data": detail})
#         else:
#             print(serializer.errors)
#             return Response({"status": "error", "data": "Enter valid data please."})

# def activate_vendor(request, uidb64, token):
#     try:
#         uid = force_str(urlsafe_base64_decode(uidb64))
#         user = TempVendor.objects.get(pk=uid)
#     except (TypeError, ValueError, OverflowError, TempVendor.DoesNotExist):
#         user = None
#     if user is not None and account_activation_token.check_token(user, token):
#         user.is_email_verified = True
#         user.save()
#         data = {"message": "Your account has been activated successfully"}
#         return render(request, "parcel_backends/activation_page.html", data)
#     else:
#         err_msg = {"message": "The used link is invalid"}
#         return render(request, "parcel_backends/activation_page.html", err_msg)

# class VendorViews(APIView):
#     def post(self, request):
#         ver_vend = TempVendor.objects.get(email=request.data['email'])
#         serializer = VendorSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 vend = Vendor.objects.get(email=request.data['email'])
#                 if vend is not None:
#                     return Response({"status": "error", "data": "Vendor Already Approved"},
#                                     status=status.HTTP_400_BAD_REQUEST)
#             except Vendor.DoesNotExist:
#                 if not ver_vend.is_email_verified:
#                     return Response({"status": "error", "data": "Vendor's Email has not been verified"})
#                 else:
#                     serializer.save()
#                     return Response({"status": "success", "data": "Vendor Approved"}, status=status.HTTP_200_OK)

# class DelTempVendorViews(APIView):
#     def delete(self, request, id=None):
#         item = get_object_or_404(TempVendor, id=id)
#         item.delete()
#         return Response({"status": "success", "data": "Vendor Deleted"})

# class GetTempVendorViews(APIView):
#     def get(self, request, id=None):
#         p_vendors = TempVendor.objects.all()
#         serializer = TempVendorSerializer(p_vendors, many=True)
#         return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)

# class GetVendorViews(APIView):
#     def get(self, request):
#         vendors = Vendor.objects.all()
#         serializer = VendorSerializer(vendors, many=True)
#         return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)

# class GetVendorByEmailViews(APIView):
#     def get(self, request, email=None):
#         vendor = Vendor.objects.get(email=email)
#         serializer = VendorSerializer(vendor)
#         return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)

# class VendorLoginViews(APIView):
#     def post(self, request):
#         serializer = VendorLoginSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 vendor = Vendor.objects.get(email=request.data['email'])
#                 if vendor is not None:
#                     access = check_password(request.data['password'], vendor.password)
#                     if access is True:
#                         acc_vendor = {
#                             "first_name": vendor.first_name,
#                             "last_name": vendor.last_name,
#                             "vend_photo": vendor.vend_photo,
#                             "email": vendor.email,
#                             "phone_no": vendor.phone_no,
#                             "bus_category": vendor.bus_category
#                         }
#                         return Response({"status": "success", "data": acc_vendor})
#                     else:
#                         return Response({"status": "password-error", "data": "Wrong Password Supplied. Reset your password then."})
#             except Vendor.DoesNotExist:
#                 try:
#                     ver_vend = TempVendor.objects.get(email=request.data['email'])
#                     if ver_vend is not None:
#                         if ver_vend.is_email_verified is False:
#                             return Response({"status": "error", "data": "You are yet to activate your account, check your mail to do so."})
#                         else:
#                             return Response({"status": "error", "data": "Your are yet to be approved."})
#                 except TempVendor.DoesNotExist:
#                     return Response({"status": "error", "data": "Vendor does not exist, register please."})

# class VendorResetViews(APIView):
#     def post(self, request):
#         serializer = VendorResetSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 user = Vendor.objects.get(email=request.data['email'])
#                 if user is not None:
#                     EmailService.send_password_reset_email(user, request, 'parcel_backends/vendor_reset.html')
#                     detail = f"Dear {user.first_name}, a password reset link has been sent to your mail. Visit your mail to reset your password."
#                     return Response({"status": "success", "data": detail}, status=status.HTTP_200_OK)
#             except Vendor.DoesNotExist:
#                 return Response({"status": "error", "data": "E-Mail does not exist"})

# def vendor_reset(request, uidb64, token):
#     try:
#         uid = force_str(urlsafe_base64_decode(uidb64))
#         user = Vendor.objects.get(pk=uid)
#     except (TypeError, ValueError, OverflowError, Vendor.DoesNotExist):
#         user = None
#     if user is not None and account_activation_token.check_token(user, token):
#         data = {
#             "message": "Reset Your Password",
#             "type": "vendor",
#             "permit": "true",
#             "user": user.email
#         }
#         return render(request, "parcel_backends/password_reset_page.html", data)
#     else:
#         err_msg = {
#             "message": "The link has expired",
#             "permit": "false"
#         }
#         return render(request, "parcel_backends/password_reset_page.html", err_msg)

# class VendorSaveResetViews(APIView):
#     def post(self, request):
#         serializer = VendorSaveResetSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 user = Vendor.objects.get(email=request.data['email'])
#                 if user is not None:
#                     user.password = make_password(request.data['password'])
#                     user.save()
#                     data = "Your password has been reset successfully"
#                     return Response({"status": "success", "data": data})
#             except Vendor.DoesNotExist:
#                 return Response({"status": "error", "data": "User does not exist"})