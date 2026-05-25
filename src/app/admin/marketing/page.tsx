'use client'

import { useState } from 'react'
import {
  Users, TrendingUp, Target, Share2, Megaphone, Zap, Store, Star,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Play, Pause, Edit, Copy,
  Instagram, Facebook, MessageCircle, Music2,
  Sparkles, ChevronRight, MapPin, Globe,
} from 'lucide-react'

// ─── Sparkline ────────────────────────────────────────────────────────────────

function sparkLine(data: number[], w: number, h: number): string {
  if (data.length < 2) return ''
  const lo = Math.min(...data), hi = Math.max(...data), r = hi - lo || 1
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - 2 - ((v - lo) / r) * (h - 4),
  }))
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i], dx = (c.x - p.x) / 2.5
    d += ` C${(p.x + dx).toFixed(1)},${p.y.toFixed(1)} ${(c.x - dx).toFixed(1)},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`
  }
  return d
}

function areaLine(data: number[], w: number, h: number): string {
  if (data.length < 2) return ''
  const lo = Math.min(...data), hi = Math.max(...data), r = hi - lo || 1
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - 2 - ((v - lo) / r) * (h - 4),
  }))
  let d = `M0,${h} L${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i], dx = (c.x - p.x) / 2.5
    d += ` C${(p.x + dx).toFixed(1)},${p.y.toFixed(1)} ${(c.x - dx).toFixed(1)},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`
  }
  d += ` L${w},${h} Z`
  return d
}

function Sparkline({
  data, color = '#2563EB', h = 28, w = 80, fluid = false,
}: {
  data: number[]; color?: string; h?: number; w?: number; fluid?: boolean
}) {
  const lp = sparkLine(data, w, h)
  const ap = areaLine(data, w, h)
  return (
    <svg
      width={fluid ? '100%' : w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ overflow: 'visible', flexShrink: 0, display: 'block' }}
    >
      <path d={ap} fill={color} opacity={0.13} />
      <path d={lp} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Trend({ pct, up }: { pct: string; up: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md leading-none
      ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
      {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {pct}
    </span>
  )
}

// ─── Data ────────────────────────────────────────────────────────────────────

type CampaignStatus = 'active' | 'scheduled' | 'ended'

interface Campaign {
  name: string; tagline: string; status: CampaignStatus
  reach: string; ctr: string; conv: string; cpa: string; eng: string; rev: string
  color: string
}

const KPI = [
  { label: 'Total Active Users',    value: '12,847', change: '+18.4%', up: true,  Icon: Users,    color: '#2563EB', spark: [42,38,51,45,58,62,55,71,68,78,82,89] },
  { label: 'New Users Today',       value: '284',    change: '+7.2%',  up: true,  Icon: TrendingUp,color: '#16A34A', spark: [190,210,245,198,267,284,271,290,310,280,265,284] },
  { label: 'Conversion Rate',       value: '34.8%',  change: '+2.1pp', up: true,  Icon: Target,   color: '#7C3AED', spark: [28,30,31,29,32,33,31,34,35,33,35,35] },
  { label: 'Referral Growth',       value: '847',    change: '+41.2%', up: true,  Icon: Share2,   color: '#EA580C', spark: [210,245,280,310,380,420,510,580,640,720,790,847] },
  { label: 'Campaign Reach',        value: '48.2K',  change: '+23.5%', up: true,  Icon: Globe,    color: '#0F172A', spark: [28,30,32,29,35,38,40,42,44,45,47,48] },
  { label: 'Active Hero Drivers',   value: '38',     change: '+5',     up: true,  Icon: Zap,      color: '#B45309', spark: [24,26,28,27,30,32,31,33,35,36,37,38] },
  { label: 'UMKM Partners',         value: '124',    change: '+12',    up: true,  Icon: Store,    color: '#059669', spark: [80,85,90,95,98,100,105,108,112,116,120,124] },
  { label: 'Customer Satisfaction', value: '4.87★',  change: '+0.12',  up: true,  Icon: Star,     color: '#D97706', spark: [450,455,460,458,465,470,468,472,475,480,484,487] },
]

const CAMPAIGNS: Campaign[] = [
  { name: 'Pahlawan Lokal Season 2',  tagline: 'Cerita Kurir Lokal',  status: 'active',    reach: '24.8K', ctr: '4.2%',  conv: '12.4%', cpa: 'Rp 8.4K',  eng: '18.7%', rev: 'Rp 12.4jt', color: '#FACC15' },
  { name: 'UMKM Gerung Goes Digital', tagline: 'Dukung Lokal',        status: 'active',    reach: '12.4K', ctr: '3.8%',  conv: '9.2%',  cpa: 'Rp 12.1K', eng: '15.3%', rev: 'Rp 6.8jt',  color: '#2563EB' },
  { name: 'Referral Berhadiah',       tagline: '2× poin tiap referral',status: 'scheduled', reach: '—',     ctr: '—',     conv: '—',     cpa: '—',         eng: '—',     rev: '—',          color: '#7C3AED' },
  { name: 'Ramadan Express',          tagline: 'Kirim Lebih Cepat',   status: 'ended',     reach: '31.2K', ctr: '5.1%',  conv: '16.8%', cpa: 'Rp 6.8K',  eng: '22.4%', rev: 'Rp 18.2jt', color: '#64748B' },
]

const FUNNEL = [
  { label: 'Pengunjung',    count: '48,200', pct: 100,  widthPct: 100, color: '#0F172A', drop: null },
  { label: 'Download App',  count: '12,847', pct: 26.7, widthPct: 87,  color: '#1E3A5F', drop: '−73.3%' },
  { label: 'Registrasi',    count: '9,234',  pct: 19.2, widthPct: 73,  color: '#2563EB', drop: '−28.2%' },
  { label: 'Order Pertama', count: '4,128',  pct: 8.6,  widthPct: 57,  color: '#3B82F6', drop: '−55.3%' },
  { label: 'Order Ulang',   count: '2,847',  pct: 5.9,  widthPct: 44,  color: '#FACC15', drop: '−31.0%' },
]

const COMMUNITY = [
  { label: 'Hero Stories Submitted', value: '247',   change: '+18%',   up: true },
  { label: 'Community Events',       value: '12',    change: '+4',      up: true },
  { label: 'UGC Posts',              value: '1,847', change: '+234',    up: true },
  { label: 'Referral Participants',  value: '847',   change: '+41%',    up: true },
  { label: 'Engagement Rate',        value: '68.4%', change: '+5.2pp',  up: true },
]

const SOCIAL = [
  {
    platform: 'Instagram', handle: '@girigocourier', Icon: Instagram,
    color: '#E1306C', bg: '#FFF0F5',
    followers: '8,420', growth: '+342 (+4.2%)', up: true,
    reach: '42.1K', eng: '7.8%',
    spark: [320,380,420,390,450,480,460,500,530,510,490,520],
    bars: [58,72,65,80,74,88,69,92,78,84,76,95],
  },
  {
    platform: 'TikTok', handle: '@girigoid', Icon: Music2,
    color: '#010101', bg: '#F0F0F0',
    followers: '12,700', growth: '+1,240 (+10.8%)', up: true,
    reach: '89.4K', eng: '12.4%',
    spark: [580,620,690,740,820,900,960,1040,1120,1180,1240,1270],
    bars: [44,60,72,82,68,90,84,96,102,110,118,128],
  },
  {
    platform: 'Facebook', handle: 'GiriGo Courier', Icon: Facebook,
    color: '#1877F2', bg: '#EEF4FF',
    followers: '5,240', growth: '+89 (+1.7%)', up: true,
    reach: '18.7K', eng: '3.2%',
    spark: [480,492,498,485,495,505,510,518,520,515,522,524],
    bars: [38,42,40,44,41,46,43,48,45,47,50,52],
  },
  {
    platform: 'WhatsApp', handle: 'GiriGo Hub', Icon: MessageCircle,
    color: '#25D366', bg: '#F0FFF4',
    followers: '2,847', growth: '+124 (+4.5%)', up: true,
    reach: '84% aktif', eng: '2.3h resp.',
    spark: [220,240,258,245,262,271,255,268,275,282,290,285],
    bars: [60,72,68,74,70,78,76,80,82,78,84,88],
  },
]

const AI_INSIGHTS = [
  { cat: 'Campaign',  color: '#B45309', text: '"Pahlawan Lokal S2" menghasilkan CTR 3.2× di atas rata-rata. Tingkatkan budget 30% selama 2 minggu ke depan.' },
  { cat: 'Audience',  color: '#2563EB', text: 'Usia 25–34 di Gerung paling aktif pukul 18:00–21:00. Jadwalkan push notif pukul 17:30 untuk open rate terbaik.' },
  { cat: 'Budget',    color: '#7C3AED', text: 'TikTok engagement 3× lebih tinggi dari Facebook dengan biaya 1/5 nya. Alihkan 20% budget Facebook ke TikTok.' },
  { cat: 'Lokasi',    color: '#059669', text: 'Dasan Baru naik +40% permintaan pengiriman minggu ini. Klaster UMKM baru terdeteksi — targetkan iklan hyperlocal.' },
  { cat: 'Konten',    color: '#EA580C', text: 'Konten behind-the-scenes kurir mendapat 5× lebih banyak saves vs post produk. Buat 2–3 "Hero Story" per minggu.' },
]

const MAP_NODES = [
  { label: 'Giri Menang', x: 138, y: 105, r: 44, activity: 'very-high', orders: 342 },
  { label: 'Mataram',     x: 242, y: 82,  r: 38, activity: 'high',      orders: 284 },
  { label: 'Gerung Kota', x: 78,  y: 138, r: 32, activity: 'high',      orders: 218 },
  { label: 'Dasan Baru',  x: 186, y: 130, r: 28, activity: 'high',      orders: 196 },
  { label: 'Banyu Urip',  x: 218, y: 102, r: 20, activity: 'medium',    orders: 124 },
  { label: 'Tempos',      x: 114, y: 162, r: 18, activity: 'medium',    orders: 98  },
  { label: 'Beleke',      x: 50,  y: 158, r: 12, activity: 'low',       orders: 54  },
]
const ACTIVITY_COLOR: Record<string, string> = {
  'very-high': '#FACC15',
  'high':      '#2563EB',
  'medium':    '#7C3AED',
  'low':       '#94A3B8',
}
const MAP_ROADS = [
  [78,138, 138,105], [138,105, 186,130], [138,105, 218,102],
  [138,105, 114,162], [114,162, 78,138], [186,130, 218,102],
  [218,102, 242,82],  [78,138, 50,158],
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = {
    active:    { label: 'Aktif',     cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    scheduled: { label: 'Scheduled', cls: 'bg-purple-50 text-purple-600 border-purple-200' },
    ended:     { label: 'Selesai',   cls: 'bg-gray-50 text-gray-400 border-gray-200' },
  }
  const { label, cls } = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {label}
    </span>
  )
}

function BarMini({ bars, color }: { bars: number[]; color: string }) {
  const max = Math.max(...bars)
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all"
          style={{ height: `${(v / max) * 100}%`, background: color, opacity: i === bars.length - 1 ? 1 : 0.4 }} />
      ))}
    </div>
  )
}

function FunnelViz() {
  return (
    <div className="space-y-1">
      {FUNNEL.map((s, i) => {
        const isDark = s.color !== '#FACC15'
        return (
          <div key={i}>
            {s.drop && (
              <div className="flex justify-center py-0.5">
                <span className="text-[9px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full">{s.drop}</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <div
                className="h-9 rounded-lg flex items-center justify-between px-3 transition-all"
                style={{ width: `${s.widthPct}%`, background: s.color }}
              >
                <span className="text-[11px] font-bold truncate" style={{ color: isDark ? '#fff' : '#0F172A' }}>
                  {s.label}
                </span>
                <span className="text-[11px] font-extrabold ml-2 shrink-0" style={{ color: isDark ? 'rgba(255,255,255,.7)' : '#0F172A' }}>
                  {s.pct}%
                </span>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 w-12 shrink-0">{s.count}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DeliveryMap() {
  return (
    <svg viewBox="0 0 296 200" style={{ width: '100%', height: '100%' }}>
      <defs>
        <pattern id="mkt-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1" />
        </pattern>
        {MAP_NODES.map((n, i) => (
          <radialGradient key={i} id={`glow-${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={ACTIVITY_COLOR[n.activity]} stopOpacity={0.35} />
            <stop offset="100%" stopColor={ACTIVITY_COLOR[n.activity]} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      <rect width="296" height="200" fill="url(#mkt-grid)" />
      {MAP_ROADS.map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="5 4" />
      ))}
      {MAP_NODES.map((n, i) => (
        <circle key={`glow-${i}`} cx={n.x} cy={n.y} r={n.r * 2.8}
          fill={`url(#glow-${i})`} />
      ))}
      {MAP_NODES.map((n, i) => (
        <g key={`node-${i}`}>
          <circle cx={n.x} cy={n.y} r={n.r}
            fill={ACTIVITY_COLOR[n.activity]} opacity={0.22} />
          <circle cx={n.x} cy={n.y} r={n.r * 0.52}
            fill={ACTIVITY_COLOR[n.activity]} />
          {n.activity === 'very-high' && (
            <circle cx={n.x} cy={n.y} r={n.r * 1.4}
              fill="none" stroke={ACTIVITY_COLOR[n.activity]} strokeWidth="1"
              opacity={0.4} strokeDasharray="3 3" />
          )}
        </g>
      ))}
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  return (
    <div className="min-h-full" style={{ background: '#F8FAFC' }}>

      {/* ── Command Center Header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: '#0F172A' }}>
        {/* Route-grid supergraphic */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="cmd-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cmd-grid)" />
          <path d="M -100 80 Q 200 40 500 90 T 1200 60" stroke="rgba(250,204,21,.12)" strokeWidth="2" fill="none" />
          <path d="M 200 0 Q 240 60 220 140" stroke="rgba(37,99,235,.18)" strokeWidth="2" fill="none" />
          <circle cx="68%" cy="50%" r="160" fill="rgba(37,99,235,.04)" />
        </svg>

        <div className="relative px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-yellow-400 tracking-[.18em] uppercase">
                  Marketing Command Center
                </span>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-tight">
                Pahlawan Lokal Warga Giri Menang
              </h1>
              <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,.45)' }}>
                Growth & Campaign Performance · GiriGo Courier · Gerung, Lombok Barat
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 mt-1">
              <div className="flex rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,.08)', padding: 2 }}>
                {(['7d', '30d', '90d'] as const).map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                    style={period === p
                      ? { background: '#FACC15', color: '#0F172A' }
                      : { color: 'rgba(255,255,255,.5)' }}>
                    {p}
                  </button>
                ))}
              </div>
              <select
                className="h-8 px-3 rounded-xl text-white text-[11px] font-semibold appearance-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)' }}>
                <option>All Campaigns</option>
                <option>Pahlawan Lokal S2</option>
                <option>UMKM Goes Digital</option>
              </select>
            </div>
          </div>

          {/* Snapshot strip */}
          <div className="flex gap-6 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
            {[
              { label: 'Total Spend', value: 'Rp 4.2jt' },
              { label: 'Avg CPA',     value: 'Rp 9.1K'  },
              { label: 'ROAS',        value: '9.4×'      },
              { label: 'Top Channel', value: 'WhatsApp'  },
              { label: 'Top Area',    value: 'Giri Menang'},
            ].map(s => (
              <div key={s.label}>
                <div className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,.4)' }}>{s.label}</div>
                <div className="text-sm font-extrabold text-white mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="p-6 space-y-5">

        {/* ── KPI Grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {KPI.map((k) => {
            const Icon = k.Icon
            return (
              <div key={k.label}
                className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all group cursor-default"
                style={{ borderColor: 'rgba(0,0,0,.06)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${k.color}16` }}>
                    <Icon size={16} style={{ color: k.color }} />
                  </div>
                  <Trend pct={k.change} up={k.up} />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[22px] font-extrabold text-gray-900 leading-none tracking-tight truncate">
                      {k.value}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium leading-tight">{k.label}</div>
                  </div>
                  <Sparkline data={k.spark} color={k.color} />
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Campaigns + Funnel ────────────────────────────────────────────── */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '3fr 2fr' }}>

          {/* Campaigns */}
          <div className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: 'rgba(0,0,0,.06)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(0,0,0,.05)' }}>
              <div>
                <h2 className="text-[13px] font-bold text-gray-900">Campaign Performance</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">4 kampanye · 2 aktif sekarang</p>
              </div>
              <button className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors">
                <Megaphone size={12} /> New Campaign
              </button>
            </div>

            <div className="divide-y divide-gray-50/80">
              {CAMPAIGNS.map((c) => (
                <div key={c.name} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: c.color }} />
                      <div>
                        <div className="font-bold text-gray-900 text-[13px] leading-tight">{c.name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{c.tagline}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <button className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
                        <MoreHorizontal size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5 mb-3">
                    {[
                      ['Reach', c.reach],
                      ['CTR', c.ctr],
                      ['Conv.', c.conv],
                      ['CPA', c.cpa],
                      ['Eng.', c.eng],
                      ['Revenue', c.rev],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="rounded-xl px-2.5 py-2" style={{ background: '#F8FAFC' }}>
                        <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">{lbl}</div>
                        <div className="text-[11px] font-bold text-gray-900 mt-0.5 truncate">{val}</div>
                      </div>
                    ))}
                  </div>

                  {c.status !== 'ended' && (
                    <div className="flex gap-1.5">
                      {[
                        { label: 'Edit', Icon: Edit },
                        { label: 'Duplikat', Icon: Copy },
                      ].map(btn => (
                        <button key={btn.label}
                          className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                          <btn.Icon size={10} />{btn.label}
                        </button>
                      ))}
                      <button className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors
                        ${c.status === 'active'
                          ? 'text-amber-600 border-amber-100 hover:bg-amber-50'
                          : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'}`}>
                        {c.status === 'active'
                          ? <><Pause size={10} /> Pause</>
                          : <><Play size={10} /> Mulai</>}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Funnel */}
          <div className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: 'rgba(0,0,0,.06)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,.05)' }}>
              <h2 className="text-[13px] font-bold text-gray-900">Acquisition Funnel</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Pengunjung → Order Ulang</p>
            </div>
            <div className="p-5">
              <FunnelViz />

              <div className="mt-5 pt-4 space-y-2.5" style={{ borderTop: '1px solid rgba(0,0,0,.05)' }}>
                {FUNNEL.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="font-medium text-gray-600">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-medium">{s.count}</span>
                      <span className="font-extrabold text-gray-900 tabular-nums w-10 text-right">{s.pct}%</span>
                      <span className="text-red-400 font-bold w-12 text-right">{s.drop ?? ''}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl p-3.5" style={{ background: '#FFF9E6', border: '1px solid rgba(250,204,21,.3)' }}>
                <p className="text-[11px] font-semibold text-yellow-700 leading-relaxed">
                  💡 Bottleneck terbesar ada di step Pengunjung → Download (−73.3%). Optimasi App Store listing dan landing page CTA.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Community + Map ───────────────────────────────────────────────── */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '2fr 3fr' }}>

          {/* Community */}
          <div className="rounded-2xl overflow-hidden border"
            style={{ borderColor: 'rgba(0,0,0,.06)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div className="px-5 py-4" style={{ background: '#0F172A' }}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2"
                style={{ background: 'rgba(250,204,21,.15)', border: '1px solid rgba(250,204,21,.25)' }}>
                <Zap size={10} style={{ color: '#FACC15' }} />
                <span className="text-[10px] font-extrabold tracking-widest uppercase" style={{ color: '#FACC15' }}>
                  Pahlawan Lokal
                </span>
              </div>
              <h2 className="text-[13px] font-bold text-white">Community Engagement</h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,.4)' }}>
                Warga Giri Menang · Program Aktif
              </p>
            </div>

            <div className="bg-white p-5 space-y-2">
              {COMMUNITY.map((m) => (
                <div key={m.label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  style={{ background: '#F8FAFC' }}>
                  <span className="text-[12px] font-medium text-gray-700">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-extrabold text-gray-900">{m.value}</span>
                    <Trend pct={m.change} up={m.up} />
                  </div>
                </div>
              ))}

              <div className="pt-3">
                <div className="flex justify-between items-center text-[11px] mb-1.5">
                  <span className="font-semibold text-gray-500">Engagement Rate keseluruhan</span>
                  <span className="font-extrabold text-gray-900">68.4%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
                  <div className="h-full rounded-full" style={{ width: '68.4%', background: '#FACC15' }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                  Program Pahlawan Lokal menghasilkan 3.2× lebih banyak konten organik dibanding campaign standar.
                </p>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: 'rgba(0,0,0,.06)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(0,0,0,.05)' }}>
              <div>
                <h2 className="text-[13px] font-bold text-gray-900">Delivery Activity Heatmap</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Kecamatan Gerung & sekitarnya · {period === '7d' ? '7' : period === '30d' ? '30' : '90'} hari terakhir</p>
              </div>
              <div className="flex items-center gap-3">
                {[
                  { label: 'Sangat Tinggi', color: '#FACC15' },
                  { label: 'Tinggi',        color: '#2563EB' },
                  { label: 'Sedang',        color: '#7C3AED' },
                  { label: 'Rendah',        color: '#94A3B8' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span className="text-[10px] font-medium text-gray-400">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex" style={{ height: 280 }}>
              <div className="flex-1 p-4">
                <DeliveryMap />
              </div>

              {/* Top locations */}
              <div className="w-44 shrink-0 p-4 flex flex-col" style={{ borderLeft: '1px solid rgba(0,0,0,.05)' }}>
                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Top Lokasi</p>
                <div className="space-y-2.5 flex-1">
                  {[...MAP_NODES].sort((a, b) => b.orders - a.orders).map((n) => (
                    <div key={n.label} className="flex items-center gap-2">
                      <div className="w-1.5 h-7 rounded-full shrink-0" style={{ background: ACTIVITY_COLOR[n.activity] }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-gray-800 truncate">{n.label}</div>
                        <div className="text-[10px] text-gray-400">{n.orders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 rounded-xl p-2.5 text-center" style={{ borderTop: '1px solid rgba(0,0,0,.05)', background: '#F8FAFC' }}>
                  <div className="text-[10px] text-gray-400 font-medium">Total Area</div>
                  <div className="text-[13px] font-extrabold text-gray-900">7 zona aktif</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Social Performance ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[13px] font-bold text-gray-900">Social Media Performance</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">4 platform · {period}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {SOCIAL.map((s) => {
              const Icon = s.Icon
              return (
                <div key={s.platform}
                  className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all"
                  style={{ borderColor: 'rgba(0,0,0,.06)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                        <Icon size={16} style={{ color: s.color }} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-gray-900">{s.platform}</div>
                        <div className="text-[10px] text-gray-400">{s.handle}</div>
                      </div>
                    </div>
                    <Trend pct={s.growth.split(' ')[0]} up={s.up} />
                  </div>

                  <div className="text-[22px] font-extrabold text-gray-900 tracking-tight leading-none">{s.followers}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 mb-3 font-medium">followers</div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-xl p-2.5" style={{ background: '#F8FAFC' }}>
                      <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Reach</div>
                      <div className="text-[11px] font-bold text-gray-900 mt-0.5">{s.reach}</div>
                    </div>
                    <div className="rounded-xl p-2.5" style={{ background: '#F8FAFC' }}>
                      <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Engagement</div>
                      <div className="text-[11px] font-bold text-gray-900 mt-0.5">{s.eng}</div>
                    </div>
                  </div>

                  <BarMini bars={s.bars} color={s.color} />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── AI Insights ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0F172A' }}>
          <div className="px-5 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(250,204,21,.15)' }}>
              <Sparkles size={15} style={{ color: '#FACC15' }} />
            </div>
            <div>
              <h2 className="text-[13px] font-bold text-white">AI Growth Insights</h2>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.4)' }}>
                Dianalisis dari data kampanye, perilaku pengguna, dan tren lokasi
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(250,204,21,.15)', color: '#FACC15', border: '1px solid rgba(250,204,21,.2)' }}>
              <Sparkles size={10} /> 5 rekomendasi baru
            </div>
          </div>

          <div className="p-5 grid grid-cols-5 gap-3">
            {AI_INSIGHTS.map((ins, i) => (
              <div key={i}
                className="rounded-2xl p-4 flex flex-col hover:scale-[1.02] transition-transform cursor-pointer"
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
                <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-3 self-start"
                  style={{ background: `${ins.color}22`, color: ins.color }}>
                  {ins.cat}
                </span>
                <p className="text-[11px] leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,.7)' }}>
                  {ins.text}
                </p>
                <button className="mt-3 flex items-center gap-1 text-[10px] font-bold transition-colors"
                  style={{ color: '#FACC15' }}>
                  Terapkan <ChevronRight size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  )
}
