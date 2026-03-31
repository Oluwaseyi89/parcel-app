import { useEffect } from 'react';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';

// Hook for fetching products with loading and error states
export const useFetchProducts = (apiUrl: string) => {
  const { setProducts, setLoading, setError } = useProductStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        setProducts(data);
        setLoading(false);
      } catch (error: any) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl, setProducts, setLoading, setError]);
};

// Hook to initialize all stores on app mount
export const useInitializeStores = () => {
  const initializeCart = useCartStore((state) => state.initializeCart);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeCart();
    initializeAuth();
  }, [initializeCart, initializeAuth]);
};

// Hook for managing form state integrated with cart
export const useCartCheckoutForm = () => {
  const { cart, cartTotal } = useCartStore();
  const { customer } = useAuthStore();

  return {
    cart,
    cartTotal,
    customer,
    isLoggedIn: !!customer,
  };
};

// Hook for protecting routes based on authentication
export const useRequireAuth = (requiredRole: string | null = null) => {
  const { customer, vendor, courier, isAuthenticated } = useAuthStore();

  const isAuthorized = () => {
    if (!isAuthenticated) return false;
    if (requiredRole === 'customer') return !!customer;
    if (requiredRole === 'vendor') return !!vendor;
    if (requiredRole === 'courier') return !!courier;
    return isAuthenticated;
  };

  return {
    isAuthorized: isAuthorized(),
    customer,
    vendor,
    courier,
  };
};

// Hook for managing cart item operations
export const useCartOperations = () => {
  const { addToCart, removeFromCart, updateCartItemQuantity, clearCart } = useCartStore();

  return {
    addItem: addToCart,
    removeItem: removeFromCart,
    updateQuantity: updateCartItemQuantity,
    clearAll: clearCart,
  };
};

// Hook for managing auth operations
export const useAuth = () => {
  const { customer, vendor, courier, isAuthenticated, loginCustomer, loginVendor, loginCourier, logout } = useAuthStore();

  return {
    customer,
    vendor,
    courier,
    isAuthenticated,
    loginAsCustomer: loginCustomer,
    loginAsVendor: loginVendor,
    loginAsCourier: loginCourier,
    logout,
  };
};
