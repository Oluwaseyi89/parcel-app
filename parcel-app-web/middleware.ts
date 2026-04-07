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

function getAuthApiBase(): string {
  return process.env.AUTH_API_BASE?.trim() || process.env.NEXT_PUBLIC_API_BASE?.trim() || "http://localhost:7000";
}

async function getTrustedActiveRole(request: NextRequest): Promise<"customer" | "vendor" | "courier" | "admin" | null> {
  if (!request.cookies.get("auth_session")?.value) {
    return null;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const meUrl = `${getAuthApiBase()}/auth/me/`;

  try {
    const response = await fetch(meUrl, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        "x-requested-with": "XMLHttpRequest",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as SessionMeResponse;
    return body?.data?.active_role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
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
