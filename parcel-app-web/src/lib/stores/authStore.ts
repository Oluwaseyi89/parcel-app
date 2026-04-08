import { create } from "zustand";

import { apiRequest } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  customer: User | null;
  vendor: User | null;
  courier: User | null;
  isAuthenticated: boolean;
  bootstrapFromServer: () => Promise<void>;
  loginCustomer: (customerData: User) => void;
  loginVendor: (vendorData: User) => void;
  loginCourier: (courierData: User) => void;
  logoutCustomer: () => Promise<void>;
  logoutVendor: () => Promise<void>;
  logoutCourier: () => Promise<void>;
  logout: () => Promise<void>;
}

interface SessionMeResponse {
  status?: string;
  data?: {
    user?: User;
    active_role?: "customer" | "vendor" | "courier" | "admin" | null;
    allowed_roles?: string[];
  };
}

function emptyState() {
  return {
    customer: null,
    vendor: null,
    courier: null,
    isAuthenticated: false,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  vendor: null,
  courier: null,
  isAuthenticated: false,

  bootstrapFromServer: async () => {
    try {
      const response = await apiRequest<SessionMeResponse>("/auth/me/", { method: "GET" });
      const activeRole = response?.data?.active_role;
      const user = response?.data?.user;

      if (!user || !activeRole) {
        set(emptyState());
        return;
      }

      if (activeRole === "customer") {
        set({ customer: user, vendor: null, courier: null, isAuthenticated: true });
        return;
      }

      if (activeRole === "vendor") {
        set({ customer: null, vendor: user, courier: null, isAuthenticated: true });
        return;
      }

      if (activeRole === "courier") {
        set({ customer: null, vendor: null, courier: user, isAuthenticated: true });
        return;
      }

      set(emptyState());
    } catch {
      set(emptyState());
    }
  },

  loginCustomer: (customerData) => {
    set({ customer: customerData, vendor: null, courier: null, isAuthenticated: true });
  },

  loginVendor: (vendorData) => {
    set({ customer: null, vendor: vendorData, courier: null, isAuthenticated: true });
  },

  loginCourier: (courierData) => {
    set({ customer: null, vendor: null, courier: courierData, isAuthenticated: true });
  },

  logoutCustomer: async () => {
    set(emptyState());
    try {
      await apiRequest<{ status?: string }>("/auth/api/logout/", { method: "POST" });
    } catch {
      // Keep local state cleared even if backend session already expired.
    }
  },

  logoutVendor: async () => {
    set(emptyState());
    try {
      await apiRequest<{ status?: string }>("/auth/api/logout/", { method: "POST" });
    } catch {
      // Keep local state cleared even if backend session already expired.
    }
  },

  logoutCourier: async () => {
    set(emptyState());
    try {
      await apiRequest<{ status?: string }>("/auth/api/logout/", { method: "POST" });
    } catch {
      // Keep local state cleared even if backend session already expired.
    }
  },

  logout: async () => {
    set(emptyState());
    try {
      await apiRequest<{ status?: string }>("/auth/api/logout/", { method: "POST" });
    } catch {
      // Keep local state cleared even if backend session already expired.
    }
  },
}));
