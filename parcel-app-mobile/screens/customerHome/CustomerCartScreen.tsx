import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  FlatList,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  added_at: string;
};

type Product = {
  id: string;
  prod_name: string;
  prod_model: string;
  prod_price: number;
  prod_photo: string;
  prod_description?: string;
  prod_category?: string;
  purchased_qty: number;
  stock_quantity: number;
  prod_weight?: number;
};

type CartScreenProps = {
  navigation: any;
};

const { width } = Dimensions.get('window');

const CustomerCartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartProducts, setCartProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showCartSummary, setShowCartSummary] = useState(false);

  // Mock API URL - replace with your actual API
  const API_URL = 'http://localhost:7000/parcel_customer';

  useEffect(() => {
    loadCustomerData();
    fetchCart();
  }, []);

  const loadCustomerData = async () => {
    try {
      const data = await AsyncStorage.getItem('logcus');
      if (data) {
        setCustomerData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const fetchCart = async () => {
    if (!customerData) {
      setLoading(false);
      return;
    }

    try {
      const custName = `${customerData.last_name} ${customerData.first_name}`;
      // Mock API call - replace with actual API
      // const response = await fetch(`${API_URL}/get_cart/${custName}/`);
      // const data = await response.json();
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockCartItems: CartItem[] = [
          { id: '1', product_id: '101', quantity: 2, added_at: '2024-01-15' },
          { id: '2', product_id: '102', quantity: 1, added_at: '2024-01-15' },
          { id: '3', product_id: '103', quantity: 3, added_at: '2024-01-14' },
        ];
        
        setCartItems(mockCartItems);
        fetchProductDetails(mockCartItems);
      }, 1000);
    } catch (error) {
      console.error('Error fetching cart:', error);
      showError('Failed to load cart');
      setLoading(false);
    }
  };

  const fetchProductDetails = async (items: CartItem[]) => {
    try {
      // Mock product data - replace with actual API calls
      const mockProducts: Product[] = [
        {
          id: '101',
          prod_name: 'Wireless Bluetooth Headphones',
          prod_model: 'BTH-2024',
          prod_price: 2999,
          prod_photo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
          prod_description: 'Premium wireless headphones with noise cancellation',
          prod_category: 'Electronics',
          purchased_qty: 2,
          stock_quantity: 50,
          prod_weight: 0.5
        },
        {
          id: '102',
          prod_name: 'Smart Watch Series 5',
          prod_model: 'SW-2024',
          prod_price: 8999,
          prod_photo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
          prod_description: 'Advanced smart watch with health monitoring',
          prod_category: 'Wearables',
          purchased_qty: 1,
          stock_quantity: 25,
          prod_weight: 0.3
        },
        {
          id: '103',
          prod_name: 'Portable Power Bank',
          prod_model: 'PB-10000',
          prod_price: 1499,
          prod_photo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed',
          prod_description: '10000mAh fast charging power bank',
          prod_category: 'Accessories',
          purchased_qty: 3,
          stock_quantity: 100,
          prod_weight: 0.2
        },
      ].filter(p => items.some(item => item.product_id === p.id))
       .map(p => ({
         ...p,
         purchased_qty: items.find(item => item.product_id === p.id)?.quantity || 1
       }));

      setCartProducts(mockProducts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product details:', error);
      showError('Failed to load product details');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  const showError = (message: string) => {
    Alert.alert('Error', message, [{ text: 'OK' }]);
  };

  const showSuccess = (message: string) => {
    Alert.alert('Success', message, [{ text: 'OK' }]);
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    setIsUpdating(productId);
    
    // Mock API call - replace with actual API
    setTimeout(() => {
      setCartProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, purchased_qty: newQuantity }
          : product
      ));
      setIsUpdating(null);
      showSuccess('Quantity updated');
    }, 500);
  };

  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setIsUpdating(productId);
            // Mock API call - replace with actual API
            setTimeout(() => {
              setCartProducts(prev => prev.filter(product => product.id !== productId));
              setCartItems(prev => prev.filter(item => item.product_id !== productId));
              setIsUpdating(null);
              showSuccess('Item removed from cart');
            }, 500);
          }
        }
      ]
    );
  };

  const handleContinueShopping = () => {
    navigation.navigate('Products');
  };

  const handleProceedToCheckout = () => {
    navigation.navigate('Checkout');
  };

  const calculateSubtotal = () => {
    return cartProducts.reduce((sum, product) => 
      sum + (product.prod_price * product.purchased_qty), 0
    );
  };

  const calculateShipping = () => {
    // Simple shipping calculation based on weight
    const totalWeight = cartProducts.reduce((sum, product) => 
      sum + ((product.prod_weight || 0.5) * product.purchased_qty), 0
    );
    return totalWeight > 2 ? 3500 : 2500;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const renderCartItem = ({ item }: { item: Product }) => (
    <View style={styles.cartItem}>
      {/* Product Image */}
      <Image 
        source={{ uri: item.prod_photo }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      
      {/* Product Details */}
      <View style={styles.productDetails}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.prod_name}
          </Text>
          <TouchableOpacity
            onPress={() => handleRemoveItem(item.id)}
            style={styles.removeButton}
          >
            <MaterialIcons name="close" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.productModel}>{item.prod_model}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>₹{item.prod_price.toLocaleString()}</Text>
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>
              Stock: {item.stock_quantity}
            </Text>
          </View>
        </View>
        
        {/* Quantity Controls */}
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantity:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.id, item.purchased_qty - 1)}
              disabled={isUpdating === item.id || item.purchased_qty <= 1}
            >
              <MaterialIcons name="remove" size={20} color="#6B7280" />
            </TouchableOpacity>
            
            <View style={styles.quantityDisplay}>
              {isUpdating === item.id ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text style={styles.quantityText}>{item.purchased_qty}</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.id, item.purchased_qty + 1)}
              disabled={isUpdating === item.id || item.purchased_qty >= item.stock_quantity}
            >
              <MaterialIcons name="add" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Item Total */}
        <View style={styles.itemTotalContainer}>
          <Text style={styles.itemTotalLabel}>Item Total:</Text>
          <Text style={styles.itemTotal}>
            ₹{(item.prod_price * item.purchased_qty).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyCartContainer}>
      <View style={styles.emptyCartIcon}>
        <MaterialIcons name="shopping-cart" size={64} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
      <Text style={styles.emptyCartMessage}>
        You have no saved cart or it might have expired
      </Text>
      <TouchableOpacity
        style={styles.continueShoppingButton}
        onPress={handleContinueShopping}
      >
        <MaterialIcons name="storefront" size={20} color="#FFFFFF" />
        <Text style={styles.continueShoppingText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartSummary = () => {
    if (cartProducts.length === 0) return null;
    
    return (
      <View style={styles.cartSummary}>
        <View style={[styles.summaryHeader, { marginBottom: showCartSummary ? 16 : 0 }]}>
          <Text style={styles.summaryTitle}>Cart Summary</Text>
          <TouchableOpacity
            onPress={() => setShowCartSummary(!showCartSummary)}
            style={styles.toggleSummary}
          >
            <MaterialIcons 
              name={showCartSummary ? "expand-less" : "expand-more"} 
              size={24} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>
        
        {showCartSummary && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal ({cartProducts.length} items)
              </Text>
              <Text style={styles.summaryValue}>
                ₹{calculateSubtotal().toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Shipping</Text>
              <Text style={styles.summaryValue}>
                ₹{calculateShipping().toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₹{calculateTotal().toLocaleString()}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleProceedToCheckout}
            >
              <MaterialIcons name="shopping-bag" size={20} color="#FFFFFF" />
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Loading your cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerSubtitle}>
            {cartProducts.length > 0 
              ? `You have ${cartProducts.length} items in your cart`
              : 'Your shopping cart is waiting for you'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueShopping}
        >
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#EF4444']}
            tintColor="#EF4444"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {cartProducts.length === 0 ? (
          renderEmptyCart()
        ) : (
          <>
            {/* Cart Items */}
            <FlatList
              data={cartProducts}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.cartList}
            />
            
            {/* Cart Summary */}
            {renderCartSummary()}
            
            {/* Additional Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.clearCartButton}
                onPress={() => {
                  Alert.alert(
                    'Clear Cart',
                    'Are you sure you want to clear your entire cart?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Clear All', 
                        style: 'destructive',
                        onPress: () => {
                          setCartProducts([]);
                          setCartItems([]);
                          showSuccess('Cart cleared successfully');
                        }
                      }
                    ]
                  );
                }}
              >
                <MaterialIcons name="delete-sweep" size={20} color="#EF4444" />
                <Text style={styles.clearCartText}>Clear Cart</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveCartButton}
                onPress={() => showSuccess('Cart saved for later')}
              >
                <MaterialIcons name="bookmark-border" size={20} color="#3B82F6" />
                <Text style={styles.saveCartText}>Save for Later</Text>
              </TouchableOpacity>
            </View>
            
            {/* Shipping Info */}
            <View style={styles.infoSection}>
              <MaterialIcons name="local-shipping" size={24} color="#10B981" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Free Shipping on Orders Over ₹5000</Text>
                <Text style={styles.infoText}>
                  • 2-3 business days delivery{'\n'}
                  • Easy returns within 30 days{'\n'}
                  • Secure payment options
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  continueButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  cartList: {
    padding: 16,
    gap: 12,
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#FB923C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  productModel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginTop: 2,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  stockBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 12,
    color: '#6B7280',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemTotalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyCartIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyCartMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  continueShoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  continueShoppingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cartSummary: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  toggleSummary: {
    padding: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  clearCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  clearCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  saveCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  saveCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
});

export default CustomerCartScreen;