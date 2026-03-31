import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';

type BankDetails = {
  bank_name: string;
  account_type: string;
  account_name: string;
  account_no: string;
};

type Transaction = {
  id: string;
  date: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  reference: string;
  type: 'credit' | 'debit';
};

type ApiResponse = {
  status: 'success' | 'error';
  data: any;
};

const CourierTransactionsScreen = () => {
  const [activeTab, setActiveTab] = useState<'bank' | 'transactions'>('bank');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: '',
    account_type: '',
    account_name: '',
    account_no: ''
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [courierData, setCourierData] = useState<any>(null);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Mock API URL - replace with your actual API
  const API_URL = 'http://localhost:7000/parcel_backends';

  useEffect(() => {
    loadCourierData();
    if (activeTab === 'bank') {
      fetchBankDetails();
    } else {
      fetchTransactions();
    }
  }, [activeTab]);

  const loadCourierData = async () => {
    try {
      const data = await AsyncStorage.getItem('logcour');
      if (data) {
        setCourierData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading courier data:', error);
    }
  };

  const fetchBankDetails = async () => {
    if (!courierData?.email) return;
    
    setBankLoading(true);
    try {
      // Mock API call - replace with actual API
      // const response = await fetch(`${API_URL}/get_cour_bank/${courierData.email}`);
      // const data = await response.json();
      
      // For demo purposes, using mock data
      setTimeout(() => {
        setBankDetails({
          bank_name: 'Demo Bank',
          account_type: 'Savings',
          account_name: 'John Doe',
          account_no: '1234567890'
        });
        setBankLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching bank details:', error);
      showMessage('Failed to fetch bank details', 'error');
      setBankLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      // const response = await fetch(`${API_URL}/get_transactions/${courierData.email}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          date: '2024-01-15',
          amount: 1500,
          status: 'completed',
          description: 'Delivery payment #DEL-001',
          reference: 'REF-001',
          type: 'credit'
        },
        {
          id: '2',
          date: '2024-01-14',
          amount: 1200,
          status: 'completed',
          description: 'Delivery payment #DEL-002',
          reference: 'REF-002',
          type: 'credit'
        },
        {
          id: '3',
          date: '2024-01-13',
          amount: 800,
          status: 'pending',
          description: 'Delivery payment #DEL-003',
          reference: 'REF-003',
          type: 'credit'
        },
        {
          id: '4',
          date: '2024-01-12',
          amount: 50,
          status: 'failed',
          description: 'Service fee',
          reference: 'REF-004',
          type: 'debit'
        },
        {
          id: '5',
          date: '2024-01-10',
          amount: 1800,
          status: 'completed',
          description: 'Delivery payment #DEL-004',
          reference: 'REF-005',
          type: 'credit'
        },
      ];
      
      setTransactions(mockTransactions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showMessage('Failed to fetch transactions', 'error');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'bank') {
      await fetchBankDetails();
    } else {
      await fetchTransactions();
    }
    setRefreshing(false);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setShowMessageModal(true);
    setTimeout(() => {
      setShowMessageModal(false);
      setMessage(null);
    }, 3000);
  };

  const handleBankDetailChange = (field: keyof BankDetails, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateBankDetails = (): boolean => {
    if (!bankDetails.bank_name.trim()) {
      showMessage('Bank name is required', 'error');
      return false;
    }
    if (!bankDetails.account_type) {
      showMessage('Account type is required', 'error');
      return false;
    }
    if (!bankDetails.account_name.trim()) {
      showMessage('Account name is required', 'error');
      return false;
    }
    if (!bankDetails.account_no.trim()) {
      showMessage('Account number is required', 'error');
      return false;
    }
    if (!/^\d+$/.test(bankDetails.account_no)) {
      showMessage('Account number must contain only numbers', 'error');
      return false;
    }
    return true;
  };

  const handleBankDetailSubmit = async () => {
    if (!courierData?.email) {
      showMessage('No courier data found. Please log in again.', 'error');
      return;
    }

    if (!validateBankDetails()) return;

    setBankLoading(true);
    try {
      // Mock API call - replace with actual API
      // const response = await fetch(`${API_URL}/save_cour_bank/`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     ...bankDetails,
      //     courier_email: courierData.email,
      //     added_at: new Date().toISOString(),
      //     updated_at: new Date().toISOString()
      //   })
      // });
      // const data = await response.json();

      // Mock response
      setTimeout(() => {
        showMessage('Bank details saved successfully!', 'success');
        setBankLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving bank details:', error);
      showMessage('Failed to save bank details. Please try again.', 'error');
      setBankLoading(false);
    }
  };

  const handleBankDetailUpdate = async () => {
    if (!courierData?.email) {
      showMessage('No courier data found. Please log in again.', 'error');
      return;
    }

    if (!validateBankDetails()) return;

    setBankLoading(true);
    try {
      // Mock API call - replace with actual API
      // const response = await fetch(`${API_URL}/update_cour_bank/${courierData.email}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     ...bankDetails,
      //     updated_at: new Date().toISOString()
      //   })
      // });
      // const data = await response.json();

      // Mock response
      setTimeout(() => {
        showMessage('Bank details updated successfully!', 'success');
        setBankLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error updating bank details:', error);
      showMessage('Failed to update bank details. Please try again.', 'error');
      setBankLoading(false);
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={[
          styles.typeIcon,
          { backgroundColor: item.type === 'credit' ? '#D1FAE5' : '#FEE2E2' }
        ]}>
          <Feather 
            name={item.type === 'credit' ? 'arrow-down-left' : 'arrow-up-right'} 
            size={16} 
            color={item.type === 'credit' ? '#10B981' : '#EF4444'} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[
            styles.transactionAmount,
            { color: item.type === 'credit' ? '#10B981' : '#EF4444' }
          ]}>
            {item.type === 'credit' ? '+' : '-'}₹{item.amount.toLocaleString()}
          </Text>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: item.status === 'completed' ? '#D1FAE5' : 
                              item.status === 'pending' ? '#FEF3C7' : 
                              '#FEE2E2' 
            }
          ]}>
            <Text style={[
              styles.statusText,
              { 
                color: item.status === 'completed' ? '#10B981' : 
                       item.status === 'pending' ? '#F59E0B' : 
                       '#EF4444' 
              }
            ]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.transactionFooter}>
        <Text style={styles.referenceText}>Ref: {item.reference}</Text>
        <TouchableOpacity>
          <Text style={styles.detailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyTransactions = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name="account-balance-wallet" size={64} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>No transactions yet</Text>
      <Text style={styles.emptyMessage}>
        Your transaction history will appear here once you start earning
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.messageModal,
            { backgroundColor: message?.type === 'success' ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            <MaterialIcons 
              name={message?.type === 'success' ? 'check-circle' : 'error'} 
              size={24} 
              color={message?.type === 'success' ? '#10B981' : '#EF4444'} 
            />
            <Text style={[
              styles.messageText,
              { color: message?.type === 'success' ? '#10B981' : '#EF4444' }
            ]}>
              {message?.text}
            </Text>
          </View>
        </View>
      </Modal>

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transactions & Banking</Text>
          <Text style={styles.headerSubtitle}>
            Manage your bank details and view transaction history
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'bank' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('bank')}
            activeOpacity={0.8}
          >
            <MaterialIcons 
              name="account-balance" 
              size={20} 
              color={activeTab === 'bank' ? '#FFFFFF' : '#EF4444'} 
            />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'bank' && styles.activeTabButtonText
            ]}>
              Bank Details
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'transactions' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('transactions')}
            activeOpacity={0.8}
          >
            <MaterialIcons 
              name="receipt" 
              size={20} 
              color={activeTab === 'transactions' ? '#FFFFFF' : '#EF4444'} 
            />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'transactions' && styles.activeTabButtonText
            ]}>
              Transactions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bank Details Form */}
        {activeTab === 'bank' && (
          <View style={styles.formContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bank Account Details</Text>
              <Text style={styles.sectionSubtitle}>
                Add or update your bank account for payments
              </Text>
            </View>

            {bankLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={styles.loadingText}>Loading bank details...</Text>
              </View>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    value={bankDetails.bank_name}
                    onChangeText={(text) => handleBankDetailChange('bank_name', text)}
                    placeholder="Enter bank name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Type</Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        bankDetails.account_type === 'Savings' && styles.radioButtonActive
                      ]}
                      onPress={() => handleBankDetailChange('account_type', 'Savings')}
                    >
                      <View style={[
                        styles.radioCircle,
                        bankDetails.account_type === 'Savings' && styles.radioCircleActive
                      ]}>
                        {bankDetails.account_type === 'Savings' && (
                          <View style={styles.radioInnerCircle} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>Savings Account</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        bankDetails.account_type === 'Current' && styles.radioButtonActive
                      ]}
                      onPress={() => handleBankDetailChange('account_type', 'Current')}
                    >
                      <View style={[
                        styles.radioCircle,
                        bankDetails.account_type === 'Current' && styles.radioCircleActive
                      ]}>
                        {bankDetails.account_type === 'Current' && (
                          <View style={styles.radioInnerCircle} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>Current Account</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Holder Name</Text>
                  <TextInput
                    style={styles.input}
                    value={bankDetails.account_name}
                    onChangeText={(text) => handleBankDetailChange('account_name', text)}
                    placeholder="Enter account holder name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Number</Text>
                  <TextInput
                    style={styles.input}
                    value={bankDetails.account_no}
                    onChangeText={(text) => handleBankDetailChange('account_no', text)}
                    placeholder="Enter account number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={20}
                  />
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleBankDetailSubmit}
                    disabled={bankLoading}
                  >
                    {bankLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="save" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Save Details</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.updateButton]}
                    onPress={handleBankDetailUpdate}
                    disabled={bankLoading}
                  >
                    {bankLoading ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <>
                        <MaterialIcons name="update" size={20} color="#EF4444" />
                        <Text style={[styles.actionButtonText, styles.updateButtonText]}>
                          Update Details
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* Transactions List */}
        {activeTab === 'transactions' && (
          <View style={styles.transactionsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>₹4,850</Text>
                  <Text style={styles.statLabel}>Total Earned</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>4</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>1</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={styles.loadingText}>Loading transactions...</Text>
              </View>
            ) : transactions.length === 0 ? (
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

            {/* Export Button */}
            {transactions.length > 0 && (
              <TouchableOpacity style={styles.exportButton}>
                <Feather name="download" size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>Export Statement</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <MaterialIcons name="info" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Payment Information</Text>
            <Text style={styles.infoText}>
              • Payments are processed every Friday{'\n'}
              • Minimum withdrawal amount: ₹500{'\n'}
              • Bank details must be verified before first payment{'\n'}
              • Contact support for any payment-related queries
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
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
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#EF4444',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  messageModal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 32,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  radioButtonActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#EF4444',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#EF4444',
  },
  updateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  updateButtonText: {
    color: '#EF4444',
  },
  transactionsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionsList: {
    paddingHorizontal: 16,
    gap: 12,
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
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: '#111827',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  referenceText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  detailsText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});

export default CourierTransactionsScreen;