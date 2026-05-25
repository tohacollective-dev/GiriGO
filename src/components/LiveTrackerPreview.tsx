'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const MILESTONES = [
  { t: '14:02',  ev: 'Order dibuat',                      status: 'done' },
  { t: '14:04',  ev: 'Kurir Andi assigned · 1.2 km',      status: 'done' },
  { t: '14:09',  ev: 'Pickup di Giri Menang Square',       status: 'done' },
  { t: '14:14',  ev: 'Dalam perjalanan ke Dasan Baru',     status: 'active' },
  { t: '~14:22', ev: 'ETA Selesai',                        status: 'pending' },
]

export default function LiveTrackerPreview() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf: number
    const start = performance.now()
    const loop = (t: number) => {
      const elapsed = (t - start) / 1000
      setProgress((Math.sin(elapsed / 4 - Math.PI / 2) + 1) / 2)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const pathX = 80 + progress * 480
  const pathY = 280 - Math.sin(progress * Math.PI) * 120
  const etaMins = Math.max(1, Math.round((1 - progress) * 12))

  return (
    <div className="tracker-frame">
      {/* Map side */}
      <div className="tracker-map">
        <svg viewBox="0 0 640 540" preserveAspectRatio="none" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
          <defs>
            <pattern id="trk-grid2" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="640" height="540" fill="url(#trk-grid2)"/>
          <path d="M 0 160 Q 120 120 240 200 T 640 220" stroke="rgba(255,255,255,.12)" strokeWidth="2" fill="none"/>
          <path d="M 0 380 Q 140 420 320 380 T 640 410" stroke="rgba(255,255,255,.10)" strokeWidth="2" fill="none"/>
          <path d="M 180 0 Q 200 220 240 320 T 280 540" stroke="rgba(255,255,255,.10)" strokeWidth="2" fill="none"/>
          <circle cx="240" cy="280" r="60" stroke="#FACC15" strokeOpacity=".55" strokeWidth="2" fill="rgba(250,204,21,.04)"/>
          <circle cx="240" cy="280" r="36" stroke="#2563EB" strokeOpacity=".4" strokeWidth="1.5" fill="none"/>
          <circle cx="240" cy="280" r="6" fill="#FACC15"/>
          <path d="M 80 400 Q 160 360 240 280 Q 320 200 400 220 Q 480 240 560 160"
            stroke="rgba(250,204,21,.25)" strokeWidth="3" fill="none"/>
          <path d="M 80 400 Q 160 360 240 280 Q 320 200 400 220 Q 480 240 560 160"
            stroke="#FACC15" strokeWidth="3" fill="none" strokeLinecap="round"
            strokeDasharray="600" strokeDashoffset={600 * (1 - progress)}
            style={{transition:'stroke-dashoffset 80ms linear'}}
          />
        </svg>

        {/* Animated courier dot */}
        <svg viewBox="0 0 640 540" preserveAspectRatio="none" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
          <circle cx={pathX} cy={pathY} r="14" fill="#FACC15" opacity=".3"/>
          <circle cx={pathX} cy={pathY} r="8"  fill="#FACC15"/>
          <circle cx={pathX} cy={pathY} r="3"  fill="#0F172A"/>
        </svg>

        {/* Pickup pin */}
        <div style={{position:'absolute',left:'12.5%',top:'74%',transform:'translate(-50%,-50%)'}}>
          <div style={{background:'#fff',color:'var(--navy)',padding:'6px 10px',borderRadius:99,fontSize:12,fontWeight:600,boxShadow:'0 8px 20px -8px rgba(0,0,0,.4)',display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}}>
            <span style={{width:8,height:8,borderRadius:99,background:'#16A34A'}}/>Pickup
          </div>
        </div>

        {/* Dropoff pin */}
        <div style={{position:'absolute',left:'87.5%',top:'30%',transform:'translate(-50%,-50%)'}}>
          <div style={{background:'var(--yellow)',color:'var(--navy)',padding:'6px 10px',borderRadius:99,fontSize:12,fontWeight:700,boxShadow:'0 8px 20px -8px rgba(250,204,21,.5)',display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}}>
            📍 Dasan Baru
          </div>
        </div>

        {/* Courier HUD */}
        <div style={{position:'absolute',left:20,top:20,background:'rgba(15,23,42,.85)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,.1)',borderRadius:14,padding:'14px 16px',color:'#fff',fontSize:12,display:'flex',alignItems:'center',gap:14}}>
          <span style={{width:40,height:40,borderRadius:99,background:'var(--yellow)',color:'var(--navy)',display:'grid',placeItems:'center',fontWeight:700,fontSize:14,flexShrink:0}}>A</span>
          <div>
            <div style={{fontWeight:600,fontSize:14}}>Kurir Andi</div>
            <div style={{color:'rgba(255,255,255,.6)',marginTop:2}}>★ 4.9 · DD–1234</div>
          </div>
          <div style={{height:28,width:1,background:'rgba(255,255,255,.1)'}}/>
          <div>
            <div style={{color:'rgba(255,255,255,.55)',fontSize:11}}>ETA</div>
            <div style={{fontWeight:700,fontSize:16,color:'#FACC15',fontVariantNumeric:'tabular-nums'}}>{etaMins} mnt</div>
          </div>
        </div>

        {/* Live badge */}
        <div style={{position:'absolute',right:20,bottom:20,background:'rgba(15,23,42,.85)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,.1)',borderRadius:99,padding:'8px 14px',color:'#fff',fontSize:12,display:'flex',alignItems:'center',gap:8}}>
          <span className="live-dot"/> Order #GG-2847 · LIVE
        </div>
      </div>

      {/* Timeline side */}
      <div className="tracker-side">
        <div className="od">ORDER</div>
        <div className="code">GG-2847</div>

        <div className="tracker-route-pair">
          <div className="col">
            <div className="k">PICKUP</div>
            <div className="v">Giri Menang Sq.</div>
          </div>
          <div className="arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </div>
          <div className="col" style={{textAlign:'right'}}>
            <div className="k">DROPOFF</div>
            <div className="v">Dasan Baru</div>
          </div>
        </div>

        <div className="tracker-timeline">
          {MILESTONES.map((m, i) => (
            <div key={i} className={`row ${m.status}`}>
              <div className="dot">
                {m.status === 'done' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5"/></svg>
                )}
              </div>
              <div>
                <div className="ev">{m.ev}</div>
                <div className="t mono">{m.t}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:8,marginTop:24}}>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
            className="btn btn-outline-light btn-sm" style={{flex:1,justifyContent:'center'}}>
            WA Kurir
          </a>
          <Link href="/tracking" className="btn btn-outline-light btn-sm" style={{flex:1,justifyContent:'center'}}>
            Detail
          </Link>
        </div>
      </div>
    </div>
  )
}
