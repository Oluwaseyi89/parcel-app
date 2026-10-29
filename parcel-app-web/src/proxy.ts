import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleProtectedRoutes = {
  "/customer-dash": "customer",
  "/vendor-dash": "vendor",
  "/courier-dash": "courier",
} as const;

const sharedProtectedRoutes = ["/cart-check", "/payment"];

type SessionMeResponse = {
  data?: {
    active_role?: "customer" | "vendor" | "courier" | "admin" | null;
  };
};

function isProtectedRoute(pathname: string): boolean {
  if (sharedProtectedRoutes.some((route) => pathname.startsWith(route))) {
    return true;
  }

  return Object.keys(roleProtectedRoutes).some((routePrefix) => pathname.startsWith(routePrefix));
}

function redirectToHome(request: NextRequest, fromPath: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("from", fromPath);
  return NextResponse.redirect(url);
}

// Middleware runs on the server, so it calls the backend directly (not through the rewrite),
// forwarding the browser's first-party cookies. AUTH_API_BASE is the older name for this setting.
function getAuthApiBase(): string | null {
  const configured = (process.env.BACKEND_API_URL || process.env.AUTH_API_BASE)?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : "http://localhost:7000";
}

async function getTrustedActiveRole(request: NextRequest): Promise<"customer" | "vendor" | "courier" | "admin" | null> {
  if (!request.cookies.get("auth_session")?.value) {
    return null;
  }

  const apiBase = getAuthApiBase();
  if (!apiBase) {
    return null;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const meUrl = `${apiBase}/api/v1/auth/me/`;
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 4_000);

  try {
    const response = await fetch(meUrl, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        "x-requested-with": "XMLHttpRequest",
      },
      cache: "no-store",
      signal: abort.signal,
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as SessionMeResponse;
    return body?.data?.active_role ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const activeRole = await getTrustedActiveRole(request);

  if (!activeRole) {
    return redirectToHome(request, pathname);
  }

  for (const [routePrefix, requiredRole] of Object.entries(roleProtectedRoutes)) {
    if (pathname.startsWith(routePrefix) && activeRole !== requiredRole) {
      return redirectToHome(request, pathname);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/customer-dash/:path*", "/vendor-dash/:path*", "/courier-dash/:path*", "/cart-check", "/payment"],
};
