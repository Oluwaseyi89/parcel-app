import json
import secrets
from datetime import datetime, timedelta
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password, check_password
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from .drf_auth import SessionTokenAuthentication
from .models import AdminUser, UserSession
from .serializers import (
    AdminLoginSerializer, AdminSessionSerializer, 
    AdminUserSerializer, ChangePasswordSerializer,
    AdminCreateSerializer, CustomerProfileSerializer
)
from .permissions import IsSuperAdmin, IsAdminOrSuperAdmin
from django.conf import settings
from .session_contract import attach_session_cookies, clear_session_cookies


from .models import CustomerUser, VendorUser, CourierUser
from product.models import Product
from order.models import Order
from dispatch.models import Dispatch
from complaints.models import CustomerComplaint
from banking.models import VendorBankDetail, CourierBankDetail
from .serializers import (
    CustomerRegistrationSerializer, CustomerLoginSerializer,
    ForgotPasswordSerializer, CustomerPasswordResetSerializer,
    CustomerUpdateSerializer
)
from .services import EmailService, CustomerService

from core.tokens import account_activation_token


def _normalize_app_role(role_value):
    role = str(role_value or "").lower().strip()
    if role in {"vendor"}:
        return "vendor"
    if role in {"courier"}:
        return "courier"
    if role in {"customer", "premium_customer", "anonymous"}:
        return "customer"
    if role in {"admin", "super_admin", "staff", "operator"}:
        return "admin"
    return None


def _is_switchable_account(account, normalized_role):
    if account is None:
        return False

    if hasattr(account, 'is_active') and not account.is_active:
        return False

    if hasattr(account, 'is_email_verified') and not account.is_email_verified:
        return False

    if normalized_role in {'vendor', 'courier'} and hasattr(account, 'is_approved') and not account.is_approved:
        return False

    return True


def _resolve_role_account(email, normalized_role):
    if normalized_role == 'customer':
        account = CustomerUser.objects.filter(email__iexact=email).order_by('-id').first()
    elif normalized_role == 'vendor':
        account = VendorUser.objects.filter(email__iexact=email).order_by('-id').first()
    elif normalized_role == 'courier':
        account = CourierUser.objects.filter(email__iexact=email).order_by('-id').first()
    elif normalized_role == 'admin':
        account = AdminUser.objects.filter(email__iexact=email).order_by('-id').first()
    else:
        return None

    if _is_switchable_account(account, normalized_role):
        return account

    return None


def _get_allowed_roles_for_email(email):
    roles = []

    if _resolve_role_account(email, 'customer'):
        roles.append('customer')
    if _resolve_role_account(email, 'vendor'):
        roles.append('vendor')
    if _resolve_role_account(email, 'courier'):
        roles.append('courier')
    if _resolve_role_account(email, 'admin'):
        roles.append('admin')

    return roles


def _build_me_payload(user):
    email = getattr(user, 'email', None)
    active_role = _normalize_app_role(getattr(user, 'role', None))
    allowed_roles = _get_allowed_roles_for_email(email) if email else []

    if active_role and active_role not in allowed_roles:
        allowed_roles.append(active_role)

    payload = {
        'id': user.id,
        'email': email,
        'first_name': getattr(user, 'first_name', ''),
        'last_name': getattr(user, 'last_name', ''),
        'role': active_role,
    }

    return {
        'user': payload,
        'allowed_roles': allowed_roles,
        'active_role': active_role,
    }




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
            
            response = Response(response_data, status=status.HTTP_200_OK)
            attach_session_cookies(response, session_token=session_token, role='admin')
            
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
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        session = getattr(request, 'auth', None)
        if isinstance(session, UserSession):
            session.is_active = False
            session.save(update_fields=['is_active'])
        else:
            session_token = request.COOKIES.get('auth_session') or request.COOKIES.get('admin_session')
            if session_token:
                try:
                    fallback_session = UserSession.objects.get(
                        session_token=session_token,
                        is_active=True
                    )
                    fallback_session.is_active = False
                    fallback_session.save(update_fields=['is_active'])
                except UserSession.DoesNotExist:
                    pass
        
        response = Response({
            "status": "success",
            "message": "Logged out successfully"
        }, status=status.HTTP_200_OK)
        clear_session_cookies(response)
        return response


class SessionMeView(APIView):
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'status': 'success',
            'data': _build_me_payload(request.user),
        }, status=status.HTTP_200_OK)


class SwitchActiveRoleView(APIView):
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        requested_role = _normalize_app_role(request.data.get('role'))
        if requested_role not in {'customer', 'vendor', 'courier', 'admin'}:
            return Response({
                'status': 'error',
                'message': 'Invalid role requested.',
            }, status=status.HTTP_400_BAD_REQUEST)

        current_user = request.user
        current_email = getattr(current_user, 'email', None)
        if not current_email:
            return Response({
                'status': 'error',
                'message': 'Authenticated user is missing an email address.',
            }, status=status.HTTP_400_BAD_REQUEST)

        allowed_roles = _get_allowed_roles_for_email(current_email)
        if requested_role not in allowed_roles:
            return Response({
                'status': 'error',
                'message': 'Requested role is not available for this account.',
            }, status=status.HTTP_403_FORBIDDEN)

        target_user = _resolve_role_account(current_email, requested_role)
        if target_user is None:
            return Response({
                'status': 'error',
                'message': 'Requested role account could not be resolved.',
            }, status=status.HTTP_404_NOT_FOUND)

        session = getattr(request, 'auth', None)
        if not isinstance(session, UserSession):
            token = request.COOKIES.get('auth_session') or request.COOKIES.get('admin_session')
            if token:
                session = UserSession.objects.filter(session_token=token, is_active=True).first()

        if not isinstance(session, UserSession):
            return Response({
                'status': 'error',
                'message': 'Active session not found.',
            }, status=status.HTTP_401_UNAUTHORIZED)

        content_type = ContentType.objects.get_for_model(target_user)
        session.content_type = content_type
        session.object_id = target_user.id
        session.save(update_fields=['content_type', 'object_id'])

        response = Response({
            'status': 'success',
            'message': f'Active role switched to {requested_role}.',
            'data': _build_me_payload(target_user),
        }, status=status.HTTP_200_OK)
        attach_session_cookies(response, session_token=session.session_token, role=requested_role)
        return response


class CsrfTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        csrf_token = get_token(request)
        return Response({
            'status': 'success',
            'data': {
                'csrf_token': csrf_token,
            },
        }, status=status.HTTP_200_OK)


class AdminProfileView(APIView):
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
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
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
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
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsSuperAdmin]
    
    def get(self, request, pk=None):
        if pk is not None:
            admin_user = get_object_or_404(AdminUser, pk=pk)
            serializer = AdminUserSerializer(admin_user)
            return Response({
                "status": "success",
                "data": serializer.data
            })

        admins = AdminUser.objects.all().order_by('-created_at')
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

    def patch(self, request, pk=None):
        if pk is None:
            return Response({
                "status": "error",
                "message": "Admin id is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        admin_user = get_object_or_404(AdminUser, pk=pk)
        serializer = AdminUserSerializer(admin_user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({
            "status": "success",
            "message": "Admin user updated successfully",
            "data": serializer.data
        })

    def delete(self, request, pk=None):
        if pk is None:
            return Response({
                "status": "error",
                "message": "Admin id is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        admin_user = get_object_or_404(AdminUser, pk=pk)

        if request.user.id == admin_user.id:
            return Response({
                "status": "error",
                "message": "You cannot deactivate your own admin account."
            }, status=status.HTTP_400_BAD_REQUEST)

        admin_user.is_active = False
        admin_user.save(update_fields=['is_active'])

        return Response({
            "status": "success",
            "message": f"Admin user {admin_user.email} deactivated successfully"
        })


class AdminCustomerListView(APIView):
    """Admin customer management (list/detail/update/deactivate)."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
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


class AdminDashboardMetricsView(APIView):
    """Admin dashboard metrics endpoint - returns pending approvals and stats."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        """Fetch aggregated admin metrics."""
        try:
            # Count pending approvals by type
            pending_vendors = VendorUser.objects.filter(approval_status='pending').count()
            pending_couriers = CourierUser.objects.filter(approval_status='pending').count()
            pending_products = Product.objects.filter(approval_status='pending').count()
            pending_orders = Order.objects.filter(status='pending').count()

            # Count total active users
            total_vendors = VendorUser.objects.filter(is_active=True).count()
            total_couriers = CourierUser.objects.filter(is_active=True).count()
            total_products = Product.objects.filter(approval_status='approved').count()
            total_orders = Order.objects.filter(status__in=['confirmed', 'processing', 'completed']).count()

            # Recent activity (last 5 pending items per category, ordered by created_at desc)
            recent_vendors = VendorUser.objects.filter(
                approval_status='pending'
            ).values('id', 'email', 'business_name', 'created_at').order_by('-created_at')[:5]

            recent_couriers = CourierUser.objects.filter(
                approval_status='pending'
            ).values('id', 'email', 'first_name', 'last_name', 'created_at').order_by('-created_at')[:5]

            recent_products = Product.objects.filter(
                approval_status='pending'
            ).values('id', 'name', 'vendor_id', 'created_at').order_by('-created_at')[:5]

            return Response({
                "status": "success",
                "data": {
                    "pending_counts": {
                        "vendors": pending_vendors,
                        "couriers": pending_couriers,
                        "products": pending_products,
                        "orders": pending_orders,
                    },
                    "total_counts": {
                        "vendors": total_vendors,
                        "couriers": total_couriers,
                        "products": total_products,
                        "orders": total_orders,
                    },
                    "recent_activity": {
                        "pending_vendors": list(recent_vendors),
                        "pending_couriers": list(recent_couriers),
                        "pending_products": list(recent_products),
                    }
                }
            })
        except Exception as e:
            return Response({
                "status": "error",
                "message": f"Failed to fetch dashboard metrics: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminModerationQueueView(APIView):
    """Admin moderation queue endpoint for vendors, couriers, and products."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        queue_type = request.query_params.get('type', 'all')
        status_filter = request.query_params.get('status', 'pending')

        if status_filter not in ['pending', 'approved', 'rejected', 'changes_requested', 'all']:
            return Response({
                "status": "error",
                "message": "Invalid status filter."
            }, status=status.HTTP_400_BAD_REQUEST)

        def with_status(queryset):
            if status_filter == 'all':
                return queryset
            return queryset.filter(approval_status=status_filter)

        vendors = []
        couriers = []
        products = []

        if queue_type in ['all', 'vendors']:
            vendors = list(
                with_status(VendorUser.objects.all())
                .values(
                    'id', 'email', 'first_name', 'last_name',
                    'business_name', 'approval_status', 'submitted_at',
                    'reviewed_at', 'rejection_reason'
                )
                .order_by('-submitted_at')[:50]
            )

        if queue_type in ['all', 'couriers']:
            couriers = list(
                with_status(CourierUser.objects.all())
                .values(
                    'id', 'email', 'first_name', 'last_name',
                    'service_area', 'vehicle_type', 'approval_status',
                    'submitted_at', 'reviewed_at', 'rejection_reason'
                )
                .order_by('-submitted_at')[:50]
            )

        if queue_type in ['all', 'products']:
            products = list(
                with_status(Product.objects.select_related('vendor'))
                .values(
                    'id', 'name', 'vendor_id', 'vendor__email', 'vendor__business_name',
                    'approval_status', 'submitted_at', 'reviewed_at', 'rejection_reason'
                )
                .order_by('-submitted_at')[:50]
            )

        return Response({
            "status": "success",
            "data": {
                "vendors": vendors,
                "couriers": couriers,
                "products": products,
                "summary": {
                    "vendors": len(vendors),
                    "couriers": len(couriers),
                    "products": len(products),
                }
            }
        })


class AdminModerationActionView(APIView):
    """Admin moderation action endpoint for approving/rejecting queue items."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def patch(self, request, queue_type, pk):
        action = str(request.data.get('action', '')).strip().lower()
        reason = str(request.data.get('reason', '')).strip()

        status_map = {
            'approve': 'approved',
            'reject': 'rejected',
            'request_changes': 'changes_requested',
        }

        if action not in status_map:
            return Response({
                "status": "error",
                "message": "Invalid action. Use approve, reject, or request_changes."
            }, status=status.HTTP_400_BAD_REQUEST)

        if queue_type == 'vendors':
            instance = get_object_or_404(VendorUser, pk=pk)
            label = 'Vendor'
        elif queue_type == 'couriers':
            instance = get_object_or_404(CourierUser, pk=pk)
            label = 'Courier'
        elif queue_type == 'products':
            instance = get_object_or_404(Product, pk=pk)
            label = 'Product'
        else:
            return Response({
                "status": "error",
                "message": "Invalid queue type."
            }, status=status.HTTP_400_BAD_REQUEST)

        next_status = status_map[action]
        instance.approval_status = next_status
        instance.reviewed_at = timezone.now()
        instance.approved_by = request.user
        instance.rejection_reason = reason if next_status in ['rejected', 'changes_requested'] else ''

        update_fields = ['approval_status', 'reviewed_at', 'approved_by', 'rejection_reason']
        if hasattr(instance, 'is_approved'):
            instance.is_approved = next_status == 'approved'
            update_fields.append('is_approved')
        if hasattr(instance, 'approved_at'):
            instance.approved_at = timezone.now() if next_status == 'approved' else None
            update_fields.append('approved_at')

        instance.save(update_fields=update_fields)

        return Response({
            "status": "success",
            "message": f"{label} moderation updated successfully.",
            "data": {
                "id": instance.id,
                "approval_status": instance.approval_status,
                "reviewed_at": instance.reviewed_at,
            }
        })


class AdminOrderListView(APIView):
    """Admin order management endpoint (list/detail)."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request, pk=None):
        if pk is not None:
            order = get_object_or_404(Order.objects.select_related('customer', 'courier'), pk=pk)
            return Response({
                "status": "success",
                "data": self._serialize_order(order)
            })

        queryset = Order.objects.select_related('customer', 'courier').all().order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(order_number__icontains=search) |
                Q(customer__email__icontains=search) |
                Q(payment_reference__icontains=search)
            )

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        payment_status_filter = request.query_params.get('payment_status')
        if payment_status_filter:
            queryset = queryset.filter(payment_status=payment_status_filter)

        data = [self._serialize_order(order) for order in queryset[:100]]
        return Response({
            "status": "success",
            "data": data
        })

    @staticmethod
    def _serialize_order(order):
        return {
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "payment_status": order.payment_status,
            "payment_method": order.payment_method,
            "payment_reference": order.payment_reference,
            "total_amount": str(order.total_amount),
            "shipping_method": order.shipping_method,
            "tracking_number": order.tracking_number,
            "customer": {
                "id": getattr(order.customer, 'id', None),
                "email": getattr(order.customer, 'email', ''),
                "name": order.customer.get_full_name() if getattr(order, 'customer', None) else '',
            },
            "courier": {
                "id": getattr(order.courier, 'id', None) if getattr(order, 'courier', None) else None,
                "email": getattr(order.courier, 'email', '') if getattr(order, 'courier', None) else '',
                "name": order.courier.get_full_name() if getattr(order, 'courier', None) else '',
            },
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "confirmed_at": order.confirmed_at,
            "delivered_at": order.delivered_at,
            "cancelled_at": order.cancelled_at,
            "internal_notes": order.internal_notes,
        }


class AdminOrderStatusUpdateView(APIView):
    """Admin order status update endpoint."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)

        next_status = str(request.data.get('status', '')).strip()
        notes = str(request.data.get('notes', '')).strip()

        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if next_status not in valid_statuses:
            return Response({
                "status": "error",
                "message": "Invalid order status."
            }, status=status.HTTP_400_BAD_REQUEST)

        if notes:
            order.internal_notes = (order.internal_notes + "\n" + notes).strip() if order.internal_notes else notes

        order.update_status(next_status, notes=notes)
        if notes:
            order.save(update_fields=['internal_notes'])

        return Response({
            "status": "success",
            "message": f"Order status updated to {next_status}",
            "data": {
                "id": order.id,
                "order_number": order.order_number,
                "status": order.status,
                "internal_notes": order.internal_notes,
            }
        })


class AdminDispatchListView(APIView):
    """Admin dispatch management endpoint (list/create)."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        queryset = Dispatch.objects.select_related('order', 'courier', 'order__customer').all().order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(tracking_number__icontains=search) |
                Q(order__order_number__icontains=search) |
                Q(order__customer__email__icontains=search)
            )

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        data = [self._serialize_dispatch(item) for item in queryset[:100]]
        return Response({
            "status": "success",
            "data": data
        })

    def post(self, request):
        order_id = request.data.get('order_id')
        admin_notes = str(request.data.get('admin_notes', '')).strip()

        if not order_id:
            return Response({
                "status": "error",
                "message": "order_id is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        order = get_object_or_404(Order, pk=order_id)
        if hasattr(order, 'dispatch'):
            return Response({
                "status": "error",
                "message": "Dispatch already exists for this order."
            }, status=status.HTTP_400_BAD_REQUEST)

        dispatch = Dispatch.objects.create(order=order, admin_notes=admin_notes)
        return Response({
            "status": "success",
            "message": "Dispatch created successfully",
            "data": self._serialize_dispatch(dispatch)
        }, status=status.HTTP_201_CREATED)

    @staticmethod
    def _serialize_dispatch(item):
        return {
            "id": item.id,
            "tracking_number": item.tracking_number,
            "status": item.status,
            "courier": {
                "id": getattr(item.courier, 'id', None) if getattr(item, 'courier', None) else None,
                "email": getattr(item.courier, 'email', '') if getattr(item, 'courier', None) else '',
                "name": item.courier.get_full_name() if getattr(item, 'courier', None) else '',
            },
            "order": {
                "id": item.order.id,
                "order_number": item.order.order_number,
                "status": item.order.status,
                "customer_email": getattr(item.order.customer, 'email', ''),
            },
            "estimated_delivery_time": item.estimated_delivery_time,
            "assigned_at": item.assigned_at,
            "created_at": item.created_at,
            "admin_notes": item.admin_notes,
        }


class AdminDispatchStatusUpdateView(APIView):
    """Admin dispatch status update endpoint."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def patch(self, request, pk):
        dispatch = get_object_or_404(Dispatch, pk=pk)
        next_status = str(request.data.get('status', '')).strip()

        valid_statuses = [choice[0] for choice in Dispatch.STATUS_CHOICES]
        if next_status not in valid_statuses:
            return Response({
                "status": "error",
                "message": "Invalid dispatch status."
            }, status=status.HTTP_400_BAD_REQUEST)

        notes = str(request.data.get('notes', '')).strip()
        dispatch.update_status(next_status, notes=notes)
        if notes:
            dispatch.admin_notes = (dispatch.admin_notes + "\n" + notes).strip() if dispatch.admin_notes else notes
            dispatch.save(update_fields=['admin_notes'])

        return Response({
            "status": "success",
            "message": f"Dispatch status updated to {next_status}",
            "data": {
                "id": dispatch.id,
                "tracking_number": dispatch.tracking_number,
                "status": dispatch.status,
            }
        })


class AdminDispatchAssignView(APIView):
    """Admin dispatch assign courier endpoint."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def patch(self, request, pk):
        dispatch = get_object_or_404(Dispatch, pk=pk)
        courier_id = request.data.get('courier_id')
        if not courier_id:
            return Response({
                "status": "error",
                "message": "courier_id is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        courier = get_object_or_404(CourierUser, pk=courier_id)
        notes = str(request.data.get('notes', '')).strip()
        dispatch.assign_courier(courier, notes=notes)

        return Response({
            "status": "success",
            "message": "Courier assigned successfully",
            "data": {
                "id": dispatch.id,
                "tracking_number": dispatch.tracking_number,
                "status": dispatch.status,
                "courier": {
                    "id": courier.id,
                    "email": courier.email,
                    "name": courier.get_full_name(),
                }
            }
        })


class AdminDispatchReadyOrdersView(APIView):
    """Admin dispatch ready order queue endpoint."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        queryset = Order.objects.select_related('customer').filter(status='ready').order_by('-created_at')
        data = []
        for order in queryset[:100]:
            if hasattr(order, 'dispatch'):
                continue
            data.append({
                "id": order.id,
                "order_number": order.order_number,
                "customer_email": getattr(order.customer, 'email', ''),
                "total_amount": str(order.total_amount),
                "payment_status": order.payment_status,
                "created_at": order.created_at,
            })

        return Response({
            "status": "success",
            "data": data
        })


class AdminCourierListView(APIView):
    """Admin courier list endpoint for dispatch assignment."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        queryset = CourierUser.objects.filter(is_active=True).exclude(status='inactive').order_by('-created_at')[:100]
        data = [
            {
                "id": courier.id,
                "email": courier.email,
                "name": courier.get_full_name(),
                "status": courier.status,
                "service_area": courier.service_area,
            }
            for courier in queryset
        ]

        return Response({
            "status": "success",
            "data": data
        })


class AdminComplaintListView(APIView):
    """Admin complaints management endpoint (list/detail)."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    @staticmethod
    def _as_bool(value):
        return str(value).strip().lower() in ['1', 'true', 'yes', 'on']

    def get(self, request, pk=None):
        if pk is not None:
            complaint = get_object_or_404(CustomerComplaint, pk=pk)
            return Response({
                "status": "success",
                "data": self._serialize(complaint)
            })

        queryset = CustomerComplaint.objects.all().order_by('-id')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(customer_email__icontains=search) |
                Q(complaint_subject__icontains=search) |
                Q(courier_involved__icontains=search)
            )

        resolved = request.query_params.get('is_resolved')
        if resolved is not None:
            queryset = queryset.filter(is_resolved=self._as_bool(resolved))

        satisfied = request.query_params.get('is_satisfied')
        if satisfied is not None:
            queryset = queryset.filter(is_satisfied=self._as_bool(satisfied))

        data = [self._serialize(complaint) for complaint in queryset[:200]]
        return Response({
            "status": "success",
            "data": data
        })

    @staticmethod
    def _serialize(complaint):
        return {
            "id": complaint.id,
            "customer_email": complaint.customer_email,
            "complaint_subject": complaint.complaint_subject,
            "courier_involved": complaint.courier_involved,
            "complaint_detail": complaint.complaint_detail,
            "is_resolved": complaint.is_resolved,
            "is_satisfied": complaint.is_satisfied,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at,
        }


class AdminComplaintUpdateView(APIView):
    """Admin complaint status update endpoint."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def patch(self, request, pk):
        complaint = get_object_or_404(CustomerComplaint, pk=pk)

        fields_to_update = []
        if 'is_resolved' in request.data:
            complaint.is_resolved = str(request.data.get('is_resolved')).strip().lower() in ['1', 'true', 'yes', 'on']
            fields_to_update.append('is_resolved')

        if 'is_satisfied' in request.data:
            complaint.is_satisfied = str(request.data.get('is_satisfied')).strip().lower() in ['1', 'true', 'yes', 'on']
            fields_to_update.append('is_satisfied')

        detail = request.data.get('complaint_detail')
        if detail is not None:
            complaint.complaint_detail = str(detail)
            fields_to_update.append('complaint_detail')

        subject = request.data.get('complaint_subject')
        if subject is not None:
            complaint.complaint_subject = str(subject)
            fields_to_update.append('complaint_subject')

        if not fields_to_update:
            return Response({
                "status": "error",
                "message": "No valid fields provided for update."
            }, status=status.HTTP_400_BAD_REQUEST)

        complaint.save(update_fields=fields_to_update)

        return Response({
            "status": "success",
            "message": "Complaint updated successfully",
            "data": {
                "id": complaint.id,
                "is_resolved": complaint.is_resolved,
                "is_satisfied": complaint.is_satisfied,
            }
        })


class AdminBankingListView(APIView):
    """Admin banking management endpoint (list vendor/courier bank details)."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        account_type = request.query_params.get('type', 'all')
        search = request.query_params.get('search', '').strip()

        vendor_data = []
        courier_data = []

        if account_type in ['all', 'vendors']:
            vendor_queryset = VendorBankDetail.objects.all().order_by('-id')
            if search:
                vendor_queryset = vendor_queryset.filter(
                    Q(vendor_email__icontains=search) |
                    Q(account_name__icontains=search) |
                    Q(bank_name__icontains=search)
                )
            vendor_data = [
                {
                    "id": item.id,
                    "type": "vendor",
                    "email": item.vendor_email,
                    "account_name": item.account_name,
                    "account_no": item.account_no,
                    "bank_name": item.bank_name,
                    "account_type": item.account_type,
                    "added_at": item.added_at,
                    "updated_at": item.updated_at,
                }
                for item in vendor_queryset[:200]
            ]

        if account_type in ['all', 'couriers']:
            courier_queryset = CourierBankDetail.objects.all().order_by('-id')
            if search:
                courier_queryset = courier_queryset.filter(
                    Q(courier_email__icontains=search) |
                    Q(account_name__icontains=search) |
                    Q(bank_name__icontains=search)
                )
            courier_data = [
                {
                    "id": item.id,
                    "type": "courier",
                    "email": item.courier_email,
                    "account_name": item.account_name,
                    "account_no": item.account_no,
                    "bank_name": item.bank_name,
                    "account_type": item.account_type,
                    "added_at": item.added_at,
                    "updated_at": item.updated_at,
                }
                for item in courier_queryset[:200]
            ]

        return Response({
            "status": "success",
            "data": {
                "vendors": vendor_data,
                "couriers": courier_data,
            }
        })


class AdminBankingUpdateView(APIView):
    """Admin banking update endpoint for vendor/courier account records."""
    authentication_classes = [SessionTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [IsAdminOrSuperAdmin]

    def patch(self, request, account_kind, pk):
        if account_kind == 'vendor':
            record = get_object_or_404(VendorBankDetail, pk=pk)
            email_field = 'vendor_email'
        elif account_kind == 'courier':
            record = get_object_or_404(CourierBankDetail, pk=pk)
            email_field = 'courier_email'
        else:
            return Response({
                "status": "error",
                "message": "Invalid account kind. Use vendor or courier."
            }, status=status.HTTP_400_BAD_REQUEST)

        allowed_fields = ['bank_name', 'account_type', 'account_name', 'account_no', 'updated_at', email_field]
        update_fields = []
        for field in allowed_fields:
            if field in request.data:
                setattr(record, field, str(request.data.get(field)))
                update_fields.append(field)

        if not update_fields:
            return Response({
                "status": "error",
                "message": "No valid fields provided for update."
            }, status=status.HTTP_400_BAD_REQUEST)

        record.save(update_fields=update_fields)

        return Response({
            "status": "success",
            "message": "Banking record updated successfully",
            "data": {
                "id": record.id,
                "account_name": record.account_name,
                "account_no": record.account_no,
                "bank_name": record.bank_name,
            }
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
            email = str(request.data.get('email', '')).strip()
            existing = CustomerUser.objects.filter(email__iexact=email).exists()
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
            customer = serializer.validated_data['customer']
            session = CustomerService.create_customer_session(customer, request)

            response = Response({
                "status": "success",
                "data": {
                    "id": customer.id,
                    "email": customer.email,
                    "first_name": customer.first_name,
                    "last_name": customer.last_name,
                    "role": customer.role,
                    "session_token": session.session_token,
                }
            })
            attach_session_cookies(response, session_token=session.session_token, role='customer')
            return response
        
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