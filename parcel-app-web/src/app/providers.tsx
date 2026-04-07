"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const bootstrapFromServer = useAuthStore((state) => state.bootstrapFromServer);
  const initializeCart = useCartStore((state) => state.initializeCart);

  useEffect(() => {
    initializeAuth();
    void bootstrapFromServer();
    initializeCart();
  }, [bootstrapFromServer, initializeAuth, initializeCart]);

  return <>{children}</>;
}
