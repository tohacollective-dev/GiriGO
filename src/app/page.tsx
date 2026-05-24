import Link from 'next/link'

const WA_NUMBER  = '6281234567890'
const WA_MESSAGE = encodeURIComponent('Halo GiriGo! Saya ingin kirim paket.')
const WA_LINK    = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`

// ─── Brand & icon primitives ──────────────────────────────────────────────────

function BrandMark({ size = 36 }: { size?: number }) {
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
      <path d="M7 24L13 14H22L24 24"   stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 14L11 8H8"          stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 14V10"              stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function WaIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ─── Route-grid SVG background (hero + CTA) ───────────────────────────────────

function RouteGrid() {
  const nodes: [number, number, string, number][] = [
    [200, 80, '#2563EB', 0], [1000, 80, '#FACC15', .8],
    [200, 720, '#FACC15', 1.6], [1000, 720, '#2563EB', 2.4],
    [0, 400, '#2563EB', .4], [1200, 400, '#FACC15', 1.2],
    [600, 0, '#2563EB', 2.0], [600, 800, '#FACC15', 2.8],
    [300, 320, '#FACC15', .6], [900, 480, '#2563EB', 1.4],
  ]
  return (
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.55, pointerEvents:'none' }}
      aria-hidden>
      <defs>
        <linearGradient id="rg-trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#2563EB" stopOpacity="0"/>
          <stop offset="60%"  stopColor="#2563EB" stopOpacity=".8"/>
          <stop offset="100%" stopColor="#FACC15" stopOpacity="1"/>
        </linearGradient>
        <linearGradient id="rg-trail-2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#FACC15" stopOpacity="0"/>
          <stop offset="100%" stopColor="#FACC15" stopOpacity=".8"/>
        </linearGradient>
      </defs>
      {/* Central roundabout */}
      <g transform="translate(600 400)">
        <circle r="120" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="1.5"/>
        <circle r="80"  fill="none" stroke="#fff" strokeOpacity=".15" strokeWidth="1"/>
        <circle r="40"  fill="none" stroke="#2563EB" strokeOpacity=".55" strokeWidth="1.5"/>
        <circle r="6"   fill="#FACC15"/>
      </g>
      {/* Cardinal spokes */}
      <line x1="600" y1="0"   x2="600" y2="280"  stroke="#fff" strokeOpacity=".18" strokeWidth="1.5"/>
      <line x1="600" y1="520" x2="600" y2="800"  stroke="#fff" strokeOpacity=".18" strokeWidth="1.5"/>
      <line x1="0"   y1="400" x2="480" y2="400"  stroke="#fff" strokeOpacity=".18" strokeWidth="1.5"/>
      <line x1="720" y1="400" x2="1200" y2="400" stroke="#fff" strokeOpacity=".18" strokeWidth="1.5"/>
      {/* Diagonal spokes */}
      <line x1="515" y1="315" x2="200"  y2="80"  stroke="#fff" strokeOpacity=".10" strokeWidth="1"/>
      <line x1="685" y1="315" x2="1000" y2="80"  stroke="#fff" strokeOpacity=".10" strokeWidth="1"/>
      <line x1="515" y1="485" x2="200"  y2="720" stroke="#fff" strokeOpacity=".10" strokeWidth="1"/>
      <line x1="685" y1="485" x2="1000" y2="720" stroke="#fff" strokeOpacity=".10" strokeWidth="1"/>
      {/* Grid */}
      {[120,240,560,680].map(y => <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="#fff" strokeOpacity=".05" strokeWidth="1"/>)}
      {[150,300,900,1050].map(x => <line key={x} x1={x} y1="0" x2={x} y2="800" stroke="#fff" strokeOpacity=".05" strokeWidth="1"/>)}
      {/* Animated trails */}
      <path d="M 100 400 L 480 400"  stroke="url(#rg-trail)"   strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="80 380"  style={{animation:'trailSweep 3.6s linear infinite'}}/>
      <path d="M 720 400 L 1100 400" stroke="url(#rg-trail-2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="60 380"  style={{animation:'trailSweep 3.6s 1.4s linear infinite'}}/>
      <path d="M 600 100 L 600 280"  stroke="url(#rg-trail-2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="40 200"  style={{animation:'trailSweep 2.4s .6s linear infinite'}}/>
      {/* Pulsing nodes */}
      {nodes.map(([x,y,c,d],i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r="3" fill={c}/>
          <circle r="3" fill={c} style={{transformOrigin:'center', animation:`gridPulse 2.6s ${d}s infinite cubic-bezier(0,0,.2,1)`}}/>
        </g>
      ))}
    </svg>
  )
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={{ fontFamily:"'Poppins', system-ui, sans-serif", color:'var(--ink)', background:'var(--white)' }}>

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <header className="nav">
        <div className="lp-container nav-inner">
          <a href="#" className="brand">
            <BrandMark size={36}/>
            <span className="brand-text">GiriGo</span>
            <span className="brand-sub">Courier</span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            <a href="#fitur"   className="nav-link">Fitur</a>
            <a href="#cara"    className="nav-link">Cara Pakai</a>
            <a href="#tarif"   className="nav-link">Tarif</a>
            <a href="#liputan" className="nav-link">Area</a>
          </nav>

          <div className="nav-actions">
            <Link href="/tracking" className="nav-link" style={{gap:6}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              Lacak Paket
            </Link>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-yellow btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
              Kirim Sekarang
            </a>
          </div>
        </div>
      </header>

      {/* ══ MARQUEE ══════════════════════════════════════════════════════════ */}
      <div className="marquee" aria-hidden>
        <div className="track">
          {[
            '⚡ Rata-rata pickup 8 menit',
            '📍 Beroperasi 24 jam',
            '✅ Setiap kurir terverifikasi',
            '📦 Dokumen · Makanan · Paket',
            '🗺 Gerung · Giri Menang · Dasan Baru',
            '💳 COD & Transfer tersedia',
            '⚡ Rata-rata pickup 8 menit',
            '📍 Beroperasi 24 jam',
            '✅ Setiap kurir terverifikasi',
            '📦 Dokumen · Makanan · Paket',
            '🗺 Gerung · Giri Menang · Dasan Baru',
            '💳 COD & Transfer tersedia',
          ].map((item, i) => (
            <span key={i}>{item}<span className="sep">◆</span></span>
          ))}
        </div>
      </div>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section className="hero section">
        <div className="hero-bg"><RouteGrid/></div>

        <div className="lp-container hero-grid">
          {/* Left copy */}
          <div>
            <div className="chip chip-dark">
              <span className="live-dot"/> Beroperasi di Kecamatan Gerung, Lombok Barat
            </div>

            <h1>
              Kurir Cepat<br/>
              Berbasis <span className="accent">WhatsApp</span>
            </h1>

            <p className="hero-lede">
              Pesan antar-jemput paket hanya lewat WhatsApp.
              Tidak perlu aplikasi, tidak perlu daftar. Langsung kirim dalam hitungan menit.
            </p>

            <div className="hero-ctas">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-yellow btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
                Kirim Sekarang
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
              <Link href="/tracking" className="btn btn-ghost-dark btn-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>
                Lacak Paket
              </Link>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                className="chip chip-dark"
                style={{padding:'12px 14px', borderRadius:12, fontSize:13, border:'1px dashed rgba(255,255,255,.2)'}}>
                <WaIcon size={14}/> Tersedia via WhatsApp
              </a>
            </div>

            <div className="hero-meta">
              {[
                { v:'8',  unit:'mnt', k:'Rata-rata pickup' },
                { v:'24', unit:'/7',  k:'Operasional' },
                { v:'12', unit:'kurir', k:'Online sekarang' },
              ].map(s => (
                <div key={s.k}>
                  <div className="num">{s.v}<span className="unit">{s.unit}</span></div>
                  <div className="label">{s.k}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: WhatsApp chat preview */}
          <div style={{position:'relative'}}>
            {/* Floating chip top-left */}
            <div className="order-chip">
              <div className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
              </div>
              <div className="meta">
                <div className="t">Order #GG-2847</div>
                <div className="s">Picked up · 2 mnt yang lalu</div>
              </div>
            </div>

            <div className="chat-frame">
              <div className="chat-screen">
                <div className="chat-header">
                  <div className="chat-avatar">
                    <ScooterGlyph size={22} color="#FACC15"/>
                  </div>
                  <div>
                    <div className="chat-name">GiriGo</div>
                    <div className="chat-status">
                      <span className="live-dot"/> bot online · membalas instan
                    </div>
                  </div>
                  <div className="chat-actions">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.7 19.79 19.79 0 0 1 1.61 5.08 2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                  </div>
                </div>

                <div className="chat-body">
                  <div className="chat-day">HARI INI</div>

                  <div className="bubble in">
                    Halo! 👋 Saya bot <strong style={{color:'#FACC15'}}>GiriGo</strong>. Mau kirim paket ke mana hari ini?
                    <span className="time">08:00</span>
                  </div>
                  <div className="bubble out" style={{animationDelay:'.4s'}}>
                    Halo, kirim dokumen ke Giri Menang Square dong
                    <span className="time">08:00</span>
                  </div>
                  <div className="bubble in bubble-card" style={{animationDelay:'1.4s', minWidth:252}}>
                    <div className="b-title" style={{marginBottom:6}}>📍 Estimasi Order</div>
                    <div className="b-row"><span className="k">Jarak</span><span className="v">3.2 km</span></div>
                    <div className="b-row"><span className="k">ETA Pickup</span><span className="v">8 mnt</span></div>
                    <div className="b-row"><span className="k">Ongkir</span><span className="v">Rp 11.400</span></div>
                    <div className="b-cta">
                      <span className="mini">✓ Konfirmasi</span>
                      <span className="mini" style={{color:'#8696A0'}}>Batal</span>
                    </div>
                    <span className="time">08:01</span>
                  </div>
                  <div className="bubble out" style={{animationDelay:'2.5s'}}>
                    ✓ Konfirmasi
                    <span className="time">08:01</span>
                  </div>
                  <div className="bubble in" style={{animationDelay:'3.4s'}}>
                    <div className="b-title">🛵 Kurir Andi berangkat</div>
                    <div style={{fontSize:13, color:'#8696A0', marginTop:4}}>Link tracking dikirim →</div>
                    <span className="time">08:02</span>
                  </div>
                  <div className="bubble in" style={{background:'transparent', padding:'4px 12px', animationDelay:'4.4s'}}>
                    <span className="typing"><span/><span/><span/></span>
                  </div>
                </div>

                <div className="chat-input">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"/></svg>
                  <div className="pill">Ketik pesan…</div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/></svg>
                  <div className="send">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating chip bottom-right */}
            <div className="order-chip bottom">
              <div className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div className="meta">
                <div className="t">Terkirim ✓</div>
                <div className="s">Foto bukti dikirim</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ══════════════════════════════════════════════════════ */}
      <section className="band-dark" style={{padding:'64px 0 80px', background:'linear-gradient(180deg,#0F172A 0%,#131c34 100%)'}}>
        <div className="lp-container">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12}}>
            <div className="chip chip-yellow">
              <span className="live-dot" style={{background:'#FACC15'}}/> Dashboard publik · diperbarui realtime
            </div>
            <div style={{color:'rgba(255,255,255,.5)', fontSize:13}} className="mono">
              GG · LIVE · {new Date().toLocaleDateString('id-ID')}
            </div>
          </div>

          <div className="stats-sparkline">
            {[
              { k:'Order minggu ini',      v:'1,284', suf:'',      delta:'+18%', pos:true,  ic:'package', col:'#60A5FA', pts:[22,18,26,20,32,28,36,30,24,38] },
              { k:'Rata-rata pickup',      v:'7.6',   suf:'mnt',   delta:'−12s', pos:true,  ic:'clock',   col:'#FACC15', pts:[20,24,18,28,22,16,14,18,12,10] },
              { k:'Kurir aktif',           v:'12',    suf:'online',delta:'',     pos:false, ic:'route',   col:'#60A5FA', pts:[8,10,12,10,14,12,10,14,12,14] },
              { k:'Tingkat keberhasilan',  v:'99.4',  suf:'%',     delta:'SLA',  pos:false, ic:'check',   col:'#4ADE80', pts:[28,30,30,28,32,30,32,28,30,32] },
            ].map((s, i) => (
              <div key={i} style={{
                background:'rgba(255,255,255,.03)',
                border:'1px solid rgba(255,255,255,.08)',
                borderRadius:20,
                padding:24,
                position:'relative',
                overflow:'hidden',
              }}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18}}>
                  <span style={{
                    width:38, height:38, borderRadius:10,
                    background: i%2 ? 'rgba(250,204,21,.14)' : 'rgba(37,99,235,.18)',
                    color: i%2 ? '#FACC15' : '#60A5FA',
                    display:'grid', placeItems:'center',
                  }}>
                    {s.ic === 'package' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>}
                    {s.ic === 'clock'   && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>}
                    {s.ic === 'route'   && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 4-4V9"/></svg>}
                    {s.ic === 'check'   && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>}
                  </span>
                  {s.delta && (
                    <span style={{
                      fontSize:11, fontWeight:700, padding:'4px 8px', borderRadius:99,
                      background: s.pos ? 'rgba(34,197,94,.16)' : 'rgba(255,255,255,.06)',
                      color: s.pos ? '#4ADE80' : 'rgba(255,255,255,.7)',
                      letterSpacing:'.04em',
                    }}>{s.delta}</span>
                  )}
                </div>
                <div style={{fontSize:36, fontWeight:700, color:'#fff', letterSpacing:'-.02em', lineHeight:1}}>
                  {s.v}
                  {s.suf && <span style={{fontSize:16, color:'rgba(255,255,255,.55)', marginLeft:6, fontWeight:500}}>{s.suf}</span>}
                </div>
                <div style={{fontSize:13, color:'rgba(255,255,255,.55)', marginTop:10}}>{s.k}</div>
                {/* Sparkline */}
                <svg width="100%" height="32" viewBox="0 0 200 32" style={{marginTop:18, opacity:.75}}>
                  <path
                    d={`M 0 ${s.pts[0]} ${s.pts.map((p,j) => `L ${20*(j+1)} ${p}`).join(' ')}`}
                    fill="none" stroke={s.col} strokeWidth="1.5" strokeLinecap="round" opacity=".9"
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES BENTO ═══════════════════════════════════════════════════ */}
      <section className="band-light" id="fitur">
        <div className="lp-container">
          <div className="section-head">
            <div className="eyebrow"><span className="dot"/>Mengapa GiriGo</div>
            <h2>Kenapa Pilih GiriGo?</h2>
            <p className="lede">Kurir lokal yang ngerti area Gerung, ditenagai teknologi modern.</p>
          </div>

          <div className="bento">
            {/* Feat 1 — Speed */}
            <div className="card feat-1">
              <span className="num-tag">01</span>
              <div className="ic" style={{background:'rgba(37,99,235,.10)', color:'var(--blue)'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              </div>
              <h3>Cepat &amp; Real-Time</h3>
              <p>Kurir dijemput otomatis dalam hitungan menit. Track posisi langsung dari WhatsApp.</p>
              <div className="live-stat-row">
                <div className="live-stat">
                  <div className="v">7.6<span className="unit">mnt</span></div>
                  <div className="k">Avg pickup</div>
                </div>
                <div className="live-stat">
                  <div className="v">14<span className="unit">mnt</span></div>
                  <div className="k">Avg delivery</div>
                </div>
                <div className="live-stat">
                  <div className="v">99.4<span className="unit">%</span></div>
                  <div className="k">On-time</div>
                </div>
              </div>
              <div className="viz-pulses">
                {[0,1,2,3,4,5].map(i => <div key={i} className="bar"/>)}
              </div>
            </div>

            {/* Feat 2 — Coverage */}
            <div className="card feat-2 coverage-card">
              <span className="num-tag">02</span>
              <div className="copy">
                <div className="ic" style={{background:'rgba(34,197,94,.10)', color:'#16A34A'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>
                </div>
                <h3>Lokal Gerung</h3>
                <p>Kami beroperasi di seluruh Kecamatan Gerung — dari Giri Menang Square ke seluruh penjuru.</p>
                <div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:20}}>
                  {['Gerung Kota','Giri Menang','Dasan Baru','Banyu Urip','Beleke','Tempos'].map(t => (
                    <span key={t} className="chip chip-light" style={{fontSize:11, padding:'4px 10px'}}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="map-thumb">
                <svg viewBox="0 0 240 280" preserveAspectRatio="none" style={{width:'100%', height:'100%'}}>
                  <path d="M 0 80 Q 60 50 120 100 T 240 130"  stroke="#2563EB" strokeOpacity=".25" strokeWidth="1.5" fill="none"/>
                  <path d="M 0 180 Q 80 220 160 190 T 240 220" stroke="#2563EB" strokeOpacity=".2"  strokeWidth="1.5" fill="none"/>
                  <path d="M 40 0 Q 60 80 90 140 T 100 280"   stroke="#2563EB" strokeOpacity=".18" strokeWidth="1.5" fill="none"/>
                  <circle cx="120" cy="140" r="32" stroke="#FACC15" strokeOpacity=".7" strokeWidth="1.5" fill="none"/>
                  <circle cx="120" cy="140" r="18" stroke="#2563EB" strokeOpacity=".4" strokeWidth="1"   fill="none"/>
                  <circle cx="120" cy="140" r="4" fill="#FACC15"/>
                  <text x="126" y="135" fill="#475569" fontSize="8" fontFamily="'Poppins',sans-serif">Giri Menang</text>
                  <circle cx="68" cy="100" r="5" fill="#2563EB" opacity=".7"/>
                  <circle cx="175" cy="120" r="5" fill="#FACC15" opacity=".8"/>
                  <circle cx="90" cy="185" r="5" fill="#FACC15" opacity=".7"/>
                  <circle cx="162" cy="185" r="5" fill="#2563EB" opacity=".7"/>
                </svg>
              </div>
            </div>

            {/* Feat 3 — Package types */}
            <div className="card feat-3">
              <span className="num-tag">03</span>
              <div className="ic" style={{background:'rgba(124,58,237,.10)', color:'#7C3AED'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>
              </div>
              <h3>Semua Jenis Paket</h3>
              <p>Dokumen, makanan, paket kecil hingga besar. COD &amp; Transfer tersedia.</p>
              <div style={{display:'flex', gap:8, marginTop:18}}>
                <span className="chip chip-light" style={{fontSize:11, padding:'4px 10px'}}>COD</span>
                <span className="chip chip-light" style={{fontSize:11, padding:'4px 10px'}}>Transfer</span>
                <span className="chip chip-light" style={{fontSize:11, padding:'4px 10px'}}>QRIS</span>
              </div>
            </div>

            {/* Feat 4 — Trust */}
            <div className="card feat-4">
              <span className="num-tag">04</span>
              <div className="ic" style={{background:'rgba(245,158,11,.10)', color:'#D97706'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              </div>
              <h3>Aman &amp; Terpercaya</h3>
              <p>Setiap kurir terverifikasi. Bukti pengiriman foto dikirim ke WhatsApp Anda.</p>
              <div style={{display:'flex', gap:14, marginTop:18, alignItems:'center'}}>
                <div style={{display:'flex'}}>
                  {['A','B','D','M'].map((l,i) => (
                    <div key={l} style={{
                      width:28, height:28, borderRadius:99,
                      background:['#0F172A','#2563EB','#FACC15','#1E293B'][i],
                      color: i===2 ? '#0F172A' : '#fff',
                      border:'2px solid #fff', marginLeft: i===0 ? 0 : -8,
                      display:'grid', placeItems:'center', fontSize:11, fontWeight:700,
                    }}>{l}</div>
                  ))}
                </div>
                <div style={{fontSize:12, color:'var(--ink-2)'}}>
                  <strong style={{color:'var(--navy)'}}>12 kurir</strong> terverifikasi
                </div>
              </div>
            </div>

            {/* Feat 5 — Pricing */}
            <div className="card feat-5">
              <span className="num-tag">05</span>
              <div className="ic" style={{background:'rgba(34,197,94,.10)', color:'#16A34A'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
              </div>
              <h3>Harga Transparan</h3>
              <p>Estimasi ongkir &amp; ETA dikirim sebelum konfirmasi. Tidak ada biaya tersembunyi.</p>
              <div style={{marginTop:18, padding:'12px 14px', background:'#F8FAFC', borderRadius:12, fontSize:13}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, color:'var(--ink-2)', whiteSpace:'nowrap'}}>
                  <span>Tarif mulai</span>
                  <span style={{color:'var(--blue)', fontWeight:700}}>Rp 5.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ COVERAGE SECTION ═════════════════════════════════════════════════ */}
      <section className="band-pale" id="liputan">
        <div className="lp-container">
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'end', marginBottom:56}}>
            <div>
              <div className="eyebrow"><span className="dot"/>Area Liputan</div>
              <h2 style={{fontSize:'clamp(36px,4vw,52px)', letterSpacing:'-.03em', color:'var(--navy)', marginTop:16, textWrap:'balance' as never}}>
                Sudah meliputi seluruh Kecamatan Gerung.
              </h2>
            </div>
            <p style={{fontSize:17, color:'var(--ink-2)', lineHeight:1.55, margin:0}}>
              Pusat operasi di Giri Menang Square dengan 12 kurir aktif menjangkau 6 desa utama, plus pengiriman antar-kota ke Mataram &amp; Lombok Barat.
            </p>
          </div>

          <div className="coverage-section">
            {/* Map panel */}
            <div style={{position:'relative', minHeight:520, background:'linear-gradient(180deg,#F4F8FF,#E6EEFC)'}}>
              <svg viewBox="0 0 600 520" preserveAspectRatio="none" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
                <defs>
                  <pattern id="cov-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(37,99,235,.08)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="600" height="520" fill="url(#cov-grid)"/>
                {/* Roads */}
                <path d="M 0 220 Q 120 180 240 240 T 600 260"  stroke="rgba(37,99,235,.35)" strokeWidth="2" fill="none"/>
                <path d="M 0 360 Q 160 410 320 380 T 600 410"  stroke="rgba(37,99,235,.25)" strokeWidth="2" fill="none"/>
                <path d="M 220 0 Q 240 220 270 320 T 320 520"  stroke="rgba(37,99,235,.25)" strokeWidth="2" fill="none"/>
                <path d="M 440 0 Q 410 180 380 320 T 420 520"  stroke="rgba(37,99,235,.2)"  strokeWidth="2" fill="none"/>
                {/* Roundabout */}
                <circle cx="240" cy="240" r="60" stroke="#FACC15" strokeOpacity=".6" strokeWidth="2" fill="rgba(250,204,21,.04)"/>
                <circle cx="240" cy="240" r="34" stroke="#2563EB" strokeOpacity=".3" strokeWidth="1.5" fill="none"/>
                <circle cx="240" cy="240" r="6"  fill="#FACC15"/>
                <text x="264" y="244" fill="#0F172A" fontSize="10" fontWeight="600" fontFamily="'Poppins',sans-serif">Giri Menang Square</text>
                {/* Coverage halo */}
                <circle cx="240" cy="240" r="220" stroke="#FACC15" strokeOpacity=".22" strokeWidth="1.5" strokeDasharray="6 6" fill="none"/>
                {/* Active route */}
                <path d="M 460 80 Q 360 160 270 240 Q 200 320 150 380"
                  stroke="#FACC15" strokeWidth="2.5" fill="none" strokeDasharray="6 5"
                  style={{animation:'trailSweep 3s linear infinite'}}/>
              </svg>

              {/* Zone pins */}
              {[
                { name:'Gerung Kota',  s:'Pusat',     t:'42%', l:'38%', c:'#FACC15' },
                { name:'Giri Menang',  s:'Aktif',     t:'32%', l:'60%', c:'#FACC15' },
                { name:'Dasan Baru',   s:'Aktif',     t:'58%', l:'52%', c:'#FACC15' },
                { name:'Banyu Urip',   s:'Aktif',     t:'46%', l:'74%', c:'#FACC15' },
                { name:'Beleke',       s:'Aktif',     t:'68%', l:'28%', c:'#FACC15' },
                { name:'Tempos',       s:'Aktif',     t:'22%', l:'40%', c:'#FACC15' },
                { name:'Mataram',      s:'Antar-kota',t:'14%', l:'82%', c:'#2563EB' },
              ].map(z => (
                <div key={z.name} style={{position:'absolute', top:z.t, left:z.l, transform:'translate(-50%,-100%)'}}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:6,
                    background:'#fff', borderRadius:99, padding:'5px 10px 5px 6px',
                    boxShadow:'0 8px 20px -8px rgba(15,23,42,.25)',
                    border:'1px solid var(--line)',
                    fontSize:12, fontWeight:600, color:'var(--navy)', whiteSpace:'nowrap',
                  }}>
                    <span style={{width:10, height:10, borderRadius:99, background:z.c, flexShrink:0}}/>
                    {z.name}
                  </div>
                </div>
              ))}

              {/* Live badge */}
              <div style={{
                position:'absolute', left:20, bottom:20,
                background:'rgba(15,23,42,.9)', color:'#fff',
                padding:'12px 16px', borderRadius:14,
                display:'flex', alignItems:'center', gap:12, fontSize:13,
              }}>
                <span className="live-dot"/>
                <span><strong style={{color:'#FACC15'}}>12 kurir</strong> aktif sekarang</span>
              </div>
            </div>

            {/* Zone list */}
            <div style={{padding:32, display:'flex', flexDirection:'column', gap:8}}>
              <div style={{fontSize:12, fontWeight:600, color:'var(--ink-3)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:12}}>
                Daftar area
              </div>
              {[
                { name:'Gerung Kota',  status:'Pusat',      c:'#FACC15' },
                { name:'Giri Menang',  status:'Aktif',      c:'#FACC15' },
                { name:'Dasan Baru',   status:'Aktif',      c:'#FACC15' },
                { name:'Banyu Urip',   status:'Aktif',      c:'#FACC15' },
                { name:'Beleke',       status:'Aktif',      c:'#FACC15' },
                { name:'Tempos',       status:'Aktif',      c:'#FACC15' },
                { name:'Mataram',      status:'Antar-kota', c:'#2563EB' },
                { name:'Lombok Barat', status:'Antar-kota', c:'#2563EB' },
              ].map((z, i, arr) => (
                <div key={z.name} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'14px 4px',
                  borderBottom: i===arr.length-1 ? 'none' : '1px solid var(--line-2)',
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:12}}>
                    <span style={{width:8, height:8, borderRadius:99, background:z.c}}/>
                    <span style={{fontSize:15, fontWeight:500, color:'var(--navy)'}}>{z.name}</span>
                  </div>
                  <span style={{
                    fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:99,
                    background: z.status==='Pusat' ? 'rgba(250,204,21,.18)' : z.status==='Antar-kota' ? 'rgba(37,99,235,.10)' : 'rgba(34,197,94,.12)',
                    color:       z.status==='Pusat' ? '#92760A'             : z.status==='Antar-kota' ? '#1D4ED8'             : '#16A34A',
                  }}>{z.status}</span>
                </div>
              ))}
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost-light"
                style={{marginTop:16, justifyContent:'space-between'}}>
                Tanyakan ke kurir via WhatsApp
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ USE CASES ════════════════════════════════════════════════════════ */}
      <section className="band-light" style={{paddingTop:40}}>
        <div className="lp-container">
          <div className="section-head">
            <div className="eyebrow"><span className="dot"/>Untuk Siapa</div>
            <h2>Dari dokumen sampai dagangan, kami antar.</h2>
            <p className="lede">Tiga jenis pengiriman paling populer di Gerung. Semua bisa dipesan dalam satu chat.</p>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24}}>
            {/* Card 1 — Dokumen */}
            <div className="uc-card">
              <div style={{height:140, borderRadius:18, background:'rgba(37,99,235,.08)', marginBottom:24, position:'relative', overflow:'hidden', border:'1px solid rgba(37,99,235,.13)'}}>
                <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" style={{width:'100%', height:'100%'}}>
                  <rect x="80"  y="20" width="80" height="100" rx="8" fill="#fff" stroke="#2563EB" strokeWidth="1.5" transform="rotate(-6 120 70)"/>
                  <rect x="140" y="14" width="80" height="100" rx="8" fill="#fff" stroke="#2563EB" strokeWidth="1.5"/>
                  <line x1="156" y1="36" x2="206" y2="36" stroke="#2563EB" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="156" y1="48" x2="196" y2="48" stroke="#2563EB" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="156" y1="60" x2="206" y2="60" stroke="#2563EB" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="156" y1="72" x2="186" y2="72" stroke="#2563EB" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="195" cy="98" r="14" fill="#2563EB" opacity=".15"/>
                  <path d="M 188 98 L 193 103 L 202 92" stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{width:44, height:44, borderRadius:12, background:'rgba(37,99,235,.08)', color:'#2563EB', display:'grid', placeItems:'center', marginBottom:18}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/></svg>
              </div>
              <h3 style={{fontSize:22, color:'var(--navy)', marginBottom:10, letterSpacing:'-.015em'}}>Dokumen Kantor</h3>
              <p style={{fontSize:14.5, color:'var(--ink-2)', lineHeight:1.55, margin:0}}>Kirim berkas urgent antar kantor di Gerung — sampai dalam hitungan menit, foto bukti otomatis ke WA.</p>
            </div>

            {/* Card 2 — Makanan */}
            <div className="uc-card">
              <div style={{height:140, borderRadius:18, background:'rgba(245,158,11,.10)', marginBottom:24, position:'relative', overflow:'hidden', border:'1px solid rgba(245,158,11,.18)'}}>
                <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" style={{width:'100%', height:'100%'}}>
                  <ellipse cx="160" cy="105" rx="78" ry="10" fill="#D97706" opacity=".15"/>
                  <rect x="100" y="50" width="120" height="60" rx="10" fill="#fff" stroke="#D97706" strokeWidth="1.5"/>
                  <path d="M 100 70 L 220 70" stroke="#D97706" strokeOpacity=".3" strokeWidth="1.5"/>
                  <circle cx="124" cy="60" r="4" fill="#D97706" opacity=".5"/>
                  <path d="M 140 30 Q 160 10 180 30 Q 195 14 210 30" stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6"/>
                  <path d="M 130 22 Q 150  4 170 22"                stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".4"/>
                </svg>
              </div>
              <div style={{width:44, height:44, borderRadius:12, background:'rgba(245,158,11,.10)', color:'#D97706', display:'grid', placeItems:'center', marginBottom:18}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 2v7a3 3 0 0 0 3 3v10M9 2v9M6 2v3"/><path d="M19 2v20M15 2c0 4 1.5 6 4 7"/></svg>
              </div>
              <h3 style={{fontSize:22, color:'var(--navy)', marginBottom:10, letterSpacing:'-.015em'}}>Makanan &amp; Minuman</h3>
              <p style={{fontSize:14.5, color:'var(--ink-2)', lineHeight:1.55, margin:0}}>Warung, kafe, dan resto bisa pakai GiriGo sebagai armada antar. Tinggal kirim alamat, beres.</p>
            </div>

            {/* Card 3 — Paket UMKM */}
            <div className="uc-card">
              <div style={{height:140, borderRadius:18, background:'rgba(124,58,237,.10)', marginBottom:24, position:'relative', overflow:'hidden', border:'1px solid rgba(124,58,237,.18)'}}>
                <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" style={{width:'100%', height:'100%'}}>
                  <path d="M 110 50 L 160 30 L 210 50 L 210 110 L 160 130 L 110 110 Z" fill="#fff" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M 110 50 L 160 70 L 210 50" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                  <path d="M 160 70 L 160 130"         stroke="#7C3AED" strokeWidth="1.5" fill="none"/>
                  <rect x="148" y="40" width="24" height="8" fill="#7C3AED" opacity=".4"/>
                </svg>
              </div>
              <div style={{width:44, height:44, borderRadius:12, background:'rgba(124,58,237,.10)', color:'#7C3AED', display:'grid', placeItems:'center', marginBottom:18}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <h3 style={{fontSize:22, color:'var(--navy)', marginBottom:10, letterSpacing:'-.015em'}}>Paket UMKM</h3>
              <p style={{fontSize:14.5, color:'var(--ink-2)', lineHeight:1.55, margin:0}}>Toko online lokal? Kami jemput dari rumah Anda dan antar ke pelanggan dalam kota. COD didukung.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section className="band-pale" id="cara">
        <div className="lp-container">
          <div className="section-head">
            <div className="eyebrow"><span className="dot"/>Cara Pakai</div>
            <h2>Cara Pakai GiriGo</h2>
            <p className="lede">4 langkah mudah, semua lewat WhatsApp.</p>
          </div>

          <div className="timeline">
            <div className="timeline-line"><div className="dash"/></div>
            <div className="steps">
              {[
                { no:'1', nm:'Chat WhatsApp',    ds:'Ketik "Halo" ke nomor GiriGo — bot kami langsung respons.',          state:'done' },
                { no:'2', nm:'Konfirmasi Harga', ds:'Kami kirim estimasi jarak, ETA, dan ongkir. Setujui dengan 1 ketuk.', state:'done' },
                { no:'3', nm:'Kurir Berangkat',  ds:'Kurir terdekat langsung dijemput otomatis. Anda dapat link tracking.', state:'active' },
                { no:'4', nm:'Terkirim!',         ds:'Foto bukti pengiriman dikirim ke WhatsApp Anda secara otomatis.',     state:'' },
              ].map(s => (
                <div key={s.no} className={`step ${s.state}`}>
                  <span className="idx mono">STEP / 0{s.no}</span>
                  <div className="node">
                    <div className="node-inner">{s.no}</div>
                  </div>
                  <div className="nm">{s.nm}</div>
                  <p className="ds">{s.ds}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ LIVE TRACKER PREVIEW ═════════════════════════════════════════════ */}
      <section className="band-light" id="lacak">
        <div className="lp-container">
          <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:40, alignItems:'end', marginBottom:48}}>
            <div>
              <div className="eyebrow"><span className="dot"/>Live Tracking</div>
              <h2 style={{fontSize:'clamp(36px,4vw,52px)', letterSpacing:'-.03em', color:'var(--navy)', marginTop:16}}>
                Lacak setiap order — real-time.
              </h2>
              <p style={{fontSize:17, color:'var(--ink-2)', marginTop:14, lineHeight:1.55, maxWidth:580}}>
                Setiap pesanan punya halaman tracking publik. Bagikan link ke pelanggan, lihat lokasi kurir, status, dan foto bukti — semua di satu tempat.
              </p>
            </div>
            <Link href="/tracking" className="btn btn-ghost-light" style={{whiteSpace:'nowrap'}}>
              Buka contoh tracking
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="tracker-wrap">
            {/* Map side */}
            <div style={{position:'relative', background:'linear-gradient(180deg,#0A1428,#131c34)', overflow:'hidden'}}>
              <svg viewBox="0 0 640 540" preserveAspectRatio="none" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
                <defs>
                  <pattern id="trk-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="640" height="540" fill="url(#trk-grid)"/>
                {/* Roads */}
                <path d="M 0 160 Q 120 120 240 200 T 640 220" stroke="rgba(255,255,255,.12)" strokeWidth="2" fill="none"/>
                <path d="M 0 380 Q 140 420 320 380 T 640 410" stroke="rgba(255,255,255,.10)" strokeWidth="2" fill="none"/>
                <path d="M 180 0 Q 200 220 240 320 T 280 540" stroke="rgba(255,255,255,.10)" strokeWidth="2" fill="none"/>
                {/* Roundabout */}
                <circle cx="240" cy="280" r="60" stroke="#FACC15" strokeOpacity=".55" strokeWidth="2" fill="rgba(250,204,21,.04)"/>
                <circle cx="240" cy="280" r="36" stroke="#2563EB" strokeOpacity=".4" strokeWidth="1.5" fill="none"/>
                <circle cx="240" cy="280" r="6"  fill="#FACC15"/>
                {/* Ghost route */}
                <path d="M 80 400 Q 160 360 240 280 Q 320 200 400 220 Q 480 240 560 160"
                  stroke="rgba(250,204,21,.25)" strokeWidth="3" fill="none"/>
                {/* Animated progress fill */}
                <path d="M 80 400 Q 160 360 240 280 Q 320 200 400 220 Q 480 240 560 160"
                  stroke="#FACC15" strokeWidth="3" fill="none" strokeLinecap="round"
                  strokeDasharray="600" strokeDashoffset="240"
                  style={{animation:'trailSweep 8s linear infinite alternate'}}/>
              </svg>

              {/* Animated courier dot */}
              <svg viewBox="0 0 640 540" preserveAspectRatio="none"
                style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', overflow:'visible'}}>
                <circle className="courier-moving" r="14" fill="#FACC15" opacity=".3"/>
                <circle className="courier-moving" r="8"  fill="#FACC15" style={{animationDelay:'.05s'}}/>
                <circle className="courier-moving" r="3"  fill="#0F172A" style={{animationDelay:'.05s'}}/>
              </svg>

              {/* Pickup pin */}
              <div style={{position:'absolute', left:'12.5%', top:'74%', transform:'translate(-50%,-50%)'}}>
                <div style={{background:'#fff', color:'var(--navy)', padding:'6px 10px', borderRadius:99, fontSize:12, fontWeight:600, boxShadow:'0 8px 20px -8px rgba(0,0,0,.4)', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap'}}>
                  <span style={{width:8, height:8, borderRadius:99, background:'#16A34A'}}/>Pickup
                </div>
              </div>
              {/* Dropoff pin */}
              <div style={{position:'absolute', left:'87.5%', top:'30%', transform:'translate(-50%,-50%)'}}>
                <div style={{background:'var(--yellow)', color:'var(--navy)', padding:'6px 10px', borderRadius:99, fontSize:12, fontWeight:700, boxShadow:'0 8px 20px -8px rgba(250,204,21,.5)', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>
                  Dasan Baru
                </div>
              </div>
              {/* Courier HUD */}
              <div style={{position:'absolute', left:20, top:20, background:'rgba(15,23,42,.8)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:'14px 16px', color:'#fff', fontSize:12, display:'flex', alignItems:'center', gap:14}}>
                <span style={{width:40, height:40, borderRadius:99, background:'var(--yellow)', color:'var(--navy)', display:'grid', placeItems:'center', fontWeight:700, fontSize:14, flexShrink:0}}>A</span>
                <div>
                  <div style={{fontWeight:600, fontSize:14}}>Kurir Andi</div>
                  <div style={{color:'rgba(255,255,255,.6)', marginTop:2}}>★ 4.9 · DD–1234</div>
                </div>
                <div style={{height:28, width:1, background:'rgba(255,255,255,.1)'}}/>
                <div>
                  <div style={{color:'rgba(255,255,255,.55)', fontSize:11}}>ETA</div>
                  <div style={{fontWeight:700, fontSize:16, color:'#FACC15'}} className="mono">8 mnt</div>
                </div>
              </div>
              {/* Live tag */}
              <div style={{position:'absolute', right:20, bottom:20, background:'rgba(15,23,42,.8)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,.1)', borderRadius:99, padding:'8px 14px', color:'#fff', fontSize:12, display:'flex', alignItems:'center', gap:8}}>
                <span className="live-dot"/> Order #GG-2847 · LIVE
              </div>
            </div>

            {/* Timeline side */}
            <div style={{padding:32, color:'#fff', background:'var(--navy)'}}>
              <div className="chip chip-yellow" style={{marginBottom:20}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
                Status real-time
              </div>
              <div style={{fontSize:13, color:'rgba(255,255,255,.55)'}}>ORDER</div>
              <div className="mono" style={{fontSize:18, fontWeight:700, marginTop:4}}>GG-2847</div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:18, paddingBottom:18, borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                <div>
                  <div style={{fontSize:11, color:'rgba(255,255,255,.5)', letterSpacing:'.1em'}}>PICKUP</div>
                  <div style={{fontSize:14, fontWeight:500, marginTop:4}}>Giri Menang Sq.</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{alignSelf:'center'}} aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:11, color:'rgba(255,255,255,.5)', letterSpacing:'.1em'}}>DROPOFF</div>
                  <div style={{fontSize:14, fontWeight:500, marginTop:4}}>Dasan Baru</div>
                </div>
              </div>

              <div style={{marginTop:28}}>
                {[
                  { t:'14:02',  ev:'Order dibuat',                        status:'done' },
                  { t:'14:04',  ev:'Kurir Andi assigned · 1.2 km',        status:'done' },
                  { t:'14:09',  ev:'Pickup di Giri Menang Square',         status:'done' },
                  { t:'14:14',  ev:'Dalam perjalanan ke Dasan Baru',       status:'active' },
                  { t:'~14:22', ev:'ETA Selesai',                          status:'pending' },
                ].map((m, i, arr) => {
                  const isDone   = m.status === 'done'
                  const isActive = m.status === 'active'
                  const color = isDone ? '#22C55E' : isActive ? '#FACC15' : 'rgba(255,255,255,.25)'
                  return (
                    <div key={i} style={{display:'flex', gap:14, padding:'12px 0', position:'relative'}}>
                      {i < arr.length - 1 && (
                        <div style={{position:'absolute', left:9, top:28, bottom:-12, width:2, background: isDone ? 'rgba(34,197,94,.3)' : 'rgba(255,255,255,.08)'}}/>
                      )}
                      <div style={{position:'relative', flexShrink:0}}>
                        <div style={{width:20, height:20, borderRadius:99, background: isDone ? color : 'transparent', border:`2px solid ${color}`, display:'grid', placeItems:'center'}}>
                          {isDone   && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5"/></svg>}
                          {isActive && <span style={{width:8, height:8, borderRadius:99, background:color}}/>}
                        </div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13, color: isActive ? '#FACC15' : '#fff', fontWeight: isActive ? 600 : 500, lineHeight:1.4}}>{m.ev}</div>
                        <div className="mono" style={{fontSize:11, color:'rgba(255,255,255,.5)', marginTop:4}}>{m.t}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{display:'flex', gap:8, marginTop:24}}>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark btn-sm" style={{flex:1}}>
                  <WaIcon size={14}/> WA Kurir
                </a>
                <a href={`tel:+${WA_NUMBER}`} className="btn btn-ghost-dark btn-sm" style={{flex:1}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.7 19.79 19.79 0 0 1 1.61 5.08 2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Telpon
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TARIFF ═══════════════════════════════════════════════════════════ */}
      <section className="band-pale" id="tarif">
        <div className="lp-container">
          <div className="section-head">
            <div className="eyebrow"><span className="dot"/>Tarif</div>
            <h2>Tarif Ongkir</h2>
            <p className="lede">Harga transparan, tidak ada biaya tersembunyi.</p>
          </div>

          <div className="tariff-wrap">
            <div className="tariff-card">
              <div className="tariff-head">
                <span>Jarak</span>
                <span>Ongkir</span>
                <span>Keterangan</span>
              </div>
              <div className="tariff-row">
                <div className="range">0 – 2 km</div>
                <div className="price">Rp 5.000</div>
                <div className="note"><span className="area-dot" style={{background:'#2563EB'}}/>Gerung Kota</div>
              </div>
              <div className="tariff-row featured">
                <div className="range">2 – 5 km</div>
                <div className="price">
                  Rp 5.000<span className="plus">+</span><span className="extra">Rp 2.000/km</span>
                </div>
                <div className="note"><span className="area-dot"/>Gerung &amp; sekitar</div>
              </div>
              <div className="tariff-row">
                <div className="range">5 – 10 km</div>
                <div className="price">
                  Rp 5.000<span className="plus">+</span><span className="extra">Rp 2.000/km</span>
                </div>
                <div className="note"><span className="area-dot" style={{background:'#2563EB'}}/>Lombok Barat</div>
              </div>
            </div>
            <p className="tariff-note">
              Tarif bisa berubah untuk jenis paket berat. Konfirmasi harga dikirim otomatis sebelum order dikonfirmasi.
            </p>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════════════════ */}
      <section className="band-light">
        <div className="lp-container">
          <div className="section-head">
            <div className="eyebrow"><span className="dot"/>Suara Pelanggan</div>
            <h2>Dipercaya Warga Gerung</h2>
            <p className="lede">Ratusan order setiap minggu, dari warung kopi sampai kantor desa.</p>
          </div>

          <div className="testi-grid">
            {[
              { text:'Cepat banget! Kirim makanan dari warung saya sampai dalam 15 menit. Recommended!', name:'Ibu Sari',   area:'Gerung Kota', init:'S', alt:'' },
              { text:'Gampang banget, tinggal WhatsApp langsung ada kurir. Harga juga transparan.',     name:'Pak Hendra', area:'Giri Menang',  init:'H', alt:'alt-1' },
              { text:'Sudah pakai GiriGo tiap hari buat kirim dokumen kantor. Nggak pernah telat.',    name:'Bu Dewi',    area:'Dasan Baru',   init:'D', alt:'alt-2' },
            ].map(t => (
              <div key={t.name} className="testi">
                <span className="quote-mark">&ldquo;</span>
                <div className="stars">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                      <path d="M12 2l2.9 6.9 7.6.6-5.8 5 1.8 7.4L12 18l-6.5 3.9 1.8-7.4-5.8-5 7.6-.6L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p className="text">"{t.text}"</p>
                <div className="who">
                  <div className={`avatar ${t.alt}`}>{t.init}</div>
                  <div>
                    <div className="nm">{t.name}</div>
                    <div className="ar">{t.area}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div style={{
            marginTop:64, padding:'32px 40px',
            background:'linear-gradient(90deg,#F1F5FA 0%,#fff 50%,#F1F5FA 100%)',
            borderRadius:24, border:'1px solid var(--line)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            gap:32, flexWrap:'wrap',
          }}>
            <div style={{display:'flex', alignItems:'center', gap:14}}>
              <div style={{display:'flex'}}>
                {['M','R','S','A','N','B','I'].map((l,i) => (
                  <div key={l} style={{
                    width:36, height:36, borderRadius:99,
                    background:['#0F172A','#2563EB','#FACC15','#1E293B','#0F172A','#2563EB','#FACC15'][i],
                    color: i===2||i===6 ? '#0F172A' : '#fff',
                    border:'2px solid #fff', marginLeft: i===0 ? 0 : -10,
                    display:'grid', placeItems:'center', fontSize:13, fontWeight:700,
                  }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{fontSize:16, fontWeight:700, color:'var(--navy)'}}>500+ pelanggan</div>
                <div style={{fontSize:13, color:'var(--ink-2)'}}>dari Kecamatan Gerung mempercayai GiriGo</div>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} viewBox="0 0 24 24" width="20" height="20" fill="#FACC15" aria-hidden>
                  <path d="M12 2l2.9 6.9 7.6.6-5.8 5 1.8 7.4L12 18l-6.5 3.9 1.8-7.4-5.8-5 7.6-.6L12 2z"/>
                </svg>
              ))}
              <span style={{fontSize:16, fontWeight:700, color:'var(--navy)', marginLeft:6}}>4.9</span>
              <span style={{fontSize:13, color:'var(--ink-3)', marginLeft:4}}>/ 5.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA BAND ═════════════════════════════════════════════════════════ */}
      <section className="cta-band">
        <RouteGrid/>
        <div className="lp-container inner">
          <div className="scooter-glyph-wrap">
            <ScooterGlyph size={42} color="#0F172A"/>
          </div>

          <div className="chip chip-yellow" style={{marginTop:28}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
            Operasional 24 jam · Bot membalas instan
          </div>

          <h2>Siap Kirim <span className="accent">Sekarang?</span></h2>
          <p>Chat WhatsApp kami — bot kami siap 24 jam membantu proses order Anda.</p>

          <div className="ctas">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-yellow btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
              Mulai Chat WhatsApp
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
            <Link href="/tracking" className="btn btn-ghost-dark btn-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>
              Lacak Paket Saya
            </Link>
          </div>

          <div style={{marginTop:32, display:'flex', justifyContent:'center', gap:32, flexWrap:'wrap', fontSize:13, color:'rgba(255,255,255,.55)'}}>
            {['Tanpa aplikasi','Tanpa daftar','Mulai dari Rp 5.000'].map(item => (
              <span key={item} style={{display:'flex', alignItems:'center', gap:8}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="inner">
            {/* Brand */}
            <div>
              <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:18}}>
                <BrandMark size={36}/>
                <span style={{color:'#fff', fontWeight:700, fontSize:20}}>GiriGo</span>
              </div>
              <p style={{fontSize:14, lineHeight:1.6, margin:0, maxWidth:280}}>
                Kurir cepat berbasis WhatsApp. Lokal Gerung, Lombok Barat — antar dokumen, makanan, dan paket dalam menit.
              </p>
              <div style={{marginTop:20, display:'flex', alignItems:'center', gap:8, fontSize:12, color:'rgba(255,255,255,.4)'}}>
                <span className="live-dot"/> Beroperasi 24/7
              </div>
            </div>

            {/* Layanan */}
            <div>
              <h4>Layanan</h4>
              <ul>
                <li><a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{fontSize:14}}>Kirim Paket</a></li>
                <li><Link href="/tracking" style={{fontSize:14}}>Lacak Paket</Link></li>
                <li><a href="#tarif" style={{fontSize:14}}>Tarif Ongkir</a></li>
                <li><a href="#liputan" style={{fontSize:14}}>Area Liputan</a></li>
              </ul>
            </div>

            {/* Perusahaan */}
            <div>
              <h4>Perusahaan</h4>
              <ul>
                <li><a href="#" style={{fontSize:14}}>Tentang GiriGo</a></li>
                <li><a href="#" style={{fontSize:14}}>Untuk Bisnis</a></li>
                <li><Link href="/courier" style={{fontSize:14}}>Jadi Kurir</Link></li>
                <li><Link href="/admin" style={{fontSize:14}}>Portal Admin</Link></li>
              </ul>
            </div>

            {/* Kontak */}
            <div>
              <h4>Kontak</h4>
              <ul>
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{fontSize:14, display:'flex', alignItems:'center', gap:8}}>
                    <WaIcon size={14}/>+62 812-3456-7890
                  </a>
                </li>
                <li><a href="mailto:halo@girigo.id" style={{fontSize:14}}>halo@girigo.id</a></li>
                <li style={{fontSize:14, lineHeight:1.55}}>Giri Menang Square,<br/>Gerung, Lombok Barat</li>
              </ul>
            </div>
          </div>

          <div className="legal">
            <span>© 2025 GiriGo Courier. Semua hak dilindungi.</span>
            <div style={{display:'flex', gap:18}}>
              <a href="#">Kebijakan Privasi</a>
              <a href="#">Syarat &amp; Ketentuan</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
