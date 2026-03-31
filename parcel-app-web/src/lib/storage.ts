import { STORAGE_KEYS } from "@/lib/constants";
import type { CartItem, CheckoutDraft, Product, User } from "@/lib/types";

const isBrowser = typeof window !== "undefined";

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeItem(key: string): void {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(key);
}

export const storage = {
  getCustomerAuth: (): User | null => readJSON<User | null>(STORAGE_KEYS.customerAuth, null),
  getVendorAuth: (): User | null => readJSON<User | null>(STORAGE_KEYS.vendorAuth, null),
  getCourierAuth: (): User | null => readJSON<User | null>(STORAGE_KEYS.courierAuth, null),

  setCustomerAuth: (user: User): void => writeJSON(STORAGE_KEYS.customerAuth, user),
  setVendorAuth: (user: User): void => writeJSON(STORAGE_KEYS.vendorAuth, user),
  setCourierAuth: (user: User): void => writeJSON(STORAGE_KEYS.courierAuth, user),

  clearCustomerAuth: (): void => removeItem(STORAGE_KEYS.customerAuth),
  clearVendorAuth: (): void => removeItem(STORAGE_KEYS.vendorAuth),
  clearCourierAuth: (): void => removeItem(STORAGE_KEYS.courierAuth),

  getCart: (): CartItem[] => readJSON<CartItem[]>(STORAGE_KEYS.cart, []),
  setCart: (cart: CartItem[]): void => writeJSON(STORAGE_KEYS.cart, cart),

  getCartTotalQuantity: (): number => {
    const value = readJSON<{ totItem?: number }>(STORAGE_KEYS.cartTotal, { totItem: 0 });
    return Number(value.totItem ?? 0);
  },
  setCartTotalQuantity: (total: number): void => writeJSON(STORAGE_KEYS.cartTotal, { totItem: total }),
  clearCart: (): void => {
    removeItem(STORAGE_KEYS.cart);
    removeItem(STORAGE_KEYS.cartTotal);
  },

  getProductView: (): Product | null => readJSON<Product | null>(STORAGE_KEYS.productView, null),
  setProductView: (product: unknown): void => writeJSON(STORAGE_KEYS.productView, product),

  getBuySingle: (): Product | null => readJSON<Product | null>(STORAGE_KEYS.buySingle, null),
  setBuySingle: (product: unknown): void => writeJSON(STORAGE_KEYS.buySingle, product),

  getCurrentOrder: (): string | null => {
    if (!isBrowser) {
      return null;
    }
    return window.localStorage.getItem(STORAGE_KEYS.currentOrder);
  },
  setCurrentOrder: (orderId: string): void => {
    if (!isBrowser) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.currentOrder, orderId);
  },

  getPaymentReference: (): string | null => {
    if (!isBrowser) {
      return null;
    }
    return window.localStorage.getItem(STORAGE_KEYS.paymentReference);
  },
  setPaymentReference: (reference: string): void => {
    if (!isBrowser) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.paymentReference, reference);
  },

  getCheckoutDraft: (): CheckoutDraft | null => readJSON<CheckoutDraft | null>(STORAGE_KEYS.checkoutDraft, null),
  setCheckoutDraft: (draft: CheckoutDraft): void => writeJSON(STORAGE_KEYS.checkoutDraft, draft),
};
