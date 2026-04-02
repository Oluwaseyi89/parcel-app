import { create } from "zustand";

import type { Deal } from "@/lib/types";

interface DealState {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  setDeals: (deals: Deal[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDealStore = create<DealState>((set) => ({
  deals: [],
  loading: false,
  error: null,

  setDeals: (deals) => set({ deals }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
