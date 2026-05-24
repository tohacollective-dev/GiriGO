'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart2,
  AlertTriangle,
  Map,
  DollarSign,
  FileText,
  Receipt,
  TrendingUp,
  Layers,
  FlaskConical,
  MapPin,
  Settings,
  ShieldCheck,
  ClipboardList,
  LogOut,
  Bell,
  Search,
  Plus,
  ChevronRight,
} from 'lucide-react'

const GlobalSearch = dynamic(() => import('@/components/admin/GlobalSearch'), { ssr: false })

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  icon?: React.ElementType
  badge?: string
  badgeColor?: 'green' | 'amber' | 'red'
  sub?: boolean
  action?: 'create-order'
}

type NavGroup = {
  label?: string
  items: NavItem[]
  bottom?: boolean
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'ORDERS',
    items: [
      { href: '/admin/orders',                   label: 'All Orders',  icon: Package },
      { href: '/admin/orders?status=pending',    label: 'Pending',                   sub: true },
      { href: '/admin/orders?status=assigned',   label: 'Active',                    sub: true },
      { href: '/admin/orders?status=delivered',  label: 'Delivered',                 sub: true },
      { href: '/admin/exceptions',               label: 'Exceptions',  icon: AlertTriangle, sub: true },
    ],
  },
  {
    label: 'LIVE MAP',
    items: [
      { href: '/admin/map', label: 'Real-Time Map', icon: Map, badge: 'LIVE', badgeColor: 'green' },
    ],
  },
  {
    label: 'COURIERS',
    items: [
      { href: '/admin/couriers',                  label: 'All Couriers',  icon: Users },
      { href: '/admin/couriers?status=online',    label: 'Online Now',                sub: true },
      { href: '/admin/couriers?tab=performance',  label: 'Performance',               sub: true },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { href: '/admin/finance/ledger',   label: 'Ledger (85/15)',      icon: DollarSign },
      { href: '/admin/finance/cod',      label: 'COD Reconciliation',  icon: Receipt,   sub: true },
      { href: '/admin/finance/reports',  label: 'Reports & Export',    icon: FileText,  sub: true },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { href: '/admin/analytics',              label: 'Overview',     icon: TrendingUp },
      { href: '/admin/analytics?tab=heatmap',  label: 'Zone Heatmap', icon: Layers,    sub: true },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { href: '/admin/simulation', label: 'Dispatch Engine',    icon: FlaskConical },
      { href: '/admin/zones',      label: 'Route Optimization', icon: MapPin },
    ],
  },
  {
    label: 'SYSTEM',
    bottom: true,
    items: [
      { href: '/admin/settings', label: 'Settings',       icon: Settings },
      { href: '/admin/roles',    label: 'Roles',           icon: ShieldCheck },
      { href: '/admin/logs',     label: 'Activity Logs',  icon: ClipboardList },
    ],
  },
]

// ─── Breadcrumb helper ────────────────────────────────────────────────────────

function getSectionName(path: string): string {
  if (path === '/admin')                   return 'Dashboard'
  if (path.startsWith('/admin/map'))       return 'Live Map'
  if (path.startsWith('/admin/orders'))    return 'Orders'
  if (path.startsWith('/admin/couriers'))  return 'Couriers'
  if (path.startsWith('/admin/analytics')) return 'Analytics'
  if (path.startsWith('/admin/finance'))   return 'Finance'
  if (path.startsWith('/admin/simulation'))return 'Dispatch Engine'
  if (path.startsWith('/admin/zones'))     return 'Route Optimization'
  if (path.startsWith('/admin/exceptions'))return 'Exceptions'
  if (path.startsWith('/admin/settings'))  return 'Settings'
  if (path.startsWith('/admin/roles'))     return 'Roles'
  if (path.startsWith('/admin/logs'))      return 'Activity Logs'
  return 'Admin'
}

// ─── NavItem component ────────────────────────────────────────────────────────

function SidebarItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  const isSub = item.sub && !item.icon

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors group
        ${isSub ? 'pl-8 py-1.5 text-[13px]' : 'px-3 py-2.5'}
        ${active
          ? 'bg-white/15 text-white'
          : 'text-white/60 hover:bg-white/10 hover:text-white'
        }`}
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      {isSub && (
        <ChevronRight size={12} className={`shrink-0 transition-colors ${active ? 'text-white/60' : 'text-white/20 group-hover:text-white/40'}`} />
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full tracking-wide leading-none
          ${item.badgeColor === 'green' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}>
          {item.badge}
        </span>
      )}
    </Link>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  // Ctrl+K opens global search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const isMapPage = path === '/admin/map'
  const sectionName = getSectionName(path)

  // Separate bottom groups from main groups
  const mainGroups  = NAV_GROUPS.filter(g => !g.bottom)
  const bottomGroups = NAV_GROUPS.filter(g => g.bottom)

  function isActive(item: NavItem) {
    // Exact match for dashboard to avoid prefix-matching everything
    if (item.href === '/admin') return path === '/admin'
    // Strip query string for comparison
    const itemPath = item.href.split('?')[0]
    const pathNoQuery = path.split('?')[0]
    return pathNoQuery === itemPath || pathNoQuery.startsWith(itemPath + '/')
  }

  function renderGroup(group: NavGroup, idx: number) {
    return (
      <div key={idx} className={group.label ? 'mt-1' : ''}>
        {group.label && (
          <p className="px-3 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30 select-none">
            {group.label}
          </p>
        )}
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <SidebarItem key={item.href} item={item} active={isActive(item)} />
          ))}
          {/* Create Order CTA under ORDERS group */}
          {group.label === 'ORDERS' && (
            <button className="flex items-center gap-2.5 px-3 py-2 mt-1 w-full rounded-lg text-[13px] font-medium
              text-brand-400 hover:bg-white/10 hover:text-white transition-colors border border-white/10 hover:border-white/20">
              <Plus size={14} />
              <span>Create Order</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-[240px] bg-brand-900 text-white flex flex-col shrink-0 overflow-hidden">

        {/* Logo */}
        <div className="px-5 py-5 shrink-0">
          <h1 className="text-xl font-bold text-white tracking-tight">🛵 GiriGo</h1>
          <p className="text-[11px] text-white/40 mt-0.5 font-medium">Admin</p>
        </div>

        {/* Main nav — scrollable */}
        <nav className="flex-1 px-3 pb-3 overflow-y-auto overflow-x-hidden
          [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent
          [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          {mainGroups.map((group, idx) => renderGroup(group, idx))}
        </nav>

        {/* Bottom groups (SYSTEM) + logout */}
        <div className="px-3 pb-4 shrink-0 border-t border-white/10 pt-3">
          {bottomGroups.map((group, idx) => renderGroup(group, idx + mainGroups.length))}

          <div className="mt-3 pt-3 border-t border-white/10">
            <button className="flex items-center gap-2.5 px-3 py-2 text-red-400/70 hover:text-red-300
              hover:bg-red-500/10 text-sm font-medium w-full rounded-lg transition-colors">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Nav */}
        <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center gap-4 shrink-0">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400 shrink-0">
            <span className="text-gray-300">Admin</span>
            <ChevronRight size={13} />
            <span className="text-gray-700 font-medium">{sectionName}</span>
          </div>

          {/* Search bar — center */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 h-9 w-full max-w-sm px-3.5 rounded-lg
                bg-gray-50 border border-gray-200 text-gray-400 text-sm
                hover:border-gray-300 hover:bg-gray-100 transition-colors cursor-text text-left"
            >
              <Search size={14} className="shrink-0 text-gray-400" />
              <span className="flex-1 text-[13px]">Cari order, kurir... (Ctrl+K)</span>
              <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-medium text-gray-300
                border border-gray-200 rounded px-1 py-0.5 leading-none">
                <span>⌘</span><span>K</span>
              </kbd>
            </button>
          </div>

          {/* Right — bell + avatar */}
          <div className="flex items-center gap-3 shrink-0">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold
                rounded-full flex items-center justify-center leading-none">
                3
              </span>
            </button>

            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center
              text-white text-sm font-bold cursor-pointer hover:bg-brand-700 transition-colors select-none">
              W
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 ${isMapPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {children}
        </main>
      </div>

      {/* Global Search overlay */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
