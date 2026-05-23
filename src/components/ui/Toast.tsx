'use client'
import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id:      string
  type:    ToastType
  title:   string
  message?: string
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
}

const COLORS: Record<ToastType, string> = {
  success: 'text-green-500',
  error:   'text-red-500',
  info:    'text-brand-500',
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const Icon = ICONS[item.type]
  return (
    <div className="toast">
      <Icon size={20} className={`shrink-0 mt-0.5 ${COLORS[item.type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
        {item.message && <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, type, title, message }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(item => (
          <div key={item.id} className="pointer-events-auto">
            <ToastItem item={item} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
