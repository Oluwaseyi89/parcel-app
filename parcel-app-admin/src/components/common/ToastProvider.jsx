import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((toast) => {
    const id = makeId()
    const next = {
      id,
      kind: toast?.kind || 'info',
      message: toast?.message || '',
      duration: typeof toast?.duration === 'number' ? toast.duration : 3500,
    }

    setToasts((prev) => [...prev, next])

    if (next.duration > 0) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id))
      }, next.duration)
    }

    return id
  }, [])

  const value = useMemo(
    () => ({
      pushToast,
      dismissToast,
      success: (message, duration) => pushToast({ kind: 'success', message, duration }),
      error: (message, duration) => pushToast({ kind: 'error', message, duration }),
      info: (message, duration) => pushToast({ kind: 'info', message, duration }),
    }),
    [dismissToast, pushToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.kind}`}>
            <span>{toast.message}</span>
            <button type="button" className="toast-close" onClick={() => dismissToast(toast.id)}>
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
