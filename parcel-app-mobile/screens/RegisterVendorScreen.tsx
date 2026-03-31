// screens/RegisterVendorScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImagePicker, { Image as PickerImage } from 'react-native-image-crop-picker';
import CheckBox from '@react-native-community/checkbox';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../config/colors';
import { UseFetch } from '../utils/useFetch';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useUIStore } from '../stores/uiStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type RegisterVendorScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'registerVendor'>;

interface Props {
  navigation: RegisterVendorScreenNavigationProp;
}

interface VendorDetails {
  first_name: string;
  last_name: string;
  bus_country: string;
  bus_state: string;
  bus_street: string;
  bus_category: BusinessCategory;
  cac_reg_no: string;
  nin: string;
  phone_no: string;
  email: string;
  vend_photo: FileData | null;
  ven_policy: boolean;
  password: string;
  reg_date: string;
  is_email_verified: boolean;
}

interface FileData {
  uri: string;
  type: string;
  size: number;
  extension: string;
  name: string;
}

type BusinessCategory = 
  | 'Clothing'
  | 'Electronics'
  | 'Chemicals'
  | 'Educative_Materials'
  | 'Furniture'
  | 'Kitchen_Utensils'
  | 'Plastics'
  | 'Spare_Parts'
  | 'General_Merchandise'
  | '';

const businessCategories = [
  { label: 'Clothing', value: 'Clothing' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Chemicals', value: 'Chemicals' },
  { label: 'Educative Materials', value: 'Educative_Materials' },
  { label: 'Furniture', value: 'Furniture' },
  { label: 'Kitchen Utensils', value: 'Kitchen_Utensils' },
  { label: 'Plastics', value: 'Plastics' },
  { label: 'Spare Parts', value: 'Spare_Parts' },
  { label: 'General Merchandise', value: 'General_Merchandise' },
];

const RegisterVendorScreen: React.FC<Props> = ({ navigation }) => {
  const [details, setDetails] = useState<VendorDetails>({
    first_name: '',
    last_name: '',
    bus_country: '',
    bus_state: '',
    bus_street: '',
    bus_category: '',
    cac_reg_no: '',
    nin: '',
    phone_no: '',
    email: '',
    vend_photo: null,
    ven_policy: false,
    password: '',
    reg_date: new Date().toISOString(),
    is_email_verified: false,
  });

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [retPass, setRetPass] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showRetPassword, setShowRetPassword] = useState<boolean>(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);

  const { showAlert, showToast, setLoadingState } = useUIStore();

  const {
    first_name,
    last_name,
    bus_country,
    bus_state,
    bus_street,
    bus_category,
    cac_reg_no,
    nin,
    phone_no,
    email,
    vend_photo,
    ven_policy,
    password,
  } = details;

  // Handle input field changes
  const handleInputChange = <K extends keyof VendorDetails>(field: K, value: VendorDetails[K]) => {
    setDetails(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFetchPhoto = async () => {
    try {
      const options = {
        width: 300,
        height: 400,
        cropping: true,
        includeBase64: true,
        mediaType: 'photo' as const,
        compressImageQuality: 0.8,
      };

      const image: PickerImage = await ImagePicker.openPicker(options);
      
      const imageData = { uri: `data:${image.mime};base64,${image.data}` };
      setImageUri(imageData.uri);
      
      const uploadFile: FileData = {
        uri: Platform.OS === 'android' ? image.path : image.path.replace('file://', ''),
        type: image.mime,
        size: image.size,
        extension: '.' + image.mime.split('/').pop() || '.jpg',
        name: Platform.OS === 'ios' ? image.filename || 'photo.jpg' : image.path.split('/').pop() || 'photo.jpg'
      };
      
      handleInputChange('vend_photo', uploadFile);
      showToast('Photo selected successfully', 'success');
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        showAlert('Error', error.message || 'Failed to select photo');
      }
    }
  };

  // Validation functions
  const validateField = (field: keyof VendorDetails, value: any): string => {
    switch (field) {
      case 'first_name':
      case 'last_name':
        if (!value.trim()) return 'This field is required';
        if (value.length < 2) return 'Minimum 2 characters required';
        return '';
      
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return '';
      
      case 'phone_no':
        if (!value.trim()) return 'Phone number is required';
        const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
        if (!phoneRegex.test(value)) return 'Invalid phone number';
        return '';
      
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Minimum 6 characters required';
        return '';
      
      case 'bus_category':
        if (!value.trim()) return 'Business category is required';
        return '';
      
      case 'cac_reg_no':
      case 'nin':
      case 'bus_country':
      case 'bus_state':
      case 'bus_street':
        if (!value.trim()) return 'This field is required';
        return '';
      
      default:
        return '';
    }
  };

  const checkInput = (): { isValid: boolean; errorCount: number; errorFields: Record<string, string> } => {
    const errorFields: Record<string, string> = {};
    let errorCount = 0;

    const fieldsToValidate: (keyof VendorDetails)[] = [
      'first_name',
      'last_name',
      'bus_country',
      'bus_state',
      'bus_street',
      'bus_category',
      'cac_reg_no',
      'nin',
      'phone_no',
      'email',
      'password'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, details[field]);
      if (error) {
        errorFields[field] = error;
        errorCount++;
      }
    });

    if (!ven_policy) {
      errorFields.ven_policy = 'You must accept the vendor policy';
      errorCount++;
    }

    if (!vend_photo) {
      errorFields.vend_photo = 'Business photo is required';
      errorCount++;
    }

    if (password !== retPass) {
      errorFields.password = 'Passwords do not match';
      errorCount++;
    }

    setErrors(errorFields);
    
    return {
      isValid: errorCount === 0,
      errorCount,
      errorFields
    };
  };

  const handleVendorRegistration = async () => {
    const validation = checkInput();
    
    if (!validation.isValid) {
      showAlert(
        'Validation Error',
        `Please fix ${validation.errorCount} error(s) before submitting.`
      );
      return;
    }

    setLoading(true);
    setLoadingState(true);

    try {
      const fetchedIP = await AsyncStorage.getItem('@IPStore:ipAdd');
      
      if (!fetchedIP) {
        showAlert('Error', 'IP address not found. Please save IP address first.');
        return;
      }

      const routeUrl = `http://${fetchedIP}:7000/parcel_backends/reg_temp_ven_mobile/`;
      const formDetails = new FormData();

      // Append all fields to FormData
      Object.entries(details).forEach(([key, value]) => {
        if (key === 'vend_photo' && value) {
          const file = value as FileData;
          formDetails.append(key, file as any);
        } else {
          formDetails.append(key, value.toString());
        }
      });

      const response = await UseFetch(routeUrl, 'POST', formDetails);

      if (String(response.status) === 'success') {
        showAlert(
          'Registration Successful',
          response.data,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('login')
            }
          ]
        );
        // Reset form
        setDetails({
          first_name: '',
          last_name: '',
          bus_country: '',
          bus_state: '',
          bus_street: '',
          bus_category: '',
          cac_reg_no: '',
          nin: '',
          phone_no: '',
          email: '',
          vend_photo: null,
          ven_policy: false,
          password: '',
          reg_date: new Date().toISOString(),
          is_email_verified: false,
        });
        setImageUri(null);
        setRetPass('');
        setErrors({});
      } else if (String(response.status) === 'error') {
        showAlert('Registration Failed', response.data || 'An error occurred');
      } else {
        showAlert('Error', 'An unexpected error occurred');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      showAlert('Network Error', error.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
      setLoadingState(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    fieldName: keyof VendorDetails,
    options?: {
      placeholder?: string;
      secureTextEntry?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      icon?: string;
      showPasswordToggle?: boolean;
      editable?: boolean;
      onPress?: () => void;
    }
  ) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputLabelContainer}>
        <Icon 
          name={options?.icon || 'form-textbox'} 
          size={18} 
          color={colors.neonRed} 
        />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      {options?.onPress ? (
        <TouchableOpacity
          style={[styles.textInput, styles.selectInput]}
          onPress={options.onPress}
          disabled={options.editable === false || loading}
        >
          <Text style={value ? styles.selectText : styles.placeholderText}>
            {value || options.placeholder || 'Select...'}
          </Text>
          <Icon name="chevron-down" size={20} color={colors.neonRed} />
        </TouchableOpacity>
      ) : (
        <View style={styles.textInputWrapper}>
          <TextInput
            style={[
              styles.textInput,
              errors[fieldName] && styles.inputError
            ]}
            value={value}
            onChangeText={onChange}
            placeholder={options?.placeholder}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={options?.secureTextEntry && !(options.showPasswordToggle ? showPassword : showRetPassword)}
            keyboardType={options?.keyboardType}
            autoCapitalize={options?.autoCapitalize}
            editable={options?.editable !== false && !loading}
          />
          {options?.showPasswordToggle && (
            <TouchableOpacity
              style={styles.inputIconRight}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.neonRed}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      {errors[fieldName] && (
        <Text style={styles.errorText}>{errors[fieldName]}</Text>
      )}
      <View style={styles.underLine} />
    </View>
  );

  const renderCategoryPicker = () => (
    <Modal
      visible={showCategoryPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategoryPicker(false)}
    >
      <View style={styles.pickerModal}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Business Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <Icon name="close" size={24} color={colors.neonRed} />
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={bus_category}
            onValueChange={(itemValue: BusinessCategory) => {
              handleInputChange('bus_category', itemValue);
              setShowCategoryPicker(false);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select Business Category" value="" />
            {businessCategories.map((category) => (
              <Picker.Item
                key={category.value}
                label={category.label}
                value={category.value}
              />
            ))}
          </Picker>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Icon name="arrow-left" size={24} color={colors.neonRed} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <View style={styles.logoContainer}>
                  <Icon name="office-building" size={32} color={colors.pearlWhite} />
                </View>
                <Text style={styles.heading}>Vendor Registration</Text>
                <Text style={styles.subtitle}>Create your vendor account to start selling</Text>
              </View>
            </View>

            {/* Business Photo Upload Section */}
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Business Photo</Text>
              <View style={styles.photoUploadContainer}>
                <View style={styles.uploadArea}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleFetchPhoto}
                    disabled={loading}
                  >
                    <View style={styles.uploadIconContainer}>
                      <Icon name="cloud-upload" size={36} color={colors.neonRed} />
                    </View>
                    <Text style={styles.uploadText}>Upload Business Photo</Text>
                    <Text style={styles.uploadSubtext}>PNG, JPG up to 5MB</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.photoPreview}>
                  <Image
                    style={styles.photo}
                    source={imageUri ? { uri: imageUri } : require('../assets/IMG-20220722-WA0002.jpg')}
                    resizeMode="cover"
                  />
                  {!imageUri && (
                    <View style={styles.photoPlaceholder}>
                      <Icon name="office-building" size={48} color={colors.silver} />
                    </View>
                  )}
                </View>
              </View>
              {errors.vend_photo && (
                <Text style={styles.errorText}>{errors.vend_photo}</Text>
              )}
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Personal Information Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="account" size={20} color={colors.neonRed} />
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                </View>
                
                <View style={styles.twoColumnLayout}>
                  {renderInput(
                    'First Name',
                    first_name,
                    (text) => handleInputChange('first_name', text),
                    'first_name',
                    {
                      placeholder: 'Enter first name',
                      autoCapitalize: 'words',
                      icon: 'account'
                    }
                  )}

                  {renderInput(
                    'Last Name',
                    last_name,
                    (text) => handleInputChange('last_name', text),
                    'last_name',
                    {
                      placeholder: 'Enter last name',
                      autoCapitalize: 'words',
                      icon: 'account-outline'
                    }
                  )}

                  {renderInput(
                    'National Identity Number (NIN)',
                    nin,
                    (text) => handleInputChange('nin', text),
                    'nin',
                    {
                      placeholder: 'Enter NIN',
                      keyboardType: 'numeric',
                      icon: 'card-account-details'
                    }
                  )}

                  {renderInput(
                    'Phone Number',
                    phone_no,
                    (text) => handleInputChange('phone_no', text),
                    'phone_no',
                    {
                      placeholder: 'Enter phone number',
                      keyboardType: 'phone-pad',
                      icon: 'phone'
                    }
                  )}
                </View>
              </View>

              {/* Business Information Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="office-building" size={20} color={colors.neonRed} />
                  <Text style={styles.sectionTitle}>Business Information</Text>
                </View>
                
                <View style={styles.twoColumnLayout}>
                  {renderInput(
                    'Business Category',
                    bus_category,
                    () => {}, // Empty function since we handle via onPress
                    'bus_category',
                    {
                      placeholder: 'Select Business Category',
                      icon: 'shape-outline',
                      editable: false,
                      onPress: () => setShowCategoryPicker(true)
                    }
                  )}

                  {renderInput(
                    'CAC Registration Number',
                    cac_reg_no,
                    (text) => handleInputChange('cac_reg_no', text),
                    'cac_reg_no',
                    {
                      placeholder: 'Enter CAC registration number',
                      autoCapitalize: 'characters',
                      icon: 'file-document'
                    }
                  )}

                  {renderInput(
                    'Business Country',
                    bus_country,
                    (text) => handleInputChange('bus_country', text),
                    'bus_country',
                    {
                      placeholder: 'Enter business country',
                      autoCapitalize: 'words',
                      icon: 'earth'
                    }
                  )}

                  {renderInput(
                    'Business State/Province',
                    bus_state,
                    (text) => handleInputChange('bus_state', text),
                    'bus_state',
                    {
                      placeholder: 'Enter business state/province',
                      autoCapitalize: 'words',
                      icon: 'map-marker'
                    }
                  )}
                </View>
                
                <View style={styles.fullWidthInput}>
                  {renderInput(
                    'Business Street Address',
                    bus_street,
                    (text) => handleInputChange('bus_street', text),
                    'bus_street',
                    {
                      placeholder: 'Enter street address',
                      autoCapitalize: 'words',
                      icon: 'road'
                    }
                  )}
                </View>
              </View>

              {/* Account Information Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="email" size={20} color={colors.neonRed} />
                  <Text style={styles.sectionTitle}>Account Information</Text>
                </View>
                
                <View style={styles.twoColumnLayout}>
                  {renderInput(
                    'Email Address',
                    email,
                    (text) => handleInputChange('email', text),
                    'email',
                    {
                      placeholder: 'Enter email address',
                      keyboardType: 'email-address',
                      autoCapitalize: 'none',
                      icon: 'email'
                    }
                  )}

                  {renderInput(
                    'Password',
                    password,
                    (text) => handleInputChange('password', text),
                    'password',
                    {
                      placeholder: 'Enter password',
                      secureTextEntry: true,
                      icon: 'lock',
                      showPasswordToggle: true
                    }
                  )}

                  <View style={styles.inputContainer}>
                    <View style={styles.inputLabelContainer}>
                      <Icon name="lock-check" size={18} color={colors.neonRed} />
                      <Text style={styles.inputLabel}>Confirm Password</Text>
                    </View>
                    <View style={styles.textInputWrapper}>
                      <TextInput
                        style={[
                          styles.textInput,
                          errors.password && styles.inputError
                        ]}
                        value={retPass}
                        onChangeText={setRetPass}
                        placeholder="Confirm password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showRetPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={styles.inputIconRight}
                        onPress={() => setShowRetPassword(!showRetPassword)}
                        disabled={loading}
                      >
                        <Icon
                          name={showRetPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color={colors.neonRed}
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                    <View style={styles.underLine} />
                  </View>
                </View>
              </View>

              {/* Vendor Policy Section */}
              <View style={styles.policySection}>
                <View style={styles.checkboxContainer}>
                  <CheckBox
                    value={ven_policy}
                    onValueChange={(value) => handleInputChange('ven_policy', value)}
                    tintColors={{ true: colors.neonRed, false: colors.silver }}
                    disabled={loading}
                    boxType="square"
                    style={styles.checkbox}
                  />
                  <View style={styles.policyTextContainer}>
                    <Text style={styles.policyText}>
                      I agree to the{' '}
                      <Text style={styles.policyLink} onPress={() => {/* Navigate to policy */}}>
                        Vendor Policy
                      </Text>
                    </Text>
                    <Text style={styles.policyDescription}>
                      By checking this box, you agree to our terms and conditions regarding vendor registration and operation.
                    </Text>
                  </View>
                </View>
                {errors.ven_policy && (
                  <Text style={styles.errorText}>{errors.ven_policy}</Text>
                )}
              </View>

              {/* Vendor Benefits Section */}
              <View style={styles.benefitsSection}>
                <View style={styles.benefitsHeader}>
                  <Icon name="office-building" size={20} color="#1E40AF" />
                  <Text style={styles.benefitsTitle}>Vendor Benefits</Text>
                </View>
                <View style={styles.benefitsList}>
                  {[
                    'Access to large customer base',
                    'Secure payment processing',
                    'Real-time order tracking',
                    'Dedicated vendor support',
                    'Marketing and promotion'
                  ].map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Icon name="check-circle" size={16} color="#10B981" />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                  onPress={handleVendorRegistration}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.registerButtonText}>Register as Vendor</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <View style={styles.loginLinkContainer}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('login')}
                    disabled={loading}
                  >
                    <Text style={styles.loginLink}>Login Instead</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Picker Modal */}
      {renderCategoryPicker()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pearlWhite,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neonRed,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  photoUploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  uploadArea: {
    flex: 1,
    marginRight: 16,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadIconContainer: {
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neonRed,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: colors.gray,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.pearlWhite,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.silver,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    marginBottom: 30,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  twoColumnLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fullWidthInput: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  textInputWrapper: {
    position: 'relative',
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: '#111827',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  underLine: {
    height: 1,
    backgroundColor: colors.neonRed,
    marginTop: 4,
  },
  inputIconRight: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  pickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.pearlWhite,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '50%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neonRed,
  },
  picker: {
    marginTop: 10,
  },
  policySection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
  },
  policyTextContainer: {
    flex: 1,
  },
  policyText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  policyLink: {
    color: colors.neonRed,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  policyDescription: {
    fontSize: 12,
    color: colors.gray,
    lineHeight: 16,
  },
  benefitsSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 8,
  },
  benefitsList: {
    paddingLeft: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  actionSection: {
    marginBottom: 32,
  },
  registerButton: {
    backgroundColor: colors.neonRed,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  registerButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: colors.neonRed,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default RegisterVendorScreen;