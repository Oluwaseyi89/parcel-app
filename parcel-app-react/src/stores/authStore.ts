import { create } from 'zustand'

type User = any

interface AuthState {
  customer: User | null
  vendor: User | null
  courier: User | null
  isAuthenticated: boolean
  initializeAuth: () => void
  loginCustomer: (customerData: any) => void
  loginVendor: (vendorData: any) => void
  loginCourier: (courierData: any) => void
  logoutCustomer: () => void
  logoutVendor: () => void
  logoutCourier: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  vendor: null,
  courier: null,
  isAuthenticated: false,

  initializeAuth: () => {
    const logcus = JSON.parse(localStorage.getItem('logcus') || 'null') || null
    const logvend = JSON.parse(localStorage.getItem('logvend') || 'null') || null
    const logcour = JSON.parse(localStorage.getItem('logcour') || 'null') || null
    set({
      customer: logcus,
      vendor: logvend,
      courier: logcour,
      isAuthenticated: !!(logcus || logvend || logcour),
    })
  },

  loginCustomer: (customerData) => {
    localStorage.setItem('logcus', JSON.stringify(customerData))
    set({ customer: customerData, isAuthenticated: true })
  },

  loginVendor: (vendorData) => {
    localStorage.setItem('logvend', JSON.stringify(vendorData))
    set({ vendor: vendorData, isAuthenticated: true })
  },

  loginCourier: (courierData) => {
    localStorage.setItem('logcour', JSON.stringify(courierData))
    set({ courier: courierData, isAuthenticated: true })
  },

  logoutCustomer: () => {
    localStorage.removeItem('logcus')
    set({ customer: null })
  },

  logoutVendor: () => {
    localStorage.removeItem('logvend')
    set({ vendor: null })
  },

  logoutCourier: () => {
    localStorage.removeItem('logcour')
    set({ courier: null })
  },

  logout: () => {
    localStorage.removeItem('logcus')
    localStorage.removeItem('logvend')
    localStorage.removeItem('logcour')
    set({ customer: null, vendor: null, courier: null, isAuthenticated: false })
  },
}))
