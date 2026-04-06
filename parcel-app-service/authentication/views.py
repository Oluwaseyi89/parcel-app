import json
import secrets
from datetime import datetime, timedelta
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from .models import AdminUser, UserSession
from .serializers import (
    AdminLoginSerializer, AdminSessionSerializer, 
    AdminUserSerializer, ChangePasswordSerializer,
    AdminCreateSerializer, CustomerProfileSerializer
)
from .permissions import IsSuperAdmin, IsAdminOrSuperAdmin
from django.conf import settings


from .models import CustomerUser, VendorUser, CourierUser
from .serializers import (
    CustomerRegistrationSerializer, CustomerLoginSerializer,
    ForgotPasswordSerializer, CustomerPasswordResetSerializer,
    CustomerUpdateSerializer
)
from .services import EmailService, CustomerService

from core.tokens import account_activation_token




# ==================== API VIEWS ====================

class AdminLoginView(APIView):
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        if serializer.is_valid():
            admin = serializer.validated_data['admin']
            
            # Create session
            session_token = secrets.token_urlsafe(32)
            expires_at = timezone.now() + timedelta(hours=8)
            content_type = ContentType.objects.get_for_model(admin)
            
            session = UserSession.objects.create(
                content_type=content_type,
                object_id=admin.id,
                session_token=session_token,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                expires_at=expires_at
            )
            
            # Update last login
            admin.last_login = timezone.now()
            admin.save()
            
            session_serializer = AdminSessionSerializer(session)
            
            response_data = {
                "status": "success",
                "message": "Login successful",
                "session": session_serializer.data,
                "admin": {
                    "email": admin.email,
                    "role": admin.role,
                    "first_name": admin.first_name,
                    "last_name": admin.last_name
                }
            }
            
            # Set session cookie (optional)
            response = Response(response_data, status=status.HTTP_200_OK)
            response.set_cookie(
                key='admin_session',
                value=session_token,
                httponly=True,
                secure=not settings.DEBUG,  # Secure in production
                samesite='Lax',
                max_age=8*60*60  # 8 hours
            )
            
            return response
        
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AdminLogoutView(APIView):
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        session_token = request.COOKIES.get('admin_session')
        if session_token:
            try:
                session = UserSession.objects.get(
                    session_token=session_token,
                    is_active=True
                )
                session.is_active = False
                session.save()
            except UserSession.DoesNotExist:
                pass
        
        response = Response({
            "status": "success",
            "message": "Logged out successfully"
        }, status=status.HTTP_200_OK)
        response.delete_cookie('admin_session')
        return response


class AdminProfileView(APIView):
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        admin = request.user
        serializer = AdminUserSerializer(admin)
        return Response({
            "status": "success",
            "data": serializer.data
        })
    
    def patch(self, request):
        admin = request.user
        serializer = AdminUserSerializer(admin, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "message": "Profile updated successfully",
                "data": serializer.data
            })
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


class ChangePasswordView(APIView):
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            admin = request.user
            
            # Verify current password
            if not admin.check_password(serializer.validated_data['current_password']):
                return Response({
                    "status": "error",
                    "error": "Current password is incorrect"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            admin.set_password(serializer.validated_data['new_password'])
            admin.save()
            
            return Response({
                "status": "success",
                "message": "Password changed successfully"
            })
        
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class AdminUserListView(APIView):
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsSuperAdmin]
    
    def get(self, request):
        admins = AdminUser.objects.all()
        serializer = AdminUserSerializer(admins, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })
    
    def post(self, request):
        serializer = AdminCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "message": "Admin user created successfully",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class AdminCustomerListView(APIView):
    """Admin customer management (list/detail/update/deactivate)."""
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    @staticmethod
    def _as_bool(value):
        return str(value).strip().lower() in ['1', 'true', 'yes', 'on']

    def get(self, request, pk=None):
        if pk is not None:
            customer = get_object_or_404(CustomerUser, pk=pk)
            serializer = CustomerProfileSerializer(customer)
            return Response({
                "status": "success",
                "data": serializer.data
            })

        queryset = CustomerUser.objects.all().order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        is_active = request.query_params.get('is_active')
        if is_active is not None:
            active_flag = self._as_bool(is_active)
            queryset = queryset.filter(is_active=active_flag)

        is_email_verified = request.query_params.get('is_email_verified')
        if is_email_verified is not None:
            verified_flag = self._as_bool(is_email_verified)
            queryset = queryset.filter(is_email_verified=verified_flag)

        serializer = CustomerProfileSerializer(queryset, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })

    def patch(self, request, pk=None):
        if pk is None:
            return Response({
                "status": "error",
                "message": "Customer id is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        customer = get_object_or_404(CustomerUser, pk=pk)

        serializer = CustomerUpdateSerializer(customer, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        mutable_fields = []
        if 'is_active' in request.data:
            customer.is_active = self._as_bool(request.data.get('is_active'))
            mutable_fields.append('is_active')

        if 'is_email_verified' in request.data:
            customer.is_email_verified = self._as_bool(request.data.get('is_email_verified'))
            mutable_fields.append('is_email_verified')

        if mutable_fields:
            customer.save(update_fields=mutable_fields)

        return Response({
            "status": "success",
            "message": "Customer updated successfully",
            "data": CustomerProfileSerializer(customer).data
        })

    def delete(self, request, pk=None):
        if pk is None:
            return Response({
                "status": "error",
                "message": "Customer id is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        customer = get_object_or_404(CustomerUser, pk=pk)
        customer.is_active = False
        customer.save(update_fields=['is_active'])

        return Response({
            "status": "success",
            "message": f"Customer {customer.email} deactivated successfully"
        })


# ==================== TEMPLATE-BASED VIEWS (LEGACY) ====================

def home(request):
    """Home page - redirects to admin login"""
    return render(request, "parcel_backends/parcel_admin.html")


def base(request):
    """Base template page"""
    return render(request, "parcel_backends/base.html")


def staff_reg_page(request):
    """Staff registration page"""
    return render(request, "parcel_backends/staff.html")


def staff_login(request):
    """Staff login page"""
    return render(request, "parcel_backends/staff_login.html")


def desk_login(request):
    """Desktop login - legacy function-based view"""
    if request.method == 'POST':
        form_input = request.POST
        staff_email = form_input['email']
        staff_password = form_input['password']
        
        try:
            check_staff = AdminUser.objects.get(email=staff_email, is_active=True)
            if not check_password(staff_password, check_staff.password):
                return render(request, "parcel_backends/staff_login.html", 
                            {"bad_password": "Wrong Password Entered"})
            else:
                return render(request, "parcel_backends/admin_desk.html", {
                    "first_name": check_staff.first_name,
                    "id": check_staff.id,
                    "last_name": check_staff.last_name,
                    "photo": check_staff.photo
                })
        except AdminUser.DoesNotExist:
            return render(request, "parcel_backends/staff_login.html", 
                        {"not_exist": "Staff is Not Registered Yet!"})
    
    return render(request, "parcel_backends/staff_login.html")


@csrf_exempt
def desk_login_external(request, email=None, password=None):
    """External desk login API"""
    if request.method == 'POST':
        if email == "" or password == "":
            return JsonResponse({"status": "error", "data": "Enter all Fields"}, safe=True)
        else:
            try:
                check_staff = AdminUser.objects.get(email=email, is_active=True)
                if check_staff is not None:
                    if check_password(password, check_staff.password):
                        staff_data = {
                            "first_name": check_staff.first_name,
                            "id": check_staff.id,
                            "last_name": check_staff.last_name,
                        }
                        return HttpResponse(json.dumps({"status": "success", "data": staff_data}))
                    else:
                        return JsonResponse({"status": "error", "data": "Wrong password"}, safe=True)
            except AdminUser.DoesNotExist:
                return JsonResponse({"status": "error", "data": "Staff does not exist"}, safe=True)
    
    return JsonResponse({"status": "error", "data": "Invalid request method"}, safe=True)


def reg_staff(request):
    """Staff registration - legacy function-based view"""
    if request.method == 'POST':
        form_input = request.POST
        first_name = form_input['first_name']
        last_name = form_input['last_name']
        phone = form_input.get('phone', '')
        photo = request.FILES.get('photo')
        email = form_input['email']
        password = form_input['password']
        retyped_password = form_input.get('retype_password', '')
        
        # Basic validation
        if (len(first_name) == 0 or len(last_name) == 0 or len(email) == 0
                or len(password) == 0 or password != retyped_password):
            return render(request, "parcel_backends/staff.html",
                        {"blank": "Fill the Missing Values and Match Password!"})
        else:
            try:
                pot_staff = AdminUser.objects.get(email=email)
                if pot_staff is not None:
                    return render(request, "parcel_backends/staff.html", 
                                {"exists": "Staff Already Exists"})
            except AdminUser.DoesNotExist:
                # Create new admin user with staff role
                new_staff = AdminUser(
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                    email=email,
                    role='staff',
                    is_active=True
                )
                new_staff.set_password(password)
                
                if photo:
                    new_staff.photo = photo
                
                new_staff.save()
                
                reg_mess = {
                    "success": "Your Registration Was Successful!",
                    "failure": "An Error Occurred Saving Your Details!"
                }
                return render(request, "parcel_backends/staff.html", reg_mess)
    
    return render(request, "parcel_backends/staff.html")


def super_admin_login(request):
    """Render admin login page"""
    return render(request, "parcel_backends/parcel_admin.html")


def super_admin_dashboard(request):
    """Admin dashboard - requires authentication"""
    # You can add session verification here
    return render(request, "parcel_backends/staff.html")

class CustomerRegistrationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = CustomerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            # Check if customer exists
            existing = CustomerService.get_customer_by_email(request.data['email'])
            if existing:
                return Response({
                    "status": "error",
                    "data": "Customer already exists"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create customer
            customer = serializer.save()
            customer.role = 'customer'
            customer.save()
            
            # Send activation email
            EmailService.send_activation_email(
                customer,
                request,
                template_name='emails/email_verification.html',
                email_type='customer',
            )
            
            return Response({
                "status": "success",
                "data": f"Registration successful. Activation email sent to {customer.email}"
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class CustomerLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = CustomerLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            customer, error = CustomerService.validate_customer_login(email, password)
            
            if error:
                return Response({
                    "status": "error",
                    "data": error
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Update last login
            customer.last_login = timezone.now()
            customer.save()
            
            return Response({
                "status": "success",
                "data": {
                    "id": customer.id,
                    "email": customer.email,
                    "first_name": customer.first_name,
                    "last_name": customer.last_name,
                    "role": customer.role
                }
            })
        
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class CustomerProfileView(APIView):
    # Extends from authentication app using same session auth
    
    def get(self, request):
        customer = request.user
        serializer = CustomerProfileSerializer(customer)
        return Response({
            "status": "success",
            "data": serializer.data
        })

class CustomerResetView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            success, message = CustomerService.initiate_password_reset(
                serializer.validated_data['email'],
                request
            )
            
            status_code = status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST
            return Response({
                "status": "success" if success else "error",
                "data": message
            }, status=status_code)
        
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class CustomerSaveResetView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = CustomerPasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            success, message = CustomerService.reset_password(
                serializer.validated_data['token'],
                serializer.validated_data['new_password'],
                serializer.validated_data['confirm_password']
            )
            
            status_code = status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST
            return Response({
                "status": "success" if success else "error",
                "data": message
            }, status=status_code)
        
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

# Also add these function-based views
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

def activate_customer(request, uidb64, token):
    """Activate customer account"""
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        customer = CustomerUser.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, CustomerUser.DoesNotExist):
        customer = None
    
    if customer is not None and account_activation_token.check_token(customer, token):
        customer.is_email_verified = True
        customer.save()
        return render(request, "parcel_backends/activation_page.html", {
            "message": "Your account has been activated successfully"
        })
    else:
        return render(request, "parcel_backends/activation_page.html", {
            "message": "The activation link is invalid or expired"
        })


def dev_verify_email(request, role, uidb64, token):
    """Dev-only verification endpoint for quick local testing."""
    if not settings.DEBUG:
        raise Http404("This endpoint is only available in development.")

    role_map = {
        'customer': CustomerUser,
        'vendor': VendorUser,
        'courier': CourierUser,
    }

    model_cls = role_map.get(role)
    if model_cls is None:
        return JsonResponse({
            "status": "error",
            "message": "Invalid role for email verification."
        }, status=400)

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = model_cls.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, model_cls.DoesNotExist):
        return JsonResponse({
            "status": "error",
            "message": "Invalid verification link."
        }, status=400)

    if not account_activation_token.check_token(user, token):
        return JsonResponse({
            "status": "error",
            "message": "Verification link expired or invalid. Please request a new one."
        }, status=400)

    if not user.is_email_verified:
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])

    return JsonResponse({
        "status": "success",
        "message": f"Email verified successfully for {user.email}. You can now return to login.",
        "data": {
            "email": user.email,
            "role": role,
            "is_email_verified": user.is_email_verified,
        }
    }, status=200)

def customer_reset(request, uidb64, token):
    """Password reset confirmation page"""
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        customer = CustomerUser.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, CustomerUser.DoesNotExist):
        customer = None
    
    if customer is not None and account_activation_token.check_token(customer, token):
        return render(request, "parcel_backends/password_reset_page.html", {
            "message": "Reset Your Password",
            "type": "customer",
            "permit": "true",
            "user": customer.email
        })
    else:
        return render(request, "parcel_backends/password_reset_page.html", {
            "message": "The link has expired",
            "permit": "false"
        })