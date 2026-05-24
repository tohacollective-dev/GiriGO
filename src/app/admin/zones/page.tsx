'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MapPin, TrendingUp, RefreshCw, Route, Package,
  Wallet, Zap, Clock, ChevronDown, ChevronUp,
} from 'lucide-react'
import { formatIDR } from '@/lib/pricing'
import { Skeleton }  from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RouteOrder {
  id:              string
  order_code:      string
  pickup_address:  string
  dropoff_address: string
  status:          string
  delivery_fee:    number
  payment_method:  string
}

interface ActiveRoute {
  id:                        string
  status:                    'active' | 'idle' | 'completed'
  orders_in_route:           string[]
  total_distance_km:         number
  route_start_address:       string
  route_end_address:         string
  start_lat:                 number
  start_lng:                 number
  end_lat:                   number
  end_lng:                   number
  current_location:          { lat: number | null; lng: number | null; updated_at: string | null }
  estimated_completion_time: string | null
  updated_at:                string
  courier: {
    id:         string
    status:     string
    rating:     number
    current_lat: number | null
    current_lng: number | null
    user: { name: string; phone: string }
  }
  orders: RouteOrder[]
}

interface RouteStats {
  active_routes:          number
  batched_orders:         number
  total_saved_idr:        number
  efficiency_pct:         number
  total_orders_today:     number
  route_optimized_orders: number
}

interface ApiResponse {
  routes:    ActiveRoute[]
  stats:     RouteStats
  timestamp: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GERUNG_ZONES = [
  { name: 'Gerung Kota',    lat: -8.6508, lng: 116.1202, desc: 'Pusat kota Gerung, dekat alun-alun' },
  { name: 'Giri Menang',    lat: -8.6475, lng: 116.1180, desc: 'Giri Menang Square & sekitarnya' },
  { name: 'Karang Bongkot', lat: -8.6620, lng: 116.1350, desc: 'Wilayah Karang Bongkot' },
  { name: 'Dasan Baru',     lat: -8.6450, lng: 116.1100, desc: 'Dasan Baru & Dasan Gria' },
  { name: 'Batu Kumbung',   lat: -8.6700, lng: 116.1100, desc: 'Batu Kumbung ke arah selatan' },
  { name: 'Tempos',         lat: -8.6350, lng: 116.1400, desc: 'Tempos & sekitarnya' },
  { name: 'Beleke',         lat: -8.6550, lng: 116.1450, desc: 'Beleke dan Taman Sari' },
  { name: 'Jagaraga',       lat: -8.6800, lng: 116.1250, desc: 'Jagaraga arah selatan' },
]

const HUB_LAT = -8.6475
const HUB_LNG = 116.1180

// Route colors for the map
const ROUTE_COLORS = ['#2563EB', '#16A34A', '#D97706', '#7C3AED', '#DC2626', '#0891B2']

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, iconBg, loading }: {
  label:   string; value:  string | number; sub?: string
  icon:    React.ElementType; iconBg: string; loading?: boolean
}) {
  if (loading) return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 min-h-[100px]">
      <Skeleton className="h-full" />
    </div>
  )
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex flex-col gap-3 animate-fade-in">
      <div className={`p-2.5 rounded-xl w-fit ${iconBg}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-[26px] font-bold text-brand-900 tabular-nums leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── RouteRow ──────────────────────────────────────────────────────────────────

function RouteRow({ route, colorIdx }: { route: ActiveRoute; colorIdx: number }) {
  const [open, setOpen] = useState(false)
  const color = ROUTE_COLORS[colorIdx % ROUTE_COLORS.length]
  const orderCount = route.orders_in_route.length

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white animate-fade-in">
      {/* Summary row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Color dot + route indicator */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
              {route.courier.user.name}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
              route.status === 'active'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gray-50 text-gray-500 border border-gray-200'
            }`}>
              {route.status}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
            {route.route_start_address} → {route.route_end_address}
          </p>
        </div>

        {/* Metrics */}
        <div className="hidden sm:flex items-center gap-4 shrink-0 text-right">
          <div>
            <p className="text-xs font-bold text-gray-800 tabular-nums">{orderCount}</p>
            <p className="text-[10px] text-gray-400">order</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 tabular-nums">{Number(route.total_distance_km).toFixed(1)} km</p>
            <p className="text-[10px] text-gray-400">jarak</p>
          </div>
          <div>
            <p className="text-xs font-bold text-yellow-600">⭐ {route.courier.rating.toFixed(1)}</p>
            <p className="text-[10px] text-gray-400">rating</p>
          </div>
        </div>

        <div className="shrink-0 text-gray-400 ml-2">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded order list */}
      {open && (
        <div className="border-t border-gray-100">
          {route.orders.length ? (
            <div className="divide-y divide-gray-50">
              {route.orders.map((o, i) => (
                <div key={o.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="text-[10px] font-mono font-bold text-gray-300 w-4 shrink-0 mt-0.5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-brand-500">{o.order_code}</span>
                      <StatusBadge status={o.status as any} size="sm" />
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{o.pickup_address}</p>
                    <p className="text-[11px] text-gray-400 truncate">→ {o.dropoff_address}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 shrink-0 tabular-nums">
                    {formatIDR(o.delivery_fee)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Order data tidak tersedia</p>
          )}

          {/* Route coordinates / GPS */}
          {route.current_location?.lat && (
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
              <MapPin size={11} className="text-gray-400 shrink-0" />
              <span className="text-[10px] text-gray-500 font-mono">
                {route.current_location.lat.toFixed(5)}, {route.current_location.lng?.toFixed(5)}
                {route.current_location.updated_at && (
                  <span className="ml-2 font-sans text-gray-400">
                    · {new Date(route.current_location.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Map component ─────────────────────────────────────────────────────────────

function RouteMap({ routes }: { routes: ActiveRoute[] }) {
  const mapRef    = useRef<HTMLDivElement>(null)
  const mapInst   = useRef<any>(null)
  const routeLayers = useRef<any[]>([])

  useEffect(() => {
    if (mapInst.current || !mapRef.current) return

    const link  = document.createElement('link')
    link.rel    = 'stylesheet'
    link.href   = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(link)

    const script    = document.createElement('script')
    script.src      = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.async    = true
    script.onload   = () => {
      const L = (window as any).L
      if (!L || !mapRef.current) return

      const map = L.map(mapRef.current, { center: [HUB_LAT, HUB_LNG], zoom: 13, zoomControl: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map)

      // 5km service radius
      L.circle([HUB_LAT, HUB_LNG], {
        radius: 5000, color: '#2563EB', weight: 1.5, opacity: 0.3,
        fillColor: '#2563EB', fillOpacity: 0.03,
      }).addTo(map)

      // Hub marker
      L.marker([HUB_LAT, HUB_LNG], {
        icon: L.divIcon({
          html: `<div style="width:32px;height:32px;background:#0F172A;border:2.5px solid white;border-radius:50%;display:grid;place-items:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.35)">🏙️</div>`,
          className: '', iconSize: [32, 32], iconAnchor: [16, 16],
        }),
      }).addTo(map).bindPopup('<b>Giri Menang Square</b><br>Hub Operasional GiriGo')

      mapInst.current = map
    }
    document.head.appendChild(script)

    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null }
    }
  }, [])

  // Draw routes whenever data changes
  useEffect(() => {
    const L = (window as any).L
    if (!L || !mapInst.current) return

    // Clear old layers
    routeLayers.current.forEach(l => mapInst.current.removeLayer(l))
    routeLayers.current = []

    routes.forEach((route, idx) => {
      const color = ROUTE_COLORS[idx % ROUTE_COLORS.length]

      // Draw start → end polyline
      const line = L.polyline(
        [[route.start_lat, route.start_lng], [route.end_lat, route.end_lng]],
        { color, weight: 3, opacity: 0.75, dashArray: route.status === 'idle' ? '6 4' : undefined },
      ).addTo(mapInst.current)
      routeLayers.current.push(line)

      // Start pin
      const startPin = L.circleMarker([route.start_lat, route.start_lng], {
        radius: 7, fillColor: color, color: '#fff', weight: 2, fillOpacity: 1,
      }).addTo(mapInst.current).bindPopup(`<b>Pickup</b><br>${route.route_start_address}`)
      routeLayers.current.push(startPin)

      // End pin
      const endPin = L.circleMarker([route.end_lat, route.end_lng], {
        radius: 7, fillColor: '#fff', color, weight: 3, fillOpacity: 1,
      }).addTo(mapInst.current).bindPopup(`<b>Dropoff</b><br>${route.route_end_address}`)
      routeLayers.current.push(endPin)

      // Courier current location
      if (route.courier.current_lat && route.courier.current_lng) {
        const courier = route.courier
        const courierMarker = L.marker([courier.current_lat!, courier.current_lng!], {
          icon: L.divIcon({
            html: `<div style="position:relative;width:36px;height:36px"><div style="width:36px;height:36px;background:${color};border:2.5px solid white;border-radius:50%;display:grid;place-items:center;color:white;font-weight:700;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.3)">${courier.user.name[0]?.toUpperCase() ?? '?'}</div></div>`,
            className: '', iconSize: [36, 36], iconAnchor: [18, 18],
          }),
        }).addTo(mapInst.current).bindPopup(`<b>${courier.user.name}</b><br>${courier.user.phone}<br>${route.orders_in_route.length} order(s)`)
        routeLayers.current.push(courierMarker)
      }
    })
  }, [routes])

  return <div ref={mapRef} className="w-full h-full" />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RouteOptimizationPage() {
  const [data,    setData]    = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/routes')
      const json = await res.json()
      setData(json)
    } catch {
      // keep stale data on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const stats  = data?.stats
  const routes = data?.routes ?? []

  return (
    <div className="p-6 space-y-6 max-w-[1440px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Route Optimization</h2>
          <p className="text-sm text-gray-400 mt-0.5">Route-based courier matching — Kecamatan Gerung</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-ghost flex items-center gap-1.5 text-sm py-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Routes"
          value={stats?.active_routes ?? 0}
          sub={`${stats?.batched_orders ?? 0} order dalam rute`}
          icon={Route} iconBg="bg-brand-500" loading={loading}
        />
        <StatCard
          label="Hemat Hari Ini"
          value={formatIDR(stats?.total_saved_idr ?? 0)}
          sub="vs single-trip delivery"
          icon={Wallet} iconBg="bg-green-500" loading={loading}
        />
        <StatCard
          label="Route Efficiency"
          value={`${stats?.efficiency_pct ?? 0}%`}
          sub={`${stats?.route_optimized_orders ?? 0} / ${stats?.total_orders_today ?? 0} order dioptimasi`}
          icon={Zap} iconBg="bg-purple-500" loading={loading}
        />
        <StatCard
          label="Total Orders Today"
          value={stats?.total_orders_today ?? 0}
          sub="24 jam terakhir"
          icon={Package} iconBg="bg-amber-500" loading={loading}
        />
      </div>

      {/* Map + Routes list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Live route map */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden lg:col-span-2" style={{ minHeight: 420 }}>
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Live Route Map</h3>
            {routes.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                {routes.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: ROUTE_COLORS[i % ROUTE_COLORS.length] }} />
                    <span className="text-[11px] text-gray-500 font-medium truncate max-w-[90px]">{r.courier.user.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ height: 380 }}>
            {!loading && <RouteMap routes={routes} />}
            {loading && <div className="h-full flex items-center justify-center"><Skeleton className="w-full h-full" /></div>}
          </div>
        </div>

        {/* Active routes list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card flex flex-col">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h3 className="text-sm font-semibold text-gray-700">Active Routes</h3>
            <span className="text-xs font-semibold text-brand-500">{routes.length} rute</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            )}
            {!loading && !routes.length && (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <Route size={28} className="text-gray-200" />
                <p className="text-sm font-medium text-gray-400">Tidak ada rute aktif</p>
                <p className="text-xs text-gray-300 max-w-[180px]">Route akan muncul saat kurir menerima order via route matching</p>
              </div>
            )}
            {!loading && routes.map((r, i) => (
              <RouteRow key={r.id} route={r} colorIdx={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Zone registry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Efficiency detail */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-gray-700">Efisiensi Route Matching</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-8" />)}</div>
          ) : (
            <div className="space-y-4">
              {/* Efficiency progress bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Order dioptimasi</span>
                  <span className="font-semibold text-gray-800">{stats?.efficiency_pct ?? 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-2 bg-brand-500 rounded-full transition-all duration-700"
                    style={{ width: `${stats?.efficiency_pct ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: 'Route Optimized', v: stats?.route_optimized_orders ?? 0, color: 'text-green-600 bg-green-50' },
                  { k: 'Single Trip',     v: (stats?.total_orders_today ?? 0) - (stats?.route_optimized_orders ?? 0), color: 'text-gray-600 bg-gray-50' },
                  { k: 'Active Routes',   v: stats?.active_routes ?? 0,          color: 'text-brand-600 bg-brand-50' },
                  { k: 'Batched Orders',  v: stats?.batched_orders ?? 0,         color: 'text-purple-600 bg-purple-50' },
                ].map(item => (
                  <div key={item.k} className={`rounded-xl p-3 ${item.color.split(' ')[1]}`}>
                    <p className={`text-xl font-bold tabular-nums ${item.color.split(' ')[0]}`}>{item.v}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.k}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">Estimasi hemat hari ini</span>
                <span className="text-sm font-bold text-green-600 tabular-nums">{formatIDR(stats?.total_saved_idr ?? 0)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Zone registry */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-gray-700">Coverage Zones ({GERUNG_ZONES.length})</h3>
          </div>
          <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 260 }}>
            {GERUNG_ZONES.map(z => (
              <div key={z.name} className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{z.name}</p>
                  <p className="text-[11px] text-gray-400">{z.desc}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/@${z.lat},${z.lng},15z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-brand-500 hover:text-brand-700 shrink-0 font-medium"
                >
                  Maps →
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
