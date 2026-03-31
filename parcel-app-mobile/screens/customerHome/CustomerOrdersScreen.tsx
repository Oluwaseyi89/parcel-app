import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  TextInput,
  Modal,
  Dimensions,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: number;
  total: number;
  customer: string;
  paymentMethod: string;
  trackingNumber?: string;
  itemsList: OrderItem[];
}

const CustomerOrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-78945',
      date: '2024-01-15',
      status: 'delivered',
      items: 3,
      total: 125000,
      customer: 'John Smith',
      paymentMethod: 'Credit Card',
      trackingNumber: 'TRK-789456123',
      itemsList: [
        { id: '1', name: 'iPhone 15 Pro', quantity: 1, price: 105000, image: '' },
        { id: '2', name: 'AirPods Pro', quantity: 1, price: 15000, image: '' },
        { id: '3', name: 'Phone Case', quantity: 1, price: 5000, image: '' },
      ],
    },
    {
      id: '2',
      orderNumber: 'ORD-78946',
      date: '2024-01-14',
      status: 'shipped',
      items: 2,
      total: 75000,
      customer: 'John Smith',
      paymentMethod: 'PayPal',
      trackingNumber: 'TRK-789456124',
      itemsList: [
        { id: '4', name: 'MacBook Air', quantity: 1, price: 70000, image: '' },
        { id: '5', name: 'USB-C Hub', quantity: 1, price: 5000, image: '' },
      ],
    },
    {
      id: '3',
      orderNumber: 'ORD-78947',
      date: '2024-01-13',
      status: 'processing',
      items: 1,
      total: 45000,
      customer: 'John Smith',
      paymentMethod: 'Bank Transfer',
      itemsList: [
        { id: '6', name: 'iPad Air', quantity: 1, price: 45000, image: '' },
      ],
    },
    {
      id: '4',
      orderNumber: 'ORD-78948',
      date: '2024-01-12',
      status: 'pending',
      items: 4,
      total: 185000,
      customer: 'John Smith',
      paymentMethod: 'Credit Card',
      itemsList: [
        { id: '7', name: 'Samsung TV 55"', quantity: 1, price: 150000, image: '' },
        { id: '8', name: 'Soundbar', quantity: 1, price: 25000, image: '' },
        { id: '9', name: 'HDMI Cable', quantity: 2, price: 5000, image: '' },
      ],
    },
    {
      id: '5',
      orderNumber: 'ORD-78949',
      date: '2024-01-10',
      status: 'cancelled',
      items: 2,
      total: 35000,
      customer: 'John Smith',
      paymentMethod: 'Credit Card',
      itemsList: [
        { id: '10', name: 'Wireless Mouse', quantity: 1, price: 15000, image: '' },
        { id: '11', name: 'Keyboard', quantity: 1, price: 20000, image: '' },
      ],
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'items'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch customer data on mount
  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const customerData = await AsyncStorage.getItem('logcus');
      if (customerData) {
        const customer = JSON.parse(customerData);
        setCustomerName(`${customer.first_name} ${customer.last_name}`);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const getStatusColor = (status: OrderStatus): { bg: string; text: string } => {
    switch(status) {
      case 'pending': return { bg: '#FEF3C7', text: '#92400E' };
      case 'processing': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'shipped': return { bg: '#F3E8FF', text: '#5B21B6' };
      case 'delivered': return { bg: '#D1FAE5', text: '#065F46' };
      case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch(status) {
      case 'pending': return <Ionicons name="time-outline" size={16} color="#92400E" />;
      case 'processing': return <MaterialIcons name="settings" size={16} color="#1E40AF" />;
      case 'shipped': return <FontAwesome5 name="shipping-fast" size={14} color="#5B21B6" />;
      case 'delivered': return <MaterialIcons name="check-circle" size={16} color="#065F46" />;
      case 'cancelled': return <MaterialIcons name="cancel" size={16} color="#991B1B" />;
      default: return <MaterialIcons name="inventory" size={16} color="#374151" />;
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString('en-US')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredOrders = orders
    .filter(order => filterStatus === 'all' || order.status === filterStatus)
    .sort((a, b) => {
      let aValue: number | string = a[sortBy];
      let bValue: number | string = b[sortBy];
      
      if (sortBy === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleReorder = (orderId: string) => {
    Alert.alert('Reorder', `Reorder initiated for order ${orderId}`);
  };

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => {
            setOrders(orders.map(order => 
              order.id === orderId ? { ...order, status: 'cancelled' } : order
            ));
            Alert.alert('Success', 'Order has been cancelled');
          }
        },
      ]
    );
  };

  const handleTrackOrder = (order: Order) => {
    Alert.alert('Track Order', `Tracking number: ${order.trackingNumber || 'N/A'}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusColors = getStatusColor(item.status);
    
    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              {getStatusIcon(item.status)}
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
        </View>

        {/* Order Details */}
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={14} color="#6B7280" />
            <Text style={styles.detailText}>Placed on {formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Feather name="package" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.items} item{item.items !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.detailRow}>
            <Feather name="credit-card" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.paymentMethod}</Text>
          </View>
        </View>

        {/* Items Preview */}
        <View style={styles.itemsPreview}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {item.itemsList.slice(0, 3).map((product, index) => (
              <View key={product.id} style={styles.productPreview}>
                <View style={styles.productImage}>
                  <MaterialIcons name="image" size={24} color="#9CA3AF" />
                </View>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.productQty}>{product.quantity} × {formatCurrency(product.price)}</Text>
              </View>
            ))}
          </ScrollView>
          {item.itemsList.length > 3 && (
            <Text style={styles.moreItemsText}>+{item.itemsList.length - 3} more</Text>
          )}
        </View>

        {/* Order Footer */}
        <View style={styles.orderFooter}>
          {item.trackingNumber && (
            <View style={styles.trackingContainer}>
              <Feather name="truck" size={14} color="#4B5563" />
              <Text style={styles.trackingText}>Tracking: {item.trackingNumber}</Text>
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => toggleOrderDetails(item.id)}
            >
              <Text style={styles.detailsButtonText}>
                {expandedOrder === item.id ? 'Hide Details' : 'View Details'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reorderButton}
              onPress={() => handleReorder(item.id)}
              disabled={item.status === 'cancelled'}
            >
              <Text style={[styles.reorderButtonText, item.status === 'cancelled' && styles.disabledButton]}>
                Reorder
              </Text>
            </TouchableOpacity>
            
            {item.status === 'pending' && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => handleCancelOrder(item.id)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.trackButton}
              onPress={() => handleTrackOrder(item)}
            >
              <Text style={styles.trackButtonText}>Track</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expanded Order Details */}
        {expandedOrder === item.id && (
          <View style={styles.expandedDetails}>
            <Text style={styles.expandedTitle}>Order Details</Text>
            {item.itemsList.map((product) => (
              <View key={product.id} style={styles.expandedItem}>
                <View style={styles.expandedItemLeft}>
                  <View style={styles.expandedProductImage}>
                    <MaterialIcons name="image" size={20} color="#9CA3AF" />
                  </View>
                  <View>
                    <Text style={styles.expandedProductName}>{product.name}</Text>
                    <Text style={styles.expandedProductQty}>Quantity: {product.quantity}</Text>
                  </View>
                </View>
                <View style={styles.expandedItemRight}>
                  <Text style={styles.expandedProductPrice}>
                    {formatCurrency(product.price * product.quantity)}
                  </Text>
                  <Text style={styles.expandedProductEach}>{formatCurrency(product.price)} each</Text>
                </View>
              </View>
            ))}
            
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>{formatCurrency(item.total)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Shipping</Text>
                <Text style={styles.priceValue}>₦2,500</Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(item.total + 2500)}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Orders</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterOptions}>
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  filterStatus === status && styles.filterOptionActive
                ]}
                onPress={() => {
                  setFilterStatus(status);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterStatus === status && styles.filterOptionTextActive
                ]}>
                  {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                  {' '}({statusCounts[status as keyof typeof statusCounts]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort Orders</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.sortOptions}>
            {[
              { key: 'date', label: 'Date' },
              { key: 'total', label: 'Total Amount' },
              { key: 'items', label: 'Items Count' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive
                ]}
                onPress={() => {
                  setSortBy(option.key as any);
                  setShowSortModal(false);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.key && styles.sortOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <MaterialIcons name="check" size={20} color="#DB214C" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.orderDirection}>
            <Text style={styles.orderDirectionLabel}>Order:</Text>
            <TouchableOpacity
              style={[
                styles.orderDirectionButton,
                sortOrder === 'desc' && styles.orderDirectionButtonActive
              ]}
              onPress={() => setSortOrder('desc')}
            >
              <Text style={[
                styles.orderDirectionText,
                sortOrder === 'desc' && styles.orderDirectionTextActive
              ]}>
                Descending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.orderDirectionButton,
                sortOrder === 'asc' && styles.orderDirectionButtonActive
              ]}
              onPress={() => setSortOrder('asc')}
            >
              <Text style={[
                styles.orderDirectionText,
                sortOrder === 'asc' && styles.orderDirectionTextActive
              ]}>
                Ascending
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name="inventory" size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>No orders found</Text>
      <Text style={styles.emptyText}>
        {filterStatus === 'all' 
          ? "You haven't placed any orders yet."
          : `No ${filterStatus} orders found.`}
      </Text>
      <TouchableOpacity style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>Track and manage your purchase history</Text>
      </View>

      {/* Stats Summary */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.statValueGreen]}>
            {formatCurrency(totalSpent)}
          </Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.statValueBlue]}>
            {formatCurrency(averageOrderValue)}
          </Text>
          <Text style={styles.statLabel}>Avg. Order Value</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.statValuePurple]}>
            {orders.filter(o => o.status === 'delivered').length}
          </Text>
          <Text style={styles.statLabel}>Delivered Orders</Text>
        </View>
      </ScrollView>

      {/* Filter Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Feather name="filter" size={18} color="#DB214C" />
          <Text style={styles.filterButtonText}>
            {filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Feather name="arrow-up" size={18} color="#4B5563" />
          <Feather name="arrow-down" size={18} color="#4B5563" />

          <Text style={styles.sortButtonText}>
            Sort: {sortBy === 'date' ? 'Date' : sortBy === 'total' ? 'Total' : 'Items'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DB214C" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#DB214C']}
              tintColor="#DB214C"
            />
          }
          ListFooterComponent={
            filteredOrders.length > 0 ? (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{filteredOrders.length}</Text>
                    <Text style={styles.summaryLabel}>Filtered Orders</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, styles.summaryValueGreen]}>
                      {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.total, 0))}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Value</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, styles.summaryValueBlue]}>
                      {filteredOrders.reduce((sum, order) => sum + order.items, 0)}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Items</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, styles.summaryValuePurple]}>
                      {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.total, 0) / filteredOrders.length)}
                    </Text>
                    <Text style={styles.summaryLabel}>Avg. Order</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, styles.summaryValueYellow]}>
                      {filteredOrders.filter(o => o.status === 'pending' || o.status === 'processing').length}
                    </Text>
                    <Text style={styles.summaryLabel}>Active Orders</Text>
                  </View>
                </View>
              </View>
            ) : null
          }
        />
      )}

      {renderFilterModal()}
      {renderSortModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statValueGreen: {
    color: '#10B981',
  },
  statValueBlue: {
    color: '#3B82F6',
  },
  statValuePurple: {
    color: '#8B5CF6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  filterButtonText: {
    color: '#DB214C',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sortButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  orderTotal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderDetails: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  itemsPreview: {
    padding: 16,
  },
  productPreview: {
    width: 100,
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  productName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  productQty: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  orderFooter: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailsButton: {
    paddingVertical: 8,
  },
  detailsButtonText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '500',
  },
  reorderButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DB214C',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reorderButtonText: {
    color: '#DB214C',
    fontSize: 13,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  trackButton: {
    backgroundColor: '#DB214C',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  disabledButton: {
    color: '#9CA3AF',
  },
  expandedDetails: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  expandedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expandedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandedProductImage: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expandedProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  expandedProductQty: {
    fontSize: 12,
    color: '#6B7280',
  },
  expandedItemRight: {
    alignItems: 'flex-end',
  },
  expandedProductPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  expandedProductEach: {
    fontSize: 11,
    color: '#6B7280',
  },
  priceBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterOptionActive: {
    backgroundColor: '#FEE2E2',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  filterOptionTextActive: {
    color: '#DB214C',
    fontWeight: '500',
  },
  sortOptions: {
    gap: 8,
    marginBottom: 20,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  sortOptionActive: {
    backgroundColor: '#FEF2F2',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#4B5563',
  },
  sortOptionTextActive: {
    color: '#DB214C',
    fontWeight: '500',
  },
  orderDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderDirectionLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 8,
  },
  orderDirectionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  orderDirectionButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  orderDirectionText: {
    fontSize: 13,
    color: '#4B5563',
  },
  orderDirectionTextActive: {
    color: '#DB214C',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#DB214C',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryValueGreen: {
    color: '#10B981',
  },
  summaryValueBlue: {
    color: '#3B82F6',
  },
  summaryValuePurple: {
    color: '#8B5CF6',
  },
  summaryValueYellow: {
    color: '#F59E0B',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default CustomerOrdersScreen;