import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Feather, Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ResolutionCard = {
  id: number;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  status: 'active' | 'pending' | 'resolved';
  count?: number;
};

const CustomerResolutionScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const resolutionCards: ResolutionCard[] = [
    {
      id: 1,
      title: 'Delivery Issues',
      description: 'Track and resolve delivery-related problems',
      icon: 'exclamation-triangle',
      iconColor: '#EF4444',
      bgColor: '#FEE2E2',
      status: 'active',
      count: 3,
    },
    {
      id: 2,
      title: 'Order Disputes',
      description: 'Handle order discrepancies and complaints',
      icon: 'balance-scale',
      iconColor: '#8B5CF6',
      bgColor: '#EDE9FE',
      status: 'pending',
      count: 2,
    },
    {
      id: 3,
      title: 'Refund Requests',
      description: 'Manage product return and refund cases',
      icon: 'undo-alt',
      iconColor: '#3B82F6',
      bgColor: '#DBEAFE',
      status: 'active',
      count: 1,
    },
    {
      id: 4,
      title: 'Customer Feedback',
      description: 'Review ratings and comments on your orders',
      icon: 'star',
      iconColor: '#F59E0B',
      bgColor: '#FEF3C7',
      status: 'active',
      count: 15,
    },
    {
      id: 5,
      title: 'Product Issues',
      description: 'Report and track product quality problems',
      icon: 'box-open',
      iconColor: '#10B981',
      bgColor: '#D1FAE5',
      status: 'resolved',
    },
    {
      id: 6,
      title: 'Service Complaints',
      description: 'Address service quality concerns',
      icon: 'headset',
      iconColor: '#EC4899',
      bgColor: '#FCE7F3',
      status: 'pending',
      count: 4,
    },
  ];

  const statsData = [
    { label: 'Issues Raised', value: '24', change: '+3', trend: 'up' },
    { label: 'Resolved Cases', value: '18', change: '+5', trend: 'up' },
    { label: 'Avg. Resolution', value: '3.2d', change: '-0.5d', trend: 'up' },
    { label: 'Pending Cases', value: '6', change: '-2', trend: 'down' },
  ];

  const upcomingFeatures = [
    'Real-time issue tracking',
    'Automated resolution suggestions',
    'Direct chat with support',
    'Case history archive',
    'Escalation management',
  ];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleViewDetails = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // In a real app, this would navigate to detailed view
      console.log('Viewing detailed resolution report');
    }, 1500);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleCardPress = (cardId: number) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const renderStatsCard = (stat: typeof statsData[0], index: number) => (
    <Animated.View 
      key={index} 
      style={[
        styles.statCard,
        { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0]
        })}] }
      ]}
    >
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
      <View style={styles.statChangeContainer}>
        <Feather 
          name={stat.trend === 'up' ? 'trending-up' : 'trending-down'} 
          size={14} 
          color={stat.trend === 'up' ? '#10B981' : '#EF4444'} 
        />
        <Text style={[
          styles.statChange,
          { color: stat.trend === 'up' ? '#10B981' : '#EF4444' }
        ]}>
          {stat.change}
        </Text>
      </View>
    </Animated.View>
  );

  const renderResolutionCard = (card: ResolutionCard) => {
    const isExpanded = expandedCard === card.id;
    
    return (
      <TouchableOpacity 
        key={card.id}
        style={[
          styles.resolutionCard,
          { backgroundColor: card.bgColor },
          isExpanded && styles.expandedCard,
        ]}
        activeOpacity={0.8}
        onPress={() => handleCardPress(card.id)}
      >
        <View style={styles.cardHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: `${card.iconColor}20` }
          ]}>
            <FontAwesome5 
              name={card.icon as any} 
              size={20} 
              color={card.iconColor} 
            />
          </View>
          <View style={styles.headerRight}>
            {card.count !== undefined && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{card.count}</Text>
              </View>
            )}
            <MaterialIcons 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#6B7280" 
            />
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardDescription}>{card.description}</Text>
        </View>
        
        <View style={styles.cardFooter}>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: card.status === 'active' ? '#10B981' : 
                             card.status === 'pending' ? '#F59E0B' : 
                             '#6B7280' 
            }
          ]}>
            <Text style={styles.statusText}>
              {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
            </Text>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View</Text>
            <Feather name="arrow-right" size={14} color={card.iconColor} />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <Animated.View style={styles.expandedContent}>
            <View style={styles.expandedRow}>
              <Feather name="info" size={16} color="#6B7280" />
              <Text style={styles.expandedText}>
                Active cases are being reviewed by our support team
              </Text>
            </View>
            {card.count && card.count > 0 && (
              <View style={styles.expandedRow}>
                <Feather name="clock" size={16} color="#6B7280" />
                <Text style={styles.expandedText}>
                  Expected resolution: 2-3 business days
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.contactSupportButton}>
              <Feather name="message-square" size={16} color="#FFFFFF" />
              <Text style={styles.contactSupportText}>Contact Support</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFeatureItem = (feature: string, index: number) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name="rocket-outline" size={16} color="#10B981" />
      </View>
      <Text style={styles.featureText}>{feature}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#DB214C']}
            tintColor="#DB214C"
          />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Resolution Center</Text>
            <Text style={styles.headerSubtitle}>
              Manage and track your order-related issues and complaints
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Beta</Text>
          </View>
        </View>

        {/* Coming Soon Banner */}
        <Animated.View 
          style={[
            styles.comingSoonBanner,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.comingSoonContent}>
            <View style={styles.spinnerContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#DB214C" />
              ) : (
                <MaterialIcons name="construction" size={48} color="#DB214C" />
              )}
            </View>
            <Text style={styles.comingSoonTitle}>Feature Under Development</Text>
            <Text style={styles.comingSoonText}>
              This section is currently being enhanced. We're adding more features to help you resolve issues faster.
            </Text>
          </View>
        </Animated.View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Resolution Stats</Text>
          <View style={styles.statsGrid}>
            {statsData.map((stat, index) => renderStatsCard(stat, index))}
          </View>
        </View>

        {/* Resolution Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Issue Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            {resolutionCards.map(renderResolutionCard)}
          </View>
        </View>

        {/* Upcoming Features */}
        <View style={styles.upcomingSection}>
          <View style={styles.upcomingHeader}>
            <MaterialIcons name="upgrade" size={24} color="#DB214C" />
            <Text style={styles.upcomingTitle}>Coming Soon Features</Text>
          </View>
          <View style={styles.upcomingList}>
            {upcomingFeatures.map(renderFeatureItem)}
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={handleViewDetails}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>View Detailed Report</Text>
                <Feather name="arrow-right" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.lastUpdated}>
            Last updated: {currentDate}
          </Text>
        </View>

        {/* Help Tip */}
        <View style={styles.tipContainer}>
          <View style={styles.tipIcon}>
            <Feather name="help-circle" size={24} color="#1E40AF" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Need Immediate Help?</Text>
            <Text style={styles.tipMessage}>
              For urgent issues, contact our 24/7 customer support:
              {'\n'}• Call: 1-800-RESOLVE
              {'\n'}• Email: support@shop.com
              {'\n'}• Live Chat: Available in app
            </Text>
          </View>
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            We're committed to resolving your issues within 48 hours.
            Your satisfaction is our priority.
          </Text>
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
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  headerBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  comingSoonBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  comingSoonContent: {
    alignItems: 'center',
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DB214C',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: SCREEN_WIDTH > 400 ? '48%' : '100%',
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
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resolutionCard: {
    width: SCREEN_WIDTH > 400 ? '48%' : '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  expandedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  expandedText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  contactSupportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DB214C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  contactSupportText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  upcomingSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  upcomingList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
  actionSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  viewDetailsButton: {
    backgroundColor: '#DB214C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#DB214C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tipIcon: {
    marginRight: 12,
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
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default CustomerResolutionScreen;