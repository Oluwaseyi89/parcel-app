"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const initializeCart = useCartStore((state) => state.initializeCart);

  useEffect(() => {
    initializeAuth();
    initializeCart();
  }, [initializeAuth, initializeCart]);

  return <>{children}</>;
}
