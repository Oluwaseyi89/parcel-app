import React, { useEffect, useReducer, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Modal,
  Image as RNImage,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  Feather,
  Octicons,
  FontAwesome,
} from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { Dimensions } from 'react-native';

// Mock API functions (replace with actual implementations)
const UseFetchJSON = async (url: string, method: string, body?: any) => {
  // Mock implementation
  console.log(`API Call: ${method} ${url}`, body);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: Array.from({ length: 3 }, (_, i) => ({
          id: `prod-${i + 1}`,
          prod_name: `Product ${i + 1}`,
          prod_model: `Model ${i + 1}`,
          prod_price: (i + 1) * 1000,
          prod_qty: (i + 1) * 10,
          prod_disc: i * 10,
          prod_desc: `Description for product ${i + 1}`,
          prod_photo: `https://picsum.photos/seed/product${i + 1}/400/400`,
          prod_cat: 'Electronics',
          vendor_name: 'John Doe',
          vendor_phone: '+1234567890',
          vendor_email: 'vendor@example.com',
          vend_photo: 'https://picsum.photos/seed/vendor/100/100',
          img_base: `product${i + 1}.jpg`,
          upload_date: new Date().toISOString(),
        })),
        status: 'success',
      });
    }, 1000);
  });
};

const UseFetch = async (url: string, method: string, formData?: any) => {
  // Mock implementation
  console.log(`API Call: ${method} ${url}`, formData);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'success',
        data: 'Product uploaded successfully',
      });
    }, 1500);
  });
};

// Types
interface Product {
  id: string;
  prod_name: string;
  prod_model: string;
  prod_price: number;
  prod_qty: number;
  prod_disc: number;
  prod_desc: string;
  prod_photo: string;
  prod_cat: string;
  vendor_name: string;
  vendor_phone: string;
  vendor_email: string;
  vend_photo: string;
  img_base: string;
  upload_date: string;
  edit?: boolean;
  submit?: boolean;
}

interface EditProduct {
  edit_price: string;
  edit_disc: string;
  edit_qty: string;
}

interface State {
  products: Product[];
}

type Action =
  | { type: 'GET_PRODUCTS'; payload: Product[] }
  | { type: 'EDIT'; payload: string }
  | { type: 'DELETE_PROD'; payload: string }
  | { type: 'SUBMIT_EDITTED'; payload: string }
  | { type: 'CHANGE_PROD'; payload: { id: string; field: keyof EditProduct; value: string } }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product };

const VendorProductScreen: React.FC = () => {
  // Screen states
  const [activeTab, setActiveTab] = useState<'upload' | 'view' | 'notifications'>('upload');
  const [refreshing, setRefreshing] = useState(false);
  
  // Upload form states
  const [product, setProduct] = useState({
    prod_name: '',
    prod_model: '',
    prod_price: '',
    prod_qty: '',
    prod_desc: '',
    prod_disc: '',
  });
  
  const [prodphoto, setProdPhoto] = useState<string | null>(null);
  const [prodphotoFile, setProdPhotoFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  
  // Edit states
  const [editprod, setEditProd] = useState<EditProduct>({
    edit_price: '',
    edit_disc: '',
    edit_qty: '',
  });
  
  // Alert states
  const [prodsus, setProdSus] = useState('');
  const [proderr, setProdErr] = useState('');
  
  // Notifications
  const [tempProd, setTempProd] = useState<any[]>([]);
  
  // Mock vendor data (replace with AsyncStorage)
  const logvend = {
    last_name: 'Doe',
    first_name: 'John',
    phone_no: '+1234567890',
    email: 'vendor@example.com',
    vend_photo: 'https://picsum.photos/seed/vendor/100/100',
    bus_category: 'Electronics',
  };

  const initialState: State = { products: [] };

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case 'GET_PRODUCTS':
        return {
          ...state,
          products: action.payload.map(prod => ({
            ...prod,
            edit: false,
            submit: false,
          })),
        };

      case 'EDIT':
        return {
          ...state,
          products: state.products.map(prod =>
            prod.id === action.payload
              ? { ...prod, edit: true }
              : prod
          ),
        };

      case 'DELETE_PROD':
        const productToDelete = state.products.find(p => p.id === action.payload);
        if (productToDelete) {
          // Simulate API call
          const apiUrl = `http://localhost:7000/parcel_product/del_product/${action.payload}/`;
          UseFetchJSON(apiUrl, 'DELETE')
            .then((res: any) => {
              if (res.status === 'success') {
                setProdSus(res.data);
              } else {
                setProdErr('An error occurred');
              }
            })
            .catch((err: any) => {
              console.log(err);
              setProdErr('Failed to delete product');
            });
        }
        
        return {
          ...state,
          products: state.products.filter(prod => prod.id !== action.payload),
        };

      case 'SUBMIT_EDITTED': {
        const { edit_price, edit_disc, edit_qty } = editprod;
        const productToUpdate = state.products.find(p => p.id === action.payload);
        
        if (productToUpdate && edit_price && edit_qty && edit_disc) {
          const updateData = {
            prod_price: parseFloat(edit_price),
            prod_qty: parseInt(edit_qty),
            prod_disc: parseInt(edit_disc),
            updated_at: new Date().toISOString(),
          };

          // Simulate API call
          const apiUrl = `http://localhost:7000/parcel_product/update_product/${action.payload}/`;
          UseFetchJSON(apiUrl, 'POST', updateData)
            .then((res: any) => {
              if (res.status === 'success') {
                setProdSus(res.data);
                setEditProd({ edit_price: '', edit_disc: '', edit_qty: '' });
              } else if (res.status === 'error') {
                setProdErr(res.data);
              } else {
                setProdErr('An error occurred');
              }
            })
            .catch((err: any) => {
              setProdErr(err.message || 'Failed to update product');
            });
        } else {
          setProdErr('Some fields are empty, no changes made');
        }

        return {
          ...state,
          products: state.products.map(prod =>
            prod.id === action.payload
              ? { ...prod, edit: false }
              : prod
          ),
        };
      }

      case 'CHANGE_PROD':
        setEditProd(prev => ({
          ...prev,
          [action.payload.field]: action.payload.value,
        }));
        
        return {
          ...state,
          products: state.products.map(prod =>
            prod.id === action.payload.id
              ? {
                  ...prod,
                  prod_price: action.payload.field === 'edit_price' ? parseFloat(action.payload.value) || prod.prod_price : prod.prod_price,
                  prod_disc: action.payload.field === 'edit_disc' ? parseInt(action.payload.value) || prod.prod_disc : prod.prod_disc,
                  prod_qty: action.payload.field === 'edit_qty' ? parseInt(action.payload.value) || prod.prod_qty : prod.prod_qty,
                }
              : prod
          ),
        };

      case 'ADD_PRODUCT':
        return {
          ...state,
          products: [...state.products, action.payload],
        };

      case 'UPDATE_PRODUCT':
        return {
          ...state,
          products: state.products.map(prod =>
            prod.id === action.payload.id
              ? action.payload
              : prod
          ),
        };

      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const email = logvend.email;
      const apiUrl = `http://localhost:7000/parcel_product/get_dist_ven_product/${email}/`;
      const res: any = await UseFetchJSON(apiUrl, 'GET');
      dispatch({ type: 'GET_PRODUCTS', payload: res.data });
    } catch (error) {
      console.error(error);
      setProdErr('Failed to load products');
    }
  }, []);

  const fetchTempProducts = useCallback(async () => {
    try {
      const email = logvend.email;
      const apiUrl = `http://localhost:7000/parcel_product/get_dist_temp_product/${email}/`;
      const res: any = await UseFetchJSON(apiUrl, 'GET');
      setTempProd(res.data || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchTempProducts();
  }, [fetchProducts, fetchTempProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchTempProducts()]);
    setRefreshing(false);
  }, [fetchProducts, fetchTempProducts]);

  // Handlers
  const handleProductChange = (field: keyof typeof product, value: string) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleProdEditChange = useCallback((id: string, field: keyof EditProduct, value: string) => {
    dispatch({ type: 'CHANGE_PROD', payload: { id, field, value } });
  }, []);

  const handleProdDelete = useCallback((id: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_PROD', payload: id }),
        },
      ]
    );
  }, []);

  const handleEditClick = useCallback((id: string) => {
    dispatch({ type: 'EDIT', payload: id });
  }, []);

  const handleSubmitClick = useCallback((id: string) => {
    dispatch({ type: 'SUBMIT_EDITTED', payload: id });
  }, []);

  const handleCloseAlert = () => {
    setProdErr('');
    setProdSus('');
  };

  // Image Picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProdPhoto(result.assets[0].uri);
      setProdPhotoFile(result.assets[0]);
    }
  };

  // Product Upload
  const handleProductSubmit = async () => {
    const { prod_name, prod_model, prod_price, prod_qty, prod_desc, prod_disc } = product;
    
    if (!prodphotoFile || !prod_name || !prod_model || !prod_price || !prod_qty || !prod_desc || !prod_disc) {
      setProdErr('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const vendor_name = `${logvend.last_name} ${logvend.first_name}`;
      const formData = new FormData();
      const filename = prodphotoFile.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // @ts-ignore
      formData.append('vendor_name', vendor_name);
      formData.append('vendor_phone', logvend.phone_no);
      formData.append('vendor_email', logvend.email);
      formData.append('vend_photo', logvend.vend_photo);
      formData.append('prod_cat', logvend.bus_category);
      formData.append('prod_name', prod_name);
      formData.append('prod_model', prod_model);
      // @ts-ignore
      formData.append('prod_photo', {
        uri: prodphotoFile.uri,
        type,
        name: filename || 'product.jpg',
      });
      formData.append('prod_price', prod_price);
      formData.append('prod_qty', prod_qty);
      formData.append('prod_disc', prod_disc);
      formData.append('prod_desc', prod_desc);
      formData.append('img_base', filename || 'product.jpg');
      formData.append('upload_date', new Date().toISOString());

      const apiUrl = 'http://localhost:7000/parcel_product/product_upload/';
      const res: any = await UseFetch(apiUrl, 'POST', formData);
      
      if (res.status === 'success') {
        setProdSus(res.data);
        // Reset form
        setProduct({
          prod_name: '',
          prod_model: '',
          prod_price: '',
          prod_qty: '',
          prod_desc: '',
          prod_disc: '',
        });
        setProdPhoto(null);
        setProdPhotoFile(null);
        // Refresh products
        fetchProducts();
      } else {
        setProdErr(res.data || 'An error occurred');
      }
    } catch (error: any) {
      console.error(error);
      setProdErr('Failed to upload product');
    } finally {
      setUploading(false);
    }
  };

  // Calculate notifications
  const notifications = [];
  if (state.products.length > 0) {
    notifications.push({
      status: 'success' as const,
      data: `You have ${state.products.length} approved products.`,
    });
  }
  if (tempProd.length > 0) {
    notifications.push({
      status: 'error' as const,
      data: `You have ${tempProd.length} unapproved products`,
    });
  }

  // Render Product Item
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      {/* Product Image */}
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: item.prod_photo }}
          style={styles.productImage}
          resizeMode="cover"
        />
      </View>

      {/* Product Details */}
      <View style={styles.productContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.prod_name}
        </Text>
        <Text style={styles.productModel} numberOfLines={1}>
          {item.prod_model}
        </Text>

        {item.edit ? (
          <View style={styles.editFields}>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Price (₦)</Text>
              <TextInput
                style={styles.editInput}
                value={editprod.edit_price || item.prod_price.toString()}
                onChangeText={(value) => handleProdEditChange(item.id, 'edit_price', value)}
                placeholder="New price"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Discount (%)</Text>
              <TextInput
                style={styles.editInput}
                value={editprod.edit_disc || item.prod_disc.toString()}
                onChangeText={(value) => handleProdEditChange(item.id, 'edit_disc', value)}
                placeholder="New discount"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Quantity</Text>
              <TextInput
                style={styles.editInput}
                value={editprod.edit_qty || item.prod_qty.toString()}
                onChangeText={(value) => handleProdEditChange(item.id, 'edit_qty', value)}
                placeholder="New quantity"
                keyboardType="numeric"
              />
            </View>
          </View>
        ) : (
          <View style={styles.productDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>₦{item.prod_price.toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Discount:</Text>
              <Text style={styles.discountValue}>{item.prod_disc}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>{item.prod_qty}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!item.edit ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditClick(item.id)}
            >
              <MaterialIcons name="edit" size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => handleSubmitClick(item.id)}
              >
                <MaterialIcons name="save" size={16} color="#FFFFFF" />
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleProdDelete(item.id)}
              >
                <MaterialIcons name="delete" size={16} color="#FFFFFF" />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'upload' && styles.tabButtonActive]}
          onPress={() => setActiveTab('upload')}
        >
          <Feather name="upload" size={20} color={activeTab === 'upload' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'upload' && styles.tabTextActive]}>
            Upload Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'view' && styles.tabButtonActive]}
          onPress={() => setActiveTab('view')}
        >
          <Feather name="eye" size={20} color={activeTab === 'view' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'view' && styles.tabTextActive]}>
            View Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notifications' && styles.tabButtonActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Feather name="bell" size={20} color={activeTab === 'notifications' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Notifications
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
        {proderr ? (
          <View style={styles.alertError}>
            <View style={styles.alertContent}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.alertText}>{proderr}</Text>
            </View>
            <TouchableOpacity onPress={handleCloseAlert}>
              <Feather name="x" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ) : null}

        {prodsus ? (
          <View style={styles.alertSuccess}>
            <View style={styles.alertContent}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.alertText}>{prodsus}</Text>
            </View>
            <TouchableOpacity onPress={handleCloseAlert}>
              <Feather name="x" size={20} color="#059669" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Upload Products Tab */}
        {activeTab === 'upload' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Octicons name="package" size={24} color="#1F2937" />
              <Text style={styles.sectionTitle}>Upload New Product</Text>
            </View>

            <View style={styles.uploadForm}>
              {/* Image Upload */}
              <View style={styles.imageUploadSection}>
                <Text style={styles.sectionLabel}>Product Image</Text>
                <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
                  {prodphoto ? (
                    <Image source={{ uri: prodphoto }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.imageUploadPlaceholder}>
                      <Feather name="image" size={48} color="#9CA3AF" />
                      <Text style={styles.imageUploadText}>Tap to upload image</Text>
                      <Text style={styles.imageUploadSubtext}>PNG, JPG, GIF up to 10MB</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Category (Read-only) */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Product Category</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>
                    Product Category: {logvend.bus_category}
                  </Text>
                </View>
              </View>

              {/* Product Name */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  value={product.prod_name}
                  onChangeText={(value) => handleProductChange('prod_name', value)}
                  placeholder="Enter product name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Product Model */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Product Model *</Text>
                <TextInput
                  style={styles.input}
                  value={product.prod_model}
                  onChangeText={(value) => handleProductChange('prod_model', value)}
                  placeholder="Enter product model"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Price and Discount */}
              <View style={styles.rowFields}>
                <View style={[styles.formField, styles.halfField]}>
                  <Text style={styles.fieldLabel}>Price (₦) *</Text>
                  <View style={styles.inputWithIcon}>
                    <FontAwesome name="dollar" size={16} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.inputWithIconPadding]}
                      value={product.prod_price}
                      onChangeText={(value) => handleProductChange('prod_price', value)}
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.formField, styles.halfField]}>
                  <Text style={styles.fieldLabel}>Discount (%) *</Text>
                  <View style={styles.inputWithIcon}>
                    <FontAwesome5 name="tag" size={16} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.inputWithIconPadding]}
                      value={product.prod_disc}
                      onChangeText={(value) => handleProductChange('prod_disc', value)}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                </View>
              </View>

              {/* Quantity */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Quantity *</Text>
                <View style={styles.inputWithIcon}>
                  <FontAwesome5 name="hashtag" size={16} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputWithIconPadding]}
                    value={product.prod_qty}
                    onChangeText={(value) => handleProductChange('prod_qty', value)}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Description *</Text>
                <View style={styles.inputWithIcon}>
                  <FontAwesome5 name="file-alt" size={16} color="#6B7280" style={[styles.inputIcon, styles.textAreaIcon]} />
                  <TextInput
                    style={[styles.input, styles.textArea, styles.textAreaPadding]}
                    value={product.prod_desc}
                    onChangeText={(value) => handleProductChange('prod_desc', value)}
                    placeholder="Describe your product..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                onPress={handleProductSubmit}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="upload" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Upload Product</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* View Products Tab */}
        {activeTab === 'view' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Octicons name="package" size={24} color="#1F2937" />
              <Text style={styles.sectionTitle}>Your Products</Text>
              <View style={styles.productCountBadge}>
                <Text style={styles.productCountText}>{state.products.length}</Text>
              </View>
            </View>

            {state.products.length > 0 ? (
              <FlatList
                data={state.products}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.productGrid}
                scrollEnabled={false}
                ListFooterComponent={<View style={{ height: 20 }} />}
              />
            ) : (
              <View style={styles.emptyState}>
                <Octicons name="package" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.emptyDescription}>
                  You haven't uploaded any products yet.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setActiveTab('upload')}
                >
                  <Text style={styles.emptyButtonText}>Upload Your First Product</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Feather name="bell" size={24} color="#1F2937" />
              <Text style={styles.sectionTitle}>Upload Status</Text>
            </View>

            <View style={styles.notificationsContainer}>
              {notifications.length > 0 ? (
                notifications.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.notificationCard,
                      item.status === 'success' ? styles.notificationSuccess : styles.notificationError,
                    ]}
                  >
                    {item.status === 'success' ? (
                      <Ionicons name="checkmark-circle" size={24} color="#059669" />
                    ) : (
                      <Ionicons name="alert-circle" size={24} color="#DC2626" />
                    )}
                    <Text
                      style={[
                        styles.notificationText,
                        item.status === 'success' ? styles.notificationSuccessText : styles.notificationErrorText,
                      ]}
                    >
                      {item.data}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="bell" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No notifications</Text>
                  <Text style={styles.emptyDescription}>
                    All your products are approved and up to date.
                  </Text>
                </View>
              )}
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
  tabContent: {
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
  productCountBadge: {
    backgroundColor: '#DB214C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 12,
  },
  productCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageUploadSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  imageUploadButton: {
    height: 200,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageUploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  imageUploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
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
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: Platform.OS === 'ios' ? 12 : 10,
    zIndex: 1,
  },
  inputWithIconPadding: {
    paddingLeft: 40,
  },
  textArea: {
    height: 100,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
  },
  textAreaPadding: {
    paddingLeft: 40,
  },
  textAreaIcon: {
    top: 12,
  },
  readOnlyField: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    width: '48%',
  },
  submitButton: {
    backgroundColor: '#DB214C',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  productGrid: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImageContainer: {
    height: 150,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productContent: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  productModel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  editFields: {
    gap: 8,
    marginBottom: 12,
  },
  editField: {
    marginBottom: 4,
  },
  editLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  editInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: '#1F2937',
  },
  productDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#DB214C',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  notificationsContainer: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  notificationSuccess: {
    backgroundColor: '#F0FDF4',
    borderLeftColor: '#059669',
  },
  notificationError: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#DC2626',
  },
  notificationText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  notificationSuccessText: {
    color: '#065F46',
  },
  notificationErrorText: {
    color: '#991B1B',
  },
});

export default VendorProductScreen;