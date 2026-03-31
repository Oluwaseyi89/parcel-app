import { create } from "zustand";

import { apiRequest } from "@/lib/api";
import type { Deal } from "@/lib/types";

interface DealState {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  setDeals: (deals: Deal[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchDeals: (fetchUrl: string) => Promise<void>;
  acceptDeal: (dealId: Deal["order_id"], courierData: unknown) => void;
  addDeal: (deal: Deal) => void;
  removeDeal: (dealId: Deal["id"]) => void;
  clearDeals: () => void;
}

export const useDealStore = create<DealState>((set) => ({
  deals: [],
  loading: false,
  error: null,

  setDeals: (deals) => set({ deals }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchDeals: async (fetchUrl) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest<Deal[]>(fetchUrl, { method: "GET" });
      const filteredDeals = data.filter((item) => !item.handled_dispatch);
      set({ deals: filteredDeals, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch deals.", loading: false });
    }
  },

  acceptDeal: (dealId) => {
    set((state) => ({ deals: state.deals.filter((deal) => deal.order_id !== dealId) }));
  },

  addDeal: (deal) => set((state) => ({ deals: [...state.deals, deal] })),

  removeDeal: (dealId) => set((state) => ({ deals: state.deals.filter((deal) => deal.id !== dealId) })),

  clearDeals: () => set({ deals: [] }),
}));
