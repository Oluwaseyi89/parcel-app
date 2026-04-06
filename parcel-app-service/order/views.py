# order/views.py
from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from authentication.permissions import IsAdminOrSuperAdmin, IsVendorOrAdmin, IsCourierOrAdmin
from .services import OrderService, PaymentService, ShippingService
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderItemSerializer,
    PaymentSerializer, PaymentInitiateSerializer, OrderStatusUpdateSerializer,
    ShippingAddressSerializer, OrderStatsSerializer
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

class PaymentInitiateView(APIView):
    """Initiate payment for an order"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PaymentInitiateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order = serializer.context['order']
        
        # Verify order belongs to customer
        if request.user.role == 'customer' and order.customer != request.user:
            return Response({
                "status": "error",
                "message": "You can only pay for your own orders."
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            payment = PaymentService.initiate_payment(
                order,
                serializer.validated_data['payment_method'],
                request=request
            )
            
            # In production, this would return payment gateway URL
            # For now, return payment details
            return Response({
                "status": "success",
                "message": "Payment initiated",
                "data": {
                    "payment": PaymentSerializer(payment).data,
                    "payment_url": f"/api/payments/{payment.reference}/verify/"  # Mock URL
                }
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class PaymentVerifyView(APIView):
    """Verify payment completion"""
    permission_classes = [AllowAny]  # Payment webhooks might not have auth
    
    def post(self, request, reference):
        try:
            payment = PaymentService.verify_payment(
                reference,
                provider_response=request.data
            )
            
            return Response({
                "status": "success",
                "message": "Payment verified successfully",
                "data": PaymentSerializer(payment).data
            })
            
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