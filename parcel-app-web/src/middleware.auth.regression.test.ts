import { middleware } from "../middleware";
import { beforeEach, describe, expect, test, vi } from "vitest";

const ROUTE_COOKIE_CASES = [
  ["/customer-dash", "customer", "vendor"],
  ["/vendor-dash", "vendor", "courier"],
  ["/courier-dash", "courier", "customer"],
] as const;

function makeRequest(pathname: string, cookieMap: Record<string, string> = {}) {
  const baseUrl = new URL(`https://parcel.test${pathname}`);
  const cookieHeader = Object.entries(cookieMap)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  const nextUrl = {
    get pathname() {
      return baseUrl.pathname;
    },
    set pathname(value: string) {
      baseUrl.pathname = value;
    },
    get searchParams() {
      return baseUrl.searchParams;
    },
    clone() {
      return new URL(baseUrl.toString());
    },
  };

  return {
    nextUrl,
    headers: {
      get(name: string) {
        return name.toLowerCase() === "cookie" ? cookieHeader : null;
      },
    },
    cookies: {
      has(name: string) {
        return Object.prototype.hasOwnProperty.call(cookieMap, name);
      },
      get(name: string) {
        if (!Object.prototype.hasOwnProperty.call(cookieMap, name)) {
          return undefined;
        }

        return { name, value: cookieMap[name] };
      },
    },
  };
}

describe("middleware regression: role dashboard guards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  test.each(ROUTE_COOKIE_CASES)(
    "redirects %s when trusted role from /auth/me is mismatched",
    async (route, requiredRole, wrongRole) => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { active_role: wrongRole } }),
      } as Response);

      const response = await middleware(makeRequest(route, { auth_session: "valid-token" }) as never);

      expect(response.status).toBe(307);
      const location = response.headers.get("location") ?? "";
      expect(location).toContain("/?from=");
      expect(location).toContain(encodeURIComponent(route));
      expect(location).toContain("from=");
    },
  );

  test.each(ROUTE_COOKIE_CASES)("allows %s when trusted role matches", async (route, requiredRole) => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { active_role: requiredRole } }),
    } as Response);

    const response = await middleware(makeRequest(route, { auth_session: "valid-token" }) as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  test("redirects shared protected routes without auth_session cookie", async () => {
    const cartResponse = await middleware(makeRequest("/cart-check") as never);
    const paymentResponse = await middleware(makeRequest("/payment") as never);

    expect(cartResponse.status).toBe(307);
    expect(paymentResponse.status).toBe(307);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("redirects when auth_session exists but /auth/me is unauthorized", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

    const response = await middleware(makeRequest("/payment", { auth_session: "expired-token" }) as never);

    expect(response.status).toBe(307);
  });

  test("allows shared protected routes when /auth/me confirms active session", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { active_role: "courier" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { active_role: "vendor" } }),
      } as Response);

    const cartResponse = await middleware(makeRequest("/cart-check", { auth_session: "courier-token" }) as never);
    const paymentResponse = await middleware(makeRequest("/payment", { auth_session: "vendor-token" }) as never);

    expect(cartResponse.status).toBe(200);
    expect(paymentResponse.status).toBe(200);
  });

  test("marker cookies alone do not grant access without trusted auth_session", async () => {
    const response = await middleware(makeRequest("/courier-dash", { logcour: "1" }) as never);

    expect(response.status).toBe(307);
    expect(fetch).not.toHaveBeenCalled();
  });
});
