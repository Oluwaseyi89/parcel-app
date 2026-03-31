import { create } from "zustand";

import { storage } from "@/lib/storage";
import type { CartItem } from "@/lib/types";

interface CartState {
  cart: CartItem[];
  cartTotal: number;
  loading: boolean;
  error: string | null;
  initializeCart: () => void;
  addToCart: (item: Partial<CartItem> & Pick<CartItem, "id">) => void;
  removeFromCart: (itemId: CartItem["id"]) => void;
  updateCartItemQuantity: (itemId: CartItem["id"], quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

function persistCart(cart: CartItem[]): number {
  const totalQty = cart.reduce((total, item) => total + Number(item.purchased_qty || 0), 0);
  storage.setCart(cart);
  storage.setCartTotalQuantity(totalQty);
  return totalQty;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  cartTotal: 0,
  loading: false,
  error: null,

  initializeCart: () => {
    set({
      cart: storage.getCart(),
      cartTotal: storage.getCartTotalQuantity(),
    });
  },

  addToCart: (item) => {
    set((state) => {
      const normalizedItem: CartItem = {
        ...item,
        id: item.id,
        purchased_qty: Number(item.purchased_qty || 1),
      } as CartItem;

      const existingItem = state.cart.find((cartItem) => cartItem.id === item.id);
      let newCart: CartItem[];

      if (existingItem) {
        newCart = state.cart.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                purchased_qty:
                  Number(cartItem.purchased_qty || 0) + Number(item.purchased_qty || 1),
              }
            : cartItem,
        );
      } else {
        newCart = [...state.cart, normalizedItem];
      }

      return { cart: newCart, cartTotal: persistCart(newCart) };
    });
  },

  removeFromCart: (itemId) => {
    set((state) => {
      const newCart = state.cart.filter((item) => item.id !== itemId);
      return { cart: newCart, cartTotal: persistCart(newCart) };
    });
  },

  updateCartItemQuantity: (itemId, quantity) => {
    set((state) => {
      const safeQty = Math.max(0, Number(quantity || 0));
      const newCart = state.cart
        .map((item) => (item.id === itemId ? { ...item, purchased_qty: safeQty } : item))
        .filter((item) => item.purchased_qty > 0);

      return { cart: newCart, cartTotal: persistCart(newCart) };
    });
  },

  clearCart: () => {
    storage.clearCart();
    set({ cart: [], cartTotal: 0 });
  },

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + Number(item.price || 0) * Number(item.purchased_qty || 0), 0);
  },
}));
