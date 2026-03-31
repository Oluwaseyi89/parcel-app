import React, { useState, useCallback, useEffect, useReducer } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  Feather,
  Octicons,
} from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock API functions (replace with actual implementations)
const UseFetchJSON = async (url: string, method: string) => {
  // Mock implementation - replace with actual API calls
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        deals: [
          {
            order_id: 'ORD001',
            products: [
              {
                vendor_phone: '+1234567890',
                is_received: false,
                product_id: 'PROD001',
                product_name: 'Premium Wireless Headphones',
                prod_model: 'Model X-200',
                prod_photo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
                quantity: 5,
                prod_price: 29999,
                total_amount: 149995,
                is_supply_ready: false,
                is_supply_received: false,
                courier_name: 'Express Delivery',
                courier_phone: '+1987654321',
              },
            ],
            handled_dispatch: true,
          },
          {
            order_id: 'ORD002',
            products: [
              {
                vendor_phone: '+1234567890',
                is_received: false,
                product_id: 'PROD002',
                product_name: 'Smart Watch Pro',
                prod_model: 'Series 5',
                prod_photo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w-400',
                quantity: 3,
                prod_price: 19999,
                total_amount: 59997,
                is_supply_ready: true,
                is_supply_received: true,
                courier_name: 'QuickShip',
                courier_phone: '+1122334455',
              },
            ],
            handled_dispatch: true,
          },
        ],
      });
    }, 1000);
  });
};

const UseFetch = async (url: string, method: string, formData?: any) => {
  // Mock implementation - replace with actual API calls
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'success',
        data: 'Supply status updated successfully',
      });
    }, 500);
  });
};

// Types
interface DealItem {
  order_id: string;
  product_id: string;
  product_name: string;
  prod_model: string;
  prod_photo: string;
  quantity: number;
  prod_price: number;
  total_amount: number;
  is_supply_ready: boolean;
  is_supply_received: boolean;
  is_received: boolean;
  handled_dispatch: boolean;
  courier_name: string;
  courier_phone: string;
  vendor_phone: string;
}

interface State {
  deals: DealItem[];
}

type Action =
  | { type: 'GET_DEALS'; payload: any[] }
  | { type: 'SUPPLY_READY'; payload: { order_id: string; product_id: string; checked: boolean } }
  | { type: 'SET_DEALS'; payload: DealItem[] };

const VendorDealScreen: React.FC = () => {
  const [prodsus, setProdSus] = useState('');
  const [proderr, setProdErr] = useState('');
  const [loadDeals, setLoadDeals] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock vendor data - replace with actual localStorage equivalent in React Native
  const logvend = { phone_no: '+1234567890' };

  const initialDeals: State = { deals: [] };

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case 'GET_DEALS': {
        const vendDealCollectn: DealItem[] = [];
        action.payload.forEach((deal: any) => {
          deal.products.forEach((prod: any) => {
            if (prod.vendor_phone === logvend.phone_no && !prod.is_received) {
              vendDealCollectn.push({
                ...prod,
                order_id: deal.order_id,
                handled_dispatch: deal.handled_dispatch,
                courier_name: deal.courier_name || prod.courier_name || '000',
                courier_phone: deal.courier_phone || prod.courier_phone || '000',
              });
            }
          });
        });
        return { ...state, deals: vendDealCollectn };
      }

      case 'SUPPLY_READY': {
        const { order_id, product_id, checked } = action.payload;
        const newDeals = state.deals.map((item) => {
          if (item.order_id === order_id && item.product_id === product_id) {
            const updatedItem = { ...item, is_supply_ready: checked };
            
            // Simulate API call
            const formData = new FormData();
            formData.append('is_supply_ready', checked.toString());
            formData.append('updated_at', new Date().toISOString());
            
            UseFetch(
              `http://localhost:7000/parcel_dispatch/update_supplied_product/${order_id}/${product_id}/`,
              'POST',
              formData
            )
              .then((res: any) => {
                if (res.status === 'success') {
                  setProdSus(res.data);
                  setTimeout(() => setProdSus(''), 3000);
                }
              })
              .catch((err: any) => {
                console.log(err.message);
                setProdErr('Failed to update supply status');
                setTimeout(() => setProdErr(''), 3000);
              });

            return updatedItem;
          }
          return item;
        });

        return { ...state, deals: newDeals };
      }

      case 'SET_DEALS':
        return { ...state, deals: action.payload };

      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialDeals);

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = 'http://localhost:7000/parcel_dispatch/get_dispatch_from_db/';
      const res: any = await UseFetchJSON(apiUrl, 'GET');
      const deals = res.deals;
      dispatch({ type: 'GET_DEALS', payload: deals });
    } catch (err: any) {
      console.log(err.message);
      setProdErr('Failed to load deals');
      Alert.alert('Error', 'Failed to load supply deals');
    } finally {
      setIsLoading(false);
      setLoadDeals(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (loadDeals) {
      fetchDeals();
    }
  }, [loadDeals, fetchDeals]);

  const handleSupplyReadyClick = useCallback((order_id: string, product_id: string, checked: boolean) => {
    setIsLoading(true);
    dispatch({ type: 'SUPPLY_READY', payload: { order_id, product_id, checked } });
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeals();
  }, [fetchDeals]);

  const renderDealItem = ({ item }: { item: DealItem }) => (
    <View style={styles.dealCard}>
      {/* Product Image Section */}
      <View style={styles.dealImageContainer}>
        <Image
          source={{ uri: item.prod_photo }}
          style={styles.dealImage}
          resizeMode="cover"
        />
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>Order #{item.order_id}</Text>
        </View>
      </View>

      {/* Product Details */}
      <View style={styles.dealContent}>
        <Text style={styles.dealTitle} numberOfLines={2}>
          {item.product_name}
        </Text>
        <Text style={styles.productModel} numberOfLines={1}>
          {item.prod_model}
        </Text>

        {/* Order Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={styles.detailValue}>{item.quantity} units</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price per unit</Text>
            <Text style={styles.detailValue}>₦{item.prod_price.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₦{item.total_amount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Courier Information */}
        <View style={styles.courierSection}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="truck" size={16} color="#6B7280" />
            <Text style={styles.sectionTitle}>Courier Details</Text>
          </View>
          
          <View style={styles.courierDetails}>
            <View style={styles.courierRow}>
              <Ionicons name="person-outline" size={16} color="#9CA3AF" />
              <Text style={styles.courierText}>
                <Text style={styles.courierLabel}>Courier: </Text>
                {item.courier_name === '000' ? 'No Courier yet' : item.courier_name}
              </Text>
            </View>
            <View style={styles.courierRow}>
              <Feather name="phone" size={16} color="#9CA3AF" />
              <Text style={styles.courierText}>
                <Text style={styles.courierLabel}>Phone: </Text>
                {item.courier_phone === '000' ? 'No Courier yet' : item.courier_phone}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Indicators */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, item.is_supply_received ? styles.statusSuccess : styles.statusWarning]}>
              <Ionicons 
                name={item.is_supply_received ? "checkmark-circle" : "time-outline"} 
                size={14} 
                color={item.is_supply_received ? "#10B981" : "#F59E0B"} 
              />
              <Text style={[styles.statusText, item.is_supply_received ? styles.statusSuccessText : styles.statusWarningText]}>
                Courier {item.is_supply_received ? 'Received' : 'Pending'}
              </Text>
            </View>
            <View style={[styles.statusBadge, item.is_received ? styles.statusSuccess : styles.statusWarning]}>
              <Ionicons 
                name={item.is_received ? "checkmark-circle" : "time-outline"} 
                size={14} 
                color={item.is_received ? "#10B981" : "#F59E0B"} 
              />
              <Text style={[styles.statusText, item.is_received ? styles.statusSuccessText : styles.statusWarningText]}>
                Customer {item.is_received ? 'Received' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Supply Ready Toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={[styles.statusDot, item.is_supply_ready && styles.statusDotActive]} />
              <Text style={styles.toggleLabel}>Ready for supply</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                item.is_supply_ready && styles.toggleButtonActive,
                isLoading && styles.toggleButtonDisabled,
              ]}
              onPress={() => handleSupplyReadyClick(item.order_id, item.product_id, !item.is_supply_ready)}
              disabled={isLoading}
            >
              <View style={[styles.toggleThumb, item.is_supply_ready && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.toggleDescription}>
            Mark when product is ready for courier pickup
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Octicons name="package" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>No Supply Deals Available</Text>
      <Text style={styles.emptyDescription}>
        You don't have any active supply deals at the moment.
      </Text>
      <Text style={styles.emptySubDescription}>
        When customers purchase your products, they'll appear here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Supply Deals Management</Text>
          <Text style={styles.headerSubtitle}>Manage your product supplies and track delivery status</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DB214C" />
        }
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View style={styles.statsTitleContainer}>
              <View style={styles.statsIndicator} />
              <Text style={styles.statsTitle}>Deals Overview</Text>
            </View>
            <View style={styles.statsValueContainer}>
              <Octicons name="package" size={24} color="#DB214C" />
              <View style={styles.statsNumbers}>
                <Text style={styles.statsLabel}>Active Supplies</Text>
                <Text style={styles.statsCount}>{state.deals.length}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.statsDescription}>
            There are <Text style={styles.highlight}>{state.deals.length}</Text> supply deals available
          </Text>
        </View>

        {/* API Alerts */}
        {proderr ? (
          <View style={styles.alertError}>
            <View style={styles.alertContent}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.alertText}>{proderr}</Text>
            </View>
            <TouchableOpacity onPress={() => setProdErr('')}>
              <Feather name="x" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ) : null}

        {prodsus ? (
          <View style={styles.alertSuccess}>
            <View style={styles.alertContent}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.alertText}>{prodsus}</Text>
            </View>
            <TouchableOpacity onPress={() => setProdSus('')}>
              <Feather name="x" size={20} color="#059669" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Loading State */}
        {isLoading && state.deals.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DB214C" />
            <Text style={styles.loadingText}>Loading supply deals...</Text>
          </View>
        ) : (
          <>
            {/* Empty State or Deals List */}
            {state.deals.length === 0 ? (
              renderEmptyState()
            ) : (
              <View style={styles.dealsContainer}>
                <FlatList
                  data={state.deals}
                  renderItem={renderDealItem}
                  keyExtractor={(item) => `${item.order_id}-${item.product_id}`}
                  scrollEnabled={false}
                  contentContainerStyle={styles.dealsList}
                />
              </View>
            )}
          </>
        )}

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Status Legend</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendGreen]} />
              <Text style={styles.legendText}>Courier Received - Courier has picked up the product</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendYellow]} />
              <Text style={styles.legendText}>Pending - Awaiting action</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendBlue]} />
              <Text style={styles.legendText}>Customer Received - Product delivered to customer</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendRed]} />
              <Text style={styles.legendText}>Ready for Supply - Product prepared for courier</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DB214C',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIndicator: {
    width: 3,
    height: 20,
    backgroundColor: '#DB214C',
    borderRadius: 1.5,
    marginRight: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsNumbers: {
    marginLeft: 8,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsDescription: {
    fontSize: 16,
    color: '#374151',
  },
  highlight: {
    color: '#DB214C',
    fontWeight: '600',
  },
  alertError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertSuccess: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertText: {
    color: '#065F46',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  dealsContainer: {
    paddingHorizontal: 16,
  },
  dealsList: {
    paddingBottom: 8,
  },
  dealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dealImageContainer: {
    position: 'relative',
    height: 200,
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  orderBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#DB214C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dealContent: {
    padding: 20,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  productModel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DB214C',
  },
  courierSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  courierDetails: {
    gap: 8,
  },
  courierRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courierText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  courierLabel: {
    fontWeight: '500',
    color: '#6B7280',
  },
  statusSection: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  statusSuccessText: {
    color: '#065F46',
  },
  statusWarningText: {
    color: '#92400E',
  },
  toggleSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  toggleButton: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#D1D5DB',
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#DB214C',
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  toggleDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  legendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  legendGrid: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  legendGreen: {
    backgroundColor: '#10B981',
  },
  legendYellow: {
    backgroundColor: '#F59E0B',
  },
  legendBlue: {
    backgroundColor: '#3B82F6',
  },
  legendRed: {
    backgroundColor: '#DB214C',
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default VendorDealScreen;