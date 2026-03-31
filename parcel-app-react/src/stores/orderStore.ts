import { create } from 'zustand'

type Order = any

interface OrderState {
  orders: Order[]
  selectedOrder: Order | null
  loading: boolean
  error: any
  setOrders: (orders: Order[]) => void
  setSelectedOrder: (order: Order | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: any) => void
  fetchOrders: (fetchUrl: string) => Promise<void>
  addOrder: (order: Order) => void
  updateOrder: (orderId: any, updatedData: any) => void
  removeOrder: (orderId: any) => void
  clearOrders: () => void
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

  fetchOrders: async (fetchUrl: string) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(fetchUrl)
      const data = await response.json()
      set({ orders: data, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  addOrder: (order) => {
    set((state) => ({ orders: [...state.orders, order] }))
  },

  updateOrder: (orderId, updatedData) => {
    set((state) => ({ orders: state.orders.map((order) => (order.id === orderId ? { ...order, ...updatedData } : order)) }))
  },

  removeOrder: (orderId) => {
    set((state) => ({ orders: state.orders.filter((order) => order.id !== orderId) }))
  },

  clearOrders: () => set({ orders: [], selectedOrder: null }),
}))
