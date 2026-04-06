# cart/services.py
from datetime import timedelta
from django.utils import timezone
from .models import CartSession, CartDetail

class CartService:
    @staticmethod
    def get_or_create_cart(customer):
        """Get existing active cart or create new one for an authenticated customer."""
        cart = CartSession.objects.filter(
            customer=customer,
            is_active=True
        ).first()
        
        if cart and not cart.is_expired():
            return cart
        
        # If expired cart exists, clear it and create new
        if cart:
            cart.items.all().delete()
            cart.delete()
        
        # Create new cart
        cart = CartSession.objects.create(
            customer=customer,
            customer_name=customer.get_full_name(),
            expires_at=timezone.now() + timedelta(days=7),
            is_active=True
        )
        return cart
    
    @staticmethod
    def add_to_cart(session_id, customer, product_id, product_name, quantity, unit_price):
        """Add or update product in a customer's cart."""
        try:
            cart = CartSession.objects.get(id=session_id, customer=customer, is_active=True)
            
            if cart.is_expired():
                cart.delete()
                return None, "Cart has expired"
            
            cart_item, created = CartDetail.objects.get_or_create(
                session=cart,
                product_id=product_id,
                defaults={
                    'product_name': product_name,
                    'quantity': quantity,
                    'unit_price': unit_price
                }
            )
            
            if not created:
                cart_item.quantity = quantity
                cart_item.unit_price = unit_price
                cart_item.save()
            
            # Update cart totals
            CartService._update_cart_totals(cart)
            return cart_item, None
            
        except CartSession.DoesNotExist:
            return None, "Cart not found"
    
    @staticmethod
    def _update_cart_totals(cart):
        """Update cart total items and price"""
        items = cart.items.all()
        total_items = sum(item.quantity for item in items)
        total_price = sum(item.total_price for item in items)
        
        cart.total_items = total_items
        cart.total_price = total_price
        cart.save()
    
    @staticmethod
    def get_cart_contents(session_id, customer):
        """Get all items in the authenticated customer's cart."""
        try:
            cart = CartSession.objects.get(id=session_id, customer=customer, is_active=True)
            
            if cart.is_expired():
                cart.delete()
                return None, "Cart has expired"
            
            items = cart.items.all()
            return {
                'session': cart,
                'items': items
            }, None
            
        except CartSession.DoesNotExist:
            return None, "Cart not found"
    
    @staticmethod
    def clear_cart(session_id, customer):
        """Clear the authenticated customer's cart contents."""
        try:
            cart = CartSession.objects.get(id=session_id, customer=customer)
            cart.items.all().delete()
            cart.delete()
            return True, None
        except CartSession.DoesNotExist:
            return False, "Cart not found"