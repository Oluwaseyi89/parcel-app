import React, { useState } from 'react';
import {
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity,
    Alert,
    FlatList
} from 'react-native';
// import { useNavigation } from '@react-native-async-storage/async-storage';

type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  icon: string;
};

const CourierNotificationScreen = () => {   
    const [notifications, setNotifications] = useState<Notification[]>([
        {
          id: 1,
          title: 'New Delivery Assignment',
          message: 'You have been assigned a new delivery to 123 Main St.',
          time: '10 minutes ago',
          type: 'success',
          read: false,
          icon: '📦',
        },
        {
          id: 2,
          title: 'Payment Received',
          message: 'Payment for delivery #DEL-456 has been deposited to your account.',
          time: '2 hours ago',
          type: 'success',
          read: false,
          icon: '💰',
        },
        {
          id: 3,
          title: 'Delivery Delay',
          message: 'Delivery #DEL-789 may be delayed due to traffic conditions.',
          time: '1 day ago',
          type: 'warning',
          read: true,
          icon: '⚠️',
        },
        {
          id: 4,
          title: 'Customer Review',
          message: 'John S. left you a 5-star review for your recent delivery.',
          time: '2 days ago',
          type: 'info',
          read: true,
          icon: '⭐',
        },
        {
          id: 5,
          title: 'Order Completed',
          message: 'Delivery #DEL-123 has been successfully completed.',
          time: '3 days ago',
          type: 'success',
          read: true,
          icon: '✅',
        },
        {
          id: 6,
          title: 'Welcome to Courier App',
          message: 'Thank you for joining! Start accepting deliveries from your dashboard.',
          time: '1 week ago',
          type: 'info',
          read: true,
          icon: '🎉',
        },
    ]);

    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [showMarkAllRead, setShowMarkAllRead] = useState(true);

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
        setShowMarkAllRead(false);
        Alert.alert('Success', 'All notifications marked as read');
    };

    const deleteNotification = (id: number) => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => {
                        setNotifications(notifications.filter(notif => notif.id !== id));
                    }
                }
            ]
        );
    };

    const clearAllNotifications = () => {
        Alert.alert(
            'Clear All Notifications',
            'Are you sure you want to clear all notifications?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Clear All', 
                    style: 'destructive',
                    onPress: () => {
                        setNotifications([]);
                        setShowMarkAllRead(false);
                    }
                }
            ]
        );
    };

    const filteredNotifications = filter === 'unread' 
        ? notifications.filter(notif => !notif.read)
        : notifications;

    const unreadCount = notifications.filter(notif => !notif.read).length;

    const getTypeColor = (type: Notification['type']) => {
        switch(type) {
          case 'success': return '#10B981';
          case 'warning': return '#F59E0B';
          case 'error': return '#EF4444';
          case 'info': 
          default: return '#3B82F6';
        }
    };

    const getTypeBgColor = (type: Notification['type']) => {
        switch(type) {
          case 'success': return '#D1FAE5';
          case 'warning': return '#FEF3C7';
          case 'error': return '#FEE2E2';
          case 'info': 
          default: return '#DBEAFE';
        }
    };

    const getTypeIcon = (type: Notification['type']) => {
        switch(type) {
          case 'success': return '✅';
          case 'warning': return '⚠️';
          case 'error': return '❌';
          case 'info': 
          default: return 'ℹ️';
        }
    };

    const renderNotificationItem = ({ item }: { item: Notification }) => (
        <View style={[
            styles.notificationCard,
            !item.read && styles.unreadNotification
        ]}>
            <View style={styles.notificationHeader}>
                <View style={styles.iconContainer}>
                    <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <View style={styles.titleContainer}>
                    <Text style={[
                        styles.notificationTitle,
                        !item.read && styles.unreadTitle
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
                        {getTypeIcon(item.type)} {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Text>
                </View>
            </View>
            
            <Text style={styles.notificationMessage}>
                {item.message}
            </Text>
            
            <View style={styles.notificationFooter}>
                <View style={styles.timeContainer}>
                    {!item.read && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>New</Text>
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
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIcon}>
                <Text style={styles.emptyStateIconText}>🔔</Text>
            </View>
            <Text style={styles.emptyStateTitle}>
                {filter === 'unread' 
                    ? "You're all caught up!"
                    : "No notifications yet"}
            </Text>
            <Text style={styles.emptyStateMessage}>
                {filter === 'unread' 
                    ? "No unread notifications."
                    : "You'll see notifications about your deliveries here."}
            </Text>
        </View>
    );

    const renderStats = () => {
        if (notifications.length === 0) return null;
        
        return (
            <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Notification Summary</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{notifications.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, styles.successStat]}>
                            {notifications.filter(n => n.type === 'success').length}
                        </Text>
                        <Text style={styles.statLabel}>Success</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, styles.infoStat]}>
                            {notifications.filter(n => n.type === 'info').length}
                        </Text>
                        <Text style={styles.statLabel}>Info</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, styles.unreadStat]}>
                            {unreadCount}
                        </Text>
                        <Text style={styles.statLabel}>Unread</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <Text style={styles.headerSubtitle}>
                        Stay updated with your deliveries and earnings
                    </Text>
                </View>
                
                {/* Actions */}
                <View style={styles.headerActions}>
                    {showMarkAllRead && unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={markAllAsRead}
                            style={styles.markAllButton}
                        >
                            <Text style={styles.markAllButtonText}>Mark All as Read</Text>
                        </TouchableOpacity>
                    )}
                    {notifications.length > 0 && (
                        <TouchableOpacity
                            onPress={clearAllNotifications}
                            style={styles.clearAllButton}
                        >
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
                        All ({notifications.length})
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
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                    contentContainerStyle={styles.notificationsList}
                />
            )}

            {/* Stats */}
            {renderStats()}

            {/* Help Tip */}
            <View style={styles.tipContainer}>
                <Text style={styles.tipIcon}>💡</Text>
                <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Notification Tips</Text>
                    <Text style={styles.tipMessage}>
                        Notifications help you track delivery assignments, payment confirmations, and important updates.
                        Mark notifications as read to stay organized.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 16,
    },
    header: {
        marginBottom: 24,
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
        backgroundColor: '#EF4444',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markAllButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    clearAllButton: {
        borderWidth: 1,
        borderColor: '#EF4444',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearAllButtonText: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: 14,
    },
    filterContainer: {
        flexDirection: 'row',
        marginBottom: 20,
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
        backgroundColor: '#EF4444',
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
        gap: 12,
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
        marginBottom: 16,
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
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginVertical: 20,
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
    emptyStateIconText: {
        fontSize: 40,
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
        paddingHorizontal: 32,
    },
    statsContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
        marginBottom: 24,
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
    tipContainer: {
        flexDirection: 'row',
        backgroundColor: '#DBEAFE',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        marginTop: 8,
        marginBottom: 24,
    },
    tipIcon: {
        fontSize: 20,
        marginRight: 12,
        marginTop: 2,
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

export default CourierNotificationScreen;