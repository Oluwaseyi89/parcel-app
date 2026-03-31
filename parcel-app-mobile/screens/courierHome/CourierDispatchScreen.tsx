// screens/courierHome/CourierDispatchScreen.tsx
import React, { useState, useEffect, useReducer, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Switch,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../config/colors';
import { UseFetch, UseFetchJSON } from '../../utils/useFetch';
import { useUIStore } from '../../stores/uiStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define TypeScript interfaces
interface VendorProduct {
  product_id: string | number;
  vendor_name: string;
  vendor_phone: string;
  vendor_address: string;
  order_id: string;
  product_name: string;
  prod_model: string;
  prod_price: number;
  quantity: number;
  total_amount: number;
  prod_photo: string;
  is_supply_ready: boolean;
  is_supply_received: boolean;
  is_received: boolean;
  is_delivered: boolean;
}

interface DispatchDeal {
  order_id: string;
  customer_name: string;
  address: string;
  phone_no: string;
  courier_email: string;
  total_items: number;
  total_price: number;
  is_delivered: boolean;
  is_received: boolean;
  products: VendorProduct[];
}

interface CourierData {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_no?: string;
}

interface DispatchState {
  dispatchables: DispatchDeal[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

type ActionPayloads = 
  | { type: 'SET_DISPATCHABLES'; payload: DispatchDeal[] }
  | { type: 'UPDATE_DELIVERED'; payload: { orderId: string; productId: string | number; isDelivered: boolean } }
  | { type: 'UPDATE_SUPPLY_RECEIVED'; payload: { orderId: string; productId: string | number; isSupplyReceived: boolean } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REFRESHING'; payload: boolean };

const initialState: DispatchState = {
  dispatchables: [],
  loading: true,
  error: null,
  refreshing: false,
};

const dispatchReducer = (state: DispatchState, action: ActionPayloads): DispatchState => {
  switch (action.type) {
    case 'SET_DISPATCHABLES':
      return {
        ...state,
        dispatchables: action.payload,
        loading: false,
        refreshing: false,
        error: null,
      };
    case 'UPDATE_DELIVERED':
      return {
        ...state,
        dispatchables: state.dispatchables.map((item) => {
          if (item.order_id === action.payload.orderId) {
            return {
              ...item,
              products: item.products.map((prod) => {
                if (prod.product_id === action.payload.productId) {
                  return { ...prod, is_delivered: action.payload.isDelivered };
                }
                return prod;
              }),
            };
          }
          return item;
        }),
      };
    case 'UPDATE_SUPPLY_RECEIVED':
      return {
        ...state,
        dispatchables: state.dispatchables.map((item) => {
          if (item.order_id === action.payload.orderId) {
            return {
              ...item,
              products: item.products.map((prod) => {
                if (prod.product_id === action.payload.productId) {
                  return { ...prod, is_supply_received: action.payload.isSupplyReceived };
                }
                return prod;
              }),
            };
          }
          return item;
        }),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false, refreshing: false };
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };
    default:
      return state;
  }
};

const CourierDispatchScreen: React.FC = () => {
  const [state, dispatch] = useReducer(dispatchReducer, initialState);
  const [loggedCour, setLoggedCour] = useState<CourierData | null>(null);
  const [ipAddress, setIpAddress] = useState<string>('');
  
  const { showAlert, showToast } = useUIStore();

  const loadCourierData = async () => {
    try {
      const courierData = await AsyncStorage.getItem('@CourierData:details');
      const savedIP = await AsyncStorage.getItem('@IPStore:ipAdd');
      
      if (courierData) {
        setLoggedCour(JSON.parse(courierData));
      }
      
      if (savedIP) {
        setIpAddress(savedIP);
      }
    } catch (error) {
      console.error('Error loading courier data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load courier data' });
    }
  };

  const fetchDispatchables = useCallback(async () => {
    if (!ipAddress || !loggedCour) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const apiUrl = `http://${ipAddress}:7000/parcel_dispatch/get_dispatch_from_db/`;
      
      const response = await UseFetchJSON<{ deals: DispatchDeal[] }>(apiUrl, 'GET');
      
      if (response.deals && Array.isArray(response.deals)) {
        const filteredData = response.deals.filter(
          (data) => data.courier_email === loggedCour.email && !data.is_received
        );
        dispatch({ type: 'SET_DISPATCHABLES', payload: filteredData });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Invalid response format' });
      }
    } catch (error: any) {
      console.error('Error fetching dispatchables:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load dispatch data' });
    }
  }, [ipAddress, loggedCour]);

  const handleIsDelivered = async (
    orderId: string,
    productId: string | number,
    isDelivered: boolean
  ) => {
    try {
      dispatch({
        type: 'UPDATE_DELIVERED',
        payload: { orderId, productId, isDelivered }
      });

      const detail = {
        is_delivered: isDelivered,
        updated_at: new Date().toISOString()
      };
      
      const apiUrl = `http://${ipAddress}:7000/parcel_dispatch/update_dispatched_product/${orderId}/${productId}/`;
      
      const response = await UseFetchJSON<{ status: string; data: string }>(apiUrl, 'PATCH', detail);
      
      if (response.status === 'success') {
        showToast('Delivery status updated successfully!', 'success');
      } else {
        showAlert('Error', response.data || 'Failed to update delivery status');
        // Revert on error
        dispatch({
          type: 'UPDATE_DELIVERED',
          payload: { orderId, productId, isDelivered: !isDelivered }
        });
      }
    } catch (error: any) {
      console.error('Error updating delivery status:', error);
      showAlert('Error', error.message || 'Failed to update delivery status');
      // Revert on error
      dispatch({
        type: 'UPDATE_DELIVERED',
        payload: { orderId, productId, isDelivered: !isDelivered }
      });
    }
  };

  const handleSupplyReceived = async (
    orderId: string,
    productId: string | number,
    isSupplyReceived: boolean
  ) => {
    try {
      dispatch({
        type: 'UPDATE_SUPPLY_RECEIVED',
        payload: { orderId, productId, isSupplyReceived }
      });

      const formData = new FormData();
      formData.append('is_supply_received', isSupplyReceived.toString());
      formData.append('updated_at', new Date().toISOString());
      
      const apiUrl = `http://${ipAddress}:7000/parcel_dispatch/update_received_product/${orderId}/${productId}/`;
      
      const response = await UseFetch<{ status: string; data: string }>(apiUrl, 'POST', formData);
      
      if (response.status === 'success') {
        showToast('Supply status updated successfully!', 'success');
      } else {
        showAlert('Error', response.data || 'Failed to update supply status');
        // Revert on error
        dispatch({
          type: 'UPDATE_SUPPLY_RECEIVED',
          payload: { orderId, productId, isSupplyReceived: !isSupplyReceived }
        });
      }
    } catch (error: any) {
      console.error('Error updating supply status:', error);
      showAlert('Error', error.message || 'Failed to update supply status');
      // Revert on error
      dispatch({
        type: 'UPDATE_SUPPLY_RECEIVED',
        payload: { orderId, productId, isSupplyReceived: !isSupplyReceived }
      });
    }
  };

  const onRefresh = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    await fetchDispatchables();
  }, [fetchDispatchables]);

  useEffect(() => {
    loadCourierData();
  }, []);

  useEffect(() => {
    if (ipAddress && loggedCour) {
      fetchDispatchables();
    }
  }, [ipAddress, loggedCour, fetchDispatchables]);

  const renderStatusBadge = (label: string, status: boolean) => (
    <View style={[
      styles.statusBadge,
      status ? styles.statusBadgeSuccess : styles.statusBadgeWarning
    ]}>
      <Icon 
        name={status ? 'check-circle' : 'clock-outline'} 
        size={14} 
        color={status ? '#10B981' : '#F59E0B'} 
      />
      <Text style={[
        styles.statusText,
        status ? styles.statusTextSuccess : styles.statusTextWarning
      ]}>
        {status ? `✓ ${label}` : `⏳ ${label}`}
      </Text>
    </View>
  );

  const renderOrderCard = (item: DispatchDeal) => (
    <View key={item.order_id} style={styles.orderCard}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Icon name="package-variant" size={20} color={colors.neonRed} />
          <Text style={styles.orderId}>Order: {item.order_id}</Text>
        </View>
        {renderStatusBadge('Order Status', item.is_delivered)}
      </View>

      {/* Customer Info */}
      <View style={styles.customerInfo}>
        <View style={styles.customerHeader}>
          <Icon name="account" size={18} color={colors.neonRed} />
          <Text style={styles.customerTitle}>Customer Details</Text>
        </View>
        <View style={styles.customerDetails}>
          <View style={styles.customerRow}>
            <Icon name="account-circle" size={16} color={colors.gray} />
            <Text style={styles.customerText}>{item.customer_name}</Text>
          </View>
          <View style={styles.customerRow}>
            <Icon name="map-marker" size={16} color={colors.gray} />
            <Text style={styles.customerText}>{item.address}</Text>
          </View>
          <View style={styles.customerRow}>
            <Icon name="phone" size={16} color={colors.gray} />
            <Text style={styles.customerText}>{item.phone_no}</Text>
          </View>
        </View>
        <View style={styles.orderSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Items:</Text>
            <Text style={styles.summaryValue}>{item.total_items}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryAmount}>₦{item.total_price.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Products List */}
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Icon name="package" size={18} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Products to Dispatch ({item.products.length})</Text>
        </View>
        <View style={styles.productsList}>
          {item.products.map((product) => renderProductCard(product, item.order_id))}
        </View>
      </View>
    </View>
  );

  const renderProductCard = (product: VendorProduct, orderId: string) => (
    <View key={product.product_id} style={styles.productCard}>
      {/* Product Header */}
      <View style={styles.productHeader}>
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: product.prod_photo }}
            style={styles.productImage}
            defaultSource={require('../../assets/placeholder.jpg')}
          />
        </View>
        <View style={styles.productBasicInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.product_name}
          </Text>
          <Text style={styles.productModel}>{product.prod_model}</Text>
          <Text style={styles.productPrice}>
            ₦{product.prod_price.toLocaleString()} × {product.quantity}
          </Text>
          <Text style={styles.productTotal}>
            Total: ₦{product.total_amount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Vendor Info */}
      <View style={styles.vendorInfo}>
        <View style={styles.vendorHeader}>
          <Icon name="store" size={16} color="#92400E" />
          <Text style={styles.vendorName}>{product.vendor_name}</Text>
        </View>
        <View style={styles.vendorDetails}>
          <View style={styles.vendorRow}>
            <Icon name="phone" size={14} color={colors.gray} />
            <Text style={styles.vendorText}>{product.vendor_phone}</Text>
          </View>
          <View style={styles.vendorRow}>
            <Icon name="map-marker" size={14} color={colors.gray} />
            <Text style={styles.vendorText} numberOfLines={2}>
              {product.vendor_address}
            </Text>
          </View>
          <Text style={styles.productOrderId}>
            Order ID: <Text style={styles.orderIdValue}>{product.order_id}</Text>
          </Text>
        </View>
      </View>

      {/* Status and Actions */}
      <View style={styles.productActions}>
        <View style={styles.statusRow}>
          <View style={styles.statusLabel}>
            <Icon name="package-variant-closed" size={16} color={colors.gray} />
            <Text style={styles.actionLabel}>Supply Status:</Text>
          </View>
          {renderStatusBadge('Ready', product.is_supply_ready)}
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Icon name="truck-delivery" size={16} color={colors.gray} />
            <Text style={styles.actionLabel}>I received supply:</Text>
          </View>
          <Switch
            value={product.is_supply_received || false}
            onValueChange={(value) => handleSupplyReceived(orderId, product.product_id, value)}
            trackColor={{ false: '#D1D5DB', true: colors.neonRed }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D1D5DB"
          />
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusLabel}>
            <Icon name="account-check" size={16} color={colors.gray} />
            <Text style={styles.actionLabel}>Customer Response:</Text>
          </View>
          {renderStatusBadge('Received', product.is_received)}
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Icon name="check-circle" size={16} color={colors.gray} />
            <Text style={styles.actionLabel}>I delivered this:</Text>
          </View>
          <Switch
            value={product.is_delivered || false}
            onValueChange={(value) => handleIsDelivered(orderId, product.product_id, value)}
            trackColor={{ false: '#D1D5DB', true: colors.neonRed }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D1D5DB"
          />
        </View>
      </View>
    </View>
  );

  if (state.loading && state.dispatchables.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.neonRed} />
          <Text style={styles.loadingText}>Loading dispatch orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Orders</Text>
          <Text style={styles.errorMessage}>{state.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDispatchables}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Icon name="truck-delivery" size={28} color={colors.pearlWhite} />
          </View>
          <Text style={styles.headerTitle}>Dispatch Orders</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          You have {state.dispatchables.length} orders to dispatch
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={onRefresh}
            colors={[colors.neonRed]}
            tintColor={colors.neonRed}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {state.dispatchables.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="package-variant-closed" size={64} color={colors.silver} />
            <Text style={styles.emptyStateTitle}>No Orders to Dispatch</Text>
            <Text style={styles.emptyStateMessage}>
              All orders have been dispatched or you have no assigned orders
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchDispatchables}>
              <Icon name="refresh" size={20} color={colors.neonRed} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {state.dispatchables.map(renderOrderCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pearlWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.neonRed,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: colors.neonRed,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.pearlWhite,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  refreshButtonText: {
    color: colors.neonRed,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  ordersList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.neonRed,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextSuccess: {
    color: '#065F46',
  },
  statusTextWarning: {
    color: '#92400E',
  },
  customerInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  customerDetails: {
    gap: 8,
    marginBottom: 16,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerText: {
    fontSize: 14,
    color: colors.gray,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  productsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productBasicInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productModel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  vendorInfo: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  vendorDetails: {
    gap: 6,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vendorText: {
    fontSize: 12,
    color: '#6B7280',
  },
  productOrderId: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 4,
  },
  orderIdValue: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  productActions: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    color: '#374151',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default CourierDispatchScreen;