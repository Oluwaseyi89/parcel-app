import { setRoleSessionCookie } from "@/lib/authSession";
import { STORAGE_KEYS } from "@/lib/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import type { User } from "@/lib/types";
import { beforeEach, describe, expect, it, test } from "vitest";

type LogoutMethod = "logoutCustomer" | "logoutVendor" | "logoutCourier" | "logout";

const logoutMethods: LogoutMethod[] = ["logoutCustomer", "logoutVendor", "logoutCourier", "logout"];

function makeUser(id: string): User {
  return {
    id,
    email: `${id}@example.com`,
    first_name: id,
  };
}

function hasCookie(key: string): boolean {
  return document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .some((entry) => entry.startsWith(`${key}=`));
}

describe("authStore regression: cross-role session conflicts", () => {
  beforeEach(() => {
    useAuthStore.setState({
      customer: null,
      vendor: null,
      courier: null,
      isAuthenticated: false,
    });
  });

  it("keeps courier active when vendor and courier sessions both exist but courier cookie is active", () => {
    const vendor = makeUser("vendor-user");
    const courier = makeUser("courier-user");

    window.localStorage.setItem(STORAGE_KEYS.vendorAuth, JSON.stringify(vendor));
    window.localStorage.setItem(STORAGE_KEYS.courierAuth, JSON.stringify(courier));
    setRoleSessionCookie("vendor");
    setRoleSessionCookie("courier");

    useAuthStore.getState().initializeAuth();
    const state = useAuthStore.getState();

    expect(state.courier).toMatchObject({ id: "courier-user" });
    expect(state.vendor).toBeNull();
    expect(state.customer).toBeNull();
    expect(state.isAuthenticated).toBe(true);

    expect(window.localStorage.getItem(STORAGE_KEYS.courierAuth)).not.toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.vendorAuth)).toBeNull();
    expect(hasCookie(STORAGE_KEYS.courierAuth)).toBe(true);
    expect(hasCookie(STORAGE_KEYS.vendorAuth)).toBe(false);
  });

  it("falls back deterministically to courier when mixed role storage exists without role cookies", () => {
    const vendor = makeUser("vendor-user");
    const courier = makeUser("courier-user");

    window.localStorage.setItem(STORAGE_KEYS.vendorAuth, JSON.stringify(vendor));
    window.localStorage.setItem(STORAGE_KEYS.courierAuth, JSON.stringify(courier));

    useAuthStore.getState().initializeAuth();
    const state = useAuthStore.getState();

    expect(state.courier).toMatchObject({ id: "courier-user" });
    expect(state.vendor).toBeNull();
    expect(state.customer).toBeNull();
  });

  it("replaces an existing vendor session cleanly when logging in as courier", () => {
    const vendor = makeUser("vendor-user");
    const courier = makeUser("courier-user");

    useAuthStore.getState().loginVendor(vendor);
    useAuthStore.getState().loginCourier(courier);

    const state = useAuthStore.getState();

    expect(state.courier).toMatchObject({ id: "courier-user" });
    expect(state.vendor).toBeNull();
    expect(state.customer).toBeNull();
    expect(state.isAuthenticated).toBe(true);

    expect(window.localStorage.getItem(STORAGE_KEYS.courierAuth)).not.toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.vendorAuth)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.customerAuth)).toBeNull();

    expect(hasCookie(STORAGE_KEYS.courierAuth)).toBe(true);
    expect(hasCookie(STORAGE_KEYS.vendorAuth)).toBe(false);
    expect(hasCookie(STORAGE_KEYS.customerAuth)).toBe(false);
  });

  test.each(logoutMethods)("%s clears all role traces", (logoutMethod) => {
    const customer = makeUser("customer-user");
    const vendor = makeUser("vendor-user");
    const courier = makeUser("courier-user");

    window.localStorage.setItem(STORAGE_KEYS.customerAuth, JSON.stringify(customer));
    window.localStorage.setItem(STORAGE_KEYS.vendorAuth, JSON.stringify(vendor));
    window.localStorage.setItem(STORAGE_KEYS.courierAuth, JSON.stringify(courier));
    setRoleSessionCookie("customer");
    setRoleSessionCookie("vendor");
    setRoleSessionCookie("courier");

    const logoutFn = useAuthStore.getState()[logoutMethod] as () => void;
    logoutFn();

    const state = useAuthStore.getState();

    expect(state.customer).toBeNull();
    expect(state.vendor).toBeNull();
    expect(state.courier).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    expect(window.localStorage.getItem(STORAGE_KEYS.customerAuth)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.vendorAuth)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.courierAuth)).toBeNull();

    expect(hasCookie(STORAGE_KEYS.customerAuth)).toBe(false);
    expect(hasCookie(STORAGE_KEYS.vendorAuth)).toBe(false);
    expect(hasCookie(STORAGE_KEYS.courierAuth)).toBe(false);
  });
});
