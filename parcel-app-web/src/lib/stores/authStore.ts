import { create } from "zustand";

import {
  clearRoleSessionCookie,
  getActiveRoleFromCookies,
  setRoleSessionCookie,
  syncSessionCookiesFromStorage,
} from "@/lib/authSession";
import { apiRequest } from "@/lib/api";
import { storage } from "@/lib/storage";
import type { User } from "@/lib/types";

interface AuthState {
  customer: User | null;
  vendor: User | null;
  courier: User | null;
  isAuthenticated: boolean;
  initializeAuth: () => void;
  bootstrapFromServer: () => Promise<void>;
  loginCustomer: (customerData: User) => void;
  loginVendor: (vendorData: User) => void;
  loginCourier: (courierData: User) => void;
  logoutCustomer: () => void;
  logoutVendor: () => void;
  logoutCourier: () => void;
  logout: () => void;
}

interface SessionMeResponse {
  status?: string;
  data?: {
    user?: User;
    active_role?: "customer" | "vendor" | "courier" | "admin" | null;
    allowed_roles?: string[];
  };
}

function pickSingleSession(
  storedCustomer: User | null,
  storedVendor: User | null,
  storedCourier: User | null,
  activeRole: ReturnType<typeof getActiveRoleFromCookies>,
) {
  const byRole = {
    customer: storedCustomer,
    vendor: storedVendor,
    courier: storedCourier,
  }

  const availableRoles = (Object.keys(byRole) as Array<keyof typeof byRole>).filter(
    (role) => Boolean(byRole[role]),
  )

  if (availableRoles.length === 0) {
    return { customer: null, vendor: null, courier: null }
  }

  if (availableRoles.length === 1) {
    const only = availableRoles[0]
    return {
      customer: only === "customer" ? storedCustomer : null,
      vendor: only === "vendor" ? storedVendor : null,
      courier: only === "courier" ? storedCourier : null,
    }
  }

  const effectiveRole =
    activeRole && byRole[activeRole]
      ? activeRole
      : availableRoles.includes("courier")
        ? "courier"
        : availableRoles.includes("vendor")
          ? "vendor"
          : "customer"

  return {
    customer: effectiveRole === "customer" ? storedCustomer : null,
    vendor: effectiveRole === "vendor" ? storedVendor : null,
    courier: effectiveRole === "courier" ? storedCourier : null,
  }
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
    const { customer, vendor, courier } = pickSingleSession(
      storedCustomer,
      storedVendor,
      storedCourier,
      activeRole,
    )

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

  bootstrapFromServer: async () => {
    try {
      const response = await apiRequest<SessionMeResponse>("/auth/me/", { method: "GET" });
      const activeRole = response?.data?.active_role;
      const user = response?.data?.user;

      if (!user || !activeRole) {
        return;
      }

      if (activeRole === "customer") {
        storage.setCustomerAuth(user);
        storage.clearVendorAuth();
        storage.clearCourierAuth();
        setRoleSessionCookie("customer");
        clearRoleSessionCookie("vendor");
        clearRoleSessionCookie("courier");
        set({ customer: user, vendor: null, courier: null, isAuthenticated: true });
        return;
      }

      if (activeRole === "vendor") {
        storage.clearCustomerAuth();
        storage.setVendorAuth(user);
        storage.clearCourierAuth();
        clearRoleSessionCookie("customer");
        setRoleSessionCookie("vendor");
        clearRoleSessionCookie("courier");
        set({ customer: null, vendor: user, courier: null, isAuthenticated: true });
        return;
      }

      if (activeRole === "courier") {
        storage.clearCustomerAuth();
        storage.clearVendorAuth();
        storage.setCourierAuth(user);
        clearRoleSessionCookie("customer");
        clearRoleSessionCookie("vendor");
        setRoleSessionCookie("courier");
        set({ customer: null, vendor: null, courier: user, isAuthenticated: true });
      }
    } catch {
      // Keep local fallback state when no authenticated backend session exists.
    }
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
    storage.clearVendorAuth();
    storage.clearCourierAuth();
    clearRoleSessionCookie("customer");
    clearRoleSessionCookie("vendor");
    clearRoleSessionCookie("courier");
    set({ customer: null, vendor: null, courier: null, isAuthenticated: false });
  },

  logoutVendor: () => {
    storage.clearCustomerAuth();
    storage.clearVendorAuth();
    storage.clearCourierAuth();
    clearRoleSessionCookie("customer");
    clearRoleSessionCookie("vendor");
    clearRoleSessionCookie("courier");
    set({ customer: null, vendor: null, courier: null, isAuthenticated: false });
  },

  logoutCourier: () => {
    storage.clearCustomerAuth();
    storage.clearVendorAuth();
    storage.clearCourierAuth();
    clearRoleSessionCookie("customer");
    clearRoleSessionCookie("vendor");
    clearRoleSessionCookie("courier");
    set({ customer: null, vendor: null, courier: null, isAuthenticated: false });
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
