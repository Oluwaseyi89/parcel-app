import { create } from 'zustand'

interface UIState {
  cartNotification: boolean
  successMessage: string
  errorMessage: string
  loadingState: boolean
  showCartNotification: () => void
  hideCartNotification: () => void
  setSuccessMessage: (message: string) => void
  clearSuccessMessage: () => void
  setErrorMessage: (message: string) => void
  clearErrorMessage: () => void
  setLoadingState: (loading: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  cartNotification: false,
  successMessage: '',
  errorMessage: '',
  loadingState: false,

  showCartNotification: () => set({ cartNotification: true }),
  hideCartNotification: () => set({ cartNotification: false }),

  setSuccessMessage: (message: string) => set({ successMessage: message }),
  clearSuccessMessage: () => set({ successMessage: '' }),

  setErrorMessage: (message: string) => set({ errorMessage: message }),
  clearErrorMessage: () => set({ errorMessage: '' }),

  setLoadingState: (loading: boolean) => set({ loadingState: loading }),
}))
