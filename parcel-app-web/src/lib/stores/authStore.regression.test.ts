import { STORAGE_KEYS } from "@/lib/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import type { User } from "@/lib/types";
import { beforeEach, describe, expect, it, test, vi } from "vitest";

type LogoutMethod = "logoutCustomer" | "logoutVendor" | "logoutCourier" | "logout";

const logoutMethods: LogoutMethod[] = ["logoutCustomer", "logoutVendor", "logoutCourier", "logout"];

// Keys that must never appear in localStorage after any auth operation.
const AUTH_STORAGE_KEYS = [STORAGE_KEYS.customerAuth, STORAGE_KEYS.vendorAuth, STORAGE_KEYS.courierAuth];

function makeUser(id: string): User {
  return {
    id,
    email: `${id}@example.com`,
    first_name: id,
  };
}

function hasAnyAuthInStorage(): boolean {
  return AUTH_STORAGE_KEYS.some((key) => window.localStorage.getItem(key) !== null);
}

describe("authStore regression: cookie-first session contract", () => {
  beforeEach(() => {
    useAuthStore.setState({
      customer: null,
      vendor: null,
      courier: null,
      activeRole: null,
      allowedRoles: [],
      isAuthenticated: false,
    });
    AUTH_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    // Provide a permissive fetch stub so the CSRF fetch inside apiRequest never throws.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { csrf_token: "test-csrf" } }),
      }),
    );
  });

  it("loginCustomer sets in-memory state without writing auth to localStorage", () => {
    const customer = makeUser("customer-user");
    useAuthStore.getState().loginCustomer(customer);
    const state = useAuthStore.getState();

    expect(state.customer).toMatchObject({ id: "customer-user" });
    expect(state.vendor).toBeNull();
    expect(state.courier).toBeNull();
    expect(state.isAuthenticated).toBe(true);
    expect(hasAnyAuthInStorage()).toBe(false);
  });

  it("loginVendor sets in-memory state without writing auth to localStorage", () => {
    const vendor = makeUser("vendor-user");
    useAuthStore.getState().loginVendor(vendor);
    const state = useAuthStore.getState();

    expect(state.vendor).toMatchObject({ id: "vendor-user" });
    expect(state.customer).toBeNull();
    expect(state.courier).toBeNull();
    expect(state.isAuthenticated).toBe(true);
    expect(hasAnyAuthInStorage()).toBe(false);
  });

  it("loginCourier sets in-memory state without writing auth to localStorage", () => {
    const courier = makeUser("courier-user");
    useAuthStore.getState().loginCourier(courier);
    const state = useAuthStore.getState();

    expect(state.courier).toMatchObject({ id: "courier-user" });
    expect(state.customer).toBeNull();
    expect(state.vendor).toBeNull();
    expect(state.isAuthenticated).toBe(true);
    expect(hasAnyAuthInStorage()).toBe(false);
  });

  it("loginCourier after loginVendor evicts vendor from in-memory state", () => {
    const vendor = makeUser("vendor-user");
    const courier = makeUser("courier-user");

    useAuthStore.getState().loginVendor(vendor);
    useAuthStore.getState().loginCourier(courier);

    const state = useAuthStore.getState();

    expect(state.courier).toMatchObject({ id: "courier-user" });
    expect(state.vendor).toBeNull();
    expect(state.customer).toBeNull();
    expect(state.isAuthenticated).toBe(true);
    expect(hasAnyAuthInStorage()).toBe(false);
  });

  test.each(logoutMethods)("%s clears in-memory auth state and writes nothing to localStorage", async (logoutMethod) => {
    const vendor = makeUser("vendor-user");
    useAuthStore.getState().loginVendor(vendor);

    const logoutFn = useAuthStore.getState()[logoutMethod] as () => Promise<void>;
    await logoutFn();

    const state = useAuthStore.getState();

    expect(state.customer).toBeNull();
    expect(state.vendor).toBeNull();
    expect(state.courier).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(hasAnyAuthInStorage()).toBe(false);
  });

  it("bootstrapFromServer hydrates in-memory state from server and stores nothing in localStorage", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: { id: "server-customer", email: "sc@example.com", first_name: "ServerCustomer" },
          active_role: "customer",
          allowed_roles: ["customer"],
        },
      }),
    } as Response);

    await useAuthStore.getState().bootstrapFromServer();

    const state = useAuthStore.getState();

    expect(state.customer).toMatchObject({ id: "server-customer" });
    expect(state.vendor).toBeNull();
    expect(state.courier).toBeNull();
    expect(state.activeRole).toBe("customer");
    expect(state.allowedRoles).toEqual(["customer"]);
    expect(state.isAuthenticated).toBe(true);
    expect(hasAnyAuthInStorage()).toBe(false);
  });

  it("switchActiveRole updates active context and allowed roles from backend", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { csrf_token: "switch-csrf" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { active_role: "courier" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: { id: "courier-user", email: "mr@example.com", first_name: "MultiRole" },
            active_role: "courier",
            allowed_roles: ["vendor", "courier"],
          },
        }),
      } as Response);

    await useAuthStore.getState().switchActiveRole("courier");

    const state = useAuthStore.getState();
    expect(state.activeRole).toBe("courier");
    expect(state.courier).toMatchObject({ id: "courier-user" });
    expect(state.vendor).toBeNull();
    expect(state.allowedRoles).toEqual(["vendor", "courier"]);
    expect(hasAnyAuthInStorage()).toBe(false);
  });
});
