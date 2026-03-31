// stores/orderStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  refreshOrders: (fetchUrl: string) => Promise<void>
  getOrderById: (orderId: any) => Order | null
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      selectedOrder: null,
      loading: false,
      error: null,

      setOrders: (orders) => set({ orders, error: null }),
      setSelectedOrder: (order) => set({ selectedOrder: order, error: null }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      fetchOrders: async (fetchUrl: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(fetchUrl)
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const data = await response.json()
          const ordersArray = Array.isArray(data) ? data : []
          
          // Sort by date if available (newest first)
          const sortedOrders = ordersArray.sort((a: Order, b: Order) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
            return dateB - dateA
          })
          
          set({ orders: sortedOrders, loading: false })
        } catch (error: any) {
          console.error('Error fetching orders:', error)
          set({ 
            error: error.message || 'Failed to fetch orders', 
            loading: false 
          })
        }
      },

      refreshOrders: async (fetchUrl: string) => {
        try {
          const response = await fetch(fetchUrl)
          if (!response.ok) throw new Error('Failed to refresh orders')
          
          const data = await response.json()
          const ordersArray = Array.isArray(data) ? data : []
          
          set({ orders: ordersArray, error: null })
        } catch (error: any) {
          console.error('Error refreshing orders:', error)
          set({ error: error.message })
        }
      },

      addOrder: (order) => {
        set((state) => ({ 
          orders: [order, ...state.orders],
          error: null 
        }))
      },

      updateOrder: (orderId, updatedData) => {
        set((state) => {
          const updatedOrders = state.orders.map((order) => 
            order.id === orderId ? { ...order, ...updatedData } : order
          )
          
          // Update selectedOrder if it's the one being updated
          const updatedSelectedOrder = 
            state.selectedOrder?.id === orderId 
              ? { ...state.selectedOrder, ...updatedData }
              : state.selectedOrder
          
          return { 
            orders: updatedOrders, 
            selectedOrder: updatedSelectedOrder,
            error: null 
          }
        })
      },

      removeOrder: (orderId) => {
        set((state) => {
          const filteredOrders = state.orders.filter((order) => order.id !== orderId)
          
          // Clear selectedOrder if it's the one being removed
          const updatedSelectedOrder = 
            state.selectedOrder?.id === orderId 
              ? null 
              : state.selectedOrder
          
          return { 
            orders: filteredOrders, 
            selectedOrder: updatedSelectedOrder,
            error: null 
          }
        })
      },

      clearOrders: () => set({ 
        orders: [], 
        selectedOrder: null,
        error: null 
      }),

      getOrderById: (orderId) => {
        const { orders } = get()
        return orders.find((order) => order.id === orderId) || null
      },
    }),
    {
      name: 'order-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        orders: state.orders,
        selectedOrder: state.selectedOrder,
      }),
    }
  )
)
