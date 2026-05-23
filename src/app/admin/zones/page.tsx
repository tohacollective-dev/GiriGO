'use client'
import { useEffect, useState } from 'react'
import { MapPin, TrendingUp } from 'lucide-react'

interface ZoneData {
  zone: string
  count: number
  revenue: number
}

// Static Gerung zone list — expand as area coverage grows
const GERUNG_ZONES = [
  { name: 'Gerung Kota',     lat: -8.6508, lng: 116.1202, description: 'Pusat kota Gerung, dekat alun-alun' },
  { name: 'Giri Menang',     lat: -8.6475, lng: 116.1180, description: 'Area Giri Menang Square & sekitarnya' },
  { name: 'Karang Bongkot',  lat: -8.6620, lng: 116.1350, description: 'Wilayah Karang Bongkot' },
  { name: 'Dasan Baru',      lat: -8.6450, lng: 116.1100, description: 'Dasan Baru & Dasan Gria' },
  { name: 'Batu Kumbung',    lat: -8.6700, lng: 116.1100, description: 'Batu Kumbung ke arah selatan' },
  { name: 'Tempos',          lat: -8.6350, lng: 116.1400, description: 'Tempos & sekitarnya' },
  { name: 'Beleke',          lat: -8.6550, lng: 116.1450, description: 'Beleke dan Taman Sari' },
  { name: 'Jagaraga',        lat: -8.6800, lng: 116.1250, description: 'Jagaraga arah selatan' },
]

export default function ZonesPage() {
  const [topZones, setTopZones] = useState<ZoneData[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => {
        setTopZones(d.top_zones ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const maxCount = topZones[0]?.count ?? 1

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Coverage Zones</h2>
        <p className="text-sm text-gray-500 mt-0.5">Zona layanan GiriGo — Kecamatan Gerung, Lombok Barat</p>
      </div>

      {/* Coverage map placeholder */}
      <div className="card bg-gradient-to-br from-brand-900 to-brand-700 text-white p-8 text-center">
        <MapPin size={32} className="mx-auto mb-3 opacity-80" />
        <p className="font-semibold text-lg">Giri Menang Square</p>
        <p className="text-white/70 text-sm mt-1">-8.6475°S, 116.1180°E — Titik pusat operasional</p>
        <p className="mt-3 text-white/60 text-xs">Radius layanan: 5km dari Giri Menang Square</p>
        <a
          href="https://www.google.com/maps/@-8.6475,116.1180,14z"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-full"
        >
          Buka di Google Maps →
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active zones from data */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-500" />
            <h3 className="font-semibold">Top Delivery Zones</h3>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : !topZones.length ? (
            <p className="text-gray-400 text-sm py-4 text-center">Belum ada data delivery</p>
          ) : (
            <div className="space-y-3">
              {topZones.map((z, i) => (
                <div key={z.zone} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{i+1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{z.zone}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                      <div
                        className="h-1.5 bg-brand-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (z.count / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 shrink-0">{z.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone registry */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-brand-500" />
            <h3 className="font-semibold">Zone Registry ({GERUNG_ZONES.length} zona)</h3>
          </div>
          <div className="space-y-2.5">
            {GERUNG_ZONES.map(z => (
              <div key={z.name} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{z.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{z.description}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/@${z.lat},${z.lng},15z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-500 hover:text-brand-700 shrink-0"
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
