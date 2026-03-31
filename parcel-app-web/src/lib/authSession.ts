import { STORAGE_KEYS } from "@/lib/constants";

type AuthRole = "customer" | "vendor" | "courier";

const roleToStorageKey: Record<AuthRole, string> = {
  customer: STORAGE_KEYS.customerAuth,
  vendor: STORAGE_KEYS.vendorAuth,
  courier: STORAGE_KEYS.courierAuth,
};

function cookieAttributes(maxAgeSeconds: number): string {
  return `path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export function setRoleSessionCookie(role: AuthRole): void {
  if (typeof document === "undefined") {
    return;
  }

  const key = roleToStorageKey[role];
  document.cookie = `${key}=1; ${cookieAttributes(60 * 60 * 24 * 7)}`;
}

export function clearRoleSessionCookie(role: AuthRole): void {
  if (typeof document === "undefined") {
    return;
  }

  const key = roleToStorageKey[role];
  document.cookie = `${key}=; ${cookieAttributes(0)}`;
}

export function syncSessionCookiesFromStorage(hasCustomer: boolean, hasVendor: boolean, hasCourier: boolean): void {
  if (hasCustomer) {
    setRoleSessionCookie("customer");
  } else {
    clearRoleSessionCookie("customer");
  }

  if (hasVendor) {
    setRoleSessionCookie("vendor");
  } else {
    clearRoleSessionCookie("vendor");
  }

  if (hasCourier) {
    setRoleSessionCookie("courier");
  } else {
    clearRoleSessionCookie("courier");
  }
}
