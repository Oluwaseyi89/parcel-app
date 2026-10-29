# courier/views.py
import datetime
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from authentication.permissions import IsAdminOrSuperAdmin, IsCourier, IsCourierOrAdmin
from core.pagination import paginated_response
from authentication.models import AdminUser, UserSession
from .services import CourierService
from .serializers import (
    TempCourierRegistrationSerializer, CourierApprovalSerializer,
    CourierLoginSerializer, CourierProfileSerializer,
    CourierLocationUpdateSerializer, CourierStatusUpdateSerializer,
    CourierModerationSerializer
)
from authentication.models import CourierUser
from email_service.services import EmailService
from authentication.session_contract import attach_session_cookies
from core.activation import activate_from_email_link

class TempCourierRegistrationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'
    parser_classes = (MultiPartParser,)
    
    def post(self, request):
        try:
            courier = CourierService.register_temp_courier(request.data, request)
            return Response({
                "status": "success",
                "message": f"Registration successful. Activation email sent to {courier.email}"
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class CourierApprovalView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def post(self, request, temp_courier_id):
        serializer = CourierModerationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        action = serializer.validated_data.get('action', 'approve')
        comments = serializer.validated_data.get('comments', '')

        try:
            courier = CourierService.moderate_courier(
                temp_courier_id=temp_courier_id,
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
                "message": f"Courier {courier.email} {action_message} successfully",
                "data": CourierApprovalSerializer(courier).data
            })
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class TempCourierListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request):
        # Stage 3: use primary CourierUser table for pending approvals.
        couriers = CourierUser.objects.filter(is_active=True, is_approved=False).order_by('-created_at', '-id')
        return paginated_response(request, couriers, lambda page: CourierApprovalSerializer(page, many=True).data)

class CourierListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        from authentication.models import CourierUser
        couriers = CourierUser.objects.filter(is_active=True).order_by('-created_at', '-id')
        return paginated_response(request, couriers, lambda page: CourierApprovalSerializer(page, many=True).data)

class CourierLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'
    
    def post(self, request):
        serializer = CourierLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            courier = serializer.validated_data.get('courier')
            
            if not courier:
                return Response({
                    "status": "error",
                    "message": "Invalid credentials or account pending approval"
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Create session
            session = CourierService.create_courier_session(courier, request)
            
            response = Response({
                "status": "success",
                "message": "Login successful",
                "data": {
                    "courier": CourierProfileSerializer(courier, context={'request': request}).data,
                    "session_token": session.session_token
                }
            })
            attach_session_cookies(response, session_token=session.session_token, role='courier')
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

class CourierProfileView(APIView):
    permission_classes = [IsAuthenticated, IsCourier]
    
    def get(self, request):
        # Assuming request.user is authenticated courier
        serializer = CourierProfileSerializer(request.user, context={'request': request})
        return Response({
            "status": "success",
            "data": serializer.data
        })

class CourierLocationUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsCourier]
    
    def post(self, request):
        serializer = CourierLocationUpdateSerializer(data=request.data)
        if serializer.is_valid():
            courier = request.user
            CourierService.update_courier_location(
                courier,
                serializer.validated_data['latitude'],
                serializer.validated_data['longitude']
            )
            return Response({
                "status": "success",
                "message": "Location updated successfully"
            })
        
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class CourierStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsCourier]
    
    def post(self, request):
        serializer = CourierStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            courier = request.user
            CourierService.update_courier_status(
                courier,
                serializer.validated_data['status']
            )
            return Response({
                "status": "success",
                "message": f"Status updated to {serializer.validated_data['status']}"
            })
        
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class AvailableCouriersView(APIView):
    permission_classes = [IsAuthenticated, IsCourierOrAdmin]
    
    def get(self, request):
        latitude = request.query_params.get('lat')
        longitude = request.query_params.get('lng')
        radius = request.query_params.get('radius', 10)
        
        try:
            couriers = CourierService.get_available_couriers(
                latitude=float(latitude) if latitude else None,
                longitude=float(longitude) if longitude else None,
                radius_km=int(radius)
            )
            serializer = CourierProfileSerializer(couriers, many=True, context={'request': request})
            return Response({
                "status": "success",
                "data": serializer.data
            })
        except ValueError:
            return Response({
                "status": "error",
                "message": "Invalid coordinates provided"
            }, status=status.HTTP_400_BAD_REQUEST)

# Keep these function-based views for email activation
def activate_courier(request, uidb64, token):
    """Verify a courier from the emailed link and queue it for approval, then redirect to the web app."""
    def queue_for_approval(courier):
        courier.approval_status = 'pending'
        return ['approval_status']

    return activate_from_email_link(CourierUser, uidb64, token, role='courier', on_activate=queue_for_approval)

# import datetime
# from django.shortcuts import render, get_object_or_404
# from django.core.files.storage import FileSystemStorage
# from django.contrib.auth.hashers import check_password, make_password
# from rest_framework.views import APIView
# from rest_framework.parsers import MultiPartParser
# from rest_framework.response import Response
# from rest_framework import status
# from .models import TempCourier, Courier
# from .serializers import TempCourierSerializer, CourierSerializer, CourierLoginSerializer, CourierResetSerializer, CourierSaveResetSerializer
# from email_service.services import EmailService
# from core.tokens import account_activation_token
# from django.utils.encoding import force_str
# from django.utils.http import urlsafe_base64_decode

# class TempCourierViews(APIView):
#     parser_classes = (MultiPartParser,)

#     def post(self, request):
#         serializer = TempCourierSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 prosp_cour = TempCourier.objects.get(email=request.data['email'])
#                 if prosp_cour is not None:
#                     return Response({"status": "error", "data": "Courier Already Exists"},
#                                     status=status.HTTP_400_BAD_REQUEST)
#             except TempCourier.DoesNotExist:
#                 upload = request.FILES['cour_photo']
#                 fss = FileSystemStorage()
#                 file = fss.save(upload.name, upload)
#                 file_url = fss.url(file)
#                 print(file_url)
#                 serializer.save()
#                 user = TempCourier.objects.get(email=request.data['email'])
#                 user.reg_date = datetime.datetime.today()
#                 user.save()
                
#                 EmailService.send_activation_email(user, request, 'parcel_backends/activate_email_cour.html')
                
#                 detail = f"Congratulation {user.first_name}, you have been registered. Check your mail to activate your account while waiting for approval."
#                 return Response({"status": "success", "data": detail}, status=status.HTTP_200_OK)

# def activate_courier(request, uidb64, token):
#     try:
#         uid = force_str(urlsafe_base64_decode(uidb64))
#         user = TempCourier.objects.get(pk=uid)
#     except (TypeError, ValueError, OverflowError, TempCourier.DoesNotExist):
#         user = None
#     if user is not None and account_activation_token.check_token(user, token):
#         user.is_email_verified = True
#         user.save()
#         data = {"message": "Your account has been activated successfully"}
#         return render(request, "parcel_backends/activation_page.html", data)
#     else:
#         err_msg = {"message": "The used link is invalid"}
#         return render(request, "parcel_backends/activation_page.html", err_msg)

# class CourierViews(APIView):
#     def post(self, request):
#         ver_cour = TempCourier.objects.get(email=request.data['email'])
#         serializer = CourierSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 cour = Courier.objects.get(email=request.data['email'])
#                 if cour is not None:
#                     return Response({"status": "error", "data": "Courier Already Approved"},
#                                     status=status.HTTP_400_BAD_REQUEST)
#             except Courier.DoesNotExist:
#                 if not ver_cour.is_email_verified:
#                     return Response({"status": "error", "data": "Courier's Email has not been verified"})
#                 else:
#                     serializer.save()
#                     return Response({"status": "success", "data": "Courier Approved"}, status=status.HTTP_200_OK)

# class DelTempCourierViews(APIView):
#     def delete(self, request, id=None):
#         item = get_object_or_404(TempCourier, id=id)
#         item.delete()
#         return Response({"status": "success", "data": "Courier Deleted"})

# class GetTempCourierViews(APIView):
#     def get(self, request, id=None):
#         p_couriers = TempCourier.objects.all()
#         serializer = TempCourierSerializer(p_couriers, many=True)
#         return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)

# class GetCourierViews(APIView):
#     def get(self, request, id=None):
#         couriers = Courier.objects.all()
#         serializer = CourierSerializer(couriers, many=True)
#         return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)

# class CourierLoginViews(APIView):
#     def post(self, request):
#         serializer = CourierLoginSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 courier = Courier.objects.get(email=request.data['email'])
#                 if courier is not None:
#                     access = check_password(request.data['password'], courier.password)
#                     if access is True:
#                         acc_courier = {
#                             "id": courier.id,
#                             "first_name": courier.first_name,
#                             "last_name": courier.last_name,
#                             "cour_photo": courier.cour_photo,
#                             "email": courier.email,
#                             "phone_no": courier.phone_no
#                         }
#                         return Response({"status": "success", "data": acc_courier})
#                     else:
#                         return Response({"status": "password-error", "data": "Wrong Password Supplied. Reset your password then."})
#             except Courier.DoesNotExist:
#                 try:
#                     ver_cour = TempCourier.objects.get(email=request.data['email'])
#                     if ver_cour is not None:
#                         if ver_cour.is_email_verified is False:
#                             return Response({"status": "error", "data": "You are yet to activate your account, check your mail to do so."})
#                         else:
#                             return Response({"status": "error", "data": "Your are yet to be approved."})
#                 except TempCourier.DoesNotExist:
#                     return Response({"status": "error", "data": "Courier does not exist, register please."})

# class CourierResetViews(APIView):
#     def post(self, request):
#         serializer = CourierResetSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 user = Courier.objects.get(email=request.data['email'])
#                 if user is not None:
#                     EmailService.send_password_reset_email(user, request, 'parcel_backends/courier_reset.html')
#                     detail = f"Dear {user.first_name}, a password reset link has been sent to your mail. Visit your mail to reset your password."
#                     return Response({"status": "success", "data": detail}, status=status.HTTP_200_OK)
#             except Courier.DoesNotExist:
#                 return Response({"status": "error", "data": "E-Mail does not exist"})

# def courier_reset(request, uidb64, token):
#     try:
#         uid = force_str(urlsafe_base64_decode(uidb64))
#         user = Courier.objects.get(pk=uid)
#     except (TypeError, ValueError, OverflowError, Courier.DoesNotExist):
#         user = None
#     if user is not None and account_activation_token.check_token(user, token):
#         data = {
#             "message": "Reset Your Password",
#             "type": "courier",
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

# class CourierSaveResetViews(APIView):
#     def post(self, request):
#         serializer = CourierSaveResetSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 user = Courier.objects.get(email=request.data['email'])
#                 if user is not None:
#                     user.password = make_password(request.data['password'])
#                     user.save()
#                     data = "Your password has been reset successfully"
#                     return Response({"status": "success", "data": data})
#             except Courier.DoesNotExist:
#                 return Response({"status": "error", "data": "User does not exist"})