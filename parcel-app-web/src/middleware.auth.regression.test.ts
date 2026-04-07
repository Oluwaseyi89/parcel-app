import { middleware } from "../middleware";
import { describe, expect, test } from "vitest";

const ROUTE_COOKIE_CASES = [
  ["/customer-dash", "logcus", "logvend"],
  ["/vendor-dash", "logvend", "logcour"],
  ["/courier-dash", "logcour", "logcus"],
] as const;

function makeRequest(pathname: string, cookies: string[] = []) {
  const baseUrl = new URL(`https://parcel.test${pathname}`);
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
    cookies: {
      has(name: string) {
        return cookies.includes(name);
      },
    },
  };
}

describe("middleware regression: role dashboard guards", () => {
  test.each(ROUTE_COOKIE_CASES)(
    "redirects %s when required cookie is missing",
    (route, requiredCookie, wrongCookie) => {
      const response = middleware(makeRequest(route, [wrongCookie]) as never);

      expect(response.status).toBe(307);
      const location = response.headers.get("location") ?? "";
      expect(location).toContain("/?from=");
      expect(location).toContain(encodeURIComponent(route));
      expect(location).not.toContain(requiredCookie);
    },
  );

  test.each(ROUTE_COOKIE_CASES)("allows %s when matching cookie is present", (route, requiredCookie) => {
    const response = middleware(makeRequest(route, [requiredCookie]) as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  test("redirects shared protected routes without any session cookie", () => {
    const cartResponse = middleware(makeRequest("/cart-check") as never);
    const paymentResponse = middleware(makeRequest("/payment") as never);

    expect(cartResponse.status).toBe(307);
    expect(paymentResponse.status).toBe(307);
  });

  test("allows shared protected routes when any role cookie exists", () => {
    const cartResponse = middleware(makeRequest("/cart-check", ["logcour"]) as never);
    const paymentResponse = middleware(makeRequest("/payment", ["logvend"]) as never);

    expect(cartResponse.status).toBe(200);
    expect(paymentResponse.status).toBe(200);
  });
});
