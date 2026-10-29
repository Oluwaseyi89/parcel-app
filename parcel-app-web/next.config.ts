import type { NextConfig } from "next";

const DEV_BACKEND_API_URL = "http://localhost:7000";

// Server-only origin of parcel-app-service, e.g. https://parcel-app-service.onrender.com.
// Required in production builds so a deploy can never silently point at localhost.
function backendApiUrl(): string {
  const url = process.env.BACKEND_API_URL?.trim().replace(/\/+$/, "");
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BACKEND_API_URL must be set for production builds.");
  }
  return DEV_BACKEND_API_URL;
}

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_PAYMENT_API_BASE?.trim()) {
  throw new Error("NEXT_PUBLIC_PAYMENT_API_BASE must be set for production builds.");
}

const nextConfig: NextConfig = {
  // Tree-shake large icon/component packages so only imported symbols are compiled
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Django routes end in "/"; keep them intact instead of redirecting to the slash-less form.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    // Proxy the API through this origin so session cookies are first-party: the browser never
    // talks to the backend domain, and middleware.ts can read the auth cookie.
    // The ":path*" segment drops a trailing slash, so match slash-terminated paths first and
    // re-append it; otherwise Django's APPEND_SLASH redirects GETs and rejects POSTs.
    const backend = backendApiUrl();
    return [
      { source: "/api/v1/:path*/", destination: `${backend}/api/v1/:path*/` },
      { source: "/api/v1/:path*", destination: `${backend}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
