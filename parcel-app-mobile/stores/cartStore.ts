// stores/cartStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type CartItem = any

interface CartState {
  cart: CartItem[]
  cartTotal: number
  loading: boolean
  error: any
  initializeCart: () => void
  addToCart: (item: any) => void
  removeFromCart: (itemId: any) => void
  updateCartItemQuantity: (itemId: any, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartSubtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      cartTotal: 0,
      loading: false,
      error: null,

      initializeCart: async () => {
        try {
          set({ loading: true })
          // Persist middleware automatically loads from AsyncStorage
          // Calculate initial cart total
          const { cart } = get()
          const itemCount = cart.reduce((total, item) => total + (item.purchased_qty || 0), 0)
          set({ cartTotal: itemCount, loading: false })
        } catch (error) {
          console.error('Error initializing cart:', error)
          set({ error, loading: false })
        }
      },

      addToCart: (item) => {
        set((state) => {
          const existingItem = state.cart.find((cartItem) => cartItem.id === item.id)
          let newCart
          
          if (existingItem) {
            newCart = state.cart.map((cartItem) =>
              cartItem.id === item.id
                ? { 
                    ...cartItem, 
                    purchased_qty: cartItem.purchased_qty + (item.purchased_qty || 1) 
                  }
                : cartItem
            )
          } else {
            newCart = [...state.cart, { 
              ...item, 
              purchased_qty: item.purchased_qty || 1 
            }]
          }
          
          const newTotal = newCart.reduce((total, cartItem) => total + cartItem.purchased_qty, 0)
          
          return { 
            cart: newCart, 
            cartTotal: newTotal,
            error: null 
          }
        })
      },

      removeFromCart: (itemId) => {
        set((state) => {
          const newCart = state.cart.filter((item) => item.id !== itemId)
          const newTotal = newCart.reduce((total, item) => total + item.purchased_qty, 0)
          
          return { 
            cart: newCart, 
            cartTotal: newTotal,
            error: null 
          }
        })
      },

      updateCartItemQuantity: (itemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            const newCart = state.cart.filter((item) => item.id !== itemId)
            const newTotal = newCart.reduce((total, item) => total + item.purchased_qty, 0)
            return { 
              cart: newCart, 
              cartTotal: newTotal,
              error: null 
            }
          }
          
          const newCart = state.cart.map((item) => 
            item.id === itemId ? { ...item, purchased_qty: quantity } : item
          )
          const newTotal = newCart.reduce((total, item) => total + item.purchased_qty, 0)
          
          return { 
            cart: newCart, 
            cartTotal: newTotal,
            error: null 
          }
        })
      },

      clearCart: () => {
        set({ 
          cart: [], 
          cartTotal: 0,
          error: null 
        })
      },

      getCartTotal: () => {
        const { cart } = get()
        return cart.reduce((total: number, item: any) => 
          total + ((item.price || 0) * (item.purchased_qty || 0)), 0)
      },

      getCartSubtotal: () => {
        const { cart } = get()
        return cart.reduce((total: number, item: any) => 
          total + ((item.originalPrice || item.price || 0) * (item.purchased_qty || 0)), 0)
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cart: state.cart,
        cartTotal: state.cartTotal,
      }),
    }
  )
)

