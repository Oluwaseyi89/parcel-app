// screens/VendorScreen.tsx
import React from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import { RouteProp, NavigationProp } from '@react-navigation/native';
import { colors } from '../config/colors';
import VendorProductScreen from './vendorHome/VendorProductScreen';
import VendorDealScreen from './vendorHome/VendorDealScreen';
import VendorTransactionScreen from './vendorHome/VendorTransactionScreen';
import VendorResolutionScreen from './vendorHome/VendorResolutionScreen';
import VendorNotificationScreen from './vendorHome/VendorNotificationScreen';
import { RootStackParamList } from '../types/navigation';

// Define tab navigation param list
export type VendorTabParamList = {
  vendorProduct: undefined;
  vendorDeal: undefined;
  vendorTransaction: undefined;
  vendorResolution: undefined;
  vendorNotification: undefined;
};

// Define props for VendorScreen
type VendorScreenProps = {
  navigation: any;
  route: RouteProp<RootStackParamList, 'vendor'>;
};

interface VendorHeaderProps {
  navigation: NavigationProp<RootStackParamList>;
}

// Create the tab navigator with proper typing
const Tab = createMaterialTopTabNavigator<VendorTabParamList>();

// Tab screen options with TypeScript typing
const tabScreenOptions: MaterialTopTabNavigationOptions = {
  tabBarActiveTintColor: colors.neonRed,
  tabBarInactiveTintColor: colors.gray,
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
  tabBarIndicatorStyle: {
    backgroundColor: colors.neonRed,
    height: 3,
  },
  tabBarStyle: {
    backgroundColor: colors.pearlWhite,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.silver,
  },
  tabBarPressColor: 'transparent',
  tabBarPressOpacity: 0.7,
  tabBarScrollEnabled: true,
  tabBarBounces: true,
};

// Tab configuration interface for better type safety
interface VendorTabConfig {
  name: keyof VendorTabParamList;
  component: React.ComponentType<any>;
  label: string;
  accessibilityLabel: string;
}

// Tab configurations array
const vendorTabs: VendorTabConfig[] = [
  {
    name: 'vendorProduct',
    component: VendorProductScreen,
    label: 'Products',
    accessibilityLabel: 'Vendor Products',
  },
  {
    name: 'vendorDeal',
    component: VendorDealScreen,
    label: 'Deals',
    accessibilityLabel: 'Vendor Deals',
  },
  {
    name: 'vendorTransaction',
    component: VendorTransactionScreen,
    label: 'Transactions',
    accessibilityLabel: 'Vendor Transactions',
  },
  {
    name: 'vendorResolution',
    component: VendorResolutionScreen,
    label: 'Resolutions',
    accessibilityLabel: 'Vendor Resolutions',
  },
  {
    name: 'vendorNotification',
    component: VendorNotificationScreen,
    label: 'Notifications',
    accessibilityLabel: 'Vendor Notifications',
  },
];

// Main VendorScreen component
const VendorScreen: React.FC<VendorScreenProps> = ({ navigation, route }) => {
  // Access route parameters if needed
  // const { someParam } = route.params || {};

  return (
    <View style={styles.container}>
      {/* Optional header can be added here */}
      <VendorHeader navigation={navigation} />
      
    <Tab.Navigator
    initialRouteName="vendorProduct"
    screenOptions={{
        ...tabScreenOptions,
        swipeEnabled: true,
        animationEnabled: true,
        sceneStyle: styles.sceneContainer, // Use sceneStyle instead
    }}
    tabBarPosition="top"
    backBehavior="none"
    >
        {vendorTabs.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              tabBarLabel: tab.label,
              tabBarAccessibilityLabel: tab.accessibilityLabel,
            }}
          />
        ))}
      </Tab.Navigator>
    </View>
  );
};

// Alternative implementation with individual Tab.Screen declarations
export const VendorScreenAlternative: React.FC<VendorScreenProps> = ({ navigation, route }) => {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
            tabBarActiveTintColor: colors.neonRed,
            tabBarInactiveTintColor: colors.gray,
            tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            },
            tabBarIndicatorStyle: {
            backgroundColor: colors.neonRed,
            height: 3,
            },
            tabBarStyle: {
            backgroundColor: colors.pearlWhite,
            elevation: 0,
            shadowOpacity: 0,
            },
            tabBarScrollEnabled: true,
            swipeEnabled: true, // Replaces pager prop
            animationEnabled: true, // Enables smooth transitions
        }}
      >
        <Tab.Screen
          name="vendorProduct"
          component={VendorProductScreen}
          options={{ tabBarLabel: 'Products' }}
        />
        <Tab.Screen
          name="vendorDeal"
          component={VendorDealScreen}
          options={{ tabBarLabel: 'Deals' }}
        />
        <Tab.Screen
          name="vendorTransaction"
          component={VendorTransactionScreen}
          options={{ tabBarLabel: 'Transactions' }}
        />
        <Tab.Screen
          name="vendorResolution"
          component={VendorResolutionScreen}
          options={{ tabBarLabel: 'Resolutions' }}
        />
        <Tab.Screen
          name="vendorNotification"
          component={VendorNotificationScreen}
          options={{ tabBarLabel: 'Notifications' }}
        />
      </Tab.Navigator>
    </View>
  );
};

// Simple implementation matching original structure
export const VendorScreenSimple: React.FC<VendorScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: colors.neonRed,
    tabBarLabelStyle: { color: colors.neonRed },
    swipeEnabled: true,
    animationEnabled: true
  }}
>
        <Tab.Screen name="vendorProduct" component={VendorProductScreen} options={{ title: "Products" }} />
        <Tab.Screen name="vendorDeal" component={VendorDealScreen} options={{ title: "Deals" }} />
        <Tab.Screen name="vendorTransaction" component={VendorTransactionScreen} options={{ title: "Transactions" }} />
        <Tab.Screen name="vendorResolution" component={VendorResolutionScreen} options={{ title: "Resolutions" }} />
        <Tab.Screen name="vendorNotification" component={VendorNotificationScreen} options={{ title: "Notifications" }} />
      </Tab.Navigator>
    </View>
  );
};



const VendorHeader: React.FC<VendorHeaderProps> = ({ navigation }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Vendor Dashboard</Text>
    </View>
  );
};

// StyleSheet with TypeScript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pearlWhite,
  },
  sceneContainer: {
    backgroundColor: colors.pearlWhite,
    paddingTop: 8,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.pearlWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.silver,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neonRed,
  },
  // Additional styles
  tabBar: {
    backgroundColor: colors.pearlWhite,
    shadowColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.silver,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  tabIndicator: {
    backgroundColor: colors.neonRed,
    height: 3,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
});

// Default export
export default VendorScreen;

// Types for navigation context
export interface VendorScreenNavigationProps {
  navigate: (screen: keyof VendorTabParamList, params?: any) => void;
  goBack: () => void;
}

// Example of using with navigation prop
export const VendorScreenWithNavigation: React.FC<{ navigation: VendorScreenNavigationProps }> = ({ navigation }) => {
  const handleTabPress = (tabName: keyof VendorTabParamList) => {
    // Example navigation logic
    navigation.navigate(tabName);
  };

  return (
    <View style={styles.container}>
      <VendorScreen navigation={navigation} route={{ key: 'vendor', name: 'vendor' } as any} />
    </View>
  );
};

