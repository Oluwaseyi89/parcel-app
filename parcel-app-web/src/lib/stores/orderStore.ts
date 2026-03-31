import { create } from "zustand";

import { apiRequest } from "@/lib/api";
import type { Order } from "@/lib/types";

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchOrders: (fetchUrl: string) => Promise<void>;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: Order["id"], updatedData: Partial<Order>) => void;
  removeOrder: (orderId: Order["id"]) => void;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,

  setOrders: (orders) => set({ orders }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchOrders: async (fetchUrl) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest<Order[]>(fetchUrl, { method: "GET" });
      set({ orders: data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch orders.", loading: false });
    }
  },

  addOrder: (order) => {
    set((state) => ({ orders: [...state.orders, order] }));
  },

  updateOrder: (orderId, updatedData) => {
    set((state) => ({
      orders: state.orders.map((order) => (order.id === orderId ? { ...order, ...updatedData } : order)),
    }));
  },

  removeOrder: (orderId) => {
    set((state) => ({ orders: state.orders.filter((order) => order.id !== orderId) }));
  },

  clearOrders: () => set({ orders: [], selectedOrder: null }),
}));
