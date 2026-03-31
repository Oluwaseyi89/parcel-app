// screens/courierHome/CourierDealScreen.tsx
import React, { useState, useEffect, useReducer, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../config/colors';
import { UseFetchJSON } from '../../utils/useFetch';
import { useUIStore } from '../../stores/uiStore';
import { useDealStore } from '../../stores/dealStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define interfaces for our data structures
interface VendorProduct {
  product_id: number;
  vendor_name: string;
  is_supply_ready: boolean;
  vendor_address: string;
  vendor_phone: string;
  order_id: string;
}

interface DispatchDeal {
  order_id: string;
  customer_name: string;
  address: string;
  phone_no: string;
  handled_dispatch: boolean;
  courier_id?: number;
  courier_name?: string;
  courier_email?: string;
  courier_phone?: string;
  updated_at?: string;
  products: VendorProduct[];
}

interface CourierData {
  id: number;
  last_name: string;
  first_name: string;
  email: string;
  phone_no: string;
}

interface DealsState {
  deals: DispatchDeal[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

type DealsAction = 
  | { type: 'SET_DEALS'; payload: DispatchDeal[] }
  | { type: 'ACCEPT_DEAL'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REFRESHING'; payload: boolean };

const initialState: DealsState = {
  deals: [],
  loading: true,
  error: null,
  refreshing: false,
};

const dealsReducer = (state: DealsState, action: DealsAction): DealsState => {
  switch (action.type) {
    case 'SET_DEALS':
      return {
        ...state,
        deals: action.payload.filter((item) => !item.handled_dispatch),
        loading: false,
        refreshing: false,
        error: null,
      };
    case 'ACCEPT_DEAL':
      return {
        ...state,
        deals: state.deals.filter((deal) => deal.order_id !== action.payload),
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

const CourierDealScreen: React.FC = () => {
  const [state, dispatch] = useReducer(dealsReducer, initialState);
  const [loggedCour, setLoggedCour] = useState<CourierData | null>(null);
  const [ipAddress, setIpAddress] = useState<string>('');
  
  const { showAlert, showToast } = useUIStore();
  const { acceptDeal: acceptDealInStore } = useDealStore();

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
    }
  };

  const fetchDeals = useCallback(async () => {
    if (!ipAddress) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const apiUrl = `http://${ipAddress}:7000/parcel_dispatch/get_dispatch_from_db/`;
      
      const response = await UseFetchJSON<{ deals: DispatchDeal[] }>(apiUrl, 'GET');
      
      if (response.deals && Array.isArray(response.deals)) {
        dispatch({ type: 'SET_DEALS', payload: response.deals });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Invalid response format' });
      }
    } catch (error: any) {
      console.error('Error fetching deals:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load deals' });
    }
  }, [ipAddress]);

  const handleAcceptDeal = async (deal: DispatchDeal) => {
    if (!loggedCour) {
      showAlert('Error', 'Please login as courier first');
      return;
    }

    try {
      dispatch({ type: 'ACCEPT_DEAL', payload: deal.order_id });
      
      const detail = {
        handled_dispatch: true,
        courier_id: loggedCour.id,
        courier_name: `${loggedCour.last_name} ${loggedCour.first_name}`,
        courier_email: loggedCour.email,
        courier_phone: loggedCour.phone_no,
        updated_at: new Date().toISOString()
      };

      const apiUrl = `http://${ipAddress}:7000/parcel_dispatch/update_dispatch/${deal.order_id}/`;
      
      const response = await UseFetchJSON<{ status: string; data: string }>(apiUrl, 'PATCH', detail);
      
      if (response.status === 'success') {
        // Update Zustand store
        acceptDealInStore(deal.order_id, loggedCour);
        
        showToast('Deal accepted successfully!', 'success');
        fetchDeals(); // Refresh the list
      } else {
        showAlert('Error', response.data || 'Failed to accept deal');
        // Re-add the deal if acceptance failed
        dispatch({ type: 'SET_DEALS', payload: [...state.deals, deal] });
      }
    } catch (error: any) {
      console.error('Error accepting deal:', error);
      showAlert('Error', error.message || 'Failed to accept deal');
      // Re-add the deal if acceptance failed
      dispatch({ type: 'SET_DEALS', payload: [...state.deals, deal] });
    }
  };

  const onRefresh = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    await fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    loadCourierData();
  }, []);

  useEffect(() => {
    if (ipAddress) {
      fetchDeals();
    }
  }, [ipAddress, fetchDeals]);

  const renderCustomerInfo = (deal: DispatchDeal) => (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <Icon name="account" size={18} color={colors.neonRed} />
        <Text style={styles.cardTitle}>Customer Info</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.customerName}>{deal.customer_name}</Text>
        <View style={styles.infoRow}>
          <Icon name="map-marker" size={14} color={colors.gray} />
          <Text style={styles.infoText}>{deal.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="phone" size={14} color={colors.gray} />
          <Text style={styles.infoText}>{deal.phone_no}</Text>
        </View>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID: </Text>
          <Text style={styles.orderIdValue}>{deal.order_id}</Text>
        </View>
      </View>
    </View>
  );

  const renderVendorInfo = (product: VendorProduct) => (
    <View key={product.product_id} style={styles.vendorCard}>
      <View style={styles.vendorHeader}>
        <Icon name="store" size={16} color="#F59E0B" />
        <Text style={styles.vendorName}>{product.vendor_name}</Text>
      </View>
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          product.is_supply_ready ? styles.statusReady : styles.statusNotReady
        ]}>
          <Icon 
            name={product.is_supply_ready ? "check-circle" : "close-circle"} 
            size={14} 
            color={product.is_supply_ready ? "#10B981" : "#EF4444"} 
          />
          <Text style={[
            styles.statusText,
            product.is_supply_ready ? styles.statusTextReady : styles.statusTextNotReady
          ]}>
            {product.is_supply_ready ? "Supply Ready" : "Supply Not Ready"}
          </Text>
        </View>
      </View>
      <View style={styles.vendorInfo}>
        <View style={styles.infoRow}>
          <Icon name="map-marker" size={14} color={colors.gray} />
          <Text style={styles.vendorInfoText}>{product.vendor_address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="phone" size={14} color={colors.gray} />
          <Text style={styles.vendorInfoText}>{product.vendor_phone}</Text>
        </View>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID: </Text>
          <Text style={styles.orderIdValue}>{product.order_id}</Text>
        </View>
      </View>
    </View>
  );

  const renderDealCard = (deal: DispatchDeal) => (
    <View key={deal.order_id} style={styles.dealCard}>
      <View style={styles.dealCardContent}>
        {/* Customer Info */}
        {renderCustomerInfo(deal)}
        
        {/* Vendor Info */}
        <View style={styles.vendorsSection}>
          <View style={styles.sectionHeader}>
            <Icon name="store-multiple" size={18} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Vendors Info</Text>
          </View>
          <View style={styles.vendorsList}>
            {deal.products.map(renderVendorInfo)}
          </View>
        </View>
      </View>
      
      {/* Accept Button */}
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => handleAcceptDeal(deal)}
        activeOpacity={0.8}
      >
        <Icon name="check-circle" size={20} color="#FFFFFF" />
        <Text style={styles.acceptButtonText}>Accept Deal</Text>
      </TouchableOpacity>
    </View>
  );

  if (state.loading && state.deals.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.neonRed} />
          <Text style={styles.loadingText}>Loading deals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Deals</Text>
          <Text style={styles.errorMessage}>{state.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDeals}>
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
            <Icon name="package-variant" size={28} color={colors.pearlWhite} />
          </View>
          <Text style={styles.headerTitle}>Available Deals</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Tap 'Accept' to execute a deal
        </Text>
      </View>

      <View style={styles.dealsCountContainer}>
        <Text style={styles.dealsCount}>
          There are <Text style={styles.dealsCountHighlight}>{state.deals.length}</Text> deals available
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
        {state.deals.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="package-variant-closed" size={64} color={colors.silver} />
            <Text style={styles.emptyStateTitle}>No Deals Available</Text>
            <Text style={styles.emptyStateMessage}>
              Check back later for new delivery opportunities
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchDeals}>
              <Icon name="refresh" size={20} color={colors.neonRed} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.dealsList}>
            {state.deals.map(renderDealCard)}
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
  dealsCountContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    marginTop: -10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dealsCount: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  dealsCountHighlight: {
    color: colors.neonRed,
    fontWeight: 'bold',
    fontSize: 18,
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
  dealsList: {
    gap: 16,
  },
  dealCard: {
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
  dealCardContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  cardContent: {
    gap: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray,
    flex: 1,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  orderIdLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  orderIdValue: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  vendorsSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  vendorsList: {
    gap: 12,
  },
  vendorCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  statusContainer: {
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusReady: {
    backgroundColor: '#D1FAE5',
  },
  statusNotReady: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextReady: {
    color: '#065F46',
  },
  statusTextNotReady: {
    color: '#991B1B',
  },
  vendorInfo: {
    gap: 6,
  },
  vendorInfoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  acceptButton: {
    backgroundColor: colors.neonRed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CourierDealScreen;