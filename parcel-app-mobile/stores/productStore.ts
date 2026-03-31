// stores/productStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  getProductDetail: (id: any) => Promise<void>
  clearSelectedProduct: () => void
  searchProducts: (query: string) => Product[]
  filterProducts: (category: string) => Product[]
  refreshProducts: (fetchUrl: string) => Promise<Product[]>
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      selectedProduct: null,
      loading: false,
      error: null,

      setProducts: (products) => set({ products, error: null }),
      setSelectedProduct: (product) => set({ 
        selectedProduct: product, 
        error: null 
      }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      getAllProducts: async (fetchUrl: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(fetchUrl)
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const data = await response.json()
          const productsArray = Array.isArray(data) ? data : []
          
          // Sort products (optional: by popularity, date, etc.)
          const sortedProducts = productsArray.sort((a: Product, b: Product) => {
            // Sort by name alphabetically by default
            const nameA = a.name?.toLowerCase() || ''
            const nameB = b.name?.toLowerCase() || ''
            return nameA.localeCompare(nameB)
          })
          
          set({ 
            products: sortedProducts, 
            loading: false 
          })
        } catch (error: any) {
          console.error('Error fetching products:', error)
          set({ 
            error: error.message || 'Failed to fetch products', 
            loading: false 
          })
        }
      },

      getProductDetail: async (id) => {
        const { products } = get()
        
        // First check local products
        const localProduct = products.find((prod) => prod.id === id)
        
        if (localProduct) {
          // Save to AsyncStorage for persistence
          try {
            await AsyncStorage.setItem('prodView', JSON.stringify(localProduct))
          } catch (error) {
            console.error('Error saving product to storage:', error)
          }
          
          set({ selectedProduct: localProduct })
          return
        }
        
        // If not found locally, fetch from API
        set({ loading: true, error: null })
        try {
          // You would need the API endpoint for single product
          // const response = await fetch(`https://your-api.com/products/${id}`)
          // const product = await response.json()
          // set({ selectedProduct: product, loading: false })
          
          // For now, just set to null if not found
          set({ 
            selectedProduct: null, 
            loading: false,
            error: 'Product not found in local cache' 
          })
        } catch (error: any) {
          console.error('Error fetching product detail:', error)
          set({ 
            error: error.message || 'Failed to fetch product details',
            loading: false 
          })
        }
      },

      clearSelectedProduct: () => {
        // Clear from AsyncStorage as well
        AsyncStorage.removeItem('prodView').catch(console.error)
        set({ 
          selectedProduct: null, 
          error: null 
        })
      },

      searchProducts: (query: string) => {
        const { products } = get()
        if (!query.trim()) return products
        
        const searchTerm = query.toLowerCase()
        return products.filter((product) => {
          return (
            product.name?.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm) ||
            product.category?.toLowerCase().includes(searchTerm)
          )
        })
      },

      filterProducts: (category: string) => {
        const { products } = get()
        if (!category || category === 'all') return products
        
        return products.filter((product) => 
          product.category?.toLowerCase() === category.toLowerCase()
        )
      },

      refreshProducts: async (fetchUrl: string) => {
        try {
          const response = await fetch(fetchUrl)
          if (!response.ok) throw new Error('Failed to refresh products')
          
          const data = await response.json()
          const productsArray = Array.isArray(data) ? data : []
          
          set({ 
            products: productsArray,
            error: null 
          })
          
          return productsArray
        } catch (error: any) {
          console.error('Error refreshing products:', error)
          set({ 
            error: error.message || 'Failed to refresh products'
          })
          throw error
        }
      },
    }),
    {
      name: 'product-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        products: state.products,
        selectedProduct: state.selectedProduct,
      }),
    }
  )
)

