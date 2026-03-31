"use client";

import { useMemo } from "react";

import { useCartStore } from "@/lib/stores/cartStore";

export function useCart() {
  const cart = useCartStore((state) => state.cart);
  const cartTotal = useCartStore((state) => state.cartTotal);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateCartItemQuantity = useCartStore((state) => state.updateCartItemQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getCartTotal = useCartStore((state) => state.getCartTotal);

  const distinctItems = cart.length;

  const totalPrice = useMemo(() => getCartTotal(), [cart, getCartTotal]);

  return {
    cart,
    cartTotal,
    distinctItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
  };
}
