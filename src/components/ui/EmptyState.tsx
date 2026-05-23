import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon:    LucideIcon
  title:   string
  message: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-16 px-6 text-center overflow-hidden rounded-xl">
      {/* Supergraphic texture */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          backgroundImage: "url('/supergraphic.svg')",
          backgroundSize:  '200%',
          backgroundPosition: 'center',
          opacity: 0.04,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Icon size={28} className="text-gray-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-700">{title}</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">{message}</p>
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}
