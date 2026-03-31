"use client";

import { useMemo } from "react";

import { useAuthStore } from "@/lib/stores/authStore";

export type AppRole = "customer" | "vendor" | "courier" | null;

export function useAuth() {
  const customer = useAuthStore((state) => state.customer);
  const vendor = useAuthStore((state) => state.vendor);
  const courier = useAuthStore((state) => state.courier);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const role = useMemo<AppRole>(() => {
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
  }, [customer, vendor, courier]);

  return {
    customer,
    vendor,
    courier,
    role,
    isAuthenticated,
    isCustomer: role === "customer",
    isVendor: role === "vendor",
    isCourier: role === "courier",
  };
}
