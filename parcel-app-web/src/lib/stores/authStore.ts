import { create } from "zustand";

import { apiRequest } from "@/lib/api";
import type { User } from "@/lib/types";

export type AppSessionRole = "customer" | "vendor" | "courier";

interface AuthState {
  customer: User | null;
  vendor: User | null;
  courier: User | null;
  activeRole: AppSessionRole | null;
  allowedRoles: AppSessionRole[];
  isAuthenticated: boolean;
  bootstrapFromServer: () => Promise<void>;
  switchActiveRole: (role: AppSessionRole) => Promise<void>;
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

interface SwitchRoleResponse {
  status?: string;
  data?: {
    active_role?: "customer" | "vendor" | "courier" | "admin" | null;
  };
}

function isAppSessionRole(role: unknown): role is AppSessionRole {
  return role === "customer" || role === "vendor" || role === "courier";
}

function emptyState() {
  return {
    customer: null,
    vendor: null,
    courier: null,
    activeRole: null,
    allowedRoles: [],
    isAuthenticated: false,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  vendor: null,
  courier: null,
  activeRole: null,
  allowedRoles: [],
  isAuthenticated: false,

  bootstrapFromServer: async () => {
    try {
      const response = await apiRequest<SessionMeResponse>("/auth/me/", { method: "GET" });
      const activeRole = response?.data?.active_role;
      const user = response?.data?.user;
      const allowedRoles = (response?.data?.allowed_roles ?? []).filter(isAppSessionRole);

      if (!user || !isAppSessionRole(activeRole)) {
        set(emptyState());
        return;
      }

      if (activeRole === "customer") {
        set({
          customer: user,
          vendor: null,
          courier: null,
          activeRole,
          allowedRoles,
          isAuthenticated: true,
        });
        return;
      }

      if (activeRole === "vendor") {
        set({
          customer: null,
          vendor: user,
          courier: null,
          activeRole,
          allowedRoles,
          isAuthenticated: true,
        });
        return;
      }

      if (activeRole === "courier") {
        set({
          customer: null,
          vendor: null,
          courier: user,
          activeRole,
          allowedRoles,
          isAuthenticated: true,
        });
        return;
      }

      set(emptyState());
    } catch {
      set(emptyState());
    }
  },

  switchActiveRole: async (role) => {
    const response = await apiRequest<SwitchRoleResponse>("/auth/switch-role/", {
      method: "POST",
      body: { role },
      json: true,
    });

    if (!isAppSessionRole(response?.data?.active_role)) {
      throw new Error("Role switch failed.");
    }

    await useAuthStore.getState().bootstrapFromServer();
  },

  loginCustomer: (customerData) => {
    set({
      customer: customerData,
      vendor: null,
      courier: null,
      activeRole: "customer",
      allowedRoles: ["customer"],
      isAuthenticated: true,
    });
  },

  loginVendor: (vendorData) => {
    set({
      customer: null,
      vendor: vendorData,
      courier: null,
      activeRole: "vendor",
      allowedRoles: ["vendor"],
      isAuthenticated: true,
    });
  },

  loginCourier: (courierData) => {
    set({
      customer: null,
      vendor: null,
      courier: courierData,
      activeRole: "courier",
      allowedRoles: ["courier"],
      isAuthenticated: true,
    });
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
