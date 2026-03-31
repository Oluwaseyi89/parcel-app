// types/navigation.ts
// export type Product = {
//   id: string;
//   name: string;
//   price: number;
//   description: string;
//   category: string;
//   // Add other product properties as needed
// };


export interface Product {
  id: string;
  prod_photo: string;
  prod_desc: string;
  prod_name: string;
  prod_model: string;
  prod_price: number;
  prod_qty: number;
}

// Main stack navigator params
export type RootStackParamList = {
  Login: undefined;
  RegisterCustomer: undefined;
  RegisterVendor: undefined;
  RegisterCourier: undefined;
  Customer: undefined;
  Vendor: undefined;
  Courier: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
  Checkout: { product: Product };
  ProductDetail: { productId: string };
  Home: undefined;
  Settings: undefined;
  // Add all your screen names here
  [key: string]: undefined | { [key: string]: any };
};

// Customer tab navigator params
export type CustomerTabParamList = {
  customerHome: undefined;
  customerProducts: undefined;
  customerTrackOrder: undefined;
  customerCart: undefined;
  customerOrders: undefined;
  customerProfile: undefined;
};

// Vendor tab navigator params
export type VendorTabParamList = {
  vendorHome: undefined;
  vendorProducts: undefined;
  vendorOrders: undefined;
  vendorProfile: undefined;
  vendorAnalytics: undefined;
};

// Courier tab navigator params
export type CourierTabParamList = {
  courierHome: undefined;
  courierOrders: undefined;
  courierProfile: undefined;
  courierEarnings: undefined;
};

// Authentication stack params
export type AuthStackParamList = {
  Login: undefined;
  RegisterCustomer: undefined;
  RegisterVendor: undefined;
  RegisterCourier: undefined;
  ForgotPassword: undefined;
};

// Navigation prop types for TypeScript
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Type aliases for easier use
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type CustomerTabNavigationProp = BottomTabNavigationProp<CustomerTabParamList>;
export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// Screen props types
export type LoginScreenProps = {
  navigation: RootStackNavigationProp;
};

export type CustomerScreenProps = {
  navigation: RootStackNavigationProp;
};

export type CheckoutScreenProps = {
  navigation: RootStackNavigationProp;
  route: { params: { product: Product } };
};

// Utility type for any screen component
export type ScreenProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: {
    params: RootStackParamList[T];
  };
};

















// export type RootStackParamList = {
//   customer: undefined;
//   vendor: undefined;
//   courier: undefined;
//   login: undefined;
//   registerCustomer: undefined;
//   registerVendor: undefined;
//   registerCourier: undefined;
//   // ... other screens
// };