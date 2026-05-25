import Link from 'next/link'
import HeroCalculator from '@/components/HeroCalculator'
import LiveTrackerPreview from '@/components/LiveTrackerPreview'

const WA_NUMBER  = '6281234567890'
const WA_MESSAGE = encodeURIComponent('Halo GiriGo! Saya ingin kirim paket.')
const WA_LINK    = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`

// ─── Brand primitives ─────────────────────────────────────────────────────────

function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="18" stroke="#2563EB" strokeWidth="3"/>
      <circle cx="32" cy="32" r="6" fill="#FACC15"/>
      <rect x="30" y="3"  width="4" height="10" rx="1.5" fill="#2563EB"/>
      <rect x="30" y="51" width="4" height="10" rx="1.5" fill="#2563EB"/>
      <rect x="3"  y="30" width="10" height="4" rx="1.5" fill="#2563EB"/>
      <rect x="51" y="30" width="10" height="4" rx="1.5" fill="#2563EB"/>
    </svg>
  )
}

function ScooterGlyph({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="7"  cy="24" r="4" stroke={color} strokeWidth="2"/>
      <circle cx="24" cy="24" r="4" stroke={color} strokeWidth="2"/>
      <path d="M7 24L13 14H22L24 24"  stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 14L11 8H8"         stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 14V10"             stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function WaIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ─── Circular movement path (for manifesto + CTA) ────────────────────────────

function CircularMovementPath({ variant = 'manifesto' }: { variant?: 'manifesto' | 'cta' }) {
  const isManifesto = variant === 'manifesto'
  const ink = isManifesto ? '#0F172A' : '#FACC15'
  const accent = isManifesto ? '#2563EB' : '#FACC15'
  const ghost = isManifesto ? 'rgba(15,23,42,.18)' : 'rgba(250,204,21,.22)'
  const roadBg = isManifesto ? 'rgba(15,23,42,.10)' : 'rgba(250,204,21,.10)'
  const hubFill = isManifesto ? 'rgba(37,99,235,.10)' : 'rgba(250,204,21,.06)'
  const intersectionFill = isManifesto ? '#FACC15' : '#0F172A'
  const intersectionDot  = isManifesto ? '#0F172A' : '#FACC15'
  const cls = isManifesto ? 'circular-poster' : undefined
  const dim = 460

  const cx = 230, cy = 230
  const R_OUT = 210, R_RING = 134, R_MID = 92, R_INNER = 50
  const roads = [
    { deg: -90 }, { deg: 0 }, { deg: 90 }, { deg: 180 },
  ]

  return (
    <svg className={cls} width={dim} height={dim} viewBox="0 0 460 460" fill="none" aria-hidden
      style={cls ? undefined : { width: dim, height: dim, position: 'absolute', top: -60, right: -80, opacity: .85 }}>
      <circle cx={cx} cy={cy} r={R_OUT + 18} stroke={ghost} strokeWidth="1.5" strokeDasharray="6 10" fill="none"
        style={{ transformOrigin:`${cx}px ${cy}px`, animation:'rotateOrbit 36s linear infinite' }}/>

      {roads.map((r, i) => {
        const a = r.deg * Math.PI / 180
        const x1 = cx + Math.cos(a) * R_RING, y1 = cy + Math.sin(a) * R_RING
        const x2 = cx + Math.cos(a) * R_OUT,  y2 = cy + Math.sin(a) * R_OUT
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={roadBg} strokeWidth="18" strokeLinecap="round"/>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray="6 10"
              style={{ animation:`roadFlow${i%2?'In':'Out'} 1.8s ${i*0.25}s linear infinite` }}/>
            <g transform={`translate(${x2} ${y2})`}>
              <circle r="16" fill={intersectionFill} opacity=".15"
                style={{ animation:`lpPulse 2.6s ${i*0.5}s ease-out infinite` }}/>
              <circle r="10" fill={intersectionFill} stroke={ink} strokeWidth="1.5"/>
              <circle r="4" fill={intersectionDot}/>
            </g>
          </g>
        )
      })}

      <circle cx={cx} cy={cy} r={R_RING} fill={hubFill} stroke={ink} strokeWidth="2.5"/>
      <circle cx={cx} cy={cy} r={R_MID}  stroke={accent} strokeWidth="1.5" fill="none" strokeDasharray="4 6"
        style={{ transformOrigin:`${cx}px ${cy}px`, animation:'rotateOrbitRev 14s linear infinite' }}/>
      <circle cx={cx} cy={cy} r={R_INNER} stroke={ink} strokeWidth="2" fill="none"/>

      <g style={{ transformOrigin:`${cx}px ${cy}px`, animation:'rotateOrbit 8s linear infinite' }}>
        <g transform={`translate(${cx}, ${cy - R_RING})`}>
          <circle r="7" fill={accent}/><circle r="3" fill={ink}/>
        </g>
      </g>
      <g style={{ transformOrigin:`${cx}px ${cy}px`, animation:'rotateOrbit 11s 2s linear infinite' }}>
        <g transform={`translate(${cx + R_MID}, ${cy})`}>
          <circle r="5" fill={accent} opacity=".85"/>
        </g>
      </g>

      <g transform={`translate(${cx} ${cy})`}>
        <circle r="16" fill={accent}/>
        <circle r="8"  fill={ink}/>
        <circle r="3"  fill={accent}/>
      </g>
    </svg>
  )
}

// ─── Feature section arts ─────────────────────────────────────────────────────

function FeatureArt({ kind }: { kind: string }) {
  if (kind === 'speed') return (
    <svg viewBox="0 0 220 96" style={{width:'100%',height:'100%'}}>
      <g transform="translate(0 30)">
        {[16,28,44,32,52,28,60,36,48,24,40].map((h,i) => (
          <rect key={i} x={i*18} y={60-h} width="6" height={h} rx="2"
            fill={i>5?'#FACC15':'#0F172A'} opacity={i>5?1:.85}
            style={{animation:`barBounceEd 1.8s ${i*.08}s infinite ease-in-out`,transformOrigin:'bottom'}}/>
        ))}
      </g>
      <text x="200" y="20" textAnchor="end" fontSize="11" fill="#0F172A" fontFamily="JetBrains Mono" fontWeight="600">7.6 MNT</text>
    </svg>
  )
  if (kind === 'local') return (
    <svg viewBox="0 0 220 96" style={{width:'100%',height:'100%'}}>
      <circle cx="110" cy="48" r="32" stroke="#0F172A" strokeWidth="1.5" fill="none"/>
      <circle cx="110" cy="48" r="18" stroke="#FACC15" strokeWidth="1.5" fill="#FACC15" fillOpacity=".25"/>
      <circle cx="110" cy="48" r="5" fill="#0F172A"/>
      <line x1="0" y1="48" x2="78" y2="48" stroke="#0F172A" strokeWidth="1.5" strokeDasharray="4 4"/>
      <line x1="142" y1="48" x2="220" y2="48" stroke="#0F172A" strokeWidth="1.5" strokeDasharray="4 4"/>
      <circle cx="40" cy="48" r="4" fill="#0F172A"/>
      <circle cx="190" cy="48" r="4" fill="#0F172A"/>
    </svg>
  )
  if (kind === 'package') return (
    <svg viewBox="0 0 220 96" style={{width:'100%',height:'100%'}}>
      <path d="M90 16 L130 30 L130 80 L90 66 Z" fill="#FACC15" stroke="#0F172A" strokeWidth="1.5"/>
      <path d="M150 16 L190 30 L190 80 L150 66 Z" fill="#fff" stroke="#0F172A" strokeWidth="1.5"/>
      <path d="M50 30 L90 16" stroke="#0F172A" strokeWidth="1.5"/>
      <path d="M50 30 L50 80 L90 66" stroke="#0F172A" strokeWidth="1.5" fill="none"/>
      <text x="14" y="56" fontSize="10" fontFamily="JetBrains Mono" fill="#0F172A">+COD</text>
    </svg>
  )
  return (
    <svg viewBox="0 0 220 96" style={{width:'100%',height:'100%'}}>
      <path d="M180 14 L140 22 L140 56 C140 76 160 86 180 90 C200 86 220 76 220 56 L220 22 Z"
        fill="#FACC15" stroke="#0F172A" strokeWidth="1.5" transform="translate(-30 0)"/>
      <path d="M140 50 L150 60 L172 36" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(-30 0)"/>
      <g transform="translate(20 30)">
        {[0,1,2,3].map(i => (
          <circle key={i} cx={i*20} cy="20" r="10" fill={['#0F172A','#fff','#FACC15','#0F172A'][i]} stroke="#0F172A" strokeWidth="1.5"/>
        ))}
      </g>
    </svg>
  )
}

// ─── Use-case card arts ───────────────────────────────────────────────────────

function UseCaseArt({ kind, dark }: { kind: string; dark: boolean }) {
  const stroke = dark ? '#FACC15' : '#0F172A'
  const fill   = dark ? 'rgba(250,204,21,.1)' : 'rgba(15,23,42,.04)'
  if (kind === 'doc') return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%'}}>
      <rect x="80" y="20" width="80" height="100" rx="8" fill={fill} stroke={stroke} strokeWidth="1.5" transform="rotate(-6 120 70)"/>
      <rect x="140" y="14" width="80" height="100" rx="8" fill="#fff" stroke={stroke} strokeWidth="1.5"/>
      <line x1="156" y1="36" x2="206" y2="36" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <line x1="156" y1="48" x2="196" y2="48" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <line x1="156" y1="60" x2="206" y2="60" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <circle cx="195" cy="98" r="14" fill={stroke}/>
      <path d="M 188 98 L 193 103 L 202 92" stroke={dark?'#0F172A':'#FACC15'} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (kind === 'food') return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%'}}>
      <ellipse cx="160" cy="108" rx="78" ry="10" fill={stroke} opacity=".15"/>
      <rect x="100" y="50" width="120" height="60" rx="10" fill={dark?'#fff':'#FACC15'} stroke={stroke} strokeWidth="1.5"/>
      <path d="M 100 70 L 220 70" stroke={stroke} strokeWidth="1.5" opacity=".4"/>
      <circle cx="124" cy="60" r="4" fill={stroke} opacity=".6"/>
      <path d="M 140 30 Q 160 10 180 30 Q 195 14 210 30" stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 130 22 Q 150  4 170 22" stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%'}}>
      <path d="M 110 50 L 160 30 L 210 50 L 210 110 L 160 130 L 110 110 Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M 110 50 L 160 70 L 210 50" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M 160 70 L 160 130" stroke={stroke} strokeWidth="1.5" fill="none"/>
      <rect x="148" y="40" width="24" height="8" fill={stroke}/>
      <text x="155" y="98" fill={dark?'#fff':'#0F172A'} fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">UMKM</text>
    </svg>
  )
}

// ─── Chapter micro-arts ───────────────────────────────────────────────────────

function ChapterArt({ step }: { step: number }) {
  const arts: Record<number, React.ReactNode> = {
    1: (
      <svg viewBox="0 0 320 180" style={{width:'100%',height:'100%',position:'absolute',inset:0}}>
        <rect x="60" y="30" width="200" height="120" rx="20" fill="rgba(34,197,94,.08)" stroke="rgba(34,197,94,.3)" strokeWidth="1.5"/>
        <circle cx="80" cy="56" r="12" fill="rgba(34,197,94,.2)" stroke="#16A34A" strokeWidth="1.5"/>
        <text x="80" y="61" textAnchor="middle" fontSize="12" fill="#16A34A" fontWeight="700">G</text>
        <text x="102" y="54" fontSize="11" fill="rgba(15,23,42,.7)" fontFamily="Poppins">GiriGo</text>
        <text x="102" y="67" fontSize="9" fill="rgba(15,23,42,.45)" fontFamily="JetBrains Mono">bot online</text>
        <rect x="76" y="82" width="136" height="22" rx="11" fill="#0F172A" opacity=".85"/>
        <text x="144" y="97" textAnchor="middle" fontSize="10" fill="#FACC15" fontWeight="600" fontFamily="Poppins">Halo GiriGo! Mau kirim…</text>
        <rect x="76" y="112" width="100" height="22" rx="11" fill="rgba(15,23,42,.06)" stroke="rgba(15,23,42,.12)" strokeWidth="1"/>
        <text x="126" y="127" textAnchor="middle" fontSize="10" fill="rgba(15,23,42,.7)" fontFamily="Poppins">Bot membalas instan ⚡</text>
      </svg>
    ),
    2: (
      <svg viewBox="0 0 320 180" style={{width:'100%',height:'100%',position:'absolute',inset:0}}>
        <rect x="60" y="20" width="200" height="140" rx="16" fill="rgba(37,99,235,.05)" stroke="rgba(37,99,235,.15)" strokeWidth="1.5"/>
        <text x="160" y="58" textAnchor="middle" fontSize="11" fill="rgba(15,23,42,.5)" fontFamily="JetBrains Mono">ESTIMASI ORDER</text>
        <text x="90" y="90" fontSize="12" fill="rgba(15,23,42,.6)" fontFamily="Poppins">Jarak</text>
        <text x="240" y="90" textAnchor="end" fontSize="12" fill="#0F172A" fontFamily="Poppins" fontWeight="600">3.2 km</text>
        <text x="90" y="112" fontSize="12" fill="rgba(15,23,42,.6)" fontFamily="Poppins">ETA</text>
        <text x="240" y="112" textAnchor="end" fontSize="12" fill="#0F172A" fontFamily="Poppins" fontWeight="600">8 mnt</text>
        <text x="90" y="134" fontSize="12" fill="rgba(15,23,42,.6)" fontFamily="Poppins">Ongkir</text>
        <text x="240" y="134" textAnchor="end" fontSize="13" fill="#2563EB" fontFamily="Poppins" fontWeight="700">Rp 11.400</text>
        <rect x="80" y="146" width="80" height="8" rx="4" fill="#16A34A" opacity=".8"/>
        <text x="120" y="153" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700" fontFamily="Poppins">✓ KONFIRMASI</text>
      </svg>
    ),
    3: (
      <svg viewBox="0 0 320 180" style={{width:'100%',height:'100%',position:'absolute',inset:0}}>
        <circle cx="160" cy="90" r="58" fill="rgba(37,99,235,.05)" stroke="rgba(37,99,235,.15)" strokeWidth="1.5"/>
        <circle cx="160" cy="90" r="36" stroke="#FACC15" strokeOpacity=".5" strokeWidth="1.5" fill="none" strokeDasharray="4 6"
          style={{transformOrigin:'160px 90px',animation:'rotateOrbit 8s linear infinite'}}/>
        <circle cx="160" cy="90" r="8" fill="#FACC15"/>
        <circle cx="160" cy="90" r="4" fill="#0F172A"/>
        <circle cx="218" cy="58" r="10" fill="#2563EB" opacity=".7"/>
        <circle cx="110" cy="130" r="8" fill="#FACC15" opacity=".6"/>
        <text x="160" y="170" textAnchor="middle" fontSize="10" fill="rgba(15,23,42,.5)" fontFamily="JetBrains Mono">Kurir menuju lokasi</text>
      </svg>
    ),
    4: (
      <svg viewBox="0 0 320 180" style={{width:'100%',height:'100%',position:'absolute',inset:0}}>
        <rect x="80" y="30" width="160" height="120" rx="16" fill="rgba(34,197,94,.06)" stroke="rgba(34,197,94,.2)" strokeWidth="1.5"/>
        <circle cx="160" cy="90" r="28" fill="rgba(34,197,94,.12)" stroke="#16A34A" strokeWidth="2"/>
        <path d="M 144 90 L 156 102 L 178 76" stroke="#16A34A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="160" y="136" textAnchor="middle" fontSize="10" fill="#16A34A" fontFamily="JetBrains Mono" fontWeight="700">TERKIRIM ✓</text>
        <text x="160" y="150" textAnchor="middle" fontSize="9" fill="rgba(15,23,42,.45)" fontFamily="Poppins">Foto bukti dikirim ke WA</text>
      </svg>
    ),
  }
  return <>{arts[step] ?? null}</>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {

  const features = [
    { num:'01', t:'Cepat & Real-Time',  d:'Kurir dijemput otomatis dalam hitungan menit. Track posisi langsung dari WhatsApp.',                 art:'speed' },
    { num:'02', t:'Lokal Gerung',        d:'Kami beroperasi di seluruh Kecamatan Gerung — dari Giri Menang Square ke seluruh penjuru.',          art:'local' },
    { num:'03', t:'Semua Jenis Paket',   d:'Dokumen, makanan, paket kecil hingga besar. COD & Transfer tersedia.',                               art:'package' },
    { num:'04', t:'Aman & Terpercaya',   d:'Setiap kurir terverifikasi. Bukti pengiriman foto dikirim ke WhatsApp Anda.',                        art:'shield' },
  ]

  const zones = [
    { name:'Gerung Kota', status:'Pusat',      pin:{top:'50%',left:'38%'}, isHub:true },
    { name:'Giri Menang', status:'Aktif',      pin:{top:'38%',left:'52%'} },
    { name:'Tempos',      status:'Aktif',      pin:{top:'22%',left:'40%'} },
    { name:'Mataram',     status:'Antar-kota', pin:{top:'14%',left:'70%'} },
    { name:'Banyu Urip',  status:'Aktif',      pin:{top:'50%',left:'76%'} },
    { name:'Dasan Baru',  status:'Aktif',      pin:{top:'72%',left:'46%'} },
    { name:'Beleke',      status:'Aktif',      pin:{top:'60%',left:'14%'} },
  ]
  const CX = 266, CY = 290
  const roadNodes = [
    { x:366, y:220 }, { x:280, y:130 }, { x:490, y:80 }, { x:532, y:290 }, { x:320, y:420 }, { x:100, y:350 },
  ]

  const cases = [
    { num:'01', t:'Dokumen Kantor',    d:'Kirim berkas urgent antar kantor di Gerung — sampai dalam hitungan menit, foto bukti otomatis ke WA.', art:'doc' },
    { num:'02', t:'Makanan & Minuman', d:'Warung, kafe, dan resto bisa pakai GiriGo sebagai armada antar. Tinggal kirim alamat, beres.',         art:'food', alt:true },
    { num:'03', t:'Paket UMKM',        d:'Toko online lokal? Kami jemput dari rumah Anda dan antar ke pelanggan dalam kota. COD didukung.',      art:'box' },
  ]

  const chapters = [
    { no:1, state:'done',   step:'Chat WhatsApp',    meta:'STEP / 01', desc:'Ketik "Halo" ke nomor GiriGo — bot kami langsung respons dalam hitungan detik.' },
    { no:2, state:'done',   step:'Konfirmasi Harga', meta:'STEP / 02', desc:'Kami kirim estimasi jarak, ETA, dan ongkir. Setujui dengan satu ketuk.' },
    { no:3, state:'active', step:'Kurir Berangkat',  meta:'STEP / 03', desc:'Kurir terdekat langsung dijemput otomatis. Anda mendapat link tracking real-time.' },
    { no:4, state:'',       step:'Terkirim!',         meta:'STEP / 04', desc:'Foto bukti pengiriman dikirim ke WhatsApp Anda secara otomatis.' },
  ]

  return (
    <>
      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <header className="nav">
        <div className="container-wide nav-inner">
          <a href="#" className="brand">
            <BrandMark size={40}/>
            <span className="brand-text">GiriGo</span>
          </a>
          <nav className="nav-links" aria-label="Utama">
            <a href="#fitur"   className="nav-link active">Fitur</a>
            <a href="#cara"    className="nav-link">Cara Pakai</a>
            <a href="#liputan" className="nav-link">Liputan</a>
            <a href="#tarif"   className="nav-link">Tarif</a>
            <a href="#cerita"  className="nav-link">Cerita</a>
          </nav>
          <div className="nav-actions">
            <Link href="/tracking" className="nav-link" style={{display:'inline-flex',gap:6}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              Lacak Paket
            </Link>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-blue btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
              Kirim Sekarang
            </a>
          </div>
        </div>
      </header>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section className="hero section">
        <div className="container-wide">
          <div className="hero-meta-row">
            <span>◆ ED. 01 · GERUNG · LOMBOK BARAT</span>
            <span className="mid"><span className="live-dot"/>&nbsp;&nbsp;BEROPERASI · 24/7</span>
            <span>EST. 2025 · GIRI MENANG SQUARE</span>
          </div>

          <div className="hero-grid">
            <div className="hero-copy">
              <h1 className="headline">
                <span className="row">Kurir Cepat</span>
                <span className="row">
                  Berbasis <span className="yellow-block">WhatsApp</span>
                </span>
              </h1>
              <p className="hero-tagline">
                Pesan antar-jemput paket hanya lewat WhatsApp. <strong>Tidak perlu aplikasi</strong>, tidak perlu daftar. Langsung kirim.
              </p>
              <div className="hero-cta-row">
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-blue btn-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
                  Kirim Sekarang
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </a>
                <Link href="/tracking" className="btn btn-outline btn-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>
                  Lacak Paket
                </Link>
              </div>
            </div>

            <div className="hero-side">
              <HeroCalculator/>
              <div className="chat-strip">
                <div className="chat-strip-head">
                  <div className="av"><ScooterGlyph size={20} color="#FACC15"/></div>
                  <div>
                    <div className="name">GiriGo</div>
                    <div className="sub"><span className="live-dot"/> bot online · membalas instan</div>
                  </div>
                  <div className="mono" style={{marginLeft:'auto',fontSize:11,color:'var(--ink-3)'}}>14:09</div>
                </div>
                <div className="chat-bubble in">Halo! 👋 Saya bot GiriGo. Mau kirim paket ke mana?</div>
                <div className="chat-bubble out">Kirim dokumen ke Giri Menang Sq.</div>
                <div className="chat-bubble in" style={{background:'var(--navy)',color:'#fff'}}>
                  <div style={{fontWeight:600,color:'var(--yellow)',marginBottom:4}}>📍 Ongkir Rp 11.400 · ETA 8 mnt</div>
                  <div style={{fontSize:12,opacity:.8}}>Ketuk ✓ untuk konfirmasi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ MANIFESTO ════════════════════════════════════════════════════════ */}
      <section className="manifesto">
        <CircularMovementPath variant="manifesto"/>
        <div className="container-wide" style={{position:'relative',zIndex:2}}>
          <h2>
            Kurir lokal yang <em>ngerti</em><br/>
            area Gerung, ditenagai<br/>
            teknologi modern.
          </h2>
          <div className="meta">
            {[
              {k:'Order minggu ini', v:'1,284'},
              {k:'Rata-rata pickup', v:'7.6',  u:'mnt'},
              {k:'Kurir aktif',      v:'12',   u:'online'},
              {k:'On-time rate',     v:'99.4', u:'%'},
            ].map(s => (
              <div key={s.k}>
                <div className="k">{s.k}</div>
                <div className="v">{s.v}{s.u && <span className="u">{s.u}</span>}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════════ */}
      <section id="fitur" className="section section-paper">
        <div className="container-wide">
          <div className="section-head">
            <div className="left">
              <div className="eyebrow">
                <span className="ix">§ 01</span>
                <span className="rule"/>
                Mengapa GiriGo
              </div>
              <p className="lede">Empat alasan kami jadi pilihan utama warga Gerung.</p>
            </div>
            <h2>Kenapa Pilih GiriGo?</h2>
          </div>
          <div className="feat-list">
            {features.map(r => (
              <div key={r.num} className="feat-row">
                <div className="num">{r.num}</div>
                <div className="ttl">{r.t}</div>
                <p className="desc">{r.d}</p>
                <div className="art"><FeatureArt kind={r.art}/></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COVERAGE ═════════════════════════════════════════════════════════ */}
      <section id="liputan" className="section section-paper">
        <div className="container-wide">
          <div className="section-head">
            <div className="left">
              <div className="eyebrow"><span className="ix">§ 02</span><span className="rule"/>Area Liputan</div>
              <p className="lede">Pusat operasi di Giri Menang Square, menjangkau 6 desa utama plus antar-kota.</p>
            </div>
            <h2>Sudah meliputi seluruh Kecamatan Gerung.</h2>
          </div>

          <div className="coverage-grid">
            <div className="coverage-map">
              <svg viewBox="0 0 700 580" preserveAspectRatio="none" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
                <defs>
                  <pattern id="cov-grid" width="44" height="44" patternUnits="userSpaceOnUse">
                    <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(15,23,42,.05)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="700" height="580" fill="url(#cov-grid)"/>
                <circle cx={CX} cy={CY} r="230" stroke="rgba(15,23,42,.18)" strokeWidth="1.5" strokeDasharray="6 8" fill="none"/>
                <circle cx={CX} cy={CY} r="168" stroke="rgba(15,23,42,.10)" strokeWidth="1.2" strokeDasharray="3 6" fill="none"/>

                {roadNodes.map((n, i) => (
                  <g key={i}>
                    <line x1={CX} y1={CY} x2={n.x} y2={n.y} stroke="rgba(15,23,42,.08)" strokeWidth="16" strokeLinecap="round"/>
                    <line x1={CX} y1={CY} x2={n.x} y2={n.y} stroke={i===2?'#2563EB':'#0F172A'} strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={i===2?'4 8':'6 8'}
                      style={{animation:`roadFlow${i%2?'Out':'In'} ${i===2?'2.4s':'2s'} ${i*.18}s linear infinite`}}/>
                  </g>
                ))}

                <circle cx={CX} cy={CY} r="96" fill="rgba(250,204,21,.18)" stroke="#0F172A" strokeWidth="2.5"/>
                <circle cx={CX} cy={CY} r="66" stroke="#0F172A" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="4 6" fill="none"
                  style={{transformOrigin:`${CX}px ${CY}px`,animation:'rotateOrbitRev 18s linear infinite'}}/>
                <circle cx={CX} cy={CY} r="38" stroke="#0F172A" strokeWidth="2" fill="none"/>

                <g style={{transformOrigin:`${CX}px ${CY}px`,animation:'rotateOrbit 10s linear infinite'}}>
                  <g transform={`translate(${CX},${CY-66})`}>
                    <circle r="7" fill="#2563EB" opacity=".25"/><circle r="4" fill="#2563EB" stroke="#0F172A" strokeWidth="1.2"/>
                  </g>
                </g>

                <text x={CX} y={CY+6}  textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="700" fontFamily="Poppins">GIRI MENANG SQUARE</text>
                <text x={CX} y={CY+22} textAnchor="middle" fill="#0F172A" fontSize="9"  fontFamily="JetBrains Mono" opacity=".6">◆ titik nol</text>
              </svg>

              {zones.map((z, i) => (
                <div key={i} className={`coverage-pin${z.isHub?' center':''}`} style={z.pin}>
                  <span className="ic"/>
                  {z.name}
                </div>
              ))}

              <div style={{position:'absolute',left:24,bottom:24,background:'#fff',border:'1px solid var(--paper-line)',padding:'14px 18px',borderRadius:16,display:'flex',flexDirection:'column',gap:8,fontSize:12,color:'var(--ink-2)',fontFamily:'JetBrains Mono,monospace',letterSpacing:'.04em'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:10,height:10,borderRadius:99,background:'#FACC15',border:'1.5px solid #0F172A'}}/> PUSAT</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:10,height:10,borderRadius:99,background:'#0F172A'}}/> AKTIF · 6 ZONA</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:10,height:10,borderRadius:99,background:'#2563EB'}}/> ANTAR-KOTA</div>
              </div>
            </div>

            <div className="coverage-side">
              <div className="eyebrow" style={{color:'rgba(255,255,255,.5)'}}>
                <span className="ix" style={{color:'rgba(255,255,255,.7)'}}>§ 02.A</span>
                <span className="rule" style={{background:'rgba(255,255,255,.3)'}}/>
                Daftar Area
              </div>
              <h3>12 kurir,<br/>7 zona,<br/>satu kecamatan.</h3>
              <p>Pengiriman dalam Gerung tarif tetap. Antar-kota ke Mataram &amp; Lombok Barat tersedia on-request via WhatsApp.</p>
              <div className="zone-list">
                {zones.map((z, i) => (
                  <div key={i} className="row">
                    <div className="nm">
                      <span className="dot" style={{background:z.status==='Pusat'?'#FACC15':z.status==='Antar-kota'?'#2563EB':'#fff'}}/>
                      {z.name}
                    </div>
                    <div className="st">{z.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ USE CASES ════════════════════════════════════════════════════════ */}
      <section className="section section-yellow">
        <div className="container-wide">
          <div className="section-head">
            <div className="left">
              <div className="eyebrow"><span className="ix">§ 03</span><span className="rule" style={{background:'rgba(15,23,42,.4)'}}/>Untuk Siapa</div>
              <p className="lede">Tiga jenis pengiriman paling populer. Semua dipesan dalam satu chat.</p>
            </div>
            <h2>Dari dokumen sampai dagangan.</h2>
          </div>
          <div className="cases-grid">
            {cases.map(c => (
              <div key={c.num} className={`case-card${c.alt?' alt':''}`}>
                <div>
                  <div className="num">{c.num} / 03</div>
                  <div className="ttl">{c.t}</div>
                  <p className="desc">{c.d}</p>
                </div>
                <div className="art">
                  <UseCaseArt kind={c.art} dark={!c.alt}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section id="cara" className="section section-paper">
        <div className="container-wide">
          <div className="section-head">
            <div className="left">
              <div className="eyebrow"><span className="ix">§ 04</span><span className="rule"/>Cara Pakai</div>
              <p className="lede">4 langkah mudah, semua lewat WhatsApp.</p>
            </div>
            <h2>Cara Pakai GiriGo</h2>
          </div>
          <div className="chapters">
            {chapters.map(c => (
              <div key={c.no} className={`chapter${c.state?' '+c.state:''}`}>
                <div className="big-num">{c.no}</div>
                <div>
                  <div className="meta-pill">
                    {c.state==='done'   && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>}
                    {c.state==='active' && <span className="live-dot" style={{background:'var(--blue)'}}/>}
                    {c.meta}
                  </div>
                  <h3>{c.step}</h3>
                  <p>{c.desc}</p>
                </div>
                <div className="micro-art">
                  <ChapterArt step={c.no}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LIVE TRACKER ═════════════════════════════════════════════════════ */}
      <section id="lacak" className="section section-navy">
        <div className="container-wide">
          <div className="section-head">
            <div className="left">
              <div className="eyebrow" style={{color:'rgba(255,255,255,.5)'}}>
                <span className="ix" style={{color:'rgba(255,255,255,.7)'}}>§ 05</span>
                <span className="rule" style={{background:'rgba(255,255,255,.3)'}}/>
                Live Tracking
              </div>
              <p className="lede">Bagikan link ke pelanggan, lihat lokasi &amp; status real-time.</p>
            </div>
            <h2>Lacak setiap order — real-time.</h2>
          </div>
          <LiveTrackerPreview/>
          <div style={{marginTop:32,textAlign:'center'}}>
            <Link href="/tracking" className="btn btn-outline-light">
              Buka halaman tracking →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ TARIFF ═══════════════════════════════════════════════════════════ */}
      <section id="tarif" className="section section-paper">
        <div className="container-wide">
          <div className="section-head">
            <div className="left">
              <div className="eyebrow"><span className="ix">§ 06</span><span className="rule"/>Tarif</div>
              <p className="lede">Harga transparan, tidak ada biaya tersembunyi.</p>
            </div>
            <h2>Tarif Ongkir</h2>
          </div>
          <div className="tariff-stack">
            {[
              { range:'0 – 2 km',   price:'Rp 5.000',    note:'Area Gerung Kota',    feat:false },
              { range:'2 – 5 km',   price:'Rp 5.000',    extra:'Rp 2.000/km', note:'Gerung & sekitar', feat:true },
              { range:'5 – 10 km',  price:'Rp 5.000',    extra:'Rp 2.000/km', note:'Lombok Barat',     feat:false },
            ].map((t, i) => (
              <div key={i} className={`tariff-row${t.feat?' featured':''}`}>
                <div className="range">{t.range}</div>
                <div className="price">
                  {t.price}
                  {t.extra && <><span className="plus">+</span><span className="extra">{t.extra}</span></>}
                </div>
                <div className="note">{t.note}</div>
                <div className="arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </div>
              </div>
            ))}
          </div>
          <p className="tariff-note">
            Tarif bisa berubah untuk jenis paket berat. Konfirmasi harga dikirim otomatis sebelum order dikonfirmasi.
          </p>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════════════════ */}
      <section id="cerita" className="section section-cream">
        <div className="container-wide">
          <div className="section-head">
            <div className="left">
              <div className="eyebrow"><span className="ix">§ 07</span><span className="rule"/>Suara Pelanggan</div>
              <p className="lede">Ratusan order setiap minggu, dari warung kopi sampai kantor desa.</p>
            </div>
            <h2>Dipercaya Warga Gerung.</h2>
          </div>
          <div className="testi-grid">
            {[
              { text:'Cepat banget! Kirim makanan dari warung saya sampai dalam 15 menit. Recommended!', name:'Ibu Sari',   area:'Gerung Kota', init:'S', av:'' },
              { text:'Gampang banget, tinggal WhatsApp langsung ada kurir. Harga juga transparan.',     name:'Pak Hendra', area:'Giri Menang',  init:'H', av:'b' },
              { text:'Sudah pakai GiriGo tiap hari buat kirim dokumen kantor. Nggak pernah telat.',    name:'Bu Dewi',    area:'Dasan Baru',   init:'D', av:'c' },
            ].map(t => (
              <div key={t.name} className="testi">
                <div className="qm">&ldquo;</div>
                <div className="stars">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                      <path d="M12 2l2.9 6.9 7.6.6-5.8 5 1.8 7.4L12 18l-6.5 3.9 1.8-7.4-5.8-5 7.6-.6L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p className="text">&ldquo;{t.text}&rdquo;</p>
                <div className="who">
                  <div className={`av${t.av?' '+t.av:''}`}>{t.init}</div>
                  <div>
                    <div className="nm">{t.name}</div>
                    <div className="ar">{t.area}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
      <section className="cta">
        <div className="container-wide">
          <div className="cta-inner">
            <div>
              <h2>Siap Kirim <em>Sekarang?</em></h2>
              <p>Chat WhatsApp kami — bot kami siap 24 jam membantu proses order Anda.</p>
              <div className="ctas">
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-yellow btn-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
                  Mulai Chat WhatsApp
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </a>
                <Link href="/tracking" className="btn btn-outline-light btn-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>
                  Lacak Paket Saya
                </Link>
              </div>
              <div style={{marginTop:36,display:'flex',gap:24,flexWrap:'wrap',fontSize:13,color:'rgba(255,255,255,.55)'}}>
                {['Tanpa aplikasi','Tanpa daftar','Mulai dari Rp 5.000'].map(item => (
                  <span key={item} style={{display:'flex',alignItems:'center',gap:8}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="cta-glyph" style={{position:'relative',height:360,display:'grid',placeItems:'center'}}>
              <CircularMovementPath variant="cta"/>
              <div className="cta-orbit" style={{width:280,height:280}}/>
              <div className="cta-orbit" style={{width:360,height:360}}/>
              <div style={{position:'absolute',background:'var(--yellow)',color:'var(--navy)',borderRadius:24,padding:'18px 24px',fontSize:13,fontWeight:700,display:'flex',flexDirection:'column',gap:4,zIndex:2}}>
                <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,opacity:.6,letterSpacing:'.16em'}}>LIVE NOW</div>
                <div style={{fontSize:28,fontWeight:800,letterSpacing:'-.03em',lineHeight:1}}>12 <span style={{fontSize:14,fontWeight:500,opacity:.6}}>kurir online</span></div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                  <span className="live-dot"/>
                  <span style={{fontSize:11,opacity:.7}}>Gerung & sekitar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="footer">
        <div className="container-wide">
          <div className="top">
            <div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
                <BrandMark size={36}/>
                <span style={{fontWeight:800,fontSize:20,color:'var(--navy)'}}>GiriGo</span>
              </div>
              <p style={{fontSize:15,lineHeight:1.6,margin:0,maxWidth:280,color:'var(--ink-2)'}}>
                Kurir cepat berbasis WhatsApp. Lokal Gerung, Lombok Barat — antar dokumen, makanan, dan paket dalam menit.
              </p>
              <div style={{marginTop:20,display:'flex',alignItems:'center',gap:8,fontSize:12,color:'var(--ink-3)'}}>
                <span className="live-dot"/> Beroperasi 24/7
              </div>
            </div>
            <div>
              <h4>Layanan</h4>
              <ul>
                <li><a href={WA_LINK} target="_blank" rel="noopener noreferrer">Kirim Paket</a></li>
                <li><Link href="/tracking">Lacak Paket</Link></li>
                <li><a href="#tarif">Tarif Ongkir</a></li>
                <li><a href="#liputan">Area Liputan</a></li>
              </ul>
            </div>
            <div>
              <h4>Perusahaan</h4>
              <ul>
                <li><a href="#">Tentang GiriGo</a></li>
                <li><a href="#">Untuk Bisnis</a></li>
                <li><Link href="/courier">Jadi Kurir</Link></li>
                <li><Link href="/admin">Portal Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4>Kontak</h4>
              <ul>
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:8}}>
                    <WaIcon size={14}/> +62 812-3456-7890
                  </a>
                </li>
                <li><a href="mailto:halo@girigo.id">halo@girigo.id</a></li>
                <li style={{color:'var(--ink-2)',lineHeight:1.55}}>Giri Menang Square,<br/>Gerung, Lombok Barat</li>
              </ul>
            </div>
          </div>

          <div className="megalo-foot">
            GiriGo.<br/>
            <em>Kirim, lacak,</em><br/>
            sampai.
          </div>

          <div className="legal">
            <span>© 2025 GIRIGO COURIER · ALL RIGHTS RESERVED</span>
            <div style={{display:'flex',gap:24}}>
              <a href="#">PRIVACY</a>
              <a href="#">TERMS</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
