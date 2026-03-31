// screens/CustomerScreen.tsx
import React from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../config/colors';
import CustomerHomeScreen from './customerHome/CustomerHomeScreen';
import CustomerCatalogueScreen from './customerHome/CustomerCatalogueScreen';
import CustomerCartScreen from './customerHome/CustomerCartScreen';
import CustomerHotDealsScreen from './customerHome/CustomerHotDealsScreen';
import CustomerOrdersScreen from './customerHome/CustomerOrdersScreen';
import CustomerDeliveriesScreen from './customerHome/CustomerDeliveriesScreen';
import CustomerResolutionScreen from './customerHome/CustomerResolutionScreen';
import { RootStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define tab navigation param list
export type CustomerTabParamList = {
  customerHome: undefined;
  customerCatalogue: undefined;
  customerHotDeals: undefined;
  customerCart: undefined;
  customerOrders: undefined;
  customerDeliveries: undefined;
  customerResolution: undefined;
};

// Define props for CustomerScreen
// type CustomerScreenProps = {
//   navigation: any;
//   route: RouteProp<RootStackParamList, 'customer'>;
// };

// Create the tab navigator with proper typing
const Tab = createMaterialTopTabNavigator<CustomerTabParamList>();

type Props = NativeStackScreenProps<RootStackParamList, 'customer'>;


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
interface CustomerTabConfig {
  name: keyof CustomerTabParamList;
  component: React.ComponentType<any>;
  label: string;
  accessibilityLabel: string;
}

// Tab configurations array
const customerTabs: CustomerTabConfig[] = [
  {
    name: 'customerHome',
    component: CustomerHomeScreen,
    label: 'Home',
    accessibilityLabel: 'Customer Home',
  },
  {
    name: 'customerCatalogue',
    component: CustomerCatalogueScreen,
    label: 'Catalogue',
    accessibilityLabel: 'Customer Catalogue',
  },
  {
    name: 'customerHotDeals',
    component: CustomerHotDealsScreen,
    label: 'Hot Deals',
    accessibilityLabel: 'Customer Hot Deals',
  },
  {
    name: 'customerCart',
    component: CustomerCartScreen,
    label: 'Cart',
    accessibilityLabel: 'Customer Cart',
  },
  {
    name: 'customerOrders',
    component: CustomerOrdersScreen,
    label: 'Orders',
    accessibilityLabel: 'Customer Orders',
  },
  {
    name: 'customerDeliveries',
    component: CustomerDeliveriesScreen,
    label: 'Deliveries',
    accessibilityLabel: 'Customer Deliveries',
  },
  {
    name: 'customerResolution',
    component: CustomerResolutionScreen,
    label: 'Resolution',
    accessibilityLabel: 'Customer Resolution',
  },
];

// Main CustomerScreen component
const CustomerScreen: React.FC<Props> = ({ navigation, route }) => {
  // Access route parameters if needed
  // const { someParam } = route.params || {};

  return (
    <View style={styles.container}>
      {/* Optional header can be added here */}
      {/* <CustomerHeader navigation={navigation} /> */}
      
      {/* <Tab.Navigator
        initialRouteName="customerHome"
        screenOptions={tabScreenOptions}
        pager={(props) => <ViewPagerAdapter {...props} />}
        tabBarPosition="top"
        backBehavior="none"
        sceneContainerStyle={styles.sceneContainer}
      > */}

      {/* <Tab.Navigator
  initialRouteName="customerHome"
  screenOptions={{
    ...tabScreenOptions,
    tabBarPosition: 'top', // Use tabBarPosition here instead
    // Remove: pager, sceneContainerStyle (not supported in v6)
    // Add proper swipe/animation settings:
    swipeEnabled: true,
    animationEnabled: true,
  }}
  backBehavior="none"
> */}

<Tab.Navigator
  initialRouteName="customerHome"
  screenOptions={{
    ...tabScreenOptions,
    swipeEnabled: true,
    animationEnabled: true,
  }}
  tabBarPosition="top"
  backBehavior="none"
>
        {customerTabs.map((tab) => (
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
export const CustomerScreenAlternative: React.FC<CustomerScreenProps> = ({ navigation, route }) => {
  return (
    <View style={styles.container}>
      {/* <Tab.Navigator
        tabBarOptions={{
          activeTintColor: colors.neonRed,
          inactiveTintColor: colors.gray,
          labelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          indicatorStyle: {
            backgroundColor: colors.neonRed,
            height: 3,
          },
          style: {
            backgroundColor: colors.pearlWhite,
            elevation: 0,
            shadowOpacity: 0,
          },
          scrollEnabled: true,
        }}
        pager={(props) => <ViewPagerAdapter {...props} />}
      > */}

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
    swipeEnabled: true,
    animationEnabled: true,
  }}
>
        <Tab.Screen
          name="customerHome"
          component={CustomerHomeScreen}
          options={{ tabBarLabel: 'Home' }}
        />
        <Tab.Screen
          name="customerCatalogue"
          component={CustomerCatalogueScreen}
          options={{ tabBarLabel: 'Catalogue' }}
        />
        <Tab.Screen
          name="customerHotDeals"
          component={CustomerHotDealsScreen}
          options={{ tabBarLabel: 'Hot Deals' }}
        />
        <Tab.Screen
          name="customerCart"
          component={CustomerCartScreen}
          options={{ tabBarLabel: 'Cart' }}
        />
        <Tab.Screen
          name="customerOrders"
          component={CustomerOrdersScreen}
          options={{ tabBarLabel: 'Orders' }}
        />
        <Tab.Screen
          name="customerDeliveries"
          component={CustomerDeliveriesScreen}
          options={{ tabBarLabel: 'Deliveries' }}
        />
        <Tab.Screen
          name="customerResolution"
          component={CustomerResolutionScreen}
          options={{ tabBarLabel: 'Resolution' }}
        />
      </Tab.Navigator>
    </View>
  );
};

// Simple implementation matching original structure
export const CustomerScreenSimple: React.FC<CustomerScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* <Tab.Navigator
        tabBarOptions={{
          activeTintColor: colors.neonRed,
          labelStyle: { color: colors.neonRed }
        }}
        pager={props => <ViewPagerAdapter {...props} />}
      > */}


      <Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: colors.neonRed,
    tabBarLabelStyle: { color: colors.neonRed },
    swipeEnabled: true,
    animationEnabled: true,
  }}
>
        <Tab.Screen name="customerHome" component={CustomerHomeScreen} options={{ title: "Home" }} />
        <Tab.Screen name="customerCatalogue" component={CustomerCatalogueScreen} options={{ title: "Catalogue" }} />
        <Tab.Screen name="customerHotDeals" component={CustomerHotDealsScreen} options={{ title: "HotDeals" }} />
        <Tab.Screen name="customerCart" component={CustomerCartScreen} options={{ title: "Cart" }} />
        <Tab.Screen name="customerOrders" component={CustomerOrdersScreen} options={{ title: "Orders" }} />
        <Tab.Screen name="customerDeliveries" component={CustomerDeliveriesScreen} options={{ title: "Deliveries" }} />
        <Tab.Screen name="customerResolution" component={CustomerResolutionScreen} options={{ title: "Resolution" }} />
      </Tab.Navigator>
    </View>
  );
};

// Optional header component
const CustomerHeader: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Customer Dashboard</Text>
      {/* Add navigation buttons or user info here */}
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
export default CustomerScreen;

// Types for navigation context
export interface CustomerScreenNavigationProps {
  navigate: (screen: keyof CustomerTabParamList, params?: any) => void;
  goBack: () => void;
}

// Example of using with navigation prop
export const CustomerScreenWithNavigation: React.FC<{ navigation: CustomerScreenNavigationProps }> = ({ navigation }) => {
  const handleTabPress = (tabName: keyof CustomerTabParamList) => {
    // Example navigation logic
    navigation.navigate(tabName);
  };

  return (
    <View style={styles.container}>
      <CustomerScreen navigation={navigation} route={{ key: 'customer', name: 'customer' } as any} />
    </View>
  );
};
