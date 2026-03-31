import React from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import { RouteProp, useRoute, NavigationProp } from '@react-navigation/native';
import { colors } from '../config/colors';
import CourierDealScreen from './courierHome/CourierDealScreen';
import CourierDispatchScreen from './courierHome/CourierDispatchScreen';
import CourierTransactionScreen from './courierHome/CourierTransactionScreen';
import CourierResolutionScreen from './courierHome/CourierResolutionScreen';
import CourierNotificationScreen from './courierHome/CourierNotificationScreen';
import { RootStackParamList } from '../types/navigation';

// Define tab navigation param list
export type CourierTabParamList = {
  courierDeal: undefined;
  courierDispatch: undefined;
  courierTransaction: undefined;
  courierResolution: undefined;
  courierNotification: undefined;
};

// Define props for CourierScreen
type CourierScreenProps = {
  navigation: any; // Using any for navigation to avoid complex type definitions
  route: RouteProp<RootStackParamList, 'courier'>;
};

interface CourierHeaderProps {
  navigation: NavigationProp<RootStackParamList>;
}

// Create the tab navigator with proper typing
const Tab = createMaterialTopTabNavigator<CourierTabParamList>();

// Tab screen options
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
};

// Tab bar label formatter
const formatTabLabel = (routeName: string): string => {
  const labelMap: Record<string, string> = {
    courierDeal: 'Deals',
    courierDispatch: 'Dispatch',
    courierTransaction: 'Transactions',
    courierResolution: 'Resolutions',
    courierNotification: 'Notifications',
  };
  return labelMap[routeName] || routeName;
};

const CourierScreen: React.FC<CourierScreenProps> = ({ navigation, route }) => {
  // You can access route.params here if needed
  // const { someParam } = route.params || {};

  return (
    <View style={styles.container}>
      {/* Optional: Header component could be added here */}
      <CourierHeader navigation={navigation} />
      
      {/* <Tab.Navigator
        initialRouteName="courierDeal"
        screenOptions={tabScreenOptions}
        pager={(props) => <ViewPagerAdapter {...props} />}
        tabBarPosition="top"
        backBehavior="none"
        sceneContainerStyle={styles.sceneContainer}
      > */}

      <Tab.Navigator
  initialRouteName="courierDeal"
  screenOptions={{
    ...tabScreenOptions,
    // sceneContainerStyle moved here as sceneStyle
    sceneStyle: styles.sceneContainer,
  }}
  tabBarPosition="top"
  backBehavior="none"
>
        <Tab.Screen
          name="courierDeal"
          component={CourierDealScreen}
          options={{
            tabBarLabel: 'Deals',
            tabBarAccessibilityLabel: 'Courier Deals',
          }}
        />
        <Tab.Screen
          name="courierDispatch"
          component={CourierDispatchScreen}
          options={{
            tabBarLabel: 'Dispatch',
            tabBarAccessibilityLabel: 'Courier Dispatch',
          }}
        />
        <Tab.Screen
          name="courierTransaction"
          component={CourierTransactionScreen}
          options={{
            tabBarLabel: 'Transactions',
            tabBarAccessibilityLabel: 'Courier Transactions',
          }}
        />
        <Tab.Screen
          name="courierResolution"
          component={CourierResolutionScreen}
          options={{
            tabBarLabel: 'Resolutions',
            tabBarAccessibilityLabel: 'Courier Resolutions',
          }}
        />
        <Tab.Screen
          name="courierNotification"
          component={CourierNotificationScreen}
          options={{
            tabBarLabel: 'Notifications',
            tabBarAccessibilityLabel: 'Courier Notifications',
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

// Alternative: Functional component with inline tab configuration
export const CourierScreenAlternative: React.FC<CourierScreenProps> = ({ navigation, route }) => {
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
    swipeEnabled: true,
    animationEnabled: true,
  }}
>
        <Tab.Screen
          name="courierDeal"
          component={CourierDealScreen}
          options={{ tabBarLabel: 'Deals' }}
        />
        <Tab.Screen
          name="courierDispatch"
          component={CourierDispatchScreen}
          options={{ tabBarLabel: 'Dispatch' }}
        />
        <Tab.Screen
          name="courierTransaction"
          component={CourierTransactionScreen}
          options={{ tabBarLabel: 'Transactions' }}
        />
        <Tab.Screen
          name="courierResolution"
          component={CourierResolutionScreen}
          options={{ tabBarLabel: 'Resolutions' }}
        />
        <Tab.Screen
          name="courierNotification"
          component={CourierNotificationScreen}
          options={{ tabBarLabel: 'Notifications' }}
        />
      </Tab.Navigator>
    </View>
  );
};

// With TypeScript interface for better type safety
interface TabConfig {
  name: keyof CourierTabParamList;
  component: React.ComponentType<any>;
  label: string;
  accessibilityLabel: string;
}

const courierTabs: TabConfig[] = [
  {
    name: 'courierDeal',
    component: CourierDealScreen,
    label: 'Deals',
    accessibilityLabel: 'Courier Deals',
  },
  {
    name: 'courierDispatch',
    component: CourierDispatchScreen,
    label: 'Dispatch',
    accessibilityLabel: 'Courier Dispatch',
  },
  {
    name: 'courierTransaction',
    component: CourierTransactionScreen,
    label: 'Transactions',
    accessibilityLabel: 'Courier Transactions',
  },
  {
    name: 'courierResolution',
    component: CourierResolutionScreen,
    label: 'Resolutions',
    accessibilityLabel: 'Courier Resolutions',
  },
  {
    name: 'courierNotification',
    component: CourierNotificationScreen,
    label: 'Notifications',
    accessibilityLabel: 'Courier Notifications',
  },
];

// Dynamic tab creation version
export const CourierScreenDynamic: React.FC<CourierScreenProps> = ({ navigation, route }) => {
  return (
    <View style={styles.container}>
      {/* <Tab.Navigator
        initialRouteName="courierDeal"
        screenOptions={{
          tabBarActiveTintColor: colors.neonRed,
          tabBarInactiveTintColor: colors.gray,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIndicatorStyle: styles.tabIndicator,
          tabBarStyle: styles.tabBar,
          tabBarScrollEnabled: true,
          tabBarItemStyle: styles.tabItem,
        }}
        pager={(props) => <ViewPagerAdapter {...props} />}
      > */}


      <Tab.Navigator
  initialRouteName="courierDeal"
  screenOptions={{
    tabBarActiveTintColor: colors.neonRed,
    tabBarInactiveTintColor: colors.gray,
    tabBarLabelStyle: styles.tabLabel,
    tabBarIndicatorStyle: styles.tabIndicator,
    tabBarStyle: styles.tabBar,
    tabBarScrollEnabled: true,
    tabBarItemStyle: styles.tabItem,
    // Add these instead of pager:
    swipeEnabled: true,
    animationEnabled: true,
  }}
>
        {courierTabs.map((tab) => (
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

// Header component (optional)
const CourierHeader: React.FC<{ navigation: CourierHeaderProps }> = ({ navigation }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Courier Dashboard</Text>
      {/* Add back button or other header actions here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pearlWhite,
  },
  sceneContainer: {
    backgroundColor: colors.pearlWhite,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.pearlWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.silver,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neonRed,
    textAlign: 'center',
  },
  // Tab styles for dynamic version
  tabBar: {
    backgroundColor: colors.pearlWhite,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.silver,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
  tabIndicator: {
    backgroundColor: colors.neonRed,
    height: 3,
  },
  tabItem: {
    width: 'auto',
    minWidth: 80,
    paddingHorizontal: 8,
  },
});

export default CourierScreen;
