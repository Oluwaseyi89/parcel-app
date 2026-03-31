import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  discount: number;
  description: string;
  inStock: boolean;
  deliveryTime: string;
  weight: string;
};

type Category = {
  id: string;
  name: string;
  icon: string;
};

type SortOption = {
  id: string;
  name: string;
};

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerCatalogueScreen'>;


const CustomerCatalogueScreen: React.FC<Props> = ({ navigation, route }) => {
  // const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const scrollY = useRef(new Animated.Value(0)).current;

  const categories: Category[] = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'electronics', name: 'Electronics', icon: 'devices' },
    { id: 'fashion', name: 'Fashion', icon: 'shopping-bag' },
    { id: 'home', name: 'Home', icon: 'home' },
    { id: 'beauty', name: 'Beauty', icon: 'spa' },
    { id: 'sports', name: 'Sports', icon: 'fitness-center' },
    { id: 'books', name: 'Books', icon: 'menu-book' },
    { id: 'toys', name: 'Toys', icon: 'toys' },
    { id: 'grocery', name: 'Grocery', icon: 'local-grocery-store' },
    { id: 'automotive', name: 'Auto', icon: 'directions-car' },
  ];

  const sortOptions: SortOption[] = [
    { id: 'featured', name: 'Featured' },
    { id: 'price-low', name: 'Price: Low to High' },
    { id: 'price-high', name: 'Price: High to Low' },
    { id: 'rating', name: 'Top Rated' },
    { id: 'newest', name: 'Newest' },
    { id: 'discount', name: 'Best Deals' },
    { id: 'popular', name: 'Most Popular' },
  ];

  // Mock product data - Replace with API call
  const products: Product[] = [
    {
      id: 1,
      name: 'Wireless Bluetooth Headphones',
      category: 'electronics',
      price: 2999,
      originalPrice: 4999,
      rating: 4.5,
      reviews: 128,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      discount: 40,
      description: 'Premium noise-cancelling headphones with 30-hour battery life',
      inStock: true,
      deliveryTime: '2-3 days',
      weight: '0.5kg'
    },
    {
      id: 2,
      name: 'Smart Watch Series 5',
      category: 'electronics',
      price: 8999,
      originalPrice: 12999,
      rating: 4.7,
      reviews: 89,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      discount: 31,
      description: 'Advanced health monitoring with GPS and cellular',
      inStock: true,
      deliveryTime: '1-2 days',
      weight: '0.3kg'
    },
    {
      id: 3,
      name: 'Organic Cotton T-Shirt',
      category: 'fashion',
      price: 799,
      originalPrice: 1299,
      rating: 4.3,
      reviews: 56,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
      discount: 38,
      description: '100% organic cotton, comfortable and sustainable',
      inStock: true,
      deliveryTime: '3-5 days',
      weight: '0.2kg'
    },
    {
      id: 4,
      name: 'Stainless Steel Cookware Set',
      category: 'home',
      price: 4299,
      originalPrice: 6999,
      rating: 4.8,
      reviews: 203,
      imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
      discount: 39,
      description: '10-piece set with non-stick coating and glass lids',
      inStock: true,
      deliveryTime: '4-6 days',
      weight: '8.5kg'
    },
    {
      id: 5,
      name: 'Professional Camera DSLR',
      category: 'electronics',
      price: 42999,
      originalPrice: 59999,
      rating: 4.9,
      reviews: 45,
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
      discount: 28,
      description: '24MP full-frame sensor with 4K video recording',
      inStock: true,
      deliveryTime: '1-3 days',
      weight: '1.2kg'
    },
    {
      id: 6,
      name: 'Yoga Mat Premium',
      category: 'sports',
      price: 1499,
      originalPrice: 2499,
      rating: 4.4,
      reviews: 167,
      imageUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0',
      discount: 40,
      description: 'Eco-friendly TPE material with alignment lines',
      inStock: true,
      deliveryTime: '2-4 days',
      weight: '2.5kg'
    },
    {
      id: 7,
      name: 'Designer Leather Handbag',
      category: 'fashion',
      price: 5999,
      originalPrice: 9999,
      rating: 4.6,
      reviews: 78,
      imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
      discount: 40,
      description: 'Genuine leather with multiple compartments',
      inStock: true,
      deliveryTime: '3-6 days',
      weight: '0.8kg'
    },
    {
      id: 8,
      name: 'Air Purifier HEPA Filter',
      category: 'home',
      price: 5999,
      originalPrice: 8499,
      rating: 4.7,
      reviews: 112,
      imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12',
      discount: 29,
      description: 'Covers up to 500 sq ft with smart sensors',
      inStock: true,
      deliveryTime: '2-3 days',
      weight: '5.2kg'
    },
    {
      id: 9,
      name: 'Fitness Tracker Watch',
      category: 'sports',
      price: 1999,
      originalPrice: 2999,
      rating: 4.2,
      reviews: 234,
      imageUrl: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288',
      discount: 33,
      description: '24/7 heart rate monitoring with sleep tracking',
      inStock: true,
      deliveryTime: '1-2 days',
      weight: '0.1kg'
    },
    {
      id: 10,
      name: 'Gaming Laptop RTX 4060',
      category: 'electronics',
      price: 89999,
      originalPrice: 119999,
      rating: 4.8,
      reviews: 67,
      imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302',
      discount: 25,
      description: '16GB RAM, 1TB SSD, 144Hz display',
      inStock: true,
      deliveryTime: '3-4 days',
      weight: '2.3kg'
    },
  ];

  const filteredProducts = products.filter(product => 
    (selectedCategory === 'all' || product.category === selectedCategory) &&
    (searchQuery === '' || 
     product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'discount': return b.discount - a.discount;
      case 'newest': return b.id - a.id;
      default: return a.id - b.id;
    }
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setPage(prev => prev + 1);
        setLoading(false);
        if (page >= 3) setHasMore(false);
      }, 1000);
    }
  };

  const handleAddToCart = (product: Product) => {
    // Add to cart logic here
    console.log('Added to cart:', product.name);
  };

  const handleViewDetails = (product: Product) => {
    navigation.navigate('ProductDetails', { product });
  };

  const renderProductGrid = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCardGrid}
      onPress={() => handleViewDetails(item)}
      activeOpacity={0.9}
    >
      {/* Discount Badge */}
      {item.discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{item.discount}%</Text>
        </View>
      )}
      
      {/* Favorite Button */}
      <TouchableOpacity style={styles.favoriteButton}>
        <MaterialIcons name="favorite-border" size={20} color="#6B7280" />
      </TouchableOpacity>
      
      {/* Product Image */}
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.productImageGrid}
        resizeMode="cover"
      />
      
      {/* Product Info */}
      <View style={styles.productInfoGrid}>
        <Text style={styles.productCategory} numberOfLines={1}>
          {item.category.toUpperCase()}
        </Text>
        
        <Text style={styles.productNameGrid} numberOfLines={2}>
          {item.name}
        </Text>
        
        {/* Rating */}
        <View style={styles.ratingContainer}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons
                key={star}
                name={star <= Math.floor(item.rating) ? 'star' : 'star-border'}
                size={14}
                color={star <= item.rating ? '#F59E0B' : '#D1D5DB'}
              />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {item.rating} ({item.reviews})
          </Text>
        </View>
        
        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>₹{item.price.toLocaleString()}</Text>
          {item.originalPrice > item.price && (
            <Text style={styles.originalPrice}>₹{item.originalPrice.toLocaleString()}</Text>
          )}
        </View>
        
        {/* Add to Cart Button */}
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToCart(item);
          }}
        >
          <MaterialIcons name="add-shopping-cart" size={16} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Add</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderProductList = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCardList}
      onPress={() => handleViewDetails(item)}
      activeOpacity={0.9}
    >
      <View style={styles.productListContainer}>
        {/* Product Image */}
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.productImageList}
          resizeMode="cover"
        />
        
        {/* Product Info */}
        <View style={styles.productInfoList}>
          {/* Header */}
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.productCategoryList}>{item.category.toUpperCase()}</Text>
              <Text style={styles.productNameList} numberOfLines={2}>
                {item.name}
              </Text>
            </View>
            {item.discount > 0 && (
              <View style={styles.discountBadgeList}>
                <Text style={styles.discountTextList}>-{item.discount}%</Text>
              </View>
            )}
          </View>
          
          {/* Description */}
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          {/* Rating */}
          <View style={styles.ratingContainerList}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialIcons
                  key={star}
                  name={star <= Math.floor(item.rating) ? 'star' : 'star-border'}
                  size={16}
                  color={star <= item.rating ? '#F59E0B' : '#D1D5DB'}
                />
              ))}
            </View>
            <Text style={styles.ratingTextList}>
              {item.rating} ({item.reviews} reviews)
            </Text>
          </View>
          
          {/* Footer */}
          <View style={styles.listFooter}>
            <View style={styles.priceContainerList}>
              <Text style={styles.currentPriceList}>₹{item.price.toLocaleString()}</Text>
              {item.originalPrice > item.price && (
                <Text style={styles.originalPriceList}>₹{item.originalPrice.toLocaleString()}</Text>
              )}
              <Text style={styles.saveText}>
                Save ₹{(item.originalPrice - item.price).toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.listActions}>
              <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleViewDetails(item);
                }}
              >
                <Text style={styles.viewDetailsText}>Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.addToCartButtonList}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCart(item);
                }}
              >
                <MaterialIcons name="add-shopping-cart" size={16} color="#FFFFFF" />
                <Text style={styles.addToCartTextList}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={sortOptions}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === item.id && styles.selectedSortOption
                ]}
                onPress={() => {
                  setSortBy(item.id);
                  setShowSortModal(false);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === item.id && styles.selectedSortOptionText
                ]}>
                  {item.name}
                </Text>
                {sortBy === item.id && (
                  <MaterialIcons name="check" size={20} color="#EF4444" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </View>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterContent}>
            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceRangeText}>₹{priceRange[0]}</Text>
                <View style={styles.sliderContainer}>
                  {/* Add Slider component here */}
                  <Text style={styles.sliderPlaceholder}>Price Range Slider</Text>
                </View>
                <Text style={styles.priceRangeText}>₹{priceRange[1]}+</Text>
              </View>
            </View>
            
            {/* Categories Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Categories</Text>
              <View style={styles.categoriesFilter}>
                {categories.slice(1).map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryFilterItem,
                      selectedCategory === category.id && styles.selectedCategoryFilterItem
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <MaterialIcons 
                      name={category.icon as any} 
                      size={20} 
                      color={selectedCategory === category.id ? '#EF4444' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.categoryFilterText,
                      selectedCategory === category.id && styles.selectedCategoryFilterText
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Availability */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Availability</Text>
              <TouchableOpacity style={styles.checkboxItem}>
                <View style={styles.checkbox}>
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.checkboxLabel}>In Stock Only</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedCategory('all');
                setPriceRange([0, 1000]);
              }}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyFiltersButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp'
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Catalogue</Text>
          <Text style={styles.headerSubtitle}>Discover amazing products</Text>
        </View>
      </Animated.View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <MaterialIcons 
                name={category.icon as any} 
                size={20} 
                color={selectedCategory === category.id ? '#FFFFFF' : '#EF4444'} 
              />
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.selectedCategoryButtonText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Controls Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredProducts.length} products
          </Text>
        </View>
        
        <View style={styles.controlsRight}>
          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
              onPress={() => setViewMode('grid')}
            >
              <MaterialIcons 
                name="grid-view" 
                size={20} 
                color={viewMode === 'grid' ? '#FFFFFF' : '#6B7280'} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
              onPress={() => setViewMode('list')}
            >
              <MaterialIcons 
                name="view-list" 
                size={20} 
                color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Sort Button */}
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <MaterialIcons name="sort" size={20} color="#6B7280" />
            <Text style={styles.sortButtonText}>
              {sortOptions.find(s => s.id === sortBy)?.name}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {/* Filter Button */}
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialIcons name="filter-list" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={viewMode === 'grid' ? renderProductGrid : renderProductList}
        keyExtractor={(item) => item.id.toString()}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridWrapper : undefined}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#EF4444']}
            tintColor="#EF4444"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="large" color="#EF4444" />
              <Text style={styles.loadingText}>Loading more products...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyMessage}>
              Try adjusting your search or filters
            </Text>
            <TouchableOpacity 
              style={styles.resetFiltersButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              <Text style={styles.resetFiltersText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {/* Newsletter CTA */}
      <View style={styles.newsletterContainer}>
        <View style={styles.newsletterIcon}>
          <MaterialIcons name="mail-outline" size={32} color="#EF4444" />
        </View>
        <Text style={styles.newsletterTitle}>Can't Find What You Need?</Text>
        <Text style={styles.newsletterText}>
          Subscribe to get notified about new arrivals
        </Text>
        <View style={styles.newsletterForm}>
          <TextInput
            style={styles.newsletterInput}
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.newsletterButton}>
            <Text style={styles.newsletterButtonText}>Notify Me</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Modals */}
      {renderSortModal()}
      {renderFilterModal()}
      
      {/* Floating Cart Button */}
      <TouchableOpacity 
        style={styles.floatingCartButton}
        onPress={() => navigation.navigate('Cart')}
      >
        <MaterialIcons name="shopping-cart" size={24} color="#FFFFFF" />
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>3</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    marginTop: Platform.OS === 'ios' ? 8 : 0,
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    minHeight: 40,
  },
  selectedCategoryButton: {
    backgroundColor: '#EF4444',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 6,
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsInfo: {
    flex: 1,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: '#EF4444',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  productsList: {
    padding: 16,
    paddingBottom: 120,
  },
  gridWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCardGrid: {
    width: (width - 40) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  productImageGrid: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F4F6',
  },
  productInfoGrid: {
    padding: 12,
  },
  productCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productNameGrid: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productCardList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productListContainer: {
    flexDirection: 'row',
  },
  productImageList: {
    width: 120,
    height: 140,
    backgroundColor: '#F3F4F6',
  },
  productInfoList: {
    flex: 1,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productCategoryList: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productNameList: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
    flex: 1,
  },
  discountBadgeList: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountTextList: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  ratingContainerList: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingTextList: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainerList: {
    flex: 1,
  },
  currentPriceList: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 2,
  },
  originalPriceList: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  saveText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewDetailsButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  addToCartButtonList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addToCartTextList: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filterModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedSortOption: {
    backgroundColor: '#FEF2F2',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedSortOptionText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  filterContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRangeText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 16,
    height: 40,
    justifyContent: 'center',
  },
  sliderPlaceholder: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
  },
  categoriesFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },
  selectedCategoryFilterItem: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedCategoryFilterText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  applyFiltersButton: {
    flex: 2,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  resetFiltersButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newsletterContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginTop: -80,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  newsletterIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  newsletterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  newsletterText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  newsletterForm: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  newsletterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  newsletterButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  newsletterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EF4444',
  },
});

export default CustomerCatalogueScreen;