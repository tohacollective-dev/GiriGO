'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Users, BarChart2,
  AlertTriangle, MapPin, LogOut
} from 'lucide-react'

const nav = [
  { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/orders',     label: 'Orders',     icon: Package },
  { href: '/admin/couriers',   label: 'Couriers',   icon: Users },
  { href: '/admin/analytics',  label: 'Analytics',  icon: BarChart2 },
  { href: '/admin/exceptions', label: 'Exceptions', icon: AlertTriangle },
  { href: '/admin/zones',      label: 'Zones',      icon: MapPin },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-900 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">🛵 GiriGo</h1>
          <p className="text-xs text-white/50 mt-0.5">Admin Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/admin' && path.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-3 py-2 text-white/60 hover:text-white text-sm w-full rounded-lg hover:bg-white/10 transition-colors">
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
