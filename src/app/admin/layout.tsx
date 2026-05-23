'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Users, BarChart2,
  AlertTriangle, MapPin, Map, FlaskConical, LogOut
} from 'lucide-react'

const nav = [
  { href: '/admin',              label: 'Dashboard',   icon: LayoutDashboard, badge: null },
  { href: '/admin/map',          label: 'Live Map',    icon: Map,             badge: 'LIVE' },
  { href: '/admin/orders',       label: 'Orders',      icon: Package,         badge: null },
  { href: '/admin/couriers',     label: 'Couriers',    icon: Users,           badge: null },
  { href: '/admin/analytics',    label: 'Analytics',   icon: BarChart2,       badge: null },
  { href: '/admin/exceptions',   label: 'Exceptions',  icon: AlertTriangle,   badge: null },
  { href: '/admin/zones',        label: 'Zones',       icon: MapPin,          badge: null },
  { href: '/admin/simulation',   label: 'Simulation',  icon: FlaskConical,    badge: 'TEST' },
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
          {nav.map(({ href, label, icon: Icon, badge }) => {
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
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full tracking-wide ${
                    badge === 'LIVE' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
                  }`}>
                    {badge}
                  </span>
                )}
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

      {/* Main content — map page needs overflow-hidden, others scroll */}
      <main className={`flex-1 ${path === '/admin/map' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {children}
      </main>
    </div>
  )
}
