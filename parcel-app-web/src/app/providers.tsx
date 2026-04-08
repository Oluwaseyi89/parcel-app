"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const bootstrapFromServer = useAuthStore((state) => state.bootstrapFromServer);
  const initializeCart = useCartStore((state) => state.initializeCart);

  useEffect(() => {
    void bootstrapFromServer();
    initializeCart();
  }, [bootstrapFromServer, initializeCart]);

  return <>{children}</>;
}
