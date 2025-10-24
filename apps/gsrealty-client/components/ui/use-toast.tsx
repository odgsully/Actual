"use client"

import * as React from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (toast: Omit<Toast, "id">) => void
  dismiss: (toastId?: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((newToast: Omit<Toast, "id">) => {
    const id = Date.now().toString()
    const toastWithId = { ...newToast, id }

    setToasts((prev) => [...prev, toastWithId])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((prev) =>
      toastId
        ? prev.filter((t) => t.id !== toastId)
        : []
    )
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Simple toast display */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border p-4 shadow-lg bg-white dark:bg-gray-900 ${
              toast.variant === "destructive"
                ? "border-red-500 text-red-900 dark:text-red-100"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {toast.title && (
              <div className="font-semibold">{toast.title}</div>
            )}
            {toast.description && (
              <div className="text-sm mt-1">{toast.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)

  if (!context) {
    // Return a dummy implementation if context is not available
    return {
      toasts: [],
      toast: (toast: Omit<Toast, "id">) => {
        // Simply log to console as fallback
        console.log("Toast:", toast)
      },
      dismiss: (toastId?: string) => {}
    }
  }

  return context
}