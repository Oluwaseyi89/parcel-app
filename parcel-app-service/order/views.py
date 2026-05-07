# order/views.py
from django.shortcuts import render, get_object_or_404
import hashlib
import hmac
import json
import secrets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from authentication.permissions import IsAdminOrSuperAdmin, IsVendorOrAdmin, IsCourierOrAdmin
from django.conf import settings
from .services import OrderService, PaymentService, ShippingService
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderItemSerializer,
    PaymentSerializer, OrderStatusUpdateSerializer,
    ShippingAddressSerializer, OrderStatsSerializer, PaymentStatusSyncSerializer,
    PaymentRegistrationSerializer
)
from .models import Order, OrderItem, Payment, ShippingAddress

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class OrderListView(APIView):
    """List orders with filters"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    
    def get(self, request):
        # Determine queryset based on user role
        if request.user.role == 'customer':
            queryset = Order.objects.filter(customer=request.user)
        elif request.user.role == 'vendor':
            queryset = Order.objects.filter(items__vendor=request.user).distinct()
        elif request.user.role == 'courier':
            queryset = Order.objects.filter(
                courier=request.user,
                status__in=['ready', 'dispatched', 'in_transit']
            )
        elif request.user.role in ['admin', 'super_admin']:
            queryset = Order.objects.all()
        else:
            queryset = Order.objects.none()
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        serializer = OrderSerializer(page, many=True)
        return paginator.get_paginated_response({
            "status": "success",
            "data": serializer.data
        })

class OrderCreateView(APIView):
    """Create a new order"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = OrderCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            order = OrderService.create_order(
                request.user,
                serializer.validated_data,
                request
            )
            
            return Response({
                "status": "success",
                "message": "Order created successfully",
                "data": OrderSerializer(order).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class OrderDetailView(APIView):
    """Get, update, or cancel an order"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)
        
        # Check permissions
        if request.user.role == 'customer' and order.customer != request.user:
            return Response({
                "status": "error",
                "message": "You can only view your own orders."
            }, status=status.HTTP_403_FORBIDDEN)
        
        if request.user.role == 'vendor' and not order.items.filter(vendor=request.user).exists():
            return Response({
                "status": "error",
                "message": "You can only view orders containing your products."
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = OrderSerializer(order)
        return Response({
            "status": "success",
            "data": serializer.data
        })
    
    def patch(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)
        
        # Only allow customers to cancel their own pending orders
        if request.user.role == 'customer':
            if order.customer != request.user:
                return Response({
                    "status": "error",
                    "message": "You can only cancel your own orders."
                }, status=status.HTTP_403_FORBIDDEN)
            
            if not order.can_be_cancelled:
                return Response({
                    "status": "error",
                    "message": "This order cannot be cancelled."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Cancel order
            OrderService.update_order_status(
                order_id,
                'cancelled',
                request.user,
                'Cancelled by customer'
            )
            
            return Response({
                "status": "success",
                "message": "Order cancelled successfully"
            })
        
        return Response({
            "status": "error",
            "message": "Invalid operation."
        }, status=status.HTTP_400_BAD_REQUEST)

class OrderStatusUpdateView(APIView):
    """Update order status (admin/vendor/courier only)"""
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]
    
    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)
        
        serializer = OrderStatusUpdateSerializer(
            data=request.data,
            context={'order': order}
        )
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            updated_order = OrderService.update_order_status(
                order_id,
                serializer.validated_data['status'],
                request.user,
                serializer.validated_data.get('notes', ''),
                **serializer.validated_data
            )
            
            return Response({
                "status": "success",
                "message": f"Order status updated to {serializer.validated_data['status']}",
                "data": OrderSerializer(updated_order).data
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class PaymentRegistrationView(APIView):
    """Create or update canonical payment records for an order."""
    permission_classes = [AllowAny]

    @staticmethod
    def _is_trusted_internal_call(request):
        expected = getattr(settings, 'PAYMENT_SYNC_TOKEN', '')
        if not expected:
            return False

        provided = (
            request.headers.get('X-Internal-Service-Token') or
            request.META.get('HTTP_X_INTERNAL_SERVICE_TOKEN') or
            ''
        )
        return secrets.compare_digest(str(provided), str(expected))

    def post(self, request):
        trusted_internal = self._is_trusted_internal_call(request)
        is_authenticated = bool(getattr(request.user, 'is_authenticated', False))

        if not trusted_internal and not is_authenticated:
            return Response({
                "status": "error",
                "message": "Forbidden"
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = PaymentRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        order = serializer.context['order']

        if is_authenticated and not trusted_internal:
            if request.user.role == 'customer' and order.customer != request.user:
                return Response({
                    "status": "error",
                    "message": "You can only register payments for your own orders."
                }, status=status.HTTP_403_FORBIDDEN)

        try:
            payment, is_duplicate = PaymentService.register_payment(
                order=order,
                reference=serializer.validated_data['reference'],
                payment_method=serializer.validated_data['payment_method'],
                amount=serializer.validated_data['amount'],
                payment_provider=serializer.validated_data.get('payment_provider', 'paystack') or 'paystack',
                fees=serializer.validated_data.get('fees', 0),
                status=serializer.validated_data.get('status', 'pending'),
                transaction_id=serializer.validated_data.get('transaction_id', ''),
                failure_reason=serializer.validated_data.get('failure_reason', ''),
                provider_response=serializer.validated_data.get('provider_response', {}),
            )

            return Response({
                "status": "success",
                "message": "Payment already registered" if is_duplicate else "Payment registered successfully",
                "data": {
                    "idempotent": is_duplicate,
                    "payment": PaymentSerializer(payment).data,
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class PaymentContextView(APIView):
    """Read-only payment context for reference-based status checks."""
    permission_classes = [AllowAny]

    @staticmethod
    def _is_trusted_internal_call(request):
        expected = getattr(settings, 'PAYMENT_SYNC_TOKEN', '')
        if not expected:
            return False

        provided = (
            request.headers.get('X-Internal-Service-Token') or
            request.META.get('HTTP_X_INTERNAL_SERVICE_TOKEN') or
            ''
        )
        return secrets.compare_digest(str(provided), str(expected))

    def get(self, request, reference):
        trusted_internal = self._is_trusted_internal_call(request)
        is_authenticated = bool(getattr(request.user, 'is_authenticated', False))

        if not trusted_internal and not is_authenticated:
            return Response({
                "status": "error",
                "message": "Forbidden"
            }, status=status.HTTP_403_FORBIDDEN)

        payment = get_object_or_404(Payment.objects.select_related('order', 'customer'), reference=reference)

        if is_authenticated and not trusted_internal:
            is_admin = request.user.role in ['admin', 'super_admin']
            is_owner = request.user.role == 'customer' and payment.customer_id == request.user.id
            if not (is_admin or is_owner):
                return Response({
                    "status": "error",
                    "message": "Forbidden"
                }, status=status.HTTP_403_FORBIDDEN)

        return Response({
            "status": "success",
            "data": {
                "reference": payment.reference,
                "payment_status": payment.status,
                "transaction_id": payment.transaction_id,
                "payment_method": payment.payment_method,
                "payment_provider": payment.payment_provider,
                "amount": payment.amount,
                "fees": payment.fees,
                "net_amount": payment.net_amount,
                "order_id": payment.order_id,
                "order_number": payment.order.order_number,
                "order_payment_status": payment.order.payment_status,
                "customer_id": payment.customer_id,
                "customer_email": payment.customer.email,
            }
        }, status=status.HTTP_200_OK)


class InternalPaymentStatusSyncView(APIView):
    """Trusted internal endpoint for payment status synchronization."""
    permission_classes = [AllowAny]

    @staticmethod
    def _is_trusted_internal_call(request):
        expected = getattr(settings, 'PAYMENT_SYNC_TOKEN', '')
        if not expected:
            return False

        provided = (
            request.headers.get('X-Internal-Service-Token') or
            request.META.get('HTTP_X_INTERNAL_SERVICE_TOKEN') or
            ''
        )
        return secrets.compare_digest(str(provided), str(expected))

    def post(self, request, reference):
        if not self._is_trusted_internal_call(request):
            return Response({
                "status": "error",
                "message": "Forbidden"
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = PaymentStatusSyncSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment, is_duplicate = PaymentService.sync_payment_status(
                reference=reference,
                status_value=serializer.validated_data['status'],
                event_id=serializer.validated_data['event_id'],
                transaction_id=serializer.validated_data.get('transaction_id', ''),
                failure_reason=serializer.validated_data.get('failure_reason', ''),
                provider_response=serializer.validated_data.get('provider_response', {}),
            )

            return Response({
                "status": "success",
                "message": "Payment sync already processed" if is_duplicate else "Payment synced successfully",
                "data": {
                    "idempotent": is_duplicate,
                    "payment": PaymentSerializer(payment).data,
                }
            })
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class PaystackWebhookView(APIView):
    """Receive and process Paystack webhook events."""
    permission_classes = [AllowAny]
    authentication_classes = []

    @staticmethod
    def _is_valid_signature(raw_body, signature):
        secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
        if not secret_key or not signature:
            return False

        expected_signature = hmac.new(
            secret_key.encode('utf-8'),
            raw_body,
            hashlib.sha512,
        ).hexdigest()
        return secrets.compare_digest(expected_signature, signature)

    @staticmethod
    def _map_webhook_status(event_name, provider_status):
        event_name = (event_name or '').lower()
        provider_status = (provider_status or '').lower()

        if event_name.startswith('refund.') or provider_status in ['refunded', 'reversed']:
            return 'refunded'
        if event_name == 'charge.success' or provider_status in ['success', 'completed']:
            return 'completed'
        if event_name in ['charge.failed', 'charge.abandoned'] or provider_status in ['failed', 'abandoned']:
            return 'failed'
        if provider_status in ['pending', 'ongoing', 'processing']:
            return 'processing'
        return 'failed'

    @staticmethod
    def _build_event_id(event_name, reference, payload_data, payload):
        base_id = payload.get('id') or payload_data.get('id')
        if base_id:
            return f"paystack-webhook-{event_name}-{base_id}"
        return f"paystack-webhook-{event_name}-{reference}"

    def post(self, request):
        signature = (
            request.headers.get('X-Paystack-Signature') or
            request.META.get('HTTP_X_PAYSTACK_SIGNATURE') or
            ''
        )

        raw_body = request.body or b''
        if not self._is_valid_signature(raw_body, signature):
            return Response({
                "status": "error",
                "message": "Forbidden"
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            payload = json.loads(raw_body.decode('utf-8') if raw_body else '{}')
        except json.JSONDecodeError:
            return Response({
                "status": "error",
                "message": "Invalid JSON payload"
            }, status=status.HTTP_400_BAD_REQUEST)

        event_name = payload.get('event', '')
        payload_data = payload.get('data') if isinstance(payload.get('data'), dict) else {}
        reference = str(payload_data.get('reference') or '').strip()

        if not reference:
            # Ignore non-transaction webhook payloads while acknowledging receipt.
            return Response({
                "status": "success",
                "message": "Ignored webhook without transaction reference",
                "data": {"idempotent": True}
            }, status=status.HTTP_200_OK)

        provider_status = payload_data.get('status', '')
        canonical_status = self._map_webhook_status(event_name, provider_status)
        event_id = self._build_event_id(event_name, reference, payload_data, payload)
        transaction_id = str(payload_data.get('id') or '')
        failure_reason = (
            payload_data.get('gateway_response') or
            payload_data.get('message') or
            ''
        )

        try:
            payment, is_duplicate = PaymentService.sync_payment_status(
                reference=reference,
                status_value=canonical_status,
                event_id=event_id,
                transaction_id=transaction_id,
                failure_reason=failure_reason,
                provider_response=payload,
            )

            return Response({
                "status": "success",
                "message": "Webhook already processed" if is_duplicate else "Webhook processed successfully",
                "data": {
                    "idempotent": is_duplicate,
                    "payment": PaymentSerializer(payment).data,
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class ShippingAddressListView(APIView):
    """Manage shipping addresses"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        addresses = ShippingAddress.objects.filter(
            customer=request.user, is_active=True
        )
        serializer = ShippingAddressSerializer(addresses, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })
    
    def post(self, request):
        serializer = ShippingAddressSerializer(
            data=request.data,
            context={'customer': request.user}
        )
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        address = serializer.save(customer=request.user)
        
        return Response({
            "status": "success",
            "message": "Shipping address saved",
            "data": ShippingAddressSerializer(address).data
        }, status=status.HTTP_201_CREATED)

class VendorOrdersView(APIView):
    """Get orders for a specific vendor"""
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]
    
    def get(self, request):
        status_filter = request.query_params.get('status')
        
        order_items = OrderService.get_vendor_orders(
            request.user.id,
            status_filter=status_filter
        )
        
        serializer = OrderItemSerializer(order_items, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })

class OrderStatsView(APIView):
    """Get order statistics"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request):
        time_period = request.query_params.get('period', 'month')
        
        stats = OrderService.calculate_order_stats(time_period)
        serializer = OrderStatsSerializer(stats)
        
        return Response({
            "status": "success",
            "data": serializer.data
        })

class CourierOrdersView(APIView):
    """Get orders assigned to a courier"""
    permission_classes = [IsAuthenticated, IsCourierOrAdmin]
    
    def get(self, request):
        if request.user.role == 'courier':
            orders = Order.objects.filter(
                courier=request.user,
                status__in=['dispatched', 'in_transit']
            )
        else:  # admin
            orders = Order.objects.filter(
                status__in=['ready', 'dispatched', 'in_transit']
            )
        
        serializer = OrderSerializer(orders, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })

# Template view (legacy compatibility)
def order(request):
    return render(request, "parcel_order/order.html")