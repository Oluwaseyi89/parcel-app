import React, { useState, useEffect, useReducer, useCallback } from 'react';
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
  Switch,
  Modal,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type DeliveryProduct = {
  order_id: number;
  product_id: number;
  product_name?: string;
  prod_model?: string;
  prod_photo?: string;
  prod_price?: number;
  quantity?: number;
  total_amount?: number;
  is_supply_ready?: boolean;
  is_supply_received?: boolean;
  is_delivered?: boolean;
  is_received?: boolean;
};

type Delivery = {
  order_id: number;
  courier_name?: string;
  courier_phone?: string;
  total_items?: number;
  total_price?: number;
  is_delivered?: boolean;
  products: DeliveryProduct[];
  email?: string;
  order_date?: string;
  estimated_delivery?: string;
  tracking_number?: string;
};

type DeliveryState = {
  deliveries: Delivery[];
  loading: boolean;
  refreshing: boolean;
  selectedOrder: Delivery | null;
  showOrderDetails: boolean;
  showMessage: { text: string; type: 'success' | 'error' } | null;
  stats: {
    totalOrders: number;
    delivered: number;
    pending: number;
    inTransit: number;
  };
};

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_DELIVERIES'; payload: Delivery[] }
  | { type: 'SET_SELECTED_ORDER'; payload: Delivery | null }
  | { type: 'SET_SHOW_ORDER_DETAILS'; payload: boolean }
  | { type: 'SET_MESSAGE'; payload: { text: string; type: 'success' | 'error' } | null }
  | { type: 'UPDATE_PRODUCT_STATUS'; payload: { orderId: number; productId: number; isReceived: boolean } }
  | { type: 'UPDATE_ORDER_STATUS'; payload: number }
  | { type: 'UPDATE_STATS' };

const initialState: DeliveryState = {
  deliveries: [],
  loading: true,
  refreshing: false,
  selectedOrder: null,
  showOrderDetails: false,
  showMessage: null,
  stats: {
    totalOrders: 0,
    delivered: 0,
    pending: 0,
    inTransit: 0
  }
};

const deliveryReducer = (state: DeliveryState, action: Action): DeliveryState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };
      
    case 'SET_DELIVERIES': {
      const deliveries = action.payload;
      const filteredDeliveries = deliveries.filter(
        delivery => delivery.email === state.deliveries[0]?.email || true // Replace with actual user email
      );
      
      // Auto-update completed deliveries
      const updatedDeliveries = filteredDeliveries.map(delivery => {
        const pendingProducts = delivery.products.filter(product => !product.is_received);
        if (pendingProducts.length === 0 && !delivery.is_delivered) {
          // This would be where you call the API to update the order status
          return { ...delivery, is_delivered: true };
        }
        return delivery;
      });
      
      return {
        ...state,
        deliveries: updatedDeliveries,
        loading: false,
        refreshing: false
      };
    }
    
    case 'SET_SELECTED_ORDER':
      return { ...state, selectedOrder: action.payload };
      
    case 'SET_SHOW_ORDER_DETAILS':
      return { ...state, showOrderDetails: action.payload };
      
    case 'SET_MESSAGE':
      return { ...state, showMessage: action.payload };
      
    case 'UPDATE_PRODUCT_STATUS': {
      const { orderId, productId, isReceived } = action.payload;
      const updatedDeliveries = state.deliveries.map(delivery => {
        if (delivery.order_id === orderId) {
          const updatedProducts = delivery.products.map(product => {
            if (product.product_id === productId) {
              return { ...product, is_received: isReceived };
            }
            return product;
          });
          return { ...delivery, products: updatedProducts };
        }
        return delivery;
      });
      
      return { ...state, deliveries: updatedDeliveries };
    }
    
    case 'UPDATE_ORDER_STATUS': {
      const orderId = action.payload;
      const updatedDeliveries = state.deliveries.map(delivery => {
        if (delivery.order_id === orderId) {
          const allReceived = delivery.products.every(product => product.is_received);
          if (allReceived) {
            return { ...delivery, is_delivered: true };
          }
        }
        return delivery;
      });
      
      return { ...state, deliveries: updatedDeliveries };
    }
    
    case 'UPDATE_STATS': {
      const totalOrders = state.deliveries.length;
      const delivered = state.deliveries.filter(d => d.is_delivered).length;
      const pending = state.deliveries.filter(d => !d.is_delivered).length;
      const inTransit = state.deliveries.filter(d => 
        d.products.some(p => p.is_delivered && !p.is_received)
      ).length;
      
      return {
        ...state,
        stats: { totalOrders, delivered, pending, inTransit }
      };
    }
    
    default:
      return state;
  }
};

const CustomerDeliveryScreen: React.FC = () => {
  const [state, dispatch] = useReducer(deliveryReducer, initialState);
  const [customerData, setCustomerData] = useState<any>(null);
  const messageOpacity = useState(new Animated.Value(0))[0];

  // Mock API URL - replace with actual API
  const API_URL = 'http://localhost:7000/parcel_dispatch';

  useEffect(() => {
    loadCustomerData();
  }, []);

  useEffect(() => {
    if (customerData) {
      fetchDeliveries();
    }
  }, [customerData]);

  useEffect(() => {
    dispatch({ type: 'UPDATE_STATS' });
  }, [state.deliveries]);

  const loadCustomerData = async () => {
    try {
      const data = await AsyncStorage.getItem('logcus');
      if (data) {
        setCustomerData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      showMessage('Failed to load customer data', 'error');
    }
  };

  const fetchDeliveries = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Mock API call - replace with actual API
      // const response = await fetch(`${API_URL}/get_dispatch_from_db/`);
      // const data = await response.json();
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockDeliveries: Delivery[] = [
          {
            order_id: 1001,
            courier_name: 'John Courier',
            courier_phone: '+91 98765 43210',
            total_items: 3,
            total_price: 4897,
            is_delivered: false,
            email: customerData?.email || 'customer@example.com',
            order_date: '2024-01-15',
            estimated_delivery: '2024-01-20',
            tracking_number: 'TRK-1001-ABC',
            products: [
              {
                order_id: 1001,
                product_id: 101,
                product_name: 'Wireless Bluetooth Headphones',
                prod_model: 'BTH-2024',
                prod_photo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
                prod_price: 2999,
                quantity: 1,
                total_amount: 2999,
                is_supply_ready: true,
                is_supply_received: true,
                is_delivered: true,
                is_received: false
              },
              {
                order_id: 1001,
                product_id: 102,
                product_name: 'Smart Watch Series 5',
                prod_model: 'SW-2024',
                prod_photo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
                prod_price: 8999,
                quantity: 1,
                total_amount: 8999,
                is_supply_ready: true,
                is_supply_received: false,
                is_delivered: false,
                is_received: false
              }
            ]
          },
          {
            order_id: 1002,
            courier_name: 'Sarah Delivery',
            courier_phone: '+91 87654 32109',
            total_items: 2,
            total_price: 2298,
            is_delivered: true,
            email: customerData?.email || 'customer@example.com',
            order_date: '2024-01-10',
            estimated_delivery: '2024-01-15',
            tracking_number: 'TRK-1002-DEF',
            products: [
              {
                order_id: 1002,
                product_id: 103,
                product_name: 'Organic Cotton T-Shirt',
                prod_model: 'TS-2024',
                prod_photo: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
                prod_price: 799,
                quantity: 2,
                total_amount: 1598,
                is_supply_ready: true,
                is_supply_received: true,
                is_delivered: true,
                is_received: true
              },
              {
                order_id: 1002,
                product_id: 104,
                product_name: 'Yoga Mat Premium',
                prod_model: 'YM-2024',
                prod_photo: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0',
                prod_price: 1499,
                quantity: 1,
                total_amount: 1499,
                is_supply_ready: true,
                is_supply_received: true,
                is_delivered: true,
                is_received: true
              }
            ]
          },
          {
            order_id: 1003,
            courier_name: 'Awaiting Courier',
            courier_phone: '000',
            total_items: 1,
            total_price: 5999,
            is_delivered: false,
            email: customerData?.email || 'customer@example.com',
            order_date: '2024-01-18',
            estimated_delivery: '2024-01-25',
            tracking_number: 'TRK-1003-GHI',
            products: [
              {
                order_id: 1003,
                product_id: 105,
                product_name: 'Designer Leather Handbag',
                prod_model: 'HB-2024',
                prod_photo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
                prod_price: 5999,
                quantity: 1,
                total_amount: 5999,
                is_supply_ready: false,
                is_supply_received: false,
                is_delivered: false,
                is_received: false
              }
            ]
          }
        ];
        
        dispatch({ type: 'SET_DELIVERIES', payload: mockDeliveries });
      }, 1500);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      showMessage('Failed to load deliveries', 'error');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const onRefresh = () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    fetchDeliveries();
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    dispatch({ type: 'SET_MESSAGE', payload: { text, type } });
    
    Animated.sequence([
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      dispatch({ type: 'SET_MESSAGE', payload: null });
    });
  };

  const handleProductReceived = async (orderId: number, productId: number, isReceived: boolean) => {
    try {
      // Mock API call - replace with actual API
      // const apiUrl = `${API_URL}/update_dispatched_product/${orderId}/${productId}/`;
      // const response = await fetch(apiUrl, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     is_received: isReceived,
      //     updated_at: new Date().toISOString()
      //   })
      // });
      // const data = await response.json();
      
      // Simulate API call
      setTimeout(() => {
        dispatch({ 
          type: 'UPDATE_PRODUCT_STATUS', 
          payload: { orderId, productId, isReceived } 
        });
        
        // Check if all products in order are received
        const order = state.deliveries.find(d => d.order_id === orderId);
        if (order) {
          const allReceived = order.products.every(p => p.is_received);
          if (allReceived) {
            dispatch({ type: 'UPDATE_ORDER_STATUS', payload: orderId });
          }
        }
        
        showMessage(
          isReceived ? 'Product marked as received' : 'Product marked as not received',
          'success'
        );
      }, 500);
    } catch (error) {
      console.error('Error updating product status:', error);
      showMessage('Failed to update product status', 'error');
    }
  };

  const handleOrderDetails = (order: Delivery) => {
    dispatch({ type: 'SET_SELECTED_ORDER', payload: order });
    dispatch({ type: 'SET_SHOW_ORDER_DETAILS', payload: true });
  };

  const getStatusIcon = (product: DeliveryProduct) => {
    if (product.is_received) return { icon: 'check-circle', color: '#10B981', label: 'Received' };
    if (product.is_delivered) return { icon: 'local-shipping', color: '#3B82F6', label: 'Delivered' };
    if (product.is_supply_received) return { icon: 'inventory-2', color: '#F59E0B', label: 'With Courier' };
    if (product.is_supply_ready) return { icon: 'store', color: '#8B5CF6', label: 'Ready at Store' };
    return { icon: 'pending', color: '#EF4444', label: 'Pending' };
  };

  const renderProductCard = (product: DeliveryProduct, order: Delivery) => {
    const status = getStatusIcon(product);
    
    return (
      <View key={`${product.order_id}-${product.product_id}`} style={styles.productCard}>
        {/* Product Image */}
        <Image 
          source={{ uri: product.prod_photo || 'https://via.placeholder.com/150' }}
          style={styles.productImage}
          resizeMode="cover"
        />
        
        {/* Product Details */}
        <View style={styles.productDetails}>
          <View style={styles.productHeader}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.product_name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
              <MaterialIcons name={status.icon as any} size={16} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
          
          <Text style={styles.productModel}>{product.prod_model}</Text>
          
          <View style={styles.productInfoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Price:</Text>
              <Text style={styles.infoValue}>₹{product.prod_price?.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quantity:</Text>
              <Text style={styles.infoValue}>{product.quantity}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount:</Text>
              <Text style={styles.amountValue}>₹{product.total_amount?.toLocaleString()}</Text>
            </View>
          </View>
          
          {/* Status Indicators */}
          <View style={styles.statusIndicators}>
            <View style={styles.statusItem}>
              <MaterialIcons 
                name={product.is_supply_ready ? 'check-circle' : 'pending'} 
                size={16} 
                color={product.is_supply_ready ? '#10B981' : '#9CA3AF'} 
              />
              <Text style={[
                styles.statusItemText,
                { color: product.is_supply_ready ? '#10B981' : '#9CA3AF' }
              ]}>
                Vendor
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <MaterialIcons 
                name={product.is_supply_received ? 'check-circle' : 'pending'} 
                size={16} 
                color={product.is_supply_received ? '#10B981' : '#9CA3AF'} 
              />
              <Text style={[
                styles.statusItemText,
                { color: product.is_supply_received ? '#10B981' : '#9CA3AF' }
              ]}>
                Courier
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <MaterialIcons 
                name={product.is_delivered ? 'check-circle' : 'pending'} 
                size={16} 
                color={product.is_delivered ? '#10B981' : '#9CA3AF'} 
              />
              <Text style={[
                styles.statusItemText,
                { color: product.is_delivered ? '#10B981' : '#9CA3AF' }
              ]}>
                Delivered
              </Text>
            </View>
          </View>
          
          {/* Receive Toggle */}
          <View style={styles.receiveToggle}>
            <Text style={styles.receiveLabel}>Mark as Received:</Text>
            <Switch
              value={!!product.is_received}
              onValueChange={(value) => handleProductReceived(product.order_id, product.product_id, value)}
              disabled={!product.is_delivered}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor={product.is_delivered ? '#FFFFFF' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
            {!product.is_delivered && (
              <Text style={styles.disabledText}>Available after delivery</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderOrderCard = (order: Delivery) => (
    <View key={order.order_id} style={styles.orderCard}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderId}>Order #{order.order_id}</Text>
          <Text style={styles.orderDate}>Placed on {order.order_date}</Text>
        </View>
        <View style={[
          styles.orderStatusBadge,
          { backgroundColor: order.is_delivered ? '#D1FAE5' : '#FEF3C7' }
        ]}>
          <Text style={[
            styles.orderStatusText,
            { color: order.is_delivered ? '#065F46' : '#92400E' }
          ]}>
            {order.is_delivered ? 'Delivered' : 'In Progress'}
          </Text>
        </View>
      </View>
      
      {/* Courier Info */}
      <View style={styles.courierInfo}>
        <MaterialIcons name="local-shipping" size={20} color="#6B7280" />
        <View style={styles.courierDetails}>
          <Text style={styles.courierName}>
            {order.courier_name === 'Awaiting Courier' || order.courier_name === '000'
              ? 'Awaiting Courier Assignment'
              : `Courier: ${order.courier_name}`}
          </Text>
          <Text style={styles.courierPhone}>
            {order.courier_phone === '000' ? 'Phone: N/A' : `Phone: ${order.courier_phone}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.trackButton}>
          <Text style={styles.trackButtonText}>Track</Text>
        </TouchableOpacity>
      </View>
      
      {/* Order Summary */}
      <View style={styles.orderSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Items</Text>
          <Text style={styles.summaryValue}>{order.total_items}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₹{order.total_price?.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Estimated Delivery</Text>
          <Text style={styles.summaryValue}>{order.estimated_delivery}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Tracking</Text>
          <Text style={styles.trackingNumber}>{order.tracking_number}</Text>
        </View>
      </View>
      
      {/* Products */}
      <Text style={styles.productsTitle}>Products ({order.products.length})</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsScroll}
      >
        {order.products.map(product => renderProductCard(product, order))}
      </ScrollView>
      
      {/* Order Progress */}
      <View style={styles.orderProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Order Progress</Text>
          <Text style={styles.progressStats}>
            {order.products.filter(p => p.is_received).length} of {order.products.length} received
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(order.products.filter(p => p.is_received).length / order.products.length) * 100}%` 
                }
              ]} 
            />
          </View>
          
          <View style={styles.progressSteps}>
            <View style={styles.progressStep}>
              <View style={[
                styles.stepDot,
                { backgroundColor: order.products.some(p => p.is_supply_ready) ? '#10B981' : '#D1D5DB' }
              ]} />
              <Text style={styles.stepLabel}>Ordered</Text>
            </View>
            
            <View style={styles.progressStep}>
              <View style={[
                styles.stepDot,
                { backgroundColor: order.products.some(p => p.is_supply_received) ? '#10B981' : '#D1D5DB' }
              ]} />
              <Text style={styles.stepLabel}>With Courier</Text>
            </View>
            
            <View style={styles.progressStep}>
              <View style={[
                styles.stepDot,
                { backgroundColor: order.products.some(p => p.is_delivered) ? '#10B981' : '#D1D5DB' }
              ]} />
              <Text style={styles.stepLabel}>Delivered</Text>
            </View>
            
            <View style={styles.progressStep}>
              <View style={[
                styles.stepDot,
                { backgroundColor: order.products.some(p => p.is_received) ? '#10B981' : '#D1D5DB' }
              ]} />
              <Text style={styles.stepLabel}>Received</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.orderActions}>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => handleOrderDetails(order)}
        >
          <MaterialIcons name="visibility" size={18} color="#3B82F6" />
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.supportButton}>
          <MaterialIcons name="support-agent" size={18} color="#6B7280" />
          <Text style={styles.supportButtonText}>Get Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderDetailsModal = () => (
    <Modal
      visible={state.showOrderDetails}
      transparent
      animationType="slide"
      onRequestClose={() => dispatch({ type: 'SET_SHOW_ORDER_DETAILS', payload: false })}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={() => dispatch({ type: 'SET_SHOW_ORDER_DETAILS', payload: false })}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {state.selectedOrder && (
            <ScrollView style={styles.modalContent}>
              {/* Detailed order information */}
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Order Information</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Order ID</Text>
                    <Text style={styles.detailValue}>{state.selectedOrder.order_id}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Order Date</Text>
                    <Text style={styles.detailValue}>{state.selectedOrder.order_date}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Estimated Delivery</Text>
                    <Text style={styles.detailValue}>{state.selectedOrder.estimated_delivery}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Tracking Number</Text>
                    <Text style={styles.detailValue}>{state.selectedOrder.tracking_number}</Text>
                  </View>
                </View>
              </View>
              
              {/* Courier Information */}
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Courier Information</Text>
                <View style={styles.courierDetail}>
                  <MaterialIcons name="person" size={20} color="#6B7280" />
                  <View style={styles.courierDetailInfo}>
                    <Text style={styles.courierDetailName}>{state.selectedOrder.courier_name}</Text>
                    <Text style={styles.courierDetailPhone}>{state.selectedOrder.courier_phone}</Text>
                  </View>
                  <TouchableOpacity style={styles.callButton}>
                    <MaterialIcons name="call" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Products Summary */}
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Products Summary</Text>
                {state.selectedOrder.products.map((product, index) => (
                  <View key={index} style={styles.productDetail}>
                    <Image 
                      source={{ uri: product.prod_photo }} 
                      style={styles.productDetailImage}
                    />
                    <View style={styles.productDetailInfo}>
                      <Text style={styles.productDetailName}>{product.product_name}</Text>
                      <Text style={styles.productDetailModel}>{product.prod_model}</Text>
                      <View style={styles.productDetailRow}>
                        <Text style={styles.productDetailPrice}>₹{product.prod_price?.toLocaleString()}</Text>
                        <Text style={styles.productDetailQuantity}>Qty: {product.quantity}</Text>
                        <Text style={styles.productDetailTotal}>Total: ₹{product.total_amount?.toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              
              {/* Total Summary */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>₹{state.selectedOrder.total_price?.toLocaleString()}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Shipping</Text>
                  <Text style={styles.totalValue}>₹0</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax</Text>
                  <Text style={styles.totalValue}>₹{(state.selectedOrder.total_price! * 0.18).toLocaleString()}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.totalRow}>
                  <Text style={styles.grandTotalLabel}>Grand Total</Text>
                  <Text style={styles.grandTotalValue}>
                    ₹{(state.selectedOrder.total_price! * 1.18).toLocaleString()}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name="local-shipping" size={64} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>No Pending Deliveries</Text>
      <Text style={styles.emptyMessage}>
        All your orders have been received or are being processed
      </Text>
      <TouchableOpacity style={styles.shopButton} onPress={() => {}}>
        <MaterialIcons name="storefront" size={20} color="#FFFFFF" />
        <Text style={styles.shopButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (state.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Loading your deliveries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Message Banner */}
      {state.showMessage && (
        <Animated.View 
          style={[
            styles.messageBanner,
            { 
              backgroundColor: state.showMessage.type === 'success' ? '#D1FAE5' : '#FEE2E2',
              opacity: messageOpacity,
              transform: [{ translateY: messageOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0]
              }) }]
            }
          ]}
        >
          <MaterialIcons 
            name={state.showMessage.type === 'success' ? 'check-circle' : 'error'} 
            size={20} 
            color={state.showMessage.type === 'success' ? '#10B981' : '#EF4444'} 
          />
          <Text style={[
            styles.messageText,
            { color: state.showMessage.type === 'success' ? '#10B981' : '#EF4444' }
          ]}>
            {state.showMessage.text}
          </Text>
        </Animated.View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Deliveries</Text>
          <Text style={styles.headerSubtitle}>
            Track and manage your order deliveries
          </Text>
        </View>
      </View>
      
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Delivery Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{state.stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.deliveredStat]}>{state.stats.delivered}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.pendingStat]}>{state.stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.inTransitStat]}>{state.stats.inTransit}</Text>
            <Text style={styles.statLabel}>In Transit</Text>
          </View>
        </View>
      </View>
      
      {/* Deliveries List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={onRefresh}
            colors={['#EF4444']}
            tintColor="#EF4444"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Expected Orders ({state.deliveries.length})
          </Text>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="filter-list" size={20} color="#6B7280" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>
        
        {state.deliveries.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.ordersList}>
            {state.deliveries.map(renderOrderCard)}
          </View>
        )}
        
        {/* Help Section */}
        <View style={styles.helpSection}>
          <MaterialIcons name="help-outline" size={24} color="#3B82F6" />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Need Help with Delivery?</Text>
            <Text style={styles.helpText}>
              • Track your order in real-time{'\n'}
              • Contact courier directly{'\n'}
              • Report delivery issues{'\n'}
              • Request reschedule
            </Text>
          </View>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Get Help</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Modals */}
      {renderOrderDetailsModal()}
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.floatingButton}>
        <MaterialIcons name="add-alert" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  messageBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    marginTop: Platform.OS === 'ios' ? 8 : 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: width > 400 ? '22%' : '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  deliveredStat: {
    color: '#10B981',
  },
  pendingStat: {
    color: '#F59E0B',
  },
  inTransitStat: {
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  ordersList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 3,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  courierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  courierDetails: {
    flex: 1,
  },
  courierName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  courierPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  trackButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  trackButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryItem: {
    minWidth: width > 400 ? '22%' : '48%',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: 'monospace',
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  productsScroll: {
    paddingBottom: 8,
  },
  productCard: {
    width: 280,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FB923C',
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  productDetails: {
    padding: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  productModel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  productInfoGrid: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusItemText: {
    fontSize: 10,
    marginTop: 2,
  },
  receiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  receiveLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  disabledText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  orderProgress: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressStats: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
  },
  progressStep: {
    alignItems: 'center',
    width: 70,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  supportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpSection: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  helpContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  helpButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    minWidth: width > 400 ? '48%' : '100%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  courierDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  courierDetailInfo: {
    flex: 1,
  },
  courierDetailName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  courierDetailPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetail: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  productDetailImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productDetailInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productDetailName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  productDetailModel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  productDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productDetailPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  productDetailQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  productDetailTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  totalSection: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CustomerDeliveryScreen;