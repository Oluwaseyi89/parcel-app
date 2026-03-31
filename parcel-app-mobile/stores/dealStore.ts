// stores/dealStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Deal = any

interface DealState {
  deals: Deal[]
  loading: boolean
  error: any
  setDeals: (deals: Deal[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: any) => void
  fetchDeals: (fetchUrl: string) => Promise<void>
  acceptDeal: (dealId: any, courierData: any) => Promise<void>
  addDeal: (deal: Deal) => void
  removeDeal: (dealId: any) => void
  clearDeals: () => void
  updateDeal: (dealId: any, updates: Partial<Deal>) => void
}

export const useDealStore = create<DealState>()(
  persist(
    (set, get) => ({
      deals: [],
      loading: false,
      error: null,

      setDeals: (deals) => set({ deals }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      fetchDeals: async (fetchUrl: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(fetchUrl)
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const data = await response.json()
          const filteredDeals = Array.isArray(data) 
            ? data.filter((item: any) => !item.handled_dispatch)
            : []
          
          set({ deals: filteredDeals, loading: false })
        } catch (error: any) {
          console.error('Error fetching deals:', error)
          set({ 
            error: error.message || 'Failed to fetch deals', 
            loading: false 
          })
        }
      },

      acceptDeal: async (dealId, courierData) => {
        set({ loading: true, error: null })
        try {
          // Optional: Make API call to accept deal on server
          // const response = await fetch('/api/accept-deal', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ dealId, courierData })
          // })
          
          // if (!response.ok) throw new Error('Failed to accept deal')
          
          // Update local state
          set((state) => ({ 
            deals: state.deals.filter((deal) => deal.order_id !== dealId),
            loading: false 
          }))
        } catch (error: any) {
          console.error('Error accepting deal:', error)
          set({ 
            error: error.message || 'Failed to accept deal', 
            loading: false 
          })
        }
      },

      addDeal: (deal) => set((state) => ({ 
        deals: [...state.deals, deal],
        error: null 
      })),

      removeDeal: (dealId) => set((state) => ({ 
        deals: state.deals.filter((deal) => deal.id !== dealId),
        error: null 
      })),

      updateDeal: (dealId, updates) => set((state) => ({
        deals: state.deals.map((deal) =>
          deal.id === dealId ? { ...deal, ...updates } : deal
        ),
        error: null
      })),

      clearDeals: () => set({ 
        deals: [], 
        error: null 
      }),
    }),
    {
      name: 'deal-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        deals: state.deals,
      }),
    }
  )
)

// Alternative: With network status check
export const useDealStoreWithNetwork = create<DealState>()(
  persist(
    (set, get) => ({
      deals: [],
      loading: false,
      error: null,

      setDeals: (deals) => set({ deals }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      fetchDeals: async (fetchUrl: string) => {
        set({ loading: true, error: null })
        try {
          // Check network connectivity (optional - requires NetInfo)
          // import NetInfo from '@react-native-community/netinfo'
          // const netInfo = await NetInfo.fetch()
          // if (!netInfo.isConnected) {
          //   throw new Error('No internet connection')
          // }
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
          
          const response = await fetch(fetchUrl, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            }
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
          }
          
          const data = await response.json()
          
          // Validate response structure
          if (!Array.isArray(data)) {
            throw new Error('Invalid response format: expected array')
          }
          
          const filteredDeals = data.filter((item: any) => !item.handled_dispatch)
          
          set({ deals: filteredDeals, loading: false })
        } catch (error: any) {
          console.error('Fetch deals error:', error)
          
          // Handle specific errors
          let errorMessage = 'Failed to fetch deals'
          if (error.name === 'AbortError') {
            errorMessage = 'Request timeout'
          } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection.'
          }
          
          set({ 
            error: errorMessage, 
            loading: false 
          })
        }
      },

      acceptDeal: async (dealId, courierData) => {
        set({ loading: true, error: null })
        try {
          // Example API call
          // const response = await fetch('https://your-api.com/accept-deal', {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'Authorization': `Bearer ${courierData.token}`,
          //   },
          //   body: JSON.stringify({
          //     dealId,
          //     courierId: courierData.id,
          //     courierName: courierData.name,
          //   }),
          // })
          
          // if (!response.ok) {
          //   const errorData = await response.json()
          //   throw new Error(errorData.message || 'Failed to accept deal')
          // }
          
          // const result = await response.json()
          
          // Update local state
          set((state) => {
            const updatedDeals = state.deals.filter((deal) => deal.order_id !== dealId)
            return { 
              deals: updatedDeals,
              loading: false 
            }
          })
          
          // Optional: Show success message
          // Alert.alert('Success', 'Deal accepted successfully')
          
        } catch (error: any) {
          console.error('Error accepting deal:', error)
          set({ 
            error: error.message || 'Failed to accept deal', 
            loading: false 
          })
          
          // Optional: Show error alert
          // Alert.alert('Error', error.message)
        }
      },

      addDeal: (deal) => set((state) => ({ 
        deals: [...state.deals, deal].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ),
        error: null 
      })),

      removeDeal: (dealId) => set((state) => ({ 
        deals: state.deals.filter((deal) => deal.id !== dealId),
        error: null 
      })),

      updateDeal: (dealId, updates) => set((state) => ({
        deals: state.deals.map((deal) =>
          deal.id === dealId ? { ...deal, ...updates } : deal
        ),
        error: null
      })),

      clearDeals: () => set({ 
        deals: [], 
        error: null 
      }),
    }),
    {
      name: 'deal-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        deals: state.deals,
      }),
    }
  )
)