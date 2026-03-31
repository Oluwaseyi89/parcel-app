"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuth, type AppRole } from "@/lib/hooks/useAuth";
import { useHydrated } from "@/lib/hooks/useHydrated";

interface RequireAuthOptions {
  requiredRole?: Exclude<AppRole, null>;
  redirectTo?: string;
}

export function useRequireAuth(options: RequireAuthOptions = {}) {
  const { requiredRole, redirectTo = "/" } = options;
  const auth = useAuth();
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!auth.isAuthenticated) {
      const query = new URLSearchParams(searchParams?.toString() || "");
      query.set("from", pathname || "/");
      router.replace(`${redirectTo}?${query.toString()}`);
      return;
    }

    if (requiredRole && auth.role !== requiredRole) {
      router.replace(redirectTo);
    }
  }, [auth.isAuthenticated, auth.role, hydrated, pathname, redirectTo, requiredRole, router, searchParams]);

  return {
    ...auth,
    hydrated,
    ready: hydrated && auth.isAuthenticated && (!requiredRole || auth.role === requiredRole),
  };
}
