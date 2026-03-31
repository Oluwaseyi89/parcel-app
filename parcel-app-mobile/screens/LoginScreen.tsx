// screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RadioGroup } from 'react-native-radio-buttons-group';
import { colors } from '../config/colors';
import { UseFetchJSON } from '../utils/useFetch';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

type LoginCredentials = {
  ipAddress: string;
  email: string;
  password: string;
  category: 'Customer' | 'Vendor' | 'Courier' | '';
};

type RadioButton = {
  id: string;
  label: string;
  value: 'Customer' | 'Vendor' | 'Courier';
  selected: boolean;
  color: string;
};

const radioButtonsData: RadioButton[] = [
  {
    id: "1",
    label: "Customer",
    value: "Customer",
    selected: false,
    color: colors.neonRed
  },
  {
    id: "2",
    label: "Vendor",
    value: "Vendor",
    selected: false,
    color: colors.neonRed
  },
  {
    id: "3",
    label: "Courier",
    value: "Courier",
    selected: false,
    color: colors.neonRed
  }
];

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [radioButtons, setRadioButtons] = useState<RadioButton[]>(radioButtonsData);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    ipAddress: '',
    email: '',
    password: '',
    category: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [resetPassword, setResetPassword] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { loginCustomer, loginVendor, loginCourier } = useAuthStore();
  const { showToast, showAlert } = useUIStore();

  const { ipAddress, email, password, category } = credentials;

  // Load saved IP address on mount
  useEffect(() => {
    loadSavedIP();
  }, []);

  const loadSavedIP = async () => {
    try {
      const savedIP = await AsyncStorage.getItem('@IPStore:ipAdd');
      if (savedIP) {
        setCredentials(prev => ({ ...prev, ipAddress: savedIP }));
      }
    } catch (error) {
      console.error('Error loading saved IP:', error);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (radioButtonsArray: RadioButton[]) => {
    setRadioButtons(radioButtonsArray);
    const selectedCategory = radioButtonsArray.find(btn => btn.selected)?.value || '';
    setCredentials(prev => ({ ...prev, category: selectedCategory as 'Customer' | 'Vendor' | 'Courier' | '' }));
  };

  const saveIPAddress = async () => {
    if (!ipAddress.trim()) return;
    
    try {
      await AsyncStorage.setItem('@IPStore:ipAdd', ipAddress.trim());
      showToast('IP address saved successfully', 'success');
    } catch (error: any) {
      showAlert('Error', `Failed to save IP address: ${error.message}`);
    }
  };

  const validateInputs = (): boolean => {
    if (!ipAddress || !email || !password || !category) {
      showAlert('Missing Fields', 'Please fill in all required fields');
      return false;
    }

    if (!ipAddress.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
      showAlert('Invalid IP', 'Please enter a valid IP address');
      return false;
    }

    if (!email.includes('@')) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    
    try {
      const BASE_URL = `http://${ipAddress.trim()}:7000/`;
      let endpoint = '';
      let loginAction: (data: any) => void;

      switch (category) {
        case 'Customer':
          endpoint = 'parcel_customer/customer_login_mobile/';
          loginAction = loginCustomer;
          break;
        case 'Vendor':
          endpoint = 'parcel_backends/vendor_login_mobile/';
          loginAction = loginVendor;
          break;
        case 'Courier':
          endpoint = 'parcel_backends/courier_login_mobile/';
          loginAction = loginCourier;
          break;
        default:
          throw new Error('Invalid category');
      }

      const url = BASE_URL + endpoint;
      const requestData = { email, password };

      const response = await UseFetchJSON(url, 'POST', requestData);

      if (response.status === 'success') {
        loginAction(response.data);
        
        // Save user data to AsyncStorage
        const storageKey = `@${category}Data:details`;
        await AsyncStorage.setItem(storageKey, JSON.stringify(response.data));
        
        showToast(`Welcome back, ${response.data.first_name || category}!`, 'success');
        
        // Navigate to respective dashboard
        setTimeout(() => {
          navigation.replace(category.toLowerCase() as 'customer' | 'vendor' | 'courier');
        }, 500);
        
      } else if (response.status === 'password-error') {
        showAlert(
          'Password Error',
          `${response.data}. Visit the website to reset your password.`,
          [
            { text: 'OK' },
            { 
              text: 'Reset Password', 
              onPress: () => setResetPassword(true) 
            }
          ]
        );
      } else {
        showAlert('Login Failed', response.data || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      showAlert('Login Error', error.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.includes('@')) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const BASE_URL = `http://${ipAddress.trim()}:7000/`;
      let endpoint = '';
      
      switch (category) {
        case 'Customer':
          endpoint = 'parcel_customer/customer_resetter/';
          break;
        case 'Vendor':
          endpoint = 'parcel_backends/vendor_resetter/';
          break;
        case 'Courier':
          endpoint = 'parcel_backends/courier_resetter/';
          break;
        default:
          showAlert('Error', 'Please select a category first');
          return;
      }

      const url = BASE_URL + endpoint;
      const requestData = { email: resetEmail };

      const response = await UseFetchJSON(url, 'POST', requestData);

      if (response.status === 'success') {
        showAlert('Password Reset', response.data);
        setResetPassword(false);
        setResetEmail('');
      } else {
        showAlert('Reset Failed', response.data || 'Failed to reset password');
      }
    } catch (error: any) {
      showAlert('Reset Error', error.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!category) {
      showAlert('Select Category', 'Please choose a category before registering');
      return;
    }

    try {
      const savedIP = await AsyncStorage.getItem('@IPStore:ipAdd');
      if (!savedIP) {
        showAlert('IP Required', 'Please save an IP address first');
        return;
      }

      let screenName: 'registerCustomer' | 'registerVendor' | 'registerCourier';
      
      switch (category) {
        case 'Customer':
          screenName = 'registerCustomer';
          break;
        case 'Vendor':
          screenName = 'registerVendor';
          break;
        case 'Courier':
          screenName = 'registerCourier';
          break;
        default:
          return;
      }

      navigation.navigate(screenName);
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    options?: {
      placeholder?: string;
      secureTextEntry?: boolean;
      keyboardType?: 'default' | 'email-address';
      icon?: string;
      onEndEditing?: () => void;
    }
  ) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputLabelContainer}>
        <Icon 
          name={options?.icon || 'information'} 
          size={20} 
          color={colors.neonRed} 
          style={styles.inputIcon}
        />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <View style={styles.textInputWrapper}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChange}
          placeholder={options?.placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={options?.secureTextEntry && !showPassword}
          keyboardType={options?.keyboardType}
          autoCapitalize="none"
          onEndEditing={options?.onEndEditing}
          editable={!loading}
        />
        {options?.secureTextEntry && (
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
        >
          <ImageBackground
            source={require('../assets/parcel_bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image
                    style={styles.logo}
                    source={require('../assets/parcel_ico.png')}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
              </View>

              {/* IP Address Input */}
              {renderInputField(
                'Server IP Address',
                ipAddress,
                (text) => handleInputChange('ipAddress', text),
                {
                  placeholder: '192.168.42.141',
                  icon: 'server-network',
                  onEndEditing: saveIPAddress
                }
              )}

              {/* Login Form */}
              <View style={styles.formContainer}>
                {renderInputField(
                  'Email Address',
                  email,
                  (text) => handleInputChange('email', text),
                  {
                    placeholder: 'example@gmail.com',
                    keyboardType: 'email-address',
                    icon: 'email'
                  }
                )}

                {renderInputField(
                  'Password',
                  password,
                  (text) => handleInputChange('password', text),
                  {
                    placeholder: '***********',
                    secureTextEntry: true,
                    icon: 'lock'
                  }
                )}

                {/* Category Selection */}
                <View style={styles.categoryContainer}>
                  <View style={styles.categoryLabelContainer}>
                    <Icon name="account-group" size={20} color={colors.neonRed} />
                    <Text style={styles.categoryLabel}>Choose Category</Text>
                  </View>
                  <RadioGroup
                    containerStyle={styles.radioContainer}
                    radioButtons={radioButtons}
                    onPress={handleCategoryChange}
                    layout="row"
                  />
                </View>

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPasswordContainer}
                  onPress={() => setResetPassword(!resetPassword)}
                  disabled={loading}
                >
                  <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                </TouchableOpacity>

                {/* Reset Password Form */}
                {resetPassword && (
                  <View style={styles.resetContainer}>
                    <Text style={styles.resetTitle}>Reset Password</Text>
                    <View style={styles.resetInputContainer}>
                      <Icon name="email-outline" size={20} color={colors.neonRed} />
                      <TextInput
                        style={styles.resetInput}
                        placeholder="Enter your registered email"
                        value={resetEmail}
                        onChangeText={setResetEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={styles.resetButtons}>
                      <TouchableOpacity
                        style={[styles.resetButton, styles.resetButtonCancel]}
                        onPress={() => {
                          setResetPassword(false);
                          setResetEmail('');
                        }}
                        disabled={loading}
                      >
                        <Text style={styles.resetButtonTextCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.resetButton, styles.resetButtonSubmit]}
                        onPress={handleResetPassword}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.resetButtonTextSubmit}>Reset Password</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="login" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Icon name="account-plus" size={20} color={colors.neonRed} style={styles.buttonIcon} />
                  <Text style={styles.registerButtonText}>Create New Account</Text>
                </TouchableOpacity>

                {/* Benefits Section */}
                <View style={styles.benefitsContainer}>
                  <Text style={styles.benefitsTitle}>Customer Benefits</Text>
                  {[
                    'Track orders in real-time',
                    'Fast and reliable delivery',
                    'Secure payment options',
                    '24/7 customer support'
                  ].map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Icon name="check-circle" size={16} color="#10B981" />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ImageBackground>
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
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neonRed,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  textInputWrapper: {
    position: 'relative',
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: '#111827',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  underLine: {
    height: 1,
    backgroundColor: colors.neonRed,
    marginTop: 4,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  radioContainer: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.neonRed,
    fontSize: 14,
    fontWeight: '500',
  },
  resetContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
  },
  resetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  resetInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: '#111827',
  },
  resetButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  resetButtonSubmit: {
    backgroundColor: colors.neonRed,
  },
  resetButtonTextCancel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  resetButtonTextSubmit: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: colors.neonRed,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
  },
  loginButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  registerButton: {
    borderWidth: 2,
    borderColor: colors.neonRed,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  registerButtonText: {
    color: colors.neonRed,
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
});

export default LoginScreen;