// stores/uiStore.ts
import { create } from 'zustand'
import { Alert } from 'react-native'

interface UIState {
  cartNotification: boolean
  successMessage: string
  errorMessage: string
  loadingState: boolean
  modalVisible: boolean
  modalContent: React.ReactNode | null
  toastQueue: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
  showCartNotification: () => void
  hideCartNotification: () => void
  setSuccessMessage: (message: string) => void
  clearSuccessMessage: () => void
  setErrorMessage: (message: string) => void
  clearErrorMessage: () => void
  setLoadingState: (loading: boolean) => void
  showModal: (content: React.ReactNode) => void
  hideModal: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void
  clearToast: (id: string) => void
  showAlert: (title: string, message: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => void
  showLoading: (message?: string) => void
  hideLoading: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  cartNotification: false,
  successMessage: '',
  errorMessage: '',
  loadingState: false,
  modalVisible: false,
  modalContent: null,
  toastQueue: [],

  showCartNotification: () => {
    set({ cartNotification: true })
    // Auto hide after 3 seconds
    setTimeout(() => {
      get().hideCartNotification()
    }, 3000)
  },

  hideCartNotification: () => set({ cartNotification: false }),

  setSuccessMessage: (message: string) => {
    set({ successMessage: message })
    // Auto clear after 3 seconds
    setTimeout(() => {
      get().clearSuccessMessage()
    }, 3000)
  },

  clearSuccessMessage: () => set({ successMessage: '' }),

  setErrorMessage: (message: string) => {
    set({ errorMessage: message })
    // Auto clear after 5 seconds
    setTimeout(() => {
      get().clearErrorMessage()
    }, 5000)
  },

  clearErrorMessage: () => set({ errorMessage: '' }),

  setLoadingState: (loading: boolean) => set({ loadingState: loading }),

  showModal: (content: React.ReactNode) => set({
    modalVisible: true,
    modalContent: content
  }),

  hideModal: () => set({
    modalVisible: false,
    modalContent: null
  }),

  showToast: (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    
    set((state) => ({
      toastQueue: [...state.toastQueue, { id, message, type }]
    }))
    
    // Auto remove after duration
    setTimeout(() => {
      get().clearToast(id)
    }, duration)
  },

  clearToast: (id: string) => {
    set((state) => ({
      toastQueue: state.toastQueue.filter(toast => toast.id !== id)
    }))
  },

  showAlert: (title: string, message: string, buttons = [{ text: 'OK' }]) => {
    Alert.alert(title, message, buttons)
  },

  showLoading: (message?: string) => {
    set({ loadingState: true })
    if (message) {
      get().showToast(message, 'info', 0) // Show indefinite toast for loading message
    }
  },

  hideLoading: () => {
    set({ loadingState: false })
    // Clear any loading toasts
    const { toastQueue } = get()
    const loadingToasts = toastQueue.filter(toast => !toast.type || toast.type === 'info')
    loadingToasts.forEach(toast => get().clearToast(toast.id))
  },
}))

