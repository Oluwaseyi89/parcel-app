import { create } from "zustand";

import {
  clearRoleSessionCookie,
  getActiveRoleFromCookies,
  setRoleSessionCookie,
  syncSessionCookiesFromStorage,
} from "@/lib/authSession";
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
    const storedCustomer = storage.getCustomerAuth();
    const storedVendor = storage.getVendorAuth();
    const storedCourier = storage.getCourierAuth();

    const activeRole = getActiveRoleFromCookies();
    const hasMultipleStoredRoles = [storedCustomer, storedVendor, storedCourier].filter(Boolean).length > 1;

    let customer: User | null = null;
    let vendor: User | null = null;
    let courier: User | null = null;

    if (activeRole === "customer") {
      customer = storedCustomer;
    } else if (activeRole === "vendor") {
      vendor = storedVendor;
    } else if (activeRole === "courier") {
      courier = storedCourier;
    } else if (hasMultipleStoredRoles) {
      // Hotfix fallback: pick a deterministic role and purge stale role auth.
      courier = storedCourier;
      vendor = courier ? null : storedVendor;
      customer = courier || vendor ? null : storedCustomer;
    } else {
      customer = storedCustomer;
      vendor = storedVendor;
      courier = storedCourier;
    }

    if (!customer) {
      storage.clearCustomerAuth();
    }
    if (!vendor) {
      storage.clearVendorAuth();
    }
    if (!courier) {
      storage.clearCourierAuth();
    }

    syncSessionCookiesFromStorage(Boolean(customer), Boolean(vendor), Boolean(courier));

    set({
      customer,
      vendor,
      courier,
      isAuthenticated: Boolean(customer || vendor || courier),
    });
  },

  loginCustomer: (customerData) => {
    storage.setCustomerAuth(customerData);
    storage.clearVendorAuth();
    storage.clearCourierAuth();
    setRoleSessionCookie("customer");
    clearRoleSessionCookie("vendor");
    clearRoleSessionCookie("courier");
    set({ customer: customerData, vendor: null, courier: null, isAuthenticated: true });
  },

  loginVendor: (vendorData) => {
    storage.clearCustomerAuth();
    storage.setVendorAuth(vendorData);
    storage.clearCourierAuth();
    clearRoleSessionCookie("customer");
    setRoleSessionCookie("vendor");
    clearRoleSessionCookie("courier");
    set({ customer: null, vendor: vendorData, courier: null, isAuthenticated: true });
  },

  loginCourier: (courierData) => {
    storage.clearCustomerAuth();
    storage.clearVendorAuth();
    storage.setCourierAuth(courierData);
    clearRoleSessionCookie("customer");
    clearRoleSessionCookie("vendor");
    setRoleSessionCookie("courier");
    set({ customer: null, vendor: null, courier: courierData, isAuthenticated: true });
  },

  logoutCustomer: () => {
    storage.clearCustomerAuth();
    clearRoleSessionCookie("customer");
    set((state) => ({
      customer: null,
      isAuthenticated: Boolean(state.vendor || state.courier),
    }));
  },

  logoutVendor: () => {
    storage.clearVendorAuth();
    clearRoleSessionCookie("vendor");
    set((state) => ({
      vendor: null,
      isAuthenticated: Boolean(state.customer || state.courier),
    }));
  },

  logoutCourier: () => {
    storage.clearCourierAuth();
    clearRoleSessionCookie("courier");
    set((state) => ({
      courier: null,
      isAuthenticated: Boolean(state.customer || state.vendor),
    }));
  },

  logout: () => {
    storage.clearCustomerAuth();
    storage.clearVendorAuth();
    storage.clearCourierAuth();
    clearRoleSessionCookie("customer");
    clearRoleSessionCookie("vendor");
    clearRoleSessionCookie("courier");
    set({ customer: null, vendor: null, courier: null, isAuthenticated: false });
  },
}));
