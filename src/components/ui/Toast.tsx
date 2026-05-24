'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id:       string
  type:     ToastType
  title:    string
  message?: string
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

// Durations: error = manual dismiss only, warning = 6s, others = 4s
const DURATION: Record<ToastType, number | null> = {
  success: 4000,
  error:   null,
  warning: 6000,
  info:    4000,
}

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
}

const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-orange-500',
  info:    'text-brand-500',
}

const BORDER_COLOR: Record<ToastType, string> = {
  success: 'border-green-100',
  error:   'border-red-100',
  warning: 'border-orange-100',
  info:    'border-blue-100',
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const Icon = ICONS[item.type]

  useEffect(() => {
    const dur = DURATION[item.type]
    if (dur === null) return
    const t = setTimeout(() => onDismiss(item.id), dur)
    return () => clearTimeout(t)
  }, [item.id, item.type, onDismiss])

  return (
    <div className={`flex items-start gap-3 bg-white rounded-xl shadow-toast border ${BORDER_COLOR[item.type]}
      p-4 min-w-[300px] max-w-[380px] animate-slide-in pointer-events-auto`}>
      <Icon size={20} className={`shrink-0 mt-0.5 ${ICON_COLOR[item.type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
        {item.message && <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors mt-0.5"
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
    setToasts(t => t.length >= 3 ? [...t.slice(-2), { id, type, title, message }] : [...t, { id, type, title, message }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(item => (
          <ToastItem key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
