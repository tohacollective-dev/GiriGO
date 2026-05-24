import Link from 'next/link'

const WA_NUMBER  = '6281234567890'
const WA_MESSAGE = encodeURIComponent('Halo GiriGo! Saya ingin kirim paket.')
const WA_LINK    = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`

function WaIcon({ cls = 'w-5 h-5' }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

const MARQUEE_ITEMS = [
  '🛵 Kurir Terverifikasi',
  '📦 Semua Jenis Paket',
  '⚡ Respon < 60 Detik',
  '💳 COD & Transfer',
  '📸 Foto Bukti Kirim',
  '🗺️ Seluruh Area Gerung',
  '🤖 Bot 24 Jam',
  '⭐ Rating Kurir Transparan',
]

const STATS = [
  { num: '< 3', unit: 'mnt', label: 'Rata-rata respon\nkurir terdekat' },
  { num: '15',  unit: 'km',  label: 'Jangkauan area\noperasional' },
  { num: '24',  unit: '/7',  label: 'WhatsApp bot\nsiap melayani' },
  { num: '85',  unit: '%',   label: 'Bagian pendapatan\nlangsung ke kurir' },
]

const TESTIMONIALS = [
  {
    text: 'Cepat banget! Kirim makanan dari warung saya sampai dalam 15 menit. Harga juga transparan, langsung tahu ongkirnya sebelum konfirmasi.',
    name: 'Ibu Sari',
    area: 'Gerung Kota',
    init: 'S',
    cls: '',
  },
  {
    text: 'Gampang banget, tinggal WhatsApp langsung ada kurir. Nggak perlu install aplikasi tambahan. Cocok buat UMKM kayak saya.',
    name: 'Pak Hendra',
    area: 'Giri Menang',
    init: 'H',
    cls: 'alt-1',
  },
  {
    text: 'Sudah pakai GiriGo tiap hari buat kirim dokumen kantor. Foto bukti pengiriman selalu dikirim otomatis — nggak pernah ada complain.',
    name: 'Bu Dewi',
    area: 'Dasan Baru',
    init: 'D',
    cls: 'alt-2',
  },
]

export default function HomePage() {
  return (
    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-container">
          <div className="lp-nav-inner">
            <div className="lp-brand">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="brand-mark" aria-hidden>
                <rect width="36" height="36" rx="10" fill="#0F172A"/>
                <text x="18" y="25" textAnchor="middle" fontSize="20" fill="#FACC15">🛵</text>
              </svg>
              <span className="lp-brand-text">GiriGo</span>
              <span className="lp-brand-sub hidden sm:inline">Courier</span>
            </div>

            <nav className="lp-nav-links" aria-label="Primary">
              <Link href="/tracking" className="lp-nav-link">Lacak Paket</Link>
              <a href="#tarif" className="lp-nav-link">Tarif</a>
              <a href="#cara-pakai" className="lp-nav-link">Cara Pakai</a>
            </nav>

            <div className="lp-nav-actions">
              <Link href="/tracking" className="lp-btn lp-btn-ghost lp-btn-sm hidden sm:inline-flex">
                Lacak Paket
              </Link>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                className="lp-btn btn-wa lp-btn-sm">
                <WaIcon cls="w-4 h-4" />
                Kirim Sekarang
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Marquee ── */}
      <div className="lp-marquee" aria-hidden>
        <div className="track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i}>
              {item}
              <span className="sep">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="lp-hero">
        {/* Decorative route grid */}
        <div className="lp-hero-bg" aria-hidden>
          <svg width="100%" height="100%" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {/* Horizontal grid lines */}
            {[100, 200, 300, 400, 500].map(y => (
              <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            ))}
            {/* Vertical grid lines */}
            {[150, 300, 450, 600, 750, 900, 1050].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="600" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            ))}
            {/* Animated route path */}
            <path d="M 150 300 Q 400 100 600 250 T 1050 200"
              stroke="rgba(37,99,235,0.3)" strokeWidth="2" fill="none"
              strokeDasharray="8 6"
              style={{ animation: 'trailSweep 3s linear infinite' }}/>
            {/* Pulse dots */}
            {[{cx:150,cy:300},{cx:600,cy:250},{cx:1050,cy:200}].map((p,i) => (
              <g key={i}>
                <circle cx={p.cx} cy={p.cy} r="5" fill="rgba(250,204,21,0.8)"/>
                <circle cx={p.cx} cy={p.cy} r="5" fill="rgba(250,204,21,0.3)"
                  style={{ animation: `gridPulse 2.4s ${i * 0.8}s ease-out infinite` }}/>
              </g>
            ))}
          </svg>
        </div>

        <div className="lp-container">
          <div className="lp-hero-grid">
            {/* Left copy */}
            <div>
              <div className="chip chip-dark">
                <span className="live-dot" />
                Beroperasi di Kecamatan Gerung
              </div>

              <h1>
                Kurir Cepat<br />
                Berbasis <span className="accent">WhatsApp</span>
              </h1>

              <p className="lp-hero-lede">
                Pesan antar-jemput paket hanya lewat WhatsApp.
                Tidak perlu aplikasi, tidak perlu daftar. Langsung kirim dalam hitungan menit.
              </p>

              <div className="lp-hero-ctas">
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                  className="lp-btn btn-wa lp-btn-lg">
                  <WaIcon />
                  Chat WhatsApp Sekarang
                </a>
                <Link href="/tracking" className="lp-btn btn-ghost-dark lp-btn-lg">
                  Lacak Paket
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              </div>

              <div className="lp-hero-meta">
                {STATS.map(s => (
                  <div key={s.label}>
                    <div className="num">{s.num}<span className="unit">{s.unit}</span></div>
                    <div className="label" style={{ whiteSpace: 'pre-line' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: WhatsApp chat preview */}
            <div style={{ position: 'relative' }}>
              {/* Floating order chip top-left */}
              <div className="order-chip">
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div className="meta">
                  <div className="t">GG-250524-007</div>
                  <div className="s">Diterima · Giri Menang</div>
                </div>
              </div>

              {/* Chat frame */}
              <div className="chat-frame">
                <div className="chat-screen">
                  {/* Header */}
                  <div className="chat-header">
                    <div className="chat-avatar">
                      <span style={{ fontSize: 18 }}>🛵</span>
                    </div>
                    <div>
                      <div className="chat-name">GiriGo Courier</div>
                      <div className="chat-status">
                        <span className="live-dot" />
                        online
                      </div>
                    </div>
                    <div className="chat-actions">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.7 19.79 19.79 0 0 1 1.61 5.08 2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    </div>
                  </div>

                  {/* Chat body */}
                  <div className="chat-body">
                    <div className="chat-day">Hari ini</div>

                    <div className="bubble out">
                      Halo! Saya mau kirim paket 🛵
                      <span className="time">09:12</span>
                    </div>

                    <div className="bubble in" style={{ animationDelay: '.15s' }}>
                      <span className="b-title">🛵 Halo! Selamat datang di GiriGo.</span>{'\n\n'}
                      Silakan isi detail pengiriman:{'\n'}
                      • 📍 Lokasi jemput{'\n'}
                      • 📍 Tujuan pengiriman{'\n'}
                      • 📦 Jenis & berat barang{'\n'}
                      • 💳 COD atau Transfer?
                      <span className="time">09:12</span>
                    </div>

                    <div className="bubble out" style={{ animationDelay: '.3s' }}>
                      Jemput: Giri Menang Square{'\n'}
                      Tujuan: Dasan Baru, Gerung{'\n'}
                      Barang: Dokumen, ~500g{'\n'}
                      Bayar: Transfer
                      <span className="time">09:13</span>
                    </div>

                    <div className="bubble in" style={{ animationDelay: '.5s' }}>
                      <span className="b-title">✅ Konfirmasi Order</span>{'\n'}
                      <div className="b-row"><span className="k">Jarak</span><span className="v">3.2 km</span></div>
                      <div className="b-row"><span className="k">ETA</span><span className="v">~18 menit</span></div>
                      <div className="b-row"><span className="k">Ongkir</span><span className="v">Rp 7.400</span></div>
                      <div className="b-row"><span className="k">Bayar</span><span className="v">Transfer</span></div>
                      <div className="b-cta">
                        <span className="mini">✅ YA, KONFIRMASI</span>
                        <span className="mini" style={{ color: '#FF6B6B' }}>❌ BATALKAN</span>
                      </div>
                      <span className="time">09:13</span>
                    </div>

                    <div className="bubble out" style={{ animationDelay: '.7s' }}>
                      YA, KONFIRMASI
                      <span className="time">09:13</span>
                    </div>

                    <div className="bubble in" style={{ animationDelay: '.9s' }}>
                      <span className="typing"><span /><span /><span /></span>
                    </div>
                  </div>

                  {/* Input bar */}
                  <div className="chat-input">
                    <div className="pill">Tulis pesan...</div>
                    <div className="send">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating chip bottom-right */}
              <div className="order-chip bottom">
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="meta">
                  <div className="t">Terkirim!</div>
                  <div className="s">Foto bukti dikirim</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="band-dark">
        <div className="lp-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}
            className="stats-grid">
            {[
              { v: '< 3', u: 'mnt', k: 'Respon kurir' },
              { v: '15',  u: 'km',  k: 'Jangkauan area' },
              { v: '24',  u: '/7',  k: 'Bot aktif' },
              { v: '85',  u: '%',   k: 'Bagian ke kurir' },
            ].map(s => (
              <div key={s.k} style={{ textAlign: 'center', padding: '24px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-.03em', color: '#fff', lineHeight: 1 }}>
                  {s.v}<span style={{ fontSize: '16px', color: '#FACC15', fontWeight: 600, marginLeft: '3px' }}>{s.u}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features bento ── */}
      <section className="band-light" id="fitur">
        <div className="lp-container">
          <div className="section-head">
            <div className="eyebrow"><span className="dot" />Kenapa GiriGo</div>
            <h2>Dirancang untuk Warga Gerung</h2>
            <p className="lede">Teknologi kurir modern yang benar-benar ngerti kebutuhan lokal — tanpa ribet, tanpa aplikasi tambahan.</p>
          </div>

          <div className="bento">
            {/* Feat 1: Speed */}
            <div className="card feat-1">
              <span className="num-tag">01</span>
              <div className="ic" style={{ background: 'rgba(37,99,235,0.1)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <h3>Cepat & Real-Time</h3>
              <p>Kurir terdekat dijemput otomatis dalam hitungan detik. Tracking posisi langsung lewat WhatsApp — tidak ada aplikasi tambahan.</p>
              <div className="live-stat-row">
                <div className="live-stat">
                  <div className="v">2.4<span className="unit">mnt</span></div>
                  <div className="k">Avg. dispatch</div>
                </div>
                <div className="live-stat">
                  <div className="v">98<span className="unit">%</span></div>
                  <div className="k">On-time rate</div>
                </div>
                <div className="live-stat">
                  <div className="v">60<span className="unit">dtk</span></div>
                  <div className="k">Acceptance window</div>
                </div>
              </div>
              {/* Animated bars */}
              <div className="viz-pulses">
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
                <div className="bar" />
              </div>
            </div>

            {/* Feat 2: Coverage */}
            <div className="card feat-2 coverage-card">
              <span className="num-tag">02</span>
              <div className="copy">
                <div className="ic" style={{ background: 'rgba(250,204,21,0.12)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h3>Lokal Gerung</h3>
                <p>Beroperasi di seluruh Kecamatan Gerung — dari Giri Menang Square hingga pelosok desa sekitar.</p>
              </div>
              {/* Map thumbnail */}
              <div className="map-thumb">
                <svg width="100%" height="100%" viewBox="0 0 260 300" xmlns="http://www.w3.org/2000/svg">
                  {/* Road grid */}
                  <line x1="0" y1="150" x2="260" y2="150" stroke="rgba(37,99,235,0.2)" strokeWidth="2"/>
                  <line x1="0" y1="100" x2="260" y2="100" stroke="rgba(37,99,235,0.1)" strokeWidth="1"/>
                  <line x1="0" y1="200" x2="260" y2="200" stroke="rgba(37,99,235,0.1)" strokeWidth="1"/>
                  <line x1="130" y1="0" x2="130" y2="300" stroke="rgba(37,99,235,0.2)" strokeWidth="2"/>
                  <line x1="65" y1="0" x2="65" y2="300" stroke="rgba(37,99,235,0.1)" strokeWidth="1"/>
                  <line x1="195" y1="0" x2="195" y2="300" stroke="rgba(37,99,235,0.1)" strokeWidth="1"/>
                  {/* Coverage circle */}
                  <circle cx="130" cy="150" r="80" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.2)" strokeWidth="1" strokeDasharray="6 4"/>
                  {/* Pins */}
                  <circle cx="130" cy="150" r="8" fill="#2563EB"/>
                  <circle cx="130" cy="150" r="16" fill="rgba(37,99,235,0.2)"/>
                  <circle cx="80" cy="110" r="5" fill="#FACC15"/>
                  <circle cx="170" cy="130" r="5" fill="#FACC15"/>
                  <circle cx="100" cy="185" r="5" fill="#FACC15"/>
                  <circle cx="160" cy="185" r="5" fill="#22C55E"/>
                </svg>
              </div>
            </div>

            {/* Feat 3: All packages */}
            <div className="card feat-3">
              <span className="num-tag">03</span>
              <div className="ic" style={{ background: 'rgba(139,92,246,0.1)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <h3>Semua Jenis Paket</h3>
              <p>Dokumen, makanan, paket kecil hingga besar. Semua ditangani dengan hati-hati oleh kurir terverifikasi.</p>
            </div>

            {/* Feat 4: COD + Transfer */}
            <div className="card feat-4">
              <span className="num-tag">04</span>
              <div className="ic" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <h3>COD & Transfer</h3>
              <p>Bayar tunai saat paket tiba (COD) atau transfer bank sebelum pengiriman. Fleksibel sesuai kebutuhan pelanggan.</p>
            </div>

            {/* Feat 5: POD */}
            <div className="card feat-5">
              <span className="num-tag">05</span>
              <div className="ic" style={{ background: 'rgba(249,115,22,0.1)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <h3>Foto Bukti Kirim</h3>
              <p>Setiap pengiriman didokumentasikan. Foto bukti dikirim otomatis ke WhatsApp pengirim setelah paket diterima.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="band-pale" id="cara-pakai">
        <div className="lp-container">
          <div className="section-head">
            <div className="eyebrow"><span className="dot" />Cara Pakai</div>
            <h2>4 Langkah, Semua Lewat WhatsApp</h2>
            <p className="lede">Tidak perlu install apapun. Cukup buka WhatsApp yang sudah ada di HP Anda.</p>
          </div>

          <div className="timeline">
            <div className="timeline-line">
              <div className="dash" />
            </div>
            <div className="steps">
              {[
                { no: '1', nm: 'Chat WhatsApp', ds: 'Ketik "Halo" ke nomor GiriGo — bot kami merespons dalam detik, siap 24 jam.', state: 'done' },
                { no: '2', nm: 'Konfirmasi Harga', ds: 'Bot mengirim estimasi jarak, ETA, dan ongkir. Setujui dengan satu ketukan.', state: 'active' },
                { no: '3', nm: 'Kurir Berangkat', ds: 'Sistem dispatch otomatis menemukan kurir terdekat dan mengirim notifikasi tracking.', state: '' },
                { no: '4', nm: 'Terkirim!', ds: 'Foto bukti pengiriman dikirim ke WhatsApp pengirim secara otomatis.', state: '' },
              ].map(s => (
                <div key={s.no} className={`step ${s.state}`}>
                  <span className="idx mono">STEP_{s.no}</span>
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

      {/* ── Tariff ── */}
      <section className="band-light" id="tarif">
        <div className="lp-container">
          <div className="section-head">
            <div className="eyebrow"><span className="dot" />Tarif Ongkir</div>
            <h2>Harga Transparan, Tanpa Biaya Tersembunyi</h2>
            <p className="lede">Ongkir dikonfirmasi via WhatsApp sebelum order diproses. Anda selalu tahu harga sebelum setuju.</p>
          </div>

          <div className="tariff-wrap">
            <div className="tariff-card">
              <div className="tariff-head">
                <span>Jarak</span>
                <span>Ongkir</span>
                <span>Area</span>
              </div>

              <div className="tariff-row featured">
                <div className="range">0 – 2 km</div>
                <div className="price">Rp 5.000</div>
                <div className="note"><span className="area-dot" />Gerung Kota</div>
              </div>

              <div className="tariff-row">
                <div className="range">2 – 5 km</div>
                <div className="price">
                  Rp 5.000
                  <span className="plus">+</span>
                  <span className="extra">Rp 2.000/km</span>
                </div>
                <div className="note"><span className="area-dot" />Gerung & sekitar</div>
              </div>

              <div className="tariff-row">
                <div className="range">5 – 10 km</div>
                <div className="price">
                  Rp 5.000
                  <span className="plus">+</span>
                  <span className="extra">Rp 2.000/km</span>
                </div>
                <div className="note"><span className="area-dot" />Lombok Barat</div>
              </div>
            </div>

            <p className="tariff-note">
              Tarif paket berat atau oversize mungkin berbeda — harga final selalu dikonfirmasi via WhatsApp sebelum kurir berangkat.
              Nilai paket COD tidak termasuk dalam perhitungan ongkir.
            </p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="band-pale">
        <div className="lp-container">
          <div className="section-head">
            <div className="eyebrow"><span className="dot" />Testimoni</div>
            <h2>Dipercaya Warga Gerung</h2>
            <p className="lede">Dari warung makan hingga kantor pemerintah — GiriGo sudah menjadi kurir andalan Kecamatan Gerung.</p>
          </div>

          <div className="testi-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testi">
                <span className="quote-mark">&ldquo;</span>
                <div className="stars">
                  {[1,2,3,4,5].map(i => <StarIcon key={i} />)}
                </div>
                <p className="text">{t.text}</p>
                <div className="who">
                  <div className={`avatar ${t.cls}`}>{t.init}</div>
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

      {/* ── CTA band ── */}
      <section className="cta-band">
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '-200px', left: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(37,99,235,0.3), transparent 60%)', pointerEvents: 'none' }} aria-hidden />
        <div style={{ position: 'absolute', bottom: '-200px', right: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(250,204,21,0.15), transparent 60%)', pointerEvents: 'none' }} aria-hidden />

        <div className="lp-container">
          <div className="inner">
            <div className="scooter-glyph-wrap">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
            </div>

            <div className="chip chip-yellow" style={{ marginTop: '28px' }}>
              <span className="live-dot" />
              Bot aktif 24 jam, 7 hari seminggu
            </div>

            <h2>
              Siap Kirim<br />
              <span className="accent">Sekarang?</span>
            </h2>

            <p>Chat WhatsApp kami — bot cerdas kami siap memproses order Anda kapan saja, di mana saja. Tidak perlu aplikasi, tidak perlu daftar.</p>

            <div className="ctas">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                className="lp-btn btn-wa lp-btn-lg">
                <WaIcon />
                Mulai Chat WhatsApp
              </a>
              <Link href="/tracking" className="lp-btn btn-ghost-dark lp-btn-lg">
                Lacak Paket Saya
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="inner">
            {/* Brand column */}
            <div>
              <div className="brand-lock">
                <span className="scoot">🛵</span> GiriGo
              </div>
              <p style={{ fontSize: '14px', marginTop: '12px', lineHeight: 1.6, maxWidth: '220px' }}>
                Kurir hyperlokal berbasis WhatsApp untuk Kecamatan Gerung, Lombok Barat.
              </p>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                className="lp-btn btn-wa lp-btn-sm" style={{ marginTop: '20px', display: 'inline-flex' }}>
                <WaIcon cls="w-4 h-4" />
                Chat Sekarang
              </a>
            </div>

            {/* Layanan */}
            <div>
              <h4>Layanan</h4>
              <ul>
                <li><a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', transition: 'color .15s' }}>Kirim Paket</a></li>
                <li><Link href="/tracking" style={{ fontSize: '14px', transition: 'color .15s' }}>Lacak Paket</Link></li>
                <li><a href="#tarif" style={{ fontSize: '14px', transition: 'color .15s' }}>Tarif Ongkir</a></li>
                <li><a href="#cara-pakai" style={{ fontSize: '14px', transition: 'color .15s' }}>Cara Pakai</a></li>
              </ul>
            </div>

            {/* Area */}
            <div>
              <h4>Area Operasional</h4>
              <ul style={{ fontSize: '14px' }}>
                {['Gerung Kota', 'Giri Menang', 'Dasan Baru', 'Tempos', 'Sekotong Tengah'].map(a => (
                  <li key={a} style={{ fontSize: '14px' }}>{a}</li>
                ))}
              </ul>
            </div>

            {/* Mitra */}
            <div>
              <h4>Mitra</h4>
              <ul>
                <li><Link href="/courier" style={{ fontSize: '14px', transition: 'color .15s' }}>Daftar Jadi Kurir</Link></li>
                <li><Link href="/admin" style={{ fontSize: '14px', transition: 'color .15s' }}>Portal Admin</Link></li>
              </ul>
            </div>
          </div>

          <div className="legal">
            <span>© 2025 GiriGo Courier — Gerung, Lombok Barat</span>
            <span>Ditenagai teknologi lokal untuk warga lokal 🇮🇩</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
