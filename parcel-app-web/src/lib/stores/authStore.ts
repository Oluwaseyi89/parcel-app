import { create } from "zustand";

import { storage } from "@/lib/storage";
import type { User } from "@/lib/types";

interface AuthState {
  customer: User | null;
  vendor: User | null;
  courier: User | null;
  isAuthenticated: boolean;
  initializeAuth: () => void;
  loginCustomer: (customerData: User) => void;
  loginVendor: (vendorData: User) => void;
  loginCourier: (courierData: User) => void;
  logoutCustomer: () => void;
  logoutVendor: () => void;
  logoutCourier: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  vendor: null,
  courier: null,
  isAuthenticated: false,

  initializeAuth: () => {
    const customer = storage.getCustomerAuth();
    const vendor = storage.getVendorAuth();
    const courier = storage.getCourierAuth();

    set({
      customer,
      vendor,
      courier,
      isAuthenticated: Boolean(customer || vendor || courier),
    });
  },

  loginCustomer: (customerData) => {
    storage.setCustomerAuth(customerData);
    set({ customer: customerData, isAuthenticated: true });
  },

  loginVendor: (vendorData) => {
    storage.setVendorAuth(vendorData);
    set({ vendor: vendorData, isAuthenticated: true });
  },

  loginCourier: (courierData) => {
    storage.setCourierAuth(courierData);
    set({ courier: courierData, isAuthenticated: true });
  },

  logoutCustomer: () => {
    storage.clearCustomerAuth();
    set((state) => ({
      customer: null,
      isAuthenticated: Boolean(state.vendor || state.courier),
    }));
  },

  logoutVendor: () => {
    storage.clearVendorAuth();
    set((state) => ({
      vendor: null,
      isAuthenticated: Boolean(state.customer || state.courier),
    }));
  },

  logoutCourier: () => {
    storage.clearCourierAuth();
    set((state) => ({
      courier: null,
      isAuthenticated: Boolean(state.customer || state.vendor),
    }));
  },

  logout: () => {
    storage.clearCustomerAuth();
    storage.clearVendorAuth();
    storage.clearCourierAuth();
    set({ customer: null, vendor: null, courier: null, isAuthenticated: false });
  },
}));
