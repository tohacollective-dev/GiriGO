'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { RefreshCw, Navigation, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ── Types ──────────────────────────────────────────────────────────────────────
interface CourierMapData {
  id:               string
  status:           'online' | 'offline' | 'busy'
  current_lat:      number | null
  current_lng:      number | null
  location_updated: string | null
  vehicle_type:     string
  rating:           number
  total_orders:     number
  user:             { name: string; phone: string }
  active_order:     {
    order_code:      string
    status:          string
    pickup_address:  string
    dropoff_address: string
  } | null
}

interface MapResponse {
  couriers:  CourierMapData[]
  timestamp: string
  counts:    { total: number; online: number; busy: number; offline: number }
}

// ── Constants ──────────────────────────────────────────────────────────────────
// Giri Menang Square — operational hub
const HUB_LAT = -8.6475
const HUB_LNG = 116.1180
const REFRESH_INTERVAL = 10_000   // 10 seconds

const STATUS_COLOR: Record<string, string> = {
  online:  '#22c55e',
  busy:    '#f59e0b',
  offline: '#9ca3af',
}

const STATUS_LABEL: Record<string, string> = {
  online:  'Online',
  busy:    'Sibuk',
  offline: 'Offline',
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function CourierMapPage() {
  const mapRef      = useRef<HTMLDivElement>(null)
  const leafletMap  = useRef<any>(null)
  const markersRef  = useRef<Record<string, any>>({})
  const hubMarker   = useRef<any>(null)

  const [data,       setData]       = useState<MapResponse | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selected,   setSelected]   = useState<CourierMapData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // ── Initialize Leaflet map ───────────────────────────────────────────────────
  useEffect(() => {
    if (leafletMap.current || !mapRef.current) return

    // Dynamically load Leaflet CSS + JS (no npm install needed)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.async = true
    script.onload = () => {
      const L = (window as any).L
      if (!L || !mapRef.current) return

      // Init map centered on Giri Menang Square
      const map = L.map(mapRef.current, {
        center:    [HUB_LAT, HUB_LNG],
        zoom:      14,
        zoomControl: true,
      })

      // OpenStreetMap tiles — completely free
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Draw 5km service radius circle
      L.circle([HUB_LAT, HUB_LNG], {
        radius:      5000,
        color:       '#0077B6',
        weight:      1.5,
        opacity:     0.4,
        fillColor:   '#0077B6',
        fillOpacity: 0.04,
      }).addTo(map)

      // Hub marker (Giri Menang Square)
      const hubIcon = L.divIcon({
        html: `<div style="
          width:36px; height:36px;
          background:#0A1628;
          border:3px solid white;
          border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:18px;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
        ">🏙️</div>`,
        className: '',
        iconSize:    [36, 36],
        iconAnchor:  [18, 18],
      })

      hubMarker.current = L.marker([HUB_LAT, HUB_LNG], { icon: hubIcon })
        .addTo(map)
        .bindPopup('<b>Giri Menang Square</b><br>Titik Pusat Operasional GiriGo')

      leafletMap.current = map
    }
    document.head.appendChild(script)

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
  }, [])

  // ── Fetch courier data ───────────────────────────────────────────────────────
  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const res  = await fetch('/api/couriers/map')
      const json = await res.json() as MapResponse
      setData(json)
      setLastUpdate(new Date())
      updateMarkers(json.couriers)
    } catch (e) {
      console.error('Map fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Update Leaflet markers ───────────────────────────────────────────────────
  function updateMarkers(couriers: CourierMapData[]) {
    const L = (window as any).L
    if (!L || !leafletMap.current) return

    const seen = new Set<string>()

    couriers.forEach(c => {
      if (!c.current_lat || !c.current_lng) return
      seen.add(c.id)

      const color     = STATUS_COLOR[c.status] ?? '#9ca3af'
      const initial   = c.user.name[0]?.toUpperCase() ?? '?'
      const emoji     = c.status === 'busy' ? '📦' : c.status === 'online' ? '🛵' : '💤'

      const icon = L.divIcon({
        html: `<div style="
          position:relative;
          width:40px; height:40px;
        ">
          <div style="
            width:40px; height:40px;
            background:${color};
            border:3px solid white;
            border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            color:white; font-weight:700; font-size:15px;
            box-shadow:0 2px 10px rgba(0,0,0,0.3);
            cursor:pointer;
            transition:transform 0.2s;
          ">${initial}</div>
          <div style="
            position:absolute;
            bottom:-2px; right:-2px;
            width:16px; height:16px;
            background:white;
            border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            font-size:9px;
          ">${emoji}</div>
        </div>`,
        className: '',
        iconSize:    [40, 40],
        iconAnchor:  [20, 20],
      })

      if (markersRef.current[c.id]) {
        // Update existing marker position
        markersRef.current[c.id].setLatLng([c.current_lat, c.current_lng])
        markersRef.current[c.id].setIcon(icon)
      } else {
        // Create new marker
        const marker = L.marker([c.current_lat, c.current_lng], { icon })
          .addTo(leafletMap.current)
          .on('click', () => setSelected(c))
        markersRef.current[c.id] = marker
      }
    })

    // Remove markers for couriers no longer in list or gone offline without GPS
    Object.keys(markersRef.current).forEach(id => {
      if (!seen.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })
  }

  // ── Update selected courier data when fresh data arrives ──────────────────
  useEffect(() => {
    if (selected && data) {
      const refreshed = data.couriers.find(c => c.id === selected.id)
      if (refreshed) setSelected(refreshed)
    }
  }, [data])

  // ── Initial load + auto-refresh ────────────────────────────────────────────
  useEffect(() => {
    // Slight delay to let Leaflet finish loading
    const init = setTimeout(() => fetchData(true), 800)
    return () => clearTimeout(init)
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => fetchData(false), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  // ── Fly to courier ─────────────────────────────────────────────────────────
  function flyToCourier(c: CourierMapData) {
    if (!leafletMap.current || !c.current_lat || !c.current_lng) return
    leafletMap.current.flyTo([c.current_lat, c.current_lng], 16, { duration: 0.8 })
    setSelected(c)
  }

  const counts = data?.counts ?? { total: 0, online: 0, busy: 0, offline: 0 }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Top bar ── */}
      <div className="shrink-0 px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900">Live Courier Map</h2>

          {/* Status pills */}
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {counts.online} Online
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              {counts.busy} Sibuk
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              {counts.offline} Offline
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-gray-400">
              Update {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: localeId })}
            </span>
          )}
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {autoRefresh ? <Wifi size={13} /> : <WifiOff size={13} />}
            {autoRefresh ? 'Auto' : 'Paused'}
          </button>
          <button
            onClick={() => fetchData(false)}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Main area: map + sidebar ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar: courier list ── */}
        <div className="w-64 shrink-0 bg-white border-r border-gray-100 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {counts.total} Kurir Terdaftar
            </p>
          </div>

          {!data && loading && (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {(data?.couriers ?? []).map(c => {
            const hasGps = !!c.current_lat
            const isSelected = selected?.id === c.id
            return (
              <button
                key={c.id}
                onClick={() => hasGps ? flyToCourier(c) : setSelected(c)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                  isSelected ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: STATUS_COLOR[c.status] }}
                  >
                    {c.user.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.user.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-400">{STATUS_LABEL[c.status]}</span>
                      {c.active_order && (
                        <span className="text-xs font-mono text-brand-500">{c.active_order.order_code}</span>
                      )}
                    </div>
                  </div>
                  {!hasGps && (
                    <AlertCircle size={13} className="text-gray-300 shrink-0" aria-label="Tanpa GPS" />
                  )}
                  {hasGps && (
                    <Navigation size={13} className="text-brand-400 shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Map ── */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />

          {/* ── Selected courier info panel ── */}
          {selected && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] w-96 max-w-[calc(100vw-2rem)]">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: STATUS_COLOR[selected.status] }}
                    >
                      {selected.user.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selected.user.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: STATUS_COLOR[selected.status] + '20',
                            color:      STATUS_COLOR[selected.status],
                          }}
                        >
                          {STATUS_LABEL[selected.status]}
                        </span>
                        <span className="text-xs text-yellow-500">⭐ {selected.rating > 0 ? selected.rating.toFixed(1) : 'N/A'}</span>
                        <span className="text-xs text-gray-400">{selected.vehicle_type}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-300 hover:text-gray-500 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* GPS info */}
                {selected.current_lat ? (
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3 font-mono">
                    {selected.current_lat.toFixed(5)}, {selected.current_lng!.toFixed(5)}
                    {selected.location_updated && (
                      <span className="ml-2 text-gray-400 font-sans">
                        · {formatDistanceToNow(new Date(selected.location_updated), { addSuffix: true, locale: localeId })}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    Lokasi tidak tersedia — kurir belum online dengan GPS
                  </div>
                )}

                {/* Active order */}
                {selected.active_order ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1.5">
                      📦 Order Aktif — {selected.active_order.order_code}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      <span className="text-gray-400">Dari: </span>{selected.active_order.pickup_address}
                    </p>
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      <span className="text-gray-400">Ke: </span>{selected.active_order.dropoff_address}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-1">Tidak ada order aktif</p>
                )}

                {/* Stats row */}
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selected.total_orders}</p>
                    <p className="text-xs text-gray-400">Total Order</p>
                  </div>
                  <div>
                    <a
                      href={`tel:${selected.user.phone}`}
                      className="text-sm font-semibold text-brand-500 block"
                    >
                      {selected.user.phone}
                    </a>
                    <p className="text-xs text-gray-400">WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map legend */}
          <div className="absolute top-3 right-3 z-[1000] bg-white rounded-xl shadow-md border border-gray-100 px-3 py-2.5 text-xs space-y-1.5">
            <p className="font-semibold text-gray-600 mb-1">Legend</p>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: STATUS_COLOR[k] }} />
                <span className="text-gray-600">{v}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              <span className="text-base">🏙️</span>
              <span className="text-gray-600">Giri Menang Sq.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-blue-400 inline-block" style={{ background: '#0077B620' }} />
              <span className="text-gray-600">5km radius</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
