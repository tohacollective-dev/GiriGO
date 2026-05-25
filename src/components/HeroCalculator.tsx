'use client'

import { useState, useEffect } from 'react'

const ZONES = ['Gerung Kota', 'Giri Menang', 'Dasan Baru', 'Banyu Urip', 'Beleke', 'Tempos', 'Mataram']

const KM: Record<string, number> = {
  'Gerung Kota|Giri Menang': 2.4, 'Gerung Kota|Dasan Baru': 3.2, 'Gerung Kota|Banyu Urip': 4.8,
  'Gerung Kota|Beleke': 4.2,     'Gerung Kota|Tempos': 1.8,     'Gerung Kota|Mataram': 8.6,
  'Giri Menang|Dasan Baru': 2.8, 'Giri Menang|Banyu Urip': 3.6, 'Giri Menang|Beleke': 5.6,
  'Giri Menang|Tempos': 1.5,     'Giri Menang|Mataram': 7.4,
  'Dasan Baru|Banyu Urip': 1.9,  'Dasan Baru|Beleke': 5.2,      'Dasan Baru|Tempos': 3.0,
  'Dasan Baru|Mataram': 6.9,
  'Banyu Urip|Beleke': 6.0,      'Banyu Urip|Tempos': 4.6,      'Banyu Urip|Mataram': 5.2,
  'Beleke|Tempos': 5.4,          'Beleke|Mataram': 9.4,
  'Tempos|Mataram': 7.0,
}

function lookupKm(a: string, b: string) {
  const A = a.trim(), B = b.trim()
  if (!A || !B) return null
  if (A.toLowerCase() === B.toLowerCase()) return 0.5
  return KM[`${A}|${B}`] ?? KM[`${B}|${A}`] ?? null
}

const calcOngkir = (km: number) => km <= 2 ? 5000 : 5000 + Math.round((km - 2) * 2000)
const calcEta    = (km: number) => Math.max(6, Math.round(6 + km * 2.4))
const fmtRp      = (n: number)  => 'Rp ' + n.toLocaleString('id-ID')

const WA = '6281234567890'

export default function HeroCalculator() {
  const [pickup,  setPickup]  = useState('Gerung Kota')
  const [dropoff, setDropoff] = useState('Dasan Baru')
  const [km,      setKm]      = useState(3.2)
  const [manual,  setManual]  = useState(false)

  useEffect(() => {
    if (manual) return
    const auto = lookupKm(pickup, dropoff)
    if (auto !== null) setKm(auto)
  }, [pickup, dropoff, manual])

  const ongkir      = calcOngkir(km)
  const eta         = calcEta(km)
  const isAutoMatch = !manual && lookupKm(pickup, dropoff) !== null
  const fillPct     = Math.min(100, Math.max(0, (km - 0.5) / (15 - 0.5) * 100))

  const waLink = `https://wa.me/${WA}?text=${encodeURIComponent(
    `Halo GiriGo! Saya mau kirim dari ${pickup || '(asal)'} ke ${dropoff || '(tujuan)'}. Estimasi ${km.toFixed(1)} km · ${fmtRp(ongkir)} · ETA ${eta} mnt.`
  )}`

  return (
    <div className="live-poster">
      <div className="lp-stamp">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
        Hitung ongkir
      </div>

      <datalist id="lp-zones">
        {ZONES.map(z => <option key={z} value={z}/>)}
      </datalist>

      <div className="lp-form">
        <label className="lp-field">
          <span className="lp-field-k">Dari</span>
          <input
            className="lp-input"
            list="lp-zones"
            value={pickup}
            placeholder="cth. Gerung Kota"
            onChange={e => { setPickup(e.target.value); setManual(false) }}
          />
        </label>

        <div className="lp-divider-row" aria-hidden>
          <span className="lp-divider-line"/>
          <span className="lp-divider-ic">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </span>
          <span className="lp-divider-line"/>
        </div>

        <label className="lp-field">
          <span className="lp-field-k">Ke</span>
          <input
            className="lp-input"
            list="lp-zones"
            value={dropoff}
            placeholder="cth. Dasan Baru"
            onChange={e => { setDropoff(e.target.value); setManual(false) }}
          />
        </label>

        <label className="lp-field lp-slider-field">
          <div className="lp-field-row">
            <span className="lp-field-k">Jarak</span>
            <span className="lp-km">
              {km.toFixed(1)} km
              {isAutoMatch && <span className="lp-auto">auto</span>}
            </span>
          </div>
          <input
            type="range"
            min="0.5" max="15" step="0.1"
            value={km}
            onChange={e => { setKm(parseFloat(e.target.value)); setManual(true) }}
            className="lp-slider"
            style={{ '--lp-fill': fillPct + '%' } as React.CSSProperties}
          />
          <div className="lp-slider-scale">
            <span>0</span><span>5</span><span>10</span><span>15 km</span>
          </div>
        </label>
      </div>

      <div className="lp-result">
        <div className="lp-result-eta">
          <div className="lp-num">{eta}</div>
          <div className="lp-unit">mnt</div>
        </div>
        <div className="lp-result-sep"/>
        <div className="lp-result-rp">
          <div className="lp-money-v">{fmtRp(ongkir)}</div>
          <div className="lp-money-k">estimasi ongkir</div>
        </div>
      </div>

      <a className="lp-btn" href={waLink} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Pesan via WhatsApp
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </a>
    </div>
  )
}
