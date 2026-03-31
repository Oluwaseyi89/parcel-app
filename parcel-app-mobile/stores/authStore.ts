// stores/authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type User = any

interface AuthState {
  customer: User | null
  vendor: User | null
  courier: User | null
  isAuthenticated: boolean
  isLoading: boolean
  initializeAuth: () => void
  loginCustomer: (customerData: any) => void
  loginVendor: (vendorData: any) => void
  loginCourier: (courierData: any) => void
  logoutCustomer: () => void
  logoutVendor: () => void
  logoutCourier: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      customer: null,
      vendor: null,
      courier: null,
      isAuthenticated: false,
      isLoading: true,

      initializeAuth: async () => {
        try {
          // Auth state will be automatically restored by persist middleware
          set({ isLoading: false })
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ isLoading: false })
        }
      },

      loginCustomer: (customerData) => {
        set({ 
          customer: customerData, 
          vendor: null, 
          courier: null, 
          isAuthenticated: true,
          isLoading: false 
        })
      },

      loginVendor: (vendorData) => {
        set({ 
          vendor: vendorData, 
          customer: null, 
          courier: null, 
          isAuthenticated: true,
          isLoading: false 
        })
      },

      loginCourier: (courierData) => {
        set({ 
          courier: courierData, 
          customer: null, 
          vendor: null, 
          isAuthenticated: true,
          isLoading: false 
        })
      },

      logoutCustomer: () => {
        set({ 
          customer: null, 
          isAuthenticated: false 
        })
      },

      logoutVendor: () => {
        set({ 
          vendor: null, 
          isAuthenticated: false 
        })
      },

      logoutCourier: () => {
        set({ 
          courier: null, 
          isAuthenticated: false 
        })
      },

      logout: () => {
        set({ 
          customer: null, 
          vendor: null, 
          courier: null, 
          isAuthenticated: false,
          isLoading: false 
        })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Optional: customize what gets persisted
      partialize: (state) => ({
        customer: state.customer,
        vendor: state.vendor,
        courier: state.courier,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Alternative: If you want separate storage keys like localStorage had:
export const useAuthStoreSeparateKeys = create<AuthState>()(
  persist(
    (set) => ({
      customer: null,
      vendor: null,
      courier: null,
      isAuthenticated: false,
      isLoading: true,

      initializeAuth: async () => {
        try {
          // Manually load from separate AsyncStorage keys
          const [logcus, logvend, logcour] = await Promise.all([
            AsyncStorage.getItem('logcus'),
            AsyncStorage.getItem('logvend'),
            AsyncStorage.getItem('logcour')
          ])

          const customer = logcus ? JSON.parse(logcus) : null
          const vendor = logvend ? JSON.parse(logvend) : null
          const courier = logcour ? JSON.parse(logcour) : null

          set({
            customer,
            vendor,
            courier,
            isAuthenticated: !!(customer || vendor || courier),
            isLoading: false,
          })
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ isLoading: false })
        }
      },

      loginCustomer: async (customerData) => {
        await AsyncStorage.setItem('logcus', JSON.stringify(customerData))
        // Clear other user types
        await AsyncStorage.multiRemove(['logvend', 'logcour'])
        set({ 
          customer: customerData, 
          vendor: null, 
          courier: null, 
          isAuthenticated: true,
          isLoading: false 
        })
      },

      loginVendor: async (vendorData) => {
        await AsyncStorage.setItem('logvend', JSON.stringify(vendorData))
        // Clear other user types
        await AsyncStorage.multiRemove(['logcus', 'logcour'])
        set({ 
          vendor: vendorData, 
          customer: null, 
          courier: null, 
          isAuthenticated: true,
          isLoading: false 
        })
      },

      loginCourier: async (courierData) => {
        await AsyncStorage.setItem('logcour', JSON.stringify(courierData))
        // Clear other user types
        await AsyncStorage.multiRemove(['logcus', 'logvend'])
        set({ 
          courier: courierData, 
          customer: null, 
          vendor: null, 
          isAuthenticated: true,
          isLoading: false 
        })
      },

      logoutCustomer: async () => {
        await AsyncStorage.removeItem('logcus')
        set({ 
          customer: null, 
          isAuthenticated: false 
        })
      },

      logoutVendor: async () => {
        await AsyncStorage.removeItem('logvend')
        set({ 
          vendor: null, 
          isAuthenticated: false 
        })
      },

      logoutCourier: async () => {
        await AsyncStorage.removeItem('logcour')
        set({ 
          courier: null, 
          isAuthenticated: false 
        })
      },

      logout: async () => {
        await AsyncStorage.multiRemove(['logcus', 'logvend', 'logcour'])
        set({ 
          customer: null, 
          vendor: null, 
          courier: null, 
          isAuthenticated: false,
          isLoading: false 
        })
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't auto-persist, we're manually managing storage
      skipHydration: true,
    }
  )
)