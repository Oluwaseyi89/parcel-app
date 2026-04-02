import { create } from "zustand";

import { apiRequest, type ApiEnvelope, unwrapApiData } from "@/lib/api";
import { storage } from "@/lib/storage";
import type { Product } from "@/lib/types";

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getAllProducts: (fetchUrl: string) => Promise<void>;
  getProductDetail: (id: Product["id"]) => void;
  clearSelectedProduct: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,

  setProducts: (products) => set({ products }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getAllProducts: async (fetchUrl) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest<Product[] | ApiEnvelope<Product[]>>(fetchUrl, { method: "GET" });
      const products = unwrapApiData<Product[]>(response, []);
      set({ products, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch products.", loading: false });
    }
  },

  getProductDetail: (id) => {
    const product = get().products.find((item) => item.id === id) ?? null;
    if (product) {
      storage.setProductView(product);
    }
    set({ selectedProduct: product });
  },

  clearSelectedProduct: () => set({ selectedProduct: null }),
}));
