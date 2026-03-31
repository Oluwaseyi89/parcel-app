import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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

const CourierResolutionsScreen = () => {
  const [loading, setLoading] = React.useState(false);
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const resolutionCards: ResolutionCard[] = [
    {
      id: 1,
      title: 'Issue Resolution',
      description: 'Track and resolve delivery issues',
      icon: 'exclamation-triangle',
      iconColor: '#EF4444',
      bgColor: '#FEE2E2',
      status: 'active',
      count: 5
    },
    {
      id: 2,
      title: 'Customer Feedback',
      description: 'Review customer ratings and comments',
      icon: 'star',
      iconColor: '#F59E0B',
      bgColor: '#FEF3C7',
      status: 'pending',
      count: 12
    },
    {
      id: 3,
      title: 'Performance Metrics',
      description: 'View your delivery performance stats',
      icon: 'chart-line',
      iconColor: '#10B981',
      bgColor: '#D1FAE5',
      status: 'active'
    },
    {
      id: 4,
      title: 'Dispute Management',
      description: 'Handle delivery disputes and claims',
      icon: 'balance-scale',
      iconColor: '#8B5CF6',
      bgColor: '#EDE9FE',
      status: 'pending',
      count: 3
    },
    {
      id: 5,
      title: 'Delivery Analytics',
      description: 'Detailed insights into your deliveries',
      icon: 'chart-pie',
      iconColor: '#3B82F6',
      bgColor: '#DBEAFE',
      status: 'active'
    },
    {
      id: 6,
      title: 'Quality Score',
      description: 'Track your service quality metrics',
      icon: 'award',
      iconColor: '#EC4899',
      bgColor: '#FCE7F3',
      status: 'resolved'
    }
  ];

  const statsData = [
    { label: 'Issues Resolved', value: '124', change: '+12%', trend: 'up' },
    { label: 'Avg. Resolution Time', value: '2.4h', change: '-0.8h', trend: 'up' },
    { label: 'Customer Satisfaction', value: '4.8/5', change: '+0.3', trend: 'up' },
    { label: 'Pending Resolutions', value: '8', change: '-3', trend: 'down' }
  ];

  const handleViewDetails = () => {
    // Navigation logic would go here
    console.log('View details pressed');
  };

  const renderStatsCard = (stat: typeof statsData[0], index: number) => (
    <View key={index} style={styles.statCard}>
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
    </View>
  );

  const renderResolutionCard = (card: ResolutionCard) => (
    <TouchableOpacity 
      key={card.id} 
      style={[
        styles.resolutionCard,
        { backgroundColor: card.bgColor }
      ]}
      activeOpacity={0.8}
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
        {card.count !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{card.count}</Text>
          </View>
        )}
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
        <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Courier Resolutions</Text>
            <Text style={styles.headerSubtitle}>
              Manage delivery issues and performance metrics
            </Text>
          </View>
        </View>

        {/* Coming Soon Banner */}
        <View style={styles.comingSoonBanner}>
          <View style={styles.comingSoonContent}>
            <View style={styles.spinnerContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#EF4444" />
              ) : (
                <MaterialIcons name="construction" size={40} color="#EF4444" />
              )}
            </View>
            <Text style={styles.comingSoonTitle}>Feature Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              This section is currently under development. Check back soon for updates!
            </Text>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.statsGrid}>
            {statsData.map((stat, index) => renderStatsCard(stat, index))}
          </View>
        </View>

        {/* Resolution Categories */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resolution Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            {resolutionCards.map(renderResolutionCard)}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={handleViewDetails}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>View Detailed Report</Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          </TouchableOpacity>
          
          <Text style={styles.lastUpdated}>
            Last updated: {currentDate}
          </Text>
        </View>

        {/* Help Tip */}
        <View style={styles.tipContainer}>
          <MaterialIcons name="info" size={24} color="#1E40AF" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Need Help?</Text>
            <Text style={styles.tipMessage}>
              If you're experiencing delivery issues or need assistance with resolutions, 
              contact our support team through the Help Center.
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
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  comingSoonBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
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
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: width > 400 ? '48%' : '100%',
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
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resolutionCard: {
    width: width > 400 ? '48%' : '100%',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  viewDetailsButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
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

export default CourierResolutionsScreen;