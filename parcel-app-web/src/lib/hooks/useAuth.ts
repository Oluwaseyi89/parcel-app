"use client";

import { useMemo } from "react";

import { useAuthStore } from "@/lib/stores/authStore";

export type AppRole = "customer" | "vendor" | "courier" | null;

export function useAuth() {
  const customer = useAuthStore((state) => state.customer);
  const vendor = useAuthStore((state) => state.vendor);
  const courier = useAuthStore((state) => state.courier);
  const activeRole = useAuthStore((state) => state.activeRole);
  const allowedRoles = useAuthStore((state) => state.allowedRoles);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const role = useMemo<AppRole>(() => {
    if (activeRole) {
      return activeRole;
    }
    if (customer) {
      return "customer";
    }
    if (vendor) {
      return "vendor";
    }
    if (courier) {
      return "courier";
    }
    return null;
  }, [activeRole, customer, vendor, courier]);

  return {
    customer,
    vendor,
    courier,
    activeRole: role,
    allowedRoles,
    role,
    isAuthenticated,
    isCustomer: role === "customer",
    isVendor: role === "vendor",
    isCourier: role === "courier",
  };
}
