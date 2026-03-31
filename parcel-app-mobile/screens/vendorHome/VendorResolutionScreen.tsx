import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  Feather,
  Octicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Resolution = {
  id: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  issueType: 'delivery' | 'quality' | 'payment' | 'other';
  issueDescription: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  productName: string;
  productImage: string;
  amount: number;
  vendorResponse?: string;
  adminResponse?: string;
  resolutionNotes?: string;
};

const VendorResolutionScreen: React.FC = () => {
  const [resolutions, setResolutions] = useState<Resolution[]>([
    {
      id: 1,
      orderId: 'ORD-78945',
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      issueType: 'delivery',
      issueDescription: 'Product arrived damaged. The packaging was torn and the product screen was cracked.',
      status: 'pending',
      priority: 'high',
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-01-15T10:30:00',
      productName: 'iPhone 15 Pro',
      productImage: 'https://via.placeholder.com/60x60?text=iPhone',
      amount: 105000,
    },
    {
      id: 2,
      orderId: 'ORD-78946',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah@example.com',
      issueType: 'quality',
      issueDescription: 'Product does not match the description. Received different model than ordered.',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '2024-01-14T14:20:00',
      updatedAt: '2024-01-15T09:15:00',
      productName: 'MacBook Air',
      productImage: 'https://via.placeholder.com/60x60?text=MacBook',
      amount: 70000,
      vendorResponse: 'We have initiated quality check with our warehouse team.',
    },
    {
      id: 3,
      orderId: 'ORD-78947',
      customerName: 'Michael Brown',
      customerEmail: 'michael@example.com',
      issueType: 'payment',
      issueDescription: 'Double charged for the order. Payment was deducted twice from my account.',
      status: 'resolved',
      priority: 'urgent',
      createdAt: '2024-01-13T11:45:00',
      updatedAt: '2024-01-14T16:30:00',
      productName: 'iPad Air',
      productImage: 'https://via.placeholder.com/60x60?text=iPad',
      amount: 45000,
      vendorResponse: 'Refund processed for duplicate charge.',
      resolutionNotes: 'Refund completed. Customer confirmed receipt.',
    },
    {
      id: 4,
      orderId: 'ORD-78948',
      customerName: 'Emily Davis',
      customerEmail: 'emily@example.com',
      issueType: 'other',
      issueDescription: 'Missing accessories from the package. Charger and earphones were not included.',
      status: 'pending',
      priority: 'medium',
      createdAt: '2024-01-12T09:15:00',
      updatedAt: '2024-01-12T09:15:00',
      productName: 'Samsung TV 55"',
      productImage: 'https://via.placeholder.com/60x60?text=TV',
      amount: 150000,
    },
    {
      id: 5,
      orderId: 'ORD-78949',
      customerName: 'Robert Wilson',
      customerEmail: 'robert@example.com',
      issueType: 'delivery',
      issueDescription: 'Delivery delayed by 5 days. Expected delivery was Friday, arrived on Wednesday.',
      status: 'escalated',
      priority: 'low',
      createdAt: '2024-01-10T16:45:00',
      updatedAt: '2024-01-11T10:20:00',
      productName: 'Wireless Mouse',
      productImage: 'https://via.placeholder.com/60x60?text=Mouse',
      amount: 15000,
      vendorResponse: 'Courier service issue. We have escalated to logistics team.',
      adminResponse: 'Investigating with courier partner. Will provide compensation.',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  const [vendorResponse, setVendorResponse] = useState<string>('');
  const [showResponseForm, setShowResponseForm] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const getStatusColor = (status: Resolution['status']) => {
    switch(status) {
      case 'pending': return { bg: '#FEF3C7', text: '#92400E' };
      case 'in_progress': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'resolved': return { bg: '#D1FAE5', text: '#065F46' };
      case 'escalated': return { bg: '#E9D5FF', text: '#6B21A8' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getStatusIcon = (status: Resolution['status']) => {
    switch(status) {
      case 'pending': return <MaterialIcons name="access-time" size={14} color="#92400E" />;
      case 'in_progress': return <Feather name="alert-triangle" size={14} color="#1E40AF" />;
      case 'resolved': return <MaterialIcons name="check-circle" size={14} color="#065F46" />;
      case 'escalated': return <Feather name="message-square" size={14} color="#6B21A8" />;
      default: return <MaterialIcons name="access-time" size={14} color="#374151" />;
    }
  };

  const getPriorityColor = (priority: Resolution['priority']) => {
    switch(priority) {
      case 'low': return { bg: '#F3F4F6', text: '#374151' };
      case 'medium': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'high': return { bg: '#FFEDD5', text: '#9A3412' };
      case 'urgent': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getIssueTypeColor = (type: Resolution['issueType']) => {
    switch(type) {
      case 'delivery': return { bg: '#FEE2E2', text: '#991B1B' };
      case 'quality': return { bg: '#FEF3C7', text: '#92400E' };
      case 'payment': return { bg: '#D1FAE5', text: '#065F46' };
      case 'other': return { bg: '#F3F4F6', text: '#374151' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const filteredResolutions = resolutions
    .filter(resolution => {
      if (filterStatus !== 'all' && resolution.status !== filterStatus) return false;
      if (filterPriority !== 'all' && resolution.priority !== filterPriority) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          resolution.orderId.toLowerCase().includes(query) ||
          resolution.customerName.toLowerCase().includes(query) ||
          resolution.productName.toLowerCase().includes(query) ||
          resolution.issueDescription.toLowerCase().includes(query)
        );
      }
      return true;
    });

  const handleSubmitResponse = (resolutionId: number) => {
    if (!vendorResponse.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }

    setResolutions(resolutions.map(res => {
      if (res.id === resolutionId) {
        return {
          ...res,
          status: 'in_progress' as const,
          vendorResponse: vendorResponse,
          updatedAt: new Date().toISOString(),
        };
      }
      return res;
    }));

    setVendorResponse('');
    setShowResponseForm(false);
    setSelectedResolution(null);
    Alert.alert('Success', 'Response submitted successfully');
  };

  const handleMarkAsResolved = (resolutionId: number) => {
    Alert.alert(
      'Mark as Resolved',
      'Are you sure you want to mark this issue as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Resolved',
          style: 'destructive',
          onPress: () => {
            setResolutions(resolutions.map(res => {
              if (res.id === resolutionId) {
                return {
                  ...res,
                  status: 'resolved' as const,
                  updatedAt: new Date().toISOString(),
                };
              }
              return res;
            }));
            Alert.alert('Success', 'Issue marked as resolved');
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const pendingCount = resolutions.filter(r => r.status === 'pending').length;
  const highPriorityCount = resolutions.filter(r => r.priority === 'high' || r.priority === 'urgent').length;
  const resolvedCount = resolutions.filter(r => r.status === 'resolved').length;

  const renderResolutionItem = ({ item }: { item: Resolution }) => {
    const statusColor = getStatusColor(item.status);
    const priorityColor = getPriorityColor(item.priority);
    const issueTypeColor = getIssueTypeColor(item.issueType);

    return (
      <View style={styles.resolutionCard}>
        <View style={styles.resolutionHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              {getStatusIcon(item.status)}
              <Text style={[styles.badgeText, { color: statusColor.text }]}>
                {item.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor.bg }]}>
              <Text style={[styles.badgeText, { color: priorityColor.text }]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.issueTypeBadge, { backgroundColor: issueTypeColor.bg }]}>
              <Text style={[styles.badgeText, { color: issueTypeColor.text }]}>
                {item.issueType.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.resolutionDetails}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.orderInfo}>
              {item.orderId} • {formatCurrency(item.amount)}
            </Text>
          </View>

          <View style={styles.customerInfo}>
            <View style={styles.infoRow}>
              <Feather name="user" size={14} color="#6B7280" />
              <Text style={styles.infoText}>{item.customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="clock" size={14} color="#6B7280" />
              <Text style={styles.infoText}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>

          <Text style={styles.issueDescription} numberOfLines={2}>
            {item.issueDescription}
          </Text>
        </View>

        {/* Vendor Response Preview */}
        {item.vendorResponse && (
          <View style={styles.vendorResponse}>
            <View style={styles.responseHeader}>
              <View style={styles.responseIcon}>
                <Feather name="user" size={16} color="#1E40AF" />
              </View>
              <View>
                <Text style={styles.responseTitle}>Your Response</Text>
                <Text style={styles.responseTime}>{formatDate(item.updatedAt)}</Text>
              </View>
            </View>
            <Text style={styles.responseText}>{item.vendorResponse}</Text>
          </View>
        )}

        {/* Admin Response */}
        {item.adminResponse && (
          <View style={styles.adminResponse}>
            <View style={styles.responseHeader}>
              <View style={[styles.responseIcon, styles.adminIcon]}>
                <MaterialCommunityIcons name="shield-account" size={16} color="#6B21A8" />
              </View>
              <View>
                <Text style={styles.adminResponseTitle}>Admin Response</Text>
                <Text style={styles.responseTime}>{formatDate(item.updatedAt)}</Text>
              </View>
            </View>
            <Text style={styles.adminResponseText}>{item.adminResponse}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.respondButton}
            onPress={() => {
              setSelectedResolution(item);
              setShowResponseForm(true);
            }}
          >
            <Feather name="message-square" size={16} color="#FFFFFF" />
            <Text style={styles.respondButtonText}>Respond</Text>
          </TouchableOpacity>

          {item.status !== 'resolved' && (
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleMarkAsResolved(item.id)}
            >
              <MaterialIcons name="check-circle" size={16} color="#059669" />
              <Text style={styles.resolveButtonText}>Mark Resolved</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setSelectedResolution(item)}
          >
            <Feather name="eye" size={16} color="#374151" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="message-processing-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No matching issues found' : 'All issues are currently resolved'}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {searchQuery ? 'Try a different search term' : 'No active issues at the moment'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="message-processing" size={32} color="#DB214C" />
            <Text style={styles.headerTitle}>Resolution Center</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Manage customer complaints and service requests
          </Text>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{resolutions.length}</Text>
            <Text style={styles.statLabel}>Total Issues</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.responseTime}>24h</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.satisfactionRate}>94%</Text>
            <Text style={styles.statLabel}>Satisfaction</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DB214C" />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Text style={styles.statCardNumber}>{resolutions.length}</Text>
                <Text style={styles.statCardLabel}>Total Issues</Text>
              </View>
              <MaterialCommunityIcons name="message-processing-outline" size={24} color="#6B7280" />
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Text style={[styles.statCardNumber, styles.pendingStat]}>{pendingCount}</Text>
                <Text style={styles.statCardLabel}>Pending</Text>
              </View>
              <MaterialIcons name="access-time" size={24} color="#F59E0B" />
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Text style={[styles.statCardNumber, styles.highPriorityStat]}>{highPriorityCount}</Text>
                <Text style={styles.statCardLabel}>High Priority</Text>
              </View>
              <Feather name="alert-triangle" size={24} color="#EF4444" />
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardContent}>
                <Text style={[styles.statCardNumber, styles.resolvedStat]}>{resolvedCount}</Text>
                <Text style={styles.statCardLabel}>Resolved</Text>
              </View>
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            </View>
          </View>
        </View>

        {/* Filters and Search */}
        <View style={styles.filterContainer}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by order ID, customer, or product..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Feather name="filter" size={16} color="#6B7280" />
              <View style={styles.filterSelect}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.selectWrapper}>
                  <MaterialIcons name="arrow-drop-down" size={20} color="#6B7280" />
                  <Text style={styles.selectText}>
                    {filterStatus === 'all' ? 'All Status' : filterStatus.replace('_', ' ')}
                  </Text>
                  <TouchableOpacity
                    style={styles.filterDropdown}
                    onPress={() => {
                      Alert.alert(
                        'Filter by Status',
                        '',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'All Status', onPress: () => setFilterStatus('all') },
                          { text: 'Pending', onPress: () => setFilterStatus('pending') },
                          { text: 'In Progress', onPress: () => setFilterStatus('in_progress') },
                          { text: 'Resolved', onPress: () => setFilterStatus('resolved') },
                          { text: 'Escalated', onPress: () => setFilterStatus('escalated') },
                        ]
                      );
                    }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <View style={styles.filterSelect}>
                <Text style={styles.filterLabel}>Priority</Text>
                <View style={styles.selectWrapper}>
                  <MaterialIcons name="arrow-drop-down" size={20} color="#6B7280" />
                  <Text style={styles.selectText}>
                    {filterPriority === 'all' ? 'All Priorities' : filterPriority}
                  </Text>
                  <TouchableOpacity
                    style={styles.filterDropdown}
                    onPress={() => {
                      Alert.alert(
                        'Filter by Priority',
                        '',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'All Priorities', onPress: () => setFilterPriority('all') },
                          { text: 'Low', onPress: () => setFilterPriority('low') },
                          { text: 'Medium', onPress: () => setFilterPriority('medium') },
                          { text: 'High', onPress: () => setFilterPriority('high') },
                          { text: 'Urgent', onPress: () => setFilterPriority('urgent') },
                        ]
                      );
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Resolutions List */}
        {filteredResolutions.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredResolutions}
            renderItem={renderResolutionItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.resolutionsList}
          />
        )}

        {/* Resolution Tips */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Feather name="alert-triangle" size={20} color="#1E40AF" />
            <Text style={styles.tipsTitle}>Resolution Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <MaterialIcons name="check-circle" size={16} color="#059669" />
              <Text style={styles.tipText}>Respond within 24 hours to maintain high satisfaction rates</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="check-circle" size={16} color="#059669" />
              <Text style={styles.tipText}>Be professional and empathetic in all communications</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="check-circle" size={16} color="#059669" />
              <Text style={styles.tipText}>Escalate urgent issues to admin support when needed</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="check-circle" size={16} color="#059669" />
              <Text style={styles.tipText}>Follow up with customers after resolution to ensure satisfaction</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Response Modal */}
      <Modal
        visible={showResponseForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowResponseForm(false);
          setSelectedResolution(null);
          setVendorResponse('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Respond to Issue</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowResponseForm(false);
                  setSelectedResolution(null);
                  setVendorResponse('');
                }}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedResolution && (
                <View style={styles.modalBody}>
                  <View style={styles.issueDetails}>
                    <Text style={styles.issueLabel}>Issue Details</Text>
                    <View style={styles.issueDescriptionBox}>
                      <Text style={styles.issueDescriptionText}>
                        {selectedResolution.issueDescription}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.responseInput}>
                    <Text style={styles.responseLabel}>Your Response *</Text>
                    <TextInput
                      style={styles.responseTextInput}
                      value={vendorResponse}
                      onChangeText={setVendorResponse}
                      placeholder="Type your response to the customer..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={8}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowResponseForm(false);
                        setSelectedResolution(null);
                        setVendorResponse('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        !vendorResponse.trim() && styles.submitButtonDisabled,
                      ]}
                      onPress={() => handleSubmitResponse(selectedResolution.id)}
                      disabled={!vendorResponse.trim()}
                    >
                      <Text style={styles.submitButtonText}>Submit Response</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  responseTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  satisfactionRate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardContent: {
    flex: 1,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  pendingStat: {
    color: '#F59E0B',
  },
  highPriorityStat: {
    color: '#EF4444',
  },
  resolvedStat: {
    color: '#10B981',
  },
  statCardLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: '#1F2937',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterSelect: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
  },
  filterDropdown: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  resolutionsList: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 16,
  },
  resolutionCard: {
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
  resolutionHeader: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  issueTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resolutionDetails: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  customerInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  issueDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  vendorResponse: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  adminResponse: {
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  responseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminIcon: {
    backgroundColor: '#E9D5FF',
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  adminResponseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B21A8',
  },
//   responseTime: {
//     fontSize: 12,
//     color: '#6B7280',
//   },
  responseText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  adminResponseText: {
    fontSize: 14,
    color: '#6B21A8',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  respondButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB214C',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  respondButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resolveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  resolveButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  viewButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  tipsContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: '80%',
  },
  modalBody: {
    padding: 20,
  },
  issueDetails: {
    marginBottom: 20,
  },
  issueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  issueDescriptionBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  issueDescriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  responseInput: {
    marginBottom: 24,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  responseTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#DB214C',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default VendorResolutionScreen;