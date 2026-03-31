import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import RegisterCustomerScreen from './screens/RegisterCustomerScreen';
import RegisterVendorScreen from './screens/RegisterVendorScreen';
import RegisterCourierScreen from './screens/RegisterCourierScreen';
import CustomerScreen from './screens/CustomerScreen';
import VendorScreen from './screens/VendorScreen';
import CourierScreen from './screens/CourierScreen';
import CustomerHomeScreen from './screens/customerHome/CustomerHomeScreen';
import CustomerCatalogueScreen from './screens/customerHome/CustomerCatalogueScreen';
import CustomerHotDealsScreen from './screens/customerHome/CustomerHotDealsScreen';
import CustomerCartScreen from './screens/customerHome/CustomerCartScreen';
import CustomerOrdersScreen from './screens/customerHome/CustomerOrdersScreen';
import CustomerDeliveriesScreen from './screens/customerHome/CustomerDeliveriesScreen';
import CustomerResolutionScreen from './screens/customerHome/CustomerResolutionScreen';
import VendorProductScreen from './screens/vendorHome/VendorProductScreen';
import VendorDealScreen from './screens/vendorHome/VendorDealScreen';
import VendorTransactionScreen from './screens/vendorHome/VendorTransactionScreen';
import VendorResolutionScreen from './screens/vendorHome/VendorResolutionScreen';
import VendorNotificationScreen from './screens/vendorHome/VendorNotificationScreen';
import CourierDealScreen from './screens/courierHome/CourierDealScreen';
import CourierDispatchScreen from './screens/courierHome/CourierDispatchScreen';
import CourierNotificationScreen from './screens/courierHome/CourierNotificationScreen';
import CourierResolutionScreen from './screens/courierHome/CourierResolutionScreen';
import CourierTransactionScreen from './screens/courierHome/CourierTransactionScreen';

import { useCartStore } from './stores/cartStore';
import { useAuthStore } from './stores/authStore';

const Stack = createNativeStackNavigator();

const App = () => {
const initializeCart = useCartStore((state: any) => state.initializeCart);
const initializeAuth = useAuthStore((state: any) => state.initializeAuth);

useEffect(() => {
initializeCart();
initializeAuth();
}, [initializeCart, initializeAuth]);

return (

 
<NavigationContainer>
  <Stack.Navigator
    initialRouteName="login"
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right' // or 'default', 'none', 'fade', 'slide_from_bottom', etc.
    }}
  >
 
<Stack.Screen name="login" component={LoginScreen} />
<Stack.Screen name="registerCustomer" component={RegisterCustomerScreen} />
<Stack.Screen name="registerVendor" component={RegisterVendorScreen} />
<Stack.Screen name="registerCourier" component={RegisterCourierScreen} />
<Stack.Screen name="customer" component={CustomerScreen} options={{ title: 'Customer Screen' }} />
<Stack.Screen name="vendor" component={VendorScreen} options={{ title: 'Vendor Screen' }} />
<Stack.Screen name="courier" component={CourierScreen} options={{ title: 'Courier Screen' }} />
<Stack.Screen name="customerHome" component={CustomerHomeScreen} options={{ title: 'Home' }} />
<Stack.Screen name="customerCatalogue" component={CustomerCatalogueScreen} options={{ title: 'Catalogue' }} />
<Stack.Screen name="customerHotDeals" component={CustomerHotDealsScreen} options={{ title: 'HotDeals' }} />
<Stack.Screen name="customerCart" component={CustomerCartScreen} options={{ title: 'Cart' }} />
<Stack.Screen name="customerOrders" component={CustomerOrdersScreen} options={{ title: 'Orders' }} />
<Stack.Screen name="customerDeliveries" component={CustomerDeliveriesScreen} options={{ title: 'Deliveries' }} />
<Stack.Screen name="customerResolution" component={CustomerResolutionScreen} options={{ title: 'Resolution' }} />
<Stack.Screen name="vendorProduct" component={VendorProductScreen} options={{ title: 'Products' }} />
<Stack.Screen name="vendorDeal" component={VendorDealScreen} options={{ title: 'Deals' }} />
<Stack.Screen name="vendorTransaction" component={VendorTransactionScreen} options={{ title: 'Transactions' }} />
<Stack.Screen name="vendorResolution" component={VendorResolutionScreen} options={{ title: 'Resolutions' }} />
<Stack.Screen name="vendorNotification" component={VendorNotificationScreen} options={{ title: 'Notifications' }} />
<Stack.Screen name="courierDeal" component={CourierDealScreen} options={{ title: 'Deals' }} />
<Stack.Screen name="courierDispatch" component={CourierDispatchScreen} options={{ title: 'Dispatches' }} />
<Stack.Screen name="courierNotification" component={CourierNotificationScreen} options={{ title: 'Notifications' }} />
<Stack.Screen name="courierResolution" component={CourierResolutionScreen} options={{ title: 'Resolutions' }} />
<Stack.Screen name="courierTransaction" component={CourierTransactionScreen} options={{ title: 'Transactions' }} />
</Stack.Navigator>
</NavigationContainer>
);
};

export default App;

