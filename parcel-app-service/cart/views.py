# cart/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services import CartService
from .serializers import CartSessionSerializer, CartDetailSerializer

class CartSessionView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, customer_name=None):
        """Create new cart"""
        customer_id = request.data.get('customer_id')
        cart = CartService.get_or_create_cart(customer_name, customer_id)
        serializer = CartSessionSerializer(cart)
        return Response({
            "status": "success",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)

class CartItemView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, session_id=None):
        """Add item to cart"""
        product_id = request.data.get('product_id')
        product_name = request.data.get('product_name')
        quantity = request.data.get('quantity', 1)
        unit_price = request.data.get('unit_price', 0)
        
        cart_item, error = CartService.add_to_cart(
            session_id, product_id, product_name, quantity, unit_price
        )
        
        if error:
            return Response({
                "status": "error",
                "data": error
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CartDetailSerializer(cart_item)
        return Response({
            "status": "success",
            "data": serializer.data
        })

class CartDetailView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, session_id=None):
        """Get cart contents"""
        cart_data, error = CartService.get_cart_contents(session_id)
        
        if error:
            return Response({
                "status": "error",
                "data": error
            }, status=status.HTTP_404_NOT_FOUND)
        
        items_serializer = CartDetailSerializer(cart_data['items'], many=True)
        cart_serializer = CartSessionSerializer(cart_data['session'])
        
        return Response({
            "status": "success",
            "cart": cart_serializer.data,
            "items": items_serializer.data
        })
    
    def delete(self, request, session_id=None):
        """Clear cart"""
        success, error = CartService.clear_cart(session_id)
        
        if error:
            return Response({
                "status": "error",
                "data": error
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            "status": "success",
            "data": "Cart cleared successfully"
        })