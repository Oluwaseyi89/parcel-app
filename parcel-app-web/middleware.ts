import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/customer-dash",
  "/vendor-dash",
  "/courier-dash",
  "/cart-check",
  "/payment",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasAnySession =
    request.cookies.has("logcus") || request.cookies.has("logvend") || request.cookies.has("logcour");

  if (!hasAnySession) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/customer-dash/:path*", "/vendor-dash/:path*", "/courier-dash/:path*", "/cart-check", "/payment"],
};
