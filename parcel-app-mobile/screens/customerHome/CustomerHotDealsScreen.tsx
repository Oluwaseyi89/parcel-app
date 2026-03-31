import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface DealItem {
  id: string;
  name: string;
  category: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  stockPercentage: number;
  imageColor: string; // For demo purposes
}

interface Category {
  id: string;
  name: string;
  discount: string;
  icon: React.ReactNode;
}

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const CustomerHotDealsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timer, setTimer] = useState({ hours: 12, minutes: 45, seconds: 30 });
  const [wishlistedItems, setWishlistedItems] = useState<Set<string>>(new Set());
  const scrollY = useRef(new Animated.Value(0)).current;

  // Sample data
  const hotDeals: DealItem[] = Array.from({ length: 8 }, (_, index) => ({
    id: `deal-${index + 1}`,
    name: `Premium Wireless Headphones ${index + 1}`,
    category: ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports', 'Electronics', 'Fashion', 'Home & Kitchen'][index],
    originalPrice: 149.99 - index * 5,
    discountedPrice: 89.99 - index * 5,
    discountPercentage: (index + 1) * 10,
    rating: 5 - (index % 2),
    reviewCount: 128 + index * 10,
    soldCount: index * 23,
    stockPercentage: 100 - index * 12,
    imageColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  }));

  const categories: Category[] = [
    { id: 'electronics', name: 'Electronics', discount: 'Up to 70% off', icon: <FontAwesome5 name="bolt" size={24} color="#FFFFFF" /> },
    { id: 'fashion', name: 'Fashion', discount: 'Up to 65% off', icon: <FontAwesome5 name="tshirt" size={24} color="#FFFFFF" /> },
    { id: 'home', name: 'Home & Kitchen', discount: 'Up to 60% off', icon: <MaterialIcons name="kitchen" size={24} color="#FFFFFF" /> },
    { id: 'beauty', name: 'Beauty', discount: 'Up to 55% off', icon: <MaterialIcons name="spa" size={24} color="#FFFFFF" /> },
    { id: 'sports', name: 'Sports', discount: 'Up to 50% off', icon: <MaterialIcons name="sports-baseball" size={24} color="#FFFFFF" /> },
    { id: 'gaming', name: 'Gaming', discount: 'Up to 45% off', icon: <FontAwesome5 name="gamepad" size={24} color="#FFFFFF" /> },
    { id: 'books', name: 'Books', discount: 'Up to 40% off', icon: <MaterialIcons name="menu-book" size={24} color="#FFFFFF" /> },
    { id: 'toys', name: 'Toys', discount: 'Up to 35% off', icon: <MaterialIcons name="toys" size={24} color="#FFFFFF" /> },
  ];

  const benefits: Benefit[] = [
    {
      id: 'price',
      title: 'Best Prices',
      description: 'Guaranteed lowest prices on all hot deals',
      icon: <MaterialIcons name="attach-money" size={32} color="#FFFFFF" />,
    },
    {
      id: 'delivery',
      title: 'Fast Delivery',
      description: 'Same-day or next-day delivery available',
      icon: <FontAwesome5 name="shipping-fast" size={32} color="#FFFFFF" />,
    },
    {
      id: 'quality',
      title: 'Quality Guarantee',
      description: '30-day return policy on all products',
      icon: <MaterialIcons name="verified" size={32} color="#FFFFFF" />,
    },
  ];

  const categoryButtons = ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports'];

  // Timer countdown (simplified)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Alert.alert('Search', `Searching for: ${searchQuery}`);
    }
  };

  const handleAddToCart = (item: DealItem) => {
    Alert.alert('Added to Cart', `${item.name} added to your cart!`);
  };

  const handleBuyNow = (item: DealItem) => {
    Alert.alert('Buy Now', `Proceeding to checkout for ${item.name}`);
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    Alert.alert('Category Selected', `Showing ${category} deals`);
  };

  const handleNewsletterSubscribe = () => {
    Alert.alert('Subscribed!', 'You will now receive hot deal notifications');
  };

  const toggleWishlist = (itemId: string) => {
    setWishlistedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderDealItem = ({ item }: { item: DealItem }) => {
    const isWishlisted = wishlistedItems.has(item.id);
    
    return (
      <View style={styles.dealCard}>
        <View style={styles.dealImageContainer}>
          <View style={[styles.dealImage, { backgroundColor: item.imageColor }]}>
            <Text style={styles.dealImageText}>Product Image</Text>
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{item.discountPercentage}%</Text>
          </View>
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={() => toggleWishlist(item.id)}
          >
            <Ionicons 
              name={isWishlisted ? "heart" : "heart-outline"} 
              size={20} 
              color={isWishlisted ? "#DB214C" : "#666"} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.dealContent}>
          <Text style={styles.dealTitle} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < item.rating ? "star" : "star-outline"}
                  size={16}
                  color={i < item.rating ? '#FFD700' : '#E5E7EB'}
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>({item.reviewCount})</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.discountedPrice}>
              ${item.discountedPrice.toFixed(2)}
            </Text>
            <Text style={styles.originalPrice}>
              ${item.originalPrice.toFixed(2)}
            </Text>
          </View>

          <View style={styles.stockInfo}>
            <View style={styles.stockTextRow}>
              <Text style={styles.stockText}>Sold: {item.soldCount}</Text>
              <Text style={styles.stockText}>Limited stock</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${item.stockPercentage}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={() => handleAddToCart(item)}
            >
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.buyNowButton}
              onPress={() => handleBuyNow(item)}
            >
              <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item.id)}
    >
      <View style={styles.categoryIconContainer}>
        {item.icon}
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryDiscount}>{item.discount}</Text>
      <View style={styles.categoryArrow}>
        <Feather name="chevron-right" size={16} color="#DB214C" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search hot deals..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Feather name="search" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>🔥 HOT DEALS OF THE DAY!</Text>
            <Text style={styles.heroSubtitle}>
              Limited time offers with massive discounts. Don't miss out on these amazing deals!
            </Text>
            <TouchableOpacity style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Shop Now →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timerCard}>
            <View style={styles.timerBadge}>
              <FontAwesome5 name="clock" size={14} color="#DB214C" />
              <Text style={styles.timerBadgeText}>LIMITED TIME</Text>
            </View>
            <Text style={styles.timerTitle}>Flash Sale Ends In:</Text>
            <View style={styles.timerDisplay}>
              <View style={styles.timeUnit}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeValue}>{timer.hours.toString().padStart(2, '0')}</Text>
                </View>
                <Text style={styles.timeLabel}>Hours</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeUnit}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeValue}>{timer.minutes.toString().padStart(2, '0')}</Text>
                </View>
                <Text style={styles.timeLabel}>Mins</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeUnit}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeValue}>{timer.seconds.toString().padStart(2, '0')}</Text>
                </View>
                <Text style={styles.timeLabel}>Secs</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Today's Best Deals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Best Deals</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryButtonsContainer}
            >
              {categoryButtons.map((category, index) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.toLowerCase() && styles.categoryButtonActive
                  ]}
                  onPress={() => handleCategoryPress(category.toLowerCase())}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category.toLowerCase() && styles.categoryButtonTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={hotDeals}
            renderItem={renderDealItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dealsList}
            contentContainerStyle={styles.dealsListContent}
          />
        </View>

        {/* Hot Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hot Categories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.categoryGrid}
            scrollEnabled={false}
          />
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why Shop Hot Deals?</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map(benefit => (
              <View key={benefit.id} style={styles.benefitCard}>
                <View style={styles.benefitIconContainer}>
                  {benefit.icon}
                </View>
                <Text style={styles.benefitCardTitle}>{benefit.title}</Text>
                <Text style={styles.benefitCardDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Newsletter Section */}
        <View style={styles.newsletterSection}>
          <Text style={styles.newsletterTitle}>Get Notified About Hot Deals!</Text>
          <Text style={styles.newsletterSubtitle}>
            Subscribe to our newsletter and be the first to know about exclusive deals, flash sales, and special offers.
          </Text>

          <View style={styles.newsletterForm}>
            <TextInput
              style={styles.newsletterInput}
              placeholder="Enter your email"
              placeholderTextColor="rgba(255,255,255,0.7)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.newsletterButton}
              onPress={handleNewsletterSubscribe}
            >
              <Text style={styles.newsletterButtonText}>Subscribe Now</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.newsletterFootnote}>No spam. Unsubscribe anytime.</Text>
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
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#DB214C',
    borderRadius: 25,
    overflow: 'hidden',
    height: 48,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
    height: '100%',
    paddingVertical: 0,
  },
  searchButton: {
    width: 48,
    height: '100%',
    backgroundColor: '#DB214C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#DB214C',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  heroContent: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 20,
    lineHeight: 20,
  },
  heroButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: '#DB214C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  timerBadgeText: {
    color: '#DB214C',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  timerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 50,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  timeValue: {
    color: '#DB214C',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  timeSeparator: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoryButtonsContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#DB214C',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#DB214C',
  },
  categoryButtonText: {
    color: '#DB214C',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dealsList: {
    marginHorizontal: -16,
  },
  dealsListContent: {
    paddingHorizontal: 16,
  },
  dealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    width: SCREEN_WIDTH * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  dealImageContainer: {
    position: 'relative',
    height: 180,
  },
  dealImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealImageText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealContent: {
    padding: 16,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DB214C',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  stockInfo: {
    marginBottom: 16,
  },
  stockTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stockText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#DB214C',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DB214C',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {
    color: '#DB214C',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryGrid: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: (SCREEN_WIDTH - 48) / 2,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DB214C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDiscount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  categoryArrow: {
    marginTop: 4,
  },
  benefitsSection: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsGrid: {
    gap: 24,
  },
  benefitCard: {
    alignItems: 'center',
  },
  benefitIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DB214C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  newsletterSection: {
    backgroundColor: '#DB214C',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  newsletterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  newsletterSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  newsletterForm: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  newsletterInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    marginRight: 12,
    color: '#333',
    height: 50,
  },
  newsletterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
  },
  newsletterButtonText: {
    color: '#DB214C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newsletterFootnote: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.75,
  },
});

export default CustomerHotDealsScreen;