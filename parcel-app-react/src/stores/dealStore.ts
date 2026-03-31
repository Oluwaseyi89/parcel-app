import { create } from 'zustand'

type Deal = any

interface DealState {
  deals: Deal[]
  loading: boolean
  error: any
  setDeals: (deals: Deal[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: any) => void
  fetchDeals: (fetchUrl: string) => Promise<void>
  acceptDeal: (dealId: any, courierData: any) => void
  addDeal: (deal: Deal) => void
  removeDeal: (dealId: any) => void
  clearDeals: () => void
}

export const useDealStore = create<DealState>((set) => ({
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
      const data = await response.json()
      const filteredDeals = data.filter((item: any) => !item.handled_dispatch)
      set({ deals: filteredDeals, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  acceptDeal: (dealId, courierData) => {
    set((state) => ({ deals: state.deals.filter((deal) => deal.order_id !== dealId) }))
  },

  addDeal: (deal) => set((state) => ({ deals: [...state.deals, deal] })),

  removeDeal: (dealId) => set((state) => ({ deals: state.deals.filter((deal) => deal.id !== dealId) })),

  clearDeals: () => set({ deals: [] }),
}))
