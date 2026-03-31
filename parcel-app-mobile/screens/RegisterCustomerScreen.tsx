// screens/RegisterCustomerScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../config/colors';
import { UseFetchJSON } from '../utils/useFetch';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useUIStore } from '../stores/uiStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type RegisterCustomerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'registerCustomer'>;

interface Props {
  navigation: RegisterCustomerScreenNavigationProp;
}

interface CustomerDetails {
  first_name: string;
  last_name: string;
  country: string;
  state: string;
  street: string;
  phone_no: string;
  email: string;
  password: string;
  reg_date: string;
  is_email_verified: boolean;
}

const RegisterCustomerScreen: React.FC<Props> = ({ navigation }) => {
  const [details, setDetails] = useState<CustomerDetails>({
    first_name: '',
    last_name: '',
    country: '',
    state: '',
    street: '',
    phone_no: '',
    email: '',
    password: '',
    reg_date: new Date().toISOString(),
    is_email_verified: false,
  });

  const [retPass, setRetPass] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showRetPassword, setShowRetPassword] = useState<boolean>(false);

  const { showAlert, showToast } = useUIStore();

  const {
    first_name,
    last_name,
    country,
    state,
    street,
    phone_no,
    email,
    password,
  } = details;

  // Handle input field changes
  const handleInputChange = <K extends keyof CustomerDetails>(field: K, value: CustomerDetails[K]) => {
    setDetails(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validation functions
  const validateField = (field: keyof CustomerDetails, value: any): string => {
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
      
      case 'country':
      case 'state':
      case 'street':
        if (!value.trim()) return 'This field is required';
        return '';
      
      default:
        return '';
    }
  };

  const checkInput = (): { isValid: boolean; errorCount: number; errorFields: Record<string, string> } => {
    const errorFields: Record<string, string> = {};
    let errorCount = 0;

    const fieldsToValidate: (keyof CustomerDetails)[] = [
      'first_name',
      'last_name',
      'country',
      'state',
      'street',
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

  const handleCustomerRegistration = async () => {
    const validation = checkInput();
    
    if (!validation.isValid) {
      showAlert(
        'Validation Error',
        `Please fix ${validation.errorCount} error(s) before submitting.`
      );
      return;
    }

    setLoading(true);

    try {
      const fetchedIP = await AsyncStorage.getItem('@IPStore:ipAdd');
      
      if (!fetchedIP) {
        showAlert('Error', 'IP address not found. Please save IP address first.');
        return;
      }

      const routeUrl = `http://${fetchedIP}:7000/parcel_customer/reg_customer_mobile/`;
      const response = await UseFetchJSON(routeUrl, 'POST', details);

      if (response.status === 'success') {
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
          country: '',
          state: '',
          street: '',
          phone_no: '',
          email: '',
          password: '',
          reg_date: new Date().toISOString(),
          is_email_verified: false,
        });
        setRetPass('');
        setErrors({});
      } else if (response.status === 'error') {
        showAlert('Registration Failed', response.data || 'An error occurred');
      } else {
        showAlert('Error', 'An unexpected error occurred');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      showAlert('Network Error', error.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    fieldName: keyof CustomerDetails,
    options?: {
      placeholder?: string;
      secureTextEntry?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      icon?: string;
      showPasswordToggle?: boolean;
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
          editable={!loading}
        />
        {options?.showPasswordToggle && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.neonRed}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[fieldName] && (
        <Text style={styles.errorText}>{errors[fieldName]}</Text>
      )}
      <View style={styles.underLine} />
    </View>
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
                  <Icon name="account-circle" size={32} color={colors.pearlWhite} />
                </View>
                <Text style={styles.heading}>Customer Registration</Text>
                <Text style={styles.subtitle}>Create your account to start shopping</Text>
              </View>
            </View>

            {/* Form Container */}
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
                </View>
              </View>

              {/* Contact Information Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="phone" size={20} color={colors.neonRed} />
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                </View>
                
                <View style={styles.twoColumnLayout}>
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
                </View>
              </View>

              {/* Address Information Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="map-marker" size={20} color={colors.neonRed} />
                  <Text style={styles.sectionTitle}>Address Information</Text>
                </View>
                
                <View style={styles.twoColumnLayout}>
                  {renderInput(
                    'Country',
                    country,
                    (text) => handleInputChange('country', text),
                    'country',
                    {
                      placeholder: 'Enter country',
                      autoCapitalize: 'words',
                      icon: 'earth'
                    }
                  )}

                  {renderInput(
                    'State/Province',
                    state,
                    (text) => handleInputChange('state', text),
                    'state',
                    {
                      placeholder: 'Enter state/province',
                      autoCapitalize: 'words',
                      icon: 'map-marker-radius'
                    }
                  )}
                </View>
                
                <View style={styles.fullWidthInput}>
                  {renderInput(
                    'Street Address',
                    street,
                    (text) => handleInputChange('street', text),
                    'street',
                    {
                      placeholder: 'Enter street address',
                      autoCapitalize: 'words',
                      icon: 'road'
                    }
                  )}
                </View>
              </View>

              {/* Account Security Section */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="lock" size={20} color={colors.neonRed} />
                  <Text style={styles.sectionTitle}>Account Security</Text>
                </View>
                
                <View style={styles.twoColumnLayout}>
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
                        style={styles.passwordToggle}
                        onPress={() => setShowRetPassword(!showRetPassword)}
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

              {/* Customer Benefits Section */}
              <View style={styles.benefitsSection}>
                <View style={styles.benefitsHeader}>
                  <Icon name="check-circle" size={20} color="#1E40AF" />
                  <Text style={styles.benefitsTitle}>Customer Benefits</Text>
                </View>
                <View style={styles.benefitsList}>
                  {[
                    'Fast and reliable delivery services',
                    'Secure payment options',
                    'Order tracking in real-time',
                    '24/7 customer support'
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
                  onPress={handleCustomerRegistration}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.registerButtonText}>Register as Customer</Text>
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
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 12,
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

export default RegisterCustomerScreen;