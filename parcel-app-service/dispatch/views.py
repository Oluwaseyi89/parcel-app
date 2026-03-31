# dispatch/views.py
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from authentication.permissions import IsAdminOrSuperAdmin, IsVendorOrAdmin, IsCourierOrAdmin, IsVendor
from .services import DispatchService, RouteOptimizationService
from .serializers import (
    DispatchSerializer, DispatchCreateSerializer, DispatchStatusUpdateSerializer,
    DispatchAssignSerializer, DispatchItemSerializer, DispatchItemUpdateSerializer,
    CourierLocationSerializer, ReadyOrdersSerializer, DispatchStatusHistorySerializer
)
from .models import Dispatch, DispatchItem, CourierLocation

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class ReadyForDispatchView(APIView):
    """Get orders ready for dispatch"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request):
        try:
            ready_orders = DispatchService.get_ready_for_dispatch()
            serializer = ReadyOrdersSerializer(ready_orders, many=True)
            
            return Response({
                "status": "success",
                "data": serializer.data
            })
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class DispatchListView(APIView):
    """List dispatches with filters"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    
    def get(self, request):
        # Determine queryset based on user role
        if request.user.role == 'courier':
            queryset = Dispatch.objects.filter(courier=request.user)
        elif request.user.role == 'vendor':
            # Get dispatches containing vendor's items
            queryset = Dispatch.objects.filter(
                items__order_item__vendor=request.user
            ).distinct()
        else:  # admin
            queryset = Dispatch.objects.all()
        
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
        
        # Search
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(tracking_number__icontains=search) |
                Q(order__order_number__icontains=search) |
                Q(order__customer__email__icontains=search)
            )
        
        # Pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        serializer = DispatchSerializer(page, many=True)
        return paginator.get_paginated_response({
            "status": "success",
            "data": serializer.data
        })

class DispatchCreateView(APIView):
    """Create a new dispatch"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def post(self, request):
        serializer = DispatchCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            dispatch = DispatchService.create_dispatch(
                serializer.validated_data['order_id'],
                serializer.validated_data.get('admin_notes', ''),
                request
            )
            
            return Response({
                "status": "success",
                "message": "Dispatch created successfully",
                "data": DispatchSerializer(dispatch).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class DispatchDetailView(APIView):
    """Get dispatch details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, dispatch_id):
        try:
            dispatch = Dispatch.objects.get(id=dispatch_id)
            
            # Check permissions
            if request.user.role == 'courier' and dispatch.courier != request.user:
                return Response({
                    "status": "error",
                    "message": "You can only view your assigned dispatches."
                }, status=status.HTTP_403_FORBIDDEN)
            
            if request.user.role == 'vendor':
                # Check if vendor has items in this dispatch
                if not dispatch.items.filter(order_item__vendor=request.user).exists():
                    return Response({
                        "status": "error",
                        "message": "You can only view dispatches containing your products."
                    }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = DispatchSerializer(dispatch)
            return Response({
                "status": "success",
                "data": serializer.data
            })
            
        except Dispatch.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Dispatch not found."
            }, status=status.HTTP_404_NOT_FOUND)

class DispatchAssignView(APIView):
    """Assign courier to dispatch"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def post(self, request, dispatch_id):
        serializer = DispatchAssignSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            dispatch = DispatchService.assign_courier(
                dispatch_id,
                serializer.validated_data['courier_id'],
                serializer.validated_data.get('notes', ''),
                request
            )
            
            return Response({
                "status": "success",
                "message": "Courier assigned successfully",
                "data": DispatchSerializer(dispatch).data
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class DispatchStatusUpdateView(APIView):
    """Update dispatch status"""
    permission_classes = [IsAuthenticated, IsCourierOrAdmin]
    
    def post(self, request, dispatch_id):
        serializer = DispatchStatusUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            location = None
            if 'latitude' in serializer.validated_data and 'longitude' in serializer.validated_data:
                location = {
                    'latitude': serializer.validated_data['latitude'],
                    'longitude': serializer.validated_data['longitude']
                }
            
            dispatch = DispatchService.update_dispatch_status(
                dispatch_id,
                serializer.validated_data['status'],
                request.user,
                serializer.validated_data.get('notes', ''),
                location
            )
            
            return Response({
                "status": "success",
                "message": f"Dispatch status updated to {serializer.validated_data['status']}",
                "data": DispatchSerializer(dispatch).data
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class VendorDispatchItemsView(APIView):
    """Get dispatch items for a vendor"""
    permission_classes = [IsAuthenticated, IsVendor]
    
    def get(self, request):
        status_filter = request.query_params.get('status', 'pending')
        
        items = DispatchItem.objects.filter(
            order_item__vendor=request.user,
            status=status_filter
        ).select_related('dispatch', 'order_item', 'order_item__product')
        
        serializer = DispatchItemSerializer(items, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })

class DispatchItemUpdateView(APIView):
    """Update dispatch item status"""
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]
    
    def patch(self, request, item_id):
        serializer = DispatchItemUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            dispatch_item = DispatchService.update_dispatch_item(
                item_id,
                serializer.validated_data,
                request.user,
                request
            )
            
            return Response({
                "status": "success",
                "message": "Dispatch item updated successfully",
                "data": DispatchItemSerializer(dispatch_item).data
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class CourierLocationUpdateView(APIView):
    """Update courier location"""
    permission_classes = [IsAuthenticated, IsCourierOrAdmin]
    
    def post(self, request):
        serializer = CourierLocationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            location = DispatchService.record_courier_location(
                request.user,
                serializer.validated_data['latitude'],
                serializer.validated_data['longitude'],
                serializer.validated_data.get('dispatch'),
                accuracy=serializer.validated_data.get('accuracy'),
                speed=serializer.validated_data.get('speed'),
                bearing=serializer.validated_data.get('bearing'),
                altitude=serializer.validated_data.get('altitude')
            )
            
            return Response({
                "status": "success",
                "message": "Location updated",
                "data": CourierLocationSerializer(location).data
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class DispatchStatsView(APIView):
    """Get dispatch statistics"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get(self, request):
        time_period = request.query_params.get('period', 'day')
        
        stats = DispatchService.calculate_dispatch_stats(time_period)
        
        return Response({
            "status": "success",
            "data": stats
        })

class RouteOptimizationView(APIView):
    """Optimize route for dispatch"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    
    def post(self, request, dispatch_id):
        try:
            route = RouteOptimizationService.optimize_route(dispatch_id)
            
            return Response({
                "status": "success",
                "message": "Route optimized successfully",
                "data": {
                    'dispatch_id': dispatch_id,
                    'total_distance_km': float(route.total_distance_km),
                    'estimated_duration_minutes': route.estimated_duration_minutes
                }
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

# Template view (legacy compatibility)
def dispatch(request):
    return render(request, "dispatch/dispatch.html")