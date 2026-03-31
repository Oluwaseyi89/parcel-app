from rest_framework import serializers
from .models import CartSession, CartDetail

class CartSessionSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = CartSession
        fields = [
            'id', 'customer_name', 'total_items', 'total_price',
            'shipping_method', 'zip_code', 'is_active', 'is_expired',
            'created_at', 'updated_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_expired']
    
    def get_is_expired(self, obj):
        return obj.is_expired()

class CartDetailSerializer(serializers.ModelSerializer):
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartDetail
        fields = [
            'id', 'product_id', 'product_name', 'quantity',
            'unit_price', 'total_price', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_price']