import React, { useState, useCallback, useEffect, useReducer } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
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

// Mock API functions (replace with actual implementations)
const UseFetchJSON = async (url: string, method: string) => {
  // Mock implementation - replace with actual API calls
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: [
          {
            id: '1',
            title: 'Product Approved',
            message: 'Your product "Wireless Headphones" has been approved and is now live.',
            time: '10 minutes ago',
            type: 'success',
            read: false,
            icon: '✅',
            product_id: 'PROD001',
          },
          {
            id: '2',
            title: 'New Order Received',
            message: 'You have a new order #ORD-789 for 3 units of Smart Watch Pro.',
            time: '2 hours ago',
            type: 'success',
            read: false,
            icon: '📦',
            order_id: 'ORD789',
          },
          {
            id: '3',
            title: 'Low Stock Alert',
            message: 'Smart Watch Pro is running low. Only 5 units remaining.',
            time: '1 day ago',
            type: 'warning',
            read: true,
            icon: '⚠️',
            product_id: 'PROD002',
          },
          {
            id: '4',
            title: 'Payment Received',
            message: 'Payment of ₦149,995 has been processed for order #ORD-456.',
            time: '2 days ago',
            type: 'success',
            read: true,
            icon: '💰',
            order_id: 'ORD456',
            amount: 149995,
          },
          {
            id: '5',
            title: 'Customer Review',
            message: 'John S. left a 5-star review for your Premium Wireless Headphones.',
            time: '3 days ago',
            type: 'info',
            read: true,
            icon: '⭐',
            product_id: 'PROD001',
          },
          {
            id: '6',
            title: 'Courier Assigned',
            message: 'Courier "Express Delivery" has been assigned to pick up order #ORD-123.',
            time: '1 week ago',
            type: 'info',
            read: true,
            icon: '🚚',
            order_id: 'ORD123',
            courier_name: 'Express Delivery',
          },
        ],
      });
    }, 1000);
  });
};

const UseFetch = async (url: string, method: string, body?: any) => {
  // Mock implementation - replace with actual API calls
  console.log(`API Call: ${method} ${url}`, body);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'success',
        data: 'Notification marked as read',
      });
    }, 500);
  });
};

// Types
type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  read: boolean;
  icon: string;
  product_id?: string;
  order_id?: string;
  amount?: number;
  courier_name?: string;
}

interface State {
  notifications: Notification[];
  loading: boolean;
}

type Action =
  | { type: 'GET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean };

const VendorNotificationScreen: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock vendor data (replace with AsyncStorage)
  const logvend = {
    email: 'vendor@example.com',
    phone_no: '+1234567890',
  };

  const initialState: State = {
    notifications: [],
    loading: true,
  };

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case 'GET_NOTIFICATIONS':
        return {
          ...state,
          notifications: action.payload,
          loading: false,
        };

      case 'MARK_AS_READ': {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          // Simulate API call
          const apiUrl = `http://localhost:7000/notifications/mark_read/${action.payload}/`;
          UseFetch(apiUrl, 'POST')
            .then((res: any) => {
              if (res.status === 'success') {
                console.log('Notification marked as read');
              }
            })
            .catch((err: any) => console.log(err.message));
        }

        return {
          ...state,
          notifications: state.notifications.map(notif =>
            notif.id === action.payload ? { ...notif, read: true } : notif
          ),
        };
      }

      case 'MARK_ALL_AS_READ':
        // Simulate API call for marking all as read
        const apiUrl = 'http://localhost:7000/notifications/mark_all_read/';
        UseFetch(apiUrl, 'POST')
          .then((res: any) => {
            if (res.status === 'success') {
              console.log('All notifications marked as read');
            }
          })
          .catch((err: any) => console.log(err.message));

        return {
          ...state,
          notifications: state.notifications.map(notif => ({ ...notif, read: true })),
        };

      case 'DELETE_NOTIFICATION': {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification) {
          // Simulate API call
          const apiUrl = `http://localhost:7000/notifications/delete/${action.payload}/`;
          UseFetch(apiUrl, 'DELETE')
            .then((res: any) => {
              if (res.status === 'success') {
                console.log('Notification deleted');
              }
            })
            .catch((err: any) => console.log(err.message));
        }

        return {
          ...state,
          notifications: state.notifications.filter(notif => notif.id !== action.payload),
        };
      }

      case 'CLEAR_ALL_NOTIFICATIONS':
        // Simulate API call for clearing all
        const clearUrl = 'http://localhost:7000/notifications/clear_all/';
        UseFetch(clearUrl, 'DELETE')
          .then((res: any) => {
            if (res.status === 'success') {
              console.log('All notifications cleared');
            }
          })
          .catch((err: any) => console.log(err.message));

        return {
          ...state,
          notifications: [],
        };

      case 'SET_LOADING':
        return {
          ...state,
          loading: action.payload,
        };

      case 'SET_REFRESHING':
        return {
          ...state,
          // Refreshing state is handled separately
        };

      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const email = logvend.email;
      const apiUrl = `http://localhost:7000/parcel_product/get_vendor_notifications/${email}/`;
      const res: any = await UseFetchJSON(apiUrl, 'GET');
      dispatch({ type: 'GET_NOTIFICATIONS', payload: res.data });
    } catch (error: any) {
      console.error(error.message);
      Alert.alert('Error', 'Failed to load notifications');
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  // Handlers
  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  }, []);

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
    Alert.alert('Success', 'All notifications marked as read');
  };

  const deleteNotification = useCallback((id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_NOTIFICATION', payload: id }),
        },
      ]
    );
  }, []);

  const clearAllNotifications = () => {
    if (state.notifications.length === 0) return;

    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' }),
        },
      ]
    );
  };

  // Filter notifications
  const filteredNotifications = filter === 'unread'
    ? state.notifications.filter(notif => !notif.read)
    : state.notifications;

  const unreadCount = state.notifications.filter(notif => !notif.read).length;
  const hasUnread = unreadCount > 0;

  // Helper functions
  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'info':
      default: return '#3B82F6';
    }
  };

  const getTypeBgColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return '#D1FAE5';
      case 'warning': return '#FEF3C7';
      case 'error': return '#FEE2E2';
      case 'info':
      default: return '#DBEAFE';
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info':
      default: return 'ℹ️';
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    // Use custom icon if provided, otherwise use type-based icon
    return notification.icon || getTypeIcon(notification.type);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle notification-specific actions
    if (notification.product_id) {
      Alert.alert(
        notification.title,
        'Would you like to view this product?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Product', onPress: () => {
            console.log('Navigate to product:', notification.product_id);
            // navigation.navigate('ProductDetail', { productId: notification.product_id });
          }},
        ]
      );
    } else if (notification.order_id) {
      Alert.alert(
        notification.title,
        'Would you like to view this order?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Order', onPress: () => {
            console.log('Navigate to order:', notification.order_id);
            // navigation.navigate('OrderDetail', { orderId: notification.order_id });
          }},
        ]
      );
    }
  };

  // Render Notification Item
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{getNotificationIcon(item)}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={[
            styles.notificationTitle,
            !item.read && styles.unreadTitle,
          ]}>
            {item.title}
          </Text>
          <Text style={styles.notificationTime}>
            {item.time}
          </Text>
        </View>
        <View style={[
          styles.typeBadge,
          { backgroundColor: getTypeBgColor(item.type) }
        ]}>
          <Text style={[
            styles.typeText,
            { color: getTypeColor(item.type) }
          ]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.notificationMessage}>
        {item.message}
      </Text>

      {/* Additional Info */}
      {(item.order_id || item.product_id || item.amount) && (
        <View style={styles.additionalInfo}>
          {item.order_id && (
            <View style={styles.infoBadge}>
              <FontAwesome5 name="box" size={12} color="#6B7280" />
              <Text style={styles.infoText}>Order: {item.order_id}</Text>
            </View>
          )}
          {item.product_id && (
            <View style={styles.infoBadge}>
              <Octicons name="package" size={12} color="#6B7280" />
              <Text style={styles.infoText}>Product ID: {item.product_id}</Text>
            </View>
          )}
          {item.amount && (
            <View style={styles.infoBadge}>
              <FontAwesome5 name="money-bill-wave" size={12} color="#6B7280" />
              <Text style={styles.infoText}>₦{item.amount.toLocaleString()}</Text>
            </View>
          )}
          {item.courier_name && (
            <View style={styles.infoBadge}>
              <FontAwesome5 name="truck" size={12} color="#6B7280" />
              <Text style={styles.infoText}>{item.courier_name}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.notificationFooter}>
        <View style={styles.timeContainer}>
          {!item.read && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          {!item.read && (
            <TouchableOpacity
              onPress={() => markAsRead(item.id)}
              style={styles.actionButton}
            >
              <Text style={styles.readButtonText}>Mark as read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => deleteNotification(item.id)}
            style={styles.actionButton}
          >
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyStateTitle}>
        {filter === 'unread'
          ? "You're all caught up!"
          : "No notifications yet"}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {filter === 'unread'
          ? "No unread notifications."
          : "You'll see notifications about orders, products, and updates here."}
      </Text>
    </View>
  );

  const renderStats = () => {
    if (state.notifications.length === 0) return null;

    const successCount = state.notifications.filter(n => n.type === 'success').length;
    const warningCount = state.notifications.filter(n => n.type === 'warning').length;
    const infoCount = state.notifications.filter(n => n.type === 'info').length;
    const errorCount = state.notifications.filter(n => n.type === 'error').length;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Notification Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{state.notifications.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.successStat]}>{successCount}</Text>
            <Text style={styles.statLabel}>Success</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.infoStat]}>{infoCount}</Text>
            <Text style={styles.statLabel}>Info</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.unreadStat]}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
        </View>
        {(warningCount > 0 || errorCount > 0) && (
          <View style={styles.warningStats}>
            {warningCount > 0 && (
              <View style={styles.warningStatItem}>
                <View style={[styles.statDot, styles.warningDot]} />
                <Text style={styles.warningStatText}>{warningCount} Warnings</Text>
              </View>
            )}
            {errorCount > 0 && (
              <View style={styles.warningStatItem}>
                <View style={[styles.statDot, styles.errorDot]} />
                <Text style={styles.warningStatText}>{errorCount} Errors</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (state.loading && state.notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DB214C" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DB214C" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Vendor Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Stay updated with orders, products, and business updates
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.headerActions}>
          {hasUnread && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={styles.markAllButton}
            >
              <Feather name="check-circle" size={16} color="#FFFFFF" />
              <Text style={styles.markAllButtonText}>Mark All as Read</Text>
            </TouchableOpacity>
          )}
          {state.notifications.length > 0 && (
            <TouchableOpacity
              onPress={clearAllNotifications}
              style={styles.clearAllButton}
            >
              <Feather name="trash-2" size={16} color="#EF4444" />
              <Text style={styles.clearAllButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[
            styles.filterButton,
            filter === 'all' ? styles.filterButtonActive : styles.filterButtonInactive
          ]}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'all' ? styles.filterButtonTextActive : styles.filterButtonTextInactive
          ]}>
            All ({state.notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('unread')}
          style={[
            styles.filterButton,
            filter === 'unread' ? styles.filterButtonActive : styles.filterButtonInactive
          ]}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'unread' ? styles.filterButtonTextActive : styles.filterButtonTextInactive
          ]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.notificationsList}
        />
      )}

      {/* Stats */}
      {renderStats()}

      {/* Help Tip */}
      <View style={styles.tipContainer}>
        <Ionicons name="information-circle-outline" size={24} color="#1E40AF" />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Notification Tips</Text>
          <Text style={styles.tipMessage}>
            • Tap notifications to view details or take action
            • Red badge indicates unread notifications
            • Mark as read to stay organized
            • Dismiss notifications you no longer need
          </Text>
        </View>
      </View>
    </ScrollView>
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
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
    fontSize: 16,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  markAllButton: {
    backgroundColor: '#DB214C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  markAllButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  clearAllButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#DB214C',
  },
  filterButtonInactive: {
    backgroundColor: '#E5E7EB',
  },
  filterButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterButtonTextInactive: {
    color: '#374151',
  },
  notificationsList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#111827',
  },
  notificationTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    paddingVertical: 4,
  },
  readButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 16,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  successStat: {
    color: '#10B981',
  },
  infoStat: {
    color: '#3B82F6',
  },
  unreadStat: {
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  warningStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  warningStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  warningDot: {
    backgroundColor: '#F59E0B',
  },
  errorDot: {
    backgroundColor: '#EF4444',
  },
  warningStatText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  tipMessage: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});

export default VendorNotificationScreen;