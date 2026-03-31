import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleProtectedRoutes = {
  "/customer-dash": "logcus",
  "/vendor-dash": "logvend",
  "/courier-dash": "logcour",
} as const;

const sharedProtectedRoutes = ["/cart-check", "/payment"];

function hasAnySessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has("logcus") ||
    request.cookies.has("logvend") ||
    request.cookies.has("logcour")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (sharedProtectedRoutes.some((route) => pathname.startsWith(route)) && !hasAnySessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  for (const [routePrefix, roleCookie] of Object.entries(roleProtectedRoutes)) {
    if (pathname.startsWith(routePrefix) && !request.cookies.has(roleCookie)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/customer-dash/:path*", "/vendor-dash/:path*", "/courier-dash/:path*", "/cart-check", "/payment"],
};
