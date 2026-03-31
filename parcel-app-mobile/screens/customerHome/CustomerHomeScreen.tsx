import React, { useState, useEffect, useCallback, useReducer } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  Image,
  useWindowDimensions,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UseFetchJSON } from '../../utils/useFetch';
import { colors } from '../../config/colors';

import { ScreenProps, Product, RootStackParamList } from '../../types/navigation';

// TypeScript Interfaces
// interface Product {
//   id: string;
//   prod_photo: string;
//   prod_desc: string;
//   prod_name: string;
//   prod_model: string;
//   prod_price: number;
//   prod_qty: number;
// }

interface CustomerData {
  id: string;
  first_name: string;
  last_name: string;
  cus_photo?: string;
}

interface State {
  products: Product[];
  customer: CustomerData | null;
  loading: boolean;
}

type Props = NativeStackScreenProps<RootStackParamList, 'customer-home'>;


type Action = 
  | { type: 'GET_ALL_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CUSTOMER'; payload: CustomerData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_TO_CART'; payload: string }
  | { type: 'RESET_STATE' };

const CustomerHomeScreen: React.FC<Props> = ({ navigation, route }) => {
  // const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [ipAddress, setIpAddress] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'home' | 'cart' | 'orders' | 'profile'>('home');

  // Initial state
  const initialState: State = {
    products: [],
    customer: null,
    loading: true,
  };

  // Reducer function
  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case 'GET_ALL_PRODUCTS':
        return { ...state, products: action.payload, loading: false };
      case 'SET_CUSTOMER':
        return { ...state, customer: action.payload };
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      case 'ADD_TO_CART':
        // Handle add to cart logic
        Alert.alert('Success', 'Product added to cart!');
        return state;
      case 'RESET_STATE':
        return initialState;
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Fetch IP address from AsyncStorage
  const fetchIP = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem('@IPStore:ipAdd');
      if (value) setIpAddress(value);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }, []);

  // Fetch customer data from AsyncStorage
  const fetchCustomerData = useCallback(async () => {
    try {
      const customerData = await AsyncStorage.getItem('logcus');
      if (customerData) {
        dispatch({ type: 'SET_CUSTOMER', payload: JSON.parse(customerData) });
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load customer data');
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!ipAddress) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const apiUrl = `http://${ipAddress}:7000/parcel_product/get_prod/`;
      const data = await UseFetchJSON(apiUrl, 'GET');
      
      if (data && data.data) {
        dispatch({ type: 'GET_ALL_PRODUCTS', payload: data.data });
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to fetch products');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [ipAddress]);

  // Handle product image URL
  const getProductImageUrl = (photoUrl: string): string => {
    if (!ipAddress || !photoUrl) return '';
    return photoUrl.replace('localhost', ipAddress);
  };

  // Handle Add to Cart
  const handleAddToCart = (productId: string) => {
    dispatch({ type: 'ADD_TO_CART', payload: productId });
  };

  // Handle Buy Now
  const handleBuyNow = (product: Product) => {
    navigation.navigate('Checkout', { product });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('logcus');
      dispatch({ type: 'RESET_STATE' });
      navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await fetchIP();
      await fetchCustomerData();
    };
    initializeData();
  }, [fetchIP, fetchCustomerData]);

  // Fetch products when IP is available
  useEffect(() => {
    if (ipAddress) {
      fetchProducts();
    }
  }, [ipAddress, fetchProducts]);

  // Navigation tabs
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.dashboardTitle}>Customer Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Customer Info Section */}
      <View style={styles.customerInfoContainer}>
        {state.customer && (
          <>
            <View style={styles.customerTextContainer}>
              <Text style={styles.customerGreeting}>
                Hello, {state.customer.last_name} {state.customer.first_name}
              </Text>
            </View>
            <View style={styles.customerImageContainer}>
              {state.customer?.cus_photo ? (
                <Image
                  source={{ uri: getProductImageUrl(state.customer.cus_photo) }}
                  style={styles.customerImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>
                    {state.customer.first_name?.[0]}{state.customer.last_name?.[0]}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* Navigation Tabs */}
      <View style={styles.navTabsContainer}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'home' && styles.activeNavTab]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.navTabText, activeTab === 'home' && styles.activeNavTabText]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'cart' && styles.activeNavTab]}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={[styles.navTabText, activeTab === 'cart' && styles.activeNavTabText]}>
            Cart
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'orders' && styles.activeNavTab]}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={[styles.navTabText, activeTab === 'orders' && styles.activeNavTabText]}>
            Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'profile' && styles.activeNavTab]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={[styles.navTabText, activeTab === 'profile' && styles.activeNavTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: getProductImageUrl(item.prod_photo) }}
        style={styles.productImage}
        resizeMode="cover"
      />
      
      <View style={styles.productDetails}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.prod_name}
        </Text>
        <Text style={styles.productModel} numberOfLines={1}>
          {item.prod_model}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.prod_desc}
        </Text>
        
        <View style={styles.productInfoRow}>
          <Text style={styles.productPrice}>${item.prod_price.toFixed(2)}</Text>
          <Text style={styles.productStock}>
            Stock: {item.prod_qty}
          </Text>
        </View>
        
        <View style={styles.productRating}>
          <Text style={styles.ratingText}>Rating: ★★★★☆</Text>
        </View>

        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.buyNowButton}
            onPress={() => handleBuyNow(item)}
          >
            <Text style={styles.buyNowButtonText}>Buy Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(item.id)}
          >
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Loading state
  if (state.loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={state.products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  headerContainer: {
    padding: 10,
    backgroundColor: '#ffffff',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: colors.danger,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutButtonText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
  dashboardTitle: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 80,
  },
  customerInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  customerTextContainer: {
    flex: 1,
  },
  customerGreeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  customerImageContainer: {
    width: 80,
    height: 80,
  },
  customerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  navTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 2,
    borderBottomColor: colors.danger,
    marginTop: 10,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeNavTab: {
    backgroundColor: colors.danger,
  },
  navTabText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
  activeNavTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  productDetails: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productModel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 13,
    color: '#777',
    marginBottom: 12,
    lineHeight: 18,
  },
  productInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.danger,
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  productRating: {
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#FF9529',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyNowButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default CustomerHomeScreen;