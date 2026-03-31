import { create } from 'zustand'

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
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  cartTotal: 0,
  loading: false,
  error: null,

  initializeCart: () => {
    const parcelCart = JSON.parse(localStorage.getItem('parcelCart') || '[]') || []
    const cartTot = JSON.parse(localStorage.getItem('cartTot') || '{"totItem":0}') || { totItem: 0 }
    set({ cart: parcelCart, cartTotal: cartTot.totItem })
  },

  addToCart: (item) => {
    set((state) => {
      const existingItem = state.cart.find((cartItem) => cartItem.id === item.id)
      let newCart
      if (existingItem) {
        newCart = state.cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, purchased_qty: cartItem.purchased_qty + (item.purchased_qty || 1) }
            : cartItem
        )
      } else {
        newCart = [...state.cart, { ...item, purchased_qty: item.purchased_qty || 1 }]
      }
      const newTotal = newCart.reduce((total, cartItem) => total + cartItem.purchased_qty, 0)
      localStorage.setItem('parcelCart', JSON.stringify(newCart))
      localStorage.setItem('cartTot', JSON.stringify({ totItem: newTotal }))
      return { cart: newCart, cartTotal: newTotal }
    })
  },

  removeFromCart: (itemId) => {
    set((state) => {
      const newCart = state.cart.filter((item) => item.id !== itemId)
      const newTotal = newCart.reduce((total, item) => total + item.purchased_qty, 0)
      localStorage.setItem('parcelCart', JSON.stringify(newCart))
      localStorage.setItem('cartTot', JSON.stringify({ totItem: newTotal }))
      return { cart: newCart, cartTotal: newTotal }
    })
  },

  updateCartItemQuantity: (itemId, quantity) => {
    set((state) => {
      const newCart = state.cart.map((item) => (item.id === itemId ? { ...item, purchased_qty: quantity } : item))
      const newTotal = newCart.reduce((total, item) => total + item.purchased_qty, 0)
      localStorage.setItem('parcelCart', JSON.stringify(newCart))
      localStorage.setItem('cartTot', JSON.stringify({ totItem: newTotal }))
      return { cart: newCart, cartTotal: newTotal }
    })
  },

  clearCart: () => {
    localStorage.removeItem('parcelCart')
    localStorage.removeItem('cartTot')
    set({ cart: [], cartTotal: 0 })
  },

  getCartTotal: () => {
    const { cart } = get()
    return cart.reduce((total: number, item: any) => total + (item.price * item.purchased_qty), 0)
  },
}))
