import { create } from 'zustand'

type Product = any

interface ProductState {
  products: Product[]
  selectedProduct: Product | null
  loading: boolean
  error: any
  setProducts: (products: Product[]) => void
  setSelectedProduct: (product: Product | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: any) => void
  getAllProducts: (fetchUrl: string) => Promise<void>
  getProductDetail: (id: any) => void
  clearSelectedProduct: () => void
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,

  setProducts: (products) => set({ products }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getAllProducts: async (fetchUrl: string) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(fetchUrl)
      const data = await response.json()
      set({ products: data, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  getProductDetail: (id) => {
    const { products } = useProductStore.getState()
    const product = products.find((prod) => prod.id === id)
    if (product) {
      set({ selectedProduct: product })
      localStorage.setItem('prodView', JSON.stringify(product))
    }
  },

  clearSelectedProduct: () => set({ selectedProduct: null }),
}))
