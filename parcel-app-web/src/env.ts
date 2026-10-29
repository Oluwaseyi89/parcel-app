const DEV_PAYMENT_API_BASE = "http://localhost:8080";

export const env = {
  // Empty by default: the browser calls /api/v1/* on this origin and next.config.ts proxies it
  // to BACKEND_API_URL. Set NEXT_PUBLIC_API_BASE only to bypass the proxy and call the backend
  // directly (session cookies then become cross-site).
  apiBase: process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ?? "",
  // Required in production (enforced at build time in next.config.ts).
  paymentApiBase:
    process.env.NEXT_PUBLIC_PAYMENT_API_BASE?.trim().replace(/\/+$/, "") ||
    (process.env.NODE_ENV === "development" ? DEV_PAYMENT_API_BASE : ""),
};
