import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  Feather,
  Octicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

// Mock API functions (replace with actual implementations)
const UseFetchJSON = async (url: string, method: string, body?: any) => {
  // Mock implementation - replace with actual API calls
  console.log(`API Call: ${method} ${url}`, body);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'success',
        data: {
          bank_name: 'First Bank',
          account_type: 'Savings',
          account_name: 'John Doe',
          account_no: '1234567890',
        },
      });
    }, 1000);
  });
};

// Types
interface BankDetails {
  bank_name: string;
  account_type: string;
  account_name: string;
  account_no: string;
}

interface Transaction {
  id: string;
  orderId: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  type: 'credit' | 'debit';
  description: string;
  reference: string;
}

const VendorTransactionScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bank' | 'transactions'>('bank');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: '',
    account_type: '',
    account_name: '',
    account_no: '',
  });

  const [banksus, setBankSus] = useState('');
  const [bankerr, setBankErr] = useState('');
  const [fetchedDetails, setFetchedDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock vendor data (replace with AsyncStorage)
  const logvend = {
    email: 'vendor@example.com',
    name: 'John Doe',
  };

  // Mock transactions data
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      orderId: 'ORD-78945',
      date: '2024-01-15T10:30:00',
      amount: 149995,
      status: 'completed',
      type: 'credit',
      description: 'Payment for order #ORD-78945',
      reference: 'REF-123456',
    },
    {
      id: '2',
      orderId: 'ORD-78946',
      date: '2024-01-14T14:20:00',
      amount: 59997,
      status: 'pending',
      type: 'credit',
      description: 'Payment for order #ORD-78946',
      reference: 'REF-123457',
    },
    {
      id: '3',
      orderId: 'ORD-78947',
      date: '2024-01-13T11:45:00',
      amount: 45000,
      status: 'completed',
      type: 'credit',
      description: 'Payment for order #ORD-78947',
      reference: 'REF-123458',
    },
    {
      id: '4',
      orderId: 'ORD-78948',
      date: '2024-01-12T09:15:00',
      amount: 150000,
      status: 'failed',
      type: 'credit',
      description: 'Payment for order #ORD-78948',
      reference: 'REF-123459',
    },
  ]);

  useEffect(() => {
    fetchBankDetails();
    fetchTransactions();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const email = logvend.email;
      const apiUrl = `http://localhost:7000/parcel_backends/get_dist_vend_bank/${email}/`;
      const res: any = await UseFetchJSON(apiUrl, 'GET');
      
      if (res.status === 'success') {
        setFetchedDetails(res.data);
        setBankDetails({
          bank_name: res.data.bank_name || '',
          account_type: res.data.account_type || '',
          account_name: res.data.account_name || '',
          account_no: res.data.account_no || '',
        });
      } else if (res.status === 'error') {
        setBankErr(res.data);
      }
    } catch (error: any) {
      setBankErr(error.message || 'Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    // Mock implementation
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBankDetails(), fetchTransactions()]);
    setRefreshing(false);
  };

  const handleBankDetailChange = (field: keyof BankDetails, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleBankDetailSubmit = async () => {
    const { bank_name, account_type, account_name, account_no } = bankDetails;
    
    if (!bank_name || !account_type || !account_name || !account_no) {
      setBankErr('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const email = logvend.email;
      const bankData = {
        bank_name,
        account_type,
        account_name,
        account_no,
        vendor_email: email,
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const apiUrl = 'http://localhost:7000/parcel_backends/save_vend_bank/';
      const res: any = await UseFetchJSON(apiUrl, 'POST', bankData);
      
      if (res.status === 'success') {
        setBankSus(res.data);
        setFetchedDetails(bankDetails);
        Alert.alert('Success', 'Bank details saved successfully');
      } else if (res.status === 'error') {
        setBankErr(res.data);
      } else {
        setBankErr('An error occurred');
      }
    } catch (error: any) {
      console.log(error);
      setBankErr('Failed to save bank details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBankDetailUpdate = async () => {
    const { bank_name, account_type, account_name, account_no } = bankDetails;
    
    if (!bank_name || !account_type || !account_name || !account_no) {
      setBankErr('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const email = logvend.email;
      const bankData = {
        bank_name,
        account_type,
        account_name,
        account_no,
        updated_at: new Date().toISOString(),
      };
      
      const apiUrl = `http://localhost:7000/parcel_backends/update_vend_bank/${email}`;
      const res: any = await UseFetchJSON(apiUrl, 'PATCH', bankData);
      
      if (res.status === 'success') {
        setBankSus(res.data);
        setFetchedDetails(bankDetails);
        Alert.alert('Success', 'Bank details updated successfully');
      } else if (res.status === 'error') {
        setBankErr(res.data);
      } else {
        setBankErr('An error occurred');
      }
    } catch (error: any) {
      console.log(error);
      setBankErr('Failed to update bank details');
    } finally {
      setSubmitting(false);
    }
  };

  const clearAlert = () => {
    setBankErr('');
    setBankSus('');
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

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return '#D1FAE5';
      case 'pending': return '#FEF3C7';
      case 'failed': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'credit': return 'arrow-down-left';
      case 'debit': return 'arrow-up-right';
      default: return 'arrow-right-left';
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'credit': return '#10B981';
      case 'debit': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const statusColor = getStatusColor(item.status);
    const statusBgColor = getStatusBgColor(item.status);
    const typeIcon = getTypeIcon(item.type);
    const typeColor = getTypeColor(item.type);

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionIcon}>
            <Feather name={typeIcon as any} size={20} color={typeColor} />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.transactionMeta}>
              <Text style={styles.orderId}>{item.orderId}</Text>
              <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
            </View>
          </View>
          <View style={styles.transactionAmountContainer}>
            <Text style={[styles.transactionAmount, { color: typeColor }]}>
              {formatCurrency(item.amount)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.transactionFooter}>
          <Text style={styles.referenceText}>Ref: {item.reference}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyTransactions = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="bank-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
      <Text style={styles.emptyStateMessage}>
        Your transaction history will appear here when you receive payments
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DB214C" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'bank' && styles.tabButtonActive]}
          onPress={() => setActiveTab('bank')}
        >
          <MaterialCommunityIcons 
            name="bank" 
            size={20} 
            color={activeTab === 'bank' ? '#FFFFFF' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'bank' && styles.tabTextActive]}>
            Bank Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'transactions' && styles.tabButtonActive]}
          onPress={() => setActiveTab('transactions')}
        >
          <MaterialCommunityIcons 
            name="cash-multiple" 
            size={20} 
            color={activeTab === 'transactions' ? '#FFFFFF' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
            Transactions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DB214C" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Alerts */}
        {bankerr ? (
          <View style={styles.alertError}>
            <View style={styles.alertContent}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.alertText}>{bankerr}</Text>
            </View>
            <TouchableOpacity onPress={clearAlert}>
              <Feather name="x" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ) : null}

        {banksus ? (
          <View style={styles.alertSuccess}>
            <View style={styles.alertContent}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.alertText}>{banksus}</Text>
            </View>
            <TouchableOpacity onPress={clearAlert}>
              <Feather name="x" size={20} color="#059669" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Bank Details Tab */}
        {activeTab === 'bank' && (
          <View style={styles.bankContainer}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="bank-outline" size={24} color="#1F2937" />
              <Text style={styles.sectionTitle}>Bank Account Details</Text>
            </View>

            <View style={styles.bankForm}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Bank Name *</Text>
                <TextInput
                  style={styles.input}
                  value={bankDetails.bank_name}
                  onChangeText={(value) => handleBankDetailChange('bank_name', value)}
                  placeholder={fetchedDetails?.bank_name || 'Enter bank name'}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Account Type *</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => {
                    Alert.alert(
                      'Select Account Type',
                      '',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Savings', 
                          onPress: () => handleBankDetailChange('account_type', 'Savings')
                        },
                        { 
                          text: 'Current', 
                          onPress: () => handleBankDetailChange('account_type', 'Current')
                        },
                      ]
                    );
                  }}
                >
                  <Text style={[styles.selectText, !bankDetails.account_type && styles.placeholderText]}>
                    {bankDetails.account_type || fetchedDetails?.account_type || 'Select Account Type'}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Account Name *</Text>
                <TextInput
                  style={styles.input}
                  value={bankDetails.account_name}
                  onChangeText={(value) => handleBankDetailChange('account_name', value)}
                  placeholder={fetchedDetails?.account_name || 'Enter account name'}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Account Number *</Text>
                <TextInput
                  style={styles.input}
                  value={bankDetails.account_no}
                  onChangeText={(value) => handleBankDetailChange('account_no', value)}
                  placeholder={fetchedDetails?.account_no || 'Enter account number'}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.saveButton, submitting && styles.buttonDisabled]}
                  onPress={handleBankDetailSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="save" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.updateButton, submitting && styles.buttonDisabled]}
                  onPress={handleBankDetailUpdate}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="update" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Update</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Current Bank Details */}
            {fetchedDetails && (
              <View style={styles.currentDetails}>
                <Text style={styles.currentDetailsTitle}>Current Bank Details</Text>
                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank Name:</Text>
                    <Text style={styles.detailValue}>{fetchedDetails.bank_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Type:</Text>
                    <Text style={styles.detailValue}>{fetchedDetails.account_type}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Name:</Text>
                    <Text style={styles.detailValue}>{fetchedDetails.account_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Number:</Text>
                    <Text style={styles.detailValue}>{fetchedDetails.account_no}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <MaterialIcons name="security" size={20} color="#3B82F6" />
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>Security Notice</Text>
                <Text style={styles.noticeText}>
                  Your bank details are encrypted and securely stored. 
                  Only authorized personnel can view this information.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <View style={styles.transactionsContainer}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#1F2937" />
              <Text style={styles.sectionTitle}>Transaction History</Text>
            </View>

            {/* Transaction Stats */}
            <View style={styles.transactionStats}>
              <View style={styles.statCard}>
                <View style={styles.statCardContent}>
                  <Text style={styles.statNumber}>{transactions.length}</Text>
                  <Text style={styles.statLabel}>Total Transactions</Text>
                </View>
                <MaterialCommunityIcons name="cash-multiple" size={24} color="#6B7280" />
              </View>

              <View style={styles.statCard}>
                <View style={styles.statCardContent}>
                  <Text style={[styles.statNumber, styles.completedStat]}>
                    {transactions.filter(t => t.status === 'completed').length}
                  </Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <MaterialIcons name="check-circle" size={24} color="#10B981" />
              </View>

              <View style={styles.statCard}>
                <View style={styles.statCardContent}>
                  <Text style={[styles.statNumber, styles.pendingStat]}>
                    {transactions.filter(t => t.status === 'pending').length}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <MaterialIcons name="access-time" size={24} color="#F59E0B" />
              </View>
            </View>

            {/* Transactions List */}
            {transactions.length === 0 ? (
              renderEmptyTransactions()
            ) : (
              <FlatList
                data={transactions}
                renderItem={renderTransactionItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.transactionsList}
              />
            )}

            {/* Payment Info */}
            <View style={styles.paymentInfo}>
              <MaterialIcons name="info-outline" size={20} color="#3B82F6" />
              <View style={styles.paymentInfoContent}>
                <Text style={styles.paymentInfoTitle}>Payment Information</Text>
                <Text style={styles.paymentInfoText}>
                  • Payments are processed within 24-48 hours after order completion
                  • Transaction status updates in real-time
                  • Contact support for any payment-related issues
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
  },
  tabButtonActive: {
    backgroundColor: '#DB214C',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  alertError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
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
    margin: 16,
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  bankContainer: {
    padding: 16,
  },
  transactionsContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  bankForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: '#1F2937',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  selectText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#DB214C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  currentDetails: {
    marginBottom: 20,
  },
  currentDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  transactionStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statCardContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  completedStat: {
    color: '#10B981',
  },
  pendingStat: {
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionsList: {
    gap: 12,
    marginBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  referenceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  paymentInfo: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  paymentInfoContent: {
    flex: 1,
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});

export default VendorTransactionScreen;