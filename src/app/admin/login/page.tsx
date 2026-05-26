'use client'
import { Suspense, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import './login.css'
import { signIn, signInWithGoogle, resetPassword } from '@/lib/auth'

// ── Font preloads wired via global layout; bespoke CSS lives in login.css ──

interface ToastItem {
  id:      string
  title:   string
  msg:     string
  type:    'success' | 'error' | 'info'
  visible: boolean
}

function LoginInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [emailError,    setEmailError]    = useState(false)
  const [passError,     setPassError]     = useState(false)
  const [showPassword,  setShowPassword]  = useState(false)
  const [rememberMe,    setRememberMe]    = useState(false)
  const [twoFa,         setTwoFa]         = useState(false)
  const [submitting,    setSubmitting]    = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [pageLoading,   setPageLoading]   = useState(false)
  const [strength,      setStrength]      = useState(0)
  const [toasts,        setToasts]        = useState<ToastItem[]>([])

  // ── helpers ────────────────────────────────────────────────────────────────

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  }

  function calcStrength(val: string): number {
    let s = 0
    if (val.length >= 8)          s++
    if (/[A-Z]/.test(val))        s++
    if (/[0-9]/.test(val))        s++
    if (/[^A-Za-z0-9]/.test(val)) s++
    return s
  }

  const showToast = useCallback((title: string, msg: string, type: ToastItem['type'] = 'success') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, title, msg, type, visible: false }])
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: true } : t))
      })
    })
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 400)
    }, 4000)
  }, [])

  function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
    const btn  = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const el   = document.createElement('span')
    el.classList.add('ripple')
    el.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`
    btn.appendChild(el)
    setTimeout(() => el.remove(), 700)
  }

  // ── handlers ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let valid = true

    if (!email || !isValidEmail(email)) { setEmailError(true); valid = false }
    if (!password || password.length < 8) { setPassError(true); valid = false }
    if (!valid) {
      showToast('Login Gagal', 'Periksa kembali email dan kata sandi Anda.', 'error')
      return
    }

    setSubmitting(true)
    setPageLoading(true)

    try {
      await signIn(email, password)
      setSubmitSuccess(true)
      showToast('Berhasil Masuk', 'Selamat datang kembali di GiriGo Admin.', 'success')
      const next = searchParams.get('next') ?? '/admin'
      setTimeout(() => {
        setPageLoading(false)
        router.push(next)
        router.refresh()
      }, 800)
    } catch (err: unknown) {
      setPageLoading(false)
      setSubmitting(false)

      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        showToast('Login Gagal', 'Email atau kata sandi tidak ditemukan.', 'error')
      } else if (msg.includes('Email not confirmed')) {
        showToast('Email Belum Dikonfirmasi', 'Cek inbox Anda dan konfirmasi email terlebih dahulu.', 'error')
      } else if (msg.includes('Too many requests')) {
        showToast('Terlalu Banyak Percobaan', 'Tunggu beberapa menit sebelum mencoba lagi.', 'error')
      } else {
        showToast('Terjadi Kesalahan', 'Gagal menghubungi server. Coba lagi.', 'error')
      }
    }
  }

  async function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault()
    if (!email || !isValidEmail(email)) {
      setEmailError(true)
      showToast('Email Diperlukan', 'Masukkan email Anda di atas terlebih dahulu.', 'error')
      return
    }
    try {
      await resetPassword(email)
      showToast('Reset Password', 'Link reset telah dikirim ke email Anda.', 'success')
    } catch {
      showToast('Gagal', 'Tidak dapat mengirim email reset. Coba lagi.', 'error')
    }
  }

  async function handleGoogleSignIn(e: React.MouseEvent) {
    e.preventDefault()
    try {
      setPageLoading(true)
      showToast('Google SSO', 'Menghubungkan ke akun Google...', 'info')
      await signInWithGoogle()
    } catch {
      setPageLoading(false)
      showToast('Gagal', 'Tidak dapat terhubung ke Google.', 'error')
    }
  }

  // ── strength bar colors ────────────────────────────────────────────────────
  const strengthColors = ['#DC3545', '#FFC107', '#25D366', '#128C7E']

  // ── toast icon paths ───────────────────────────────────────────────────────
  function toastIconPath(type: ToastItem['type'], color: string) {
    if (type === 'success')
      return <><circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.3"/><path d="M4.5 7L6.5 9L9.5 5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></>
    return <><circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.3"/><path d="M7 4.5V7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="9.5" r="0.8" fill={color}/></>
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="signin-page">
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* ── Toast Container ───────────────────────────────────────────────── */}
      <div className="toast-container">
        {toasts.map(t => {
          const color = t.type === 'error' ? '#DC3545' : t.type === 'success' ? '#25D366' : '#6C757D'
          return (
            <div
              key={t.id}
              className={`toast${t.visible ? ' show' : ''}${t.type === 'error' ? ' error' : ''}`}
              style={{ borderLeftColor: color }}
            >
              <svg className="toast-icon" viewBox="0 0 14 14" fill="none">
                {toastIconPath(t.type, color)}
              </svg>
              <div className="toast-body">
                <div className="toast-title">{t.title}</div>
                <div className="toast-msg">{t.msg}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Loading Overlay ───────────────────────────────────────────────── */}
      <div className={`auth-loading-overlay${pageLoading ? ' active' : ''}`}>
        <div className="loading-spinner" />
        <div className="loading-text">Memverifikasi akun...</div>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div className="signin-layout">

        {/* ═════ LEFT: BRAND STORYTELLING PANEL ═════ */}
        <div className="brand-panel">

          {/* Supergraphic SVG Canvas */}
          <div className="supergraphic-canvas">
            <svg viewBox="0 0 560 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="150" x2="560" y2="150" className="route-line" style={{strokeDasharray:'600',animationDelay:'0.2s'}}/>
              <line x1="0" y1="300" x2="560" y2="300" className="route-line" style={{strokeDasharray:'600',animationDelay:'0.5s'}}/>
              <line x1="0" y1="450" x2="560" y2="450" className="route-line" style={{strokeDasharray:'600',animationDelay:'0.8s'}}/>
              <line x1="0" y1="600" x2="560" y2="600" className="route-line" style={{strokeDasharray:'600',animationDelay:'1.1s'}}/>
              <line x1="0" y1="750" x2="560" y2="750" className="route-line" style={{strokeDasharray:'600',animationDelay:'1.4s'}}/>
              <line x1="100" y1="0" x2="100" y2="900" className="route-line" style={{strokeDasharray:'900',animationDelay:'0.3s'}}/>
              <line x1="240" y1="0" x2="240" y2="900" className="route-line" style={{strokeDasharray:'900',animationDelay:'0.6s'}}/>
              <line x1="380" y1="0" x2="380" y2="900" className="route-line" style={{strokeDasharray:'900',animationDelay:'0.9s'}}/>
              <line x1="500" y1="0" x2="500" y2="900" className="route-line" style={{strokeDasharray:'900',animationDelay:'1.2s'}}/>
              <path d="M100 300 Q240 150 380 300 Q500 450 380 600 Q240 750 100 600 Q0 450 100 300Z"
                fill="none" stroke="#25D366" strokeWidth="0.8" opacity="0.07"
                strokeDasharray="1200" strokeDashoffset="1200"
                style={{animation:'routeLineAnim 3s ease 0.5s forwards'}}/>
              <circle className="delivery-dot" r="3" opacity="0.85">
                <animateMotion dur="4s" repeatCount="indefinite" begin="0s">
                  <mpath href="#route-h1"/>
                </animateMotion>
              </circle>
              <circle className="delivery-dot" r="2.5" opacity="0.6">
                <animateMotion dur="6s" repeatCount="indefinite" begin="2s">
                  <mpath href="#route-h2"/>
                </animateMotion>
              </circle>
              <circle className="delivery-dot" r="2" opacity="0.5">
                <animateMotion dur="5s" repeatCount="indefinite" begin="1s">
                  <mpath href="#route-v1"/>
                </animateMotion>
              </circle>
              <circle className="delivery-dot" r="2" opacity="0.4">
                <animateMotion dur="7s" repeatCount="indefinite" begin="3.5s">
                  <mpath href="#route-v2"/>
                </animateMotion>
              </circle>
              <defs>
                <path id="route-h1" d="M0 300 L560 300"/>
                <path id="route-h2" d="M560 450 L0 450"/>
                <path id="route-v1" d="M240 0 L240 900"/>
                <path id="route-v2" d="M380 900 L380 0"/>
              </defs>
              <circle cx="100" cy="300" r="4" className="node-ring" style={{animationDelay:'0.5s'}}/>
              <circle cx="100" cy="300" r="3" className="node-core" opacity="0.5"/>
              <circle cx="240" cy="300" r="4" className="node-ring" style={{animationDelay:'1s'}}/>
              <circle cx="240" cy="300" r="3" className="node-core" opacity="0.7"/>
              <circle cx="380" cy="300" r="4" className="node-ring" style={{animationDelay:'1.5s'}}/>
              <circle cx="380" cy="300" r="3" className="node-core" opacity="0.5"/>
              <circle cx="240" cy="450" r="6" className="node-ring" style={{animationDelay:'0.8s'}}/>
              <circle cx="240" cy="450" r="4" className="node-core" opacity="0.9"/>
              <circle cx="100" cy="450" r="4" className="node-ring" style={{animationDelay:'2s'}}/>
              <circle cx="100" cy="450" r="2.5" className="node-core" opacity="0.5"/>
              <circle cx="380" cy="600" r="4" className="node-ring" style={{animationDelay:'1.2s'}}/>
              <circle cx="380" cy="600" r="3" className="node-core" opacity="0.5"/>
              <line x1="420" y1="80" x2="490" y2="80" stroke="#25D366" strokeWidth="1.5" opacity="0.25"/>
              <line x1="430" y1="88" x2="480" y2="88" stroke="#25D366" strokeWidth="1" opacity="0.15"/>
              <line x1="440" y1="96" x2="475" y2="96" stroke="#25D366" strokeWidth="0.7" opacity="0.10"/>
              <line x1="60" y1="820" x2="120" y2="820" stroke="#25D366" strokeWidth="1.5" opacity="0.20"/>
              <line x1="70" y1="828" x2="110" y2="828" stroke="#25D366" strokeWidth="1" opacity="0.12"/>
            </svg>
          </div>

          {/* Brand Header */}
          <div className="brand-header">
            <div className="girigogo-logo">
              <div className="logo-mark">
                <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 4 C8.03 4 4 8.03 4 13 C4 17.97 8.03 22 13 22 C17.97 22 22 17.97 22 13 L13 13 L13 16 L18.5 16 C17.5 18.5 15.4 20 13 20 C9.13 20 6 16.87 6 13 C6 9.13 9.13 6 13 6 C15.1 6 17.0 6.9 18.4 8.3 L19.8 6.9 C18.0 5.1 15.6 4 13 4Z" fill="#111111"/>
                  <path d="M20 10 L23 13 L20 16" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div className="logo-wordmark">
                <div className="logo-name">Giri<span>Go</span></div>
                <div className="logo-tagline-sub">Admin Portal · v2.4</div>
              </div>
            </div>
          </div>

          {/* Brand Center */}
          <div className="brand-center">
            <div className="live-badge">
              <div className="live-dot" />
              Sistem Aktif · Gerung, Lombok Barat
            </div>

            <div className="route-orbit">
              <svg className="orbit-svg" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="140" cy="140" r="128" className="orbit-ring-outer" strokeDasharray="8 5"/>
                <circle cx="140" cy="140" r="100" className="orbit-ring-mid" strokeDasharray="4 8"/>
                <circle cx="140" cy="140" r="72" className="orbit-ring-inner"/>
                <line x1="140" y1="68" x2="140" y2="40" stroke="#25D366" strokeWidth="0.8" opacity="0.3"/>
                <line x1="140" y1="212" x2="140" y2="240" stroke="#25D366" strokeWidth="0.8" opacity="0.3"/>
                <line x1="68" y1="140" x2="40" y2="140" stroke="#25D366" strokeWidth="0.8" opacity="0.3"/>
                <line x1="212" y1="140" x2="240" y2="140" stroke="#25D366" strokeWidth="0.8" opacity="0.3"/>
                <circle cx="140" cy="140" r="30" className="orbit-hub"/>
                <circle cx="140" cy="140" r="18" className="orbit-hub-core"/>
                <text x="140" y="138" className="orbit-hub-label">GIRI</text>
                <text x="140" y="148" className="orbit-hub-label">MENANG</text>
                <g style={{animation:'orbitCourier 9s linear infinite',transformOrigin:'140px 140px',['--start-angle' as string]:'0deg'}}>
                  <circle cx="140" cy="12" r="6" className="courier-node-dot"/>
                  <text x="140" y="30" className="courier-node-label">🛵</text>
                </g>
                <g style={{animation:'orbitCourier 9s linear infinite',transformOrigin:'140px 140px',['--start-angle' as string]:'120deg'}}>
                  <circle cx="140" cy="12" r="5" className="courier-node-dot" opacity="0.7"/>
                  <text x="140" y="30" className="courier-node-label">📦</text>
                </g>
                <g style={{animation:'orbitCourier 9s linear infinite',transformOrigin:'140px 140px',['--start-angle' as string]:'240deg'}}>
                  <circle cx="140" cy="12" r="4" className="courier-node-dot" opacity="0.5"/>
                  <text x="140" y="30" className="courier-node-label">📍</text>
                </g>
                <g style={{animation:'orbitCourier 5s linear infinite reverse',transformOrigin:'140px 140px',['--start-angle' as string]:'60deg'}}>
                  <circle cx="140" cy="68" r="4" fill="#128C7E" opacity="0.8"/>
                </g>
                <g style={{animation:'orbitCourier 5s linear infinite reverse',transformOrigin:'140px 140px',['--start-angle' as string]:'180deg'}}>
                  <circle cx="140" cy="68" r="3" fill="#128C7E" opacity="0.6"/>
                </g>
                <g style={{animation:'orbitCourier 5s linear infinite reverse',transformOrigin:'140px 140px',['--start-angle' as string]:'300deg'}}>
                  <circle cx="140" cy="68" r="3.5" fill="#128C7E" opacity="0.7"/>
                </g>
              </svg>
            </div>

            <div className="brand-tagline">
              Pahlawan Lokal<br/>
              <em>Warga Giri Menang</em>
            </div>
            <div className="brand-supporting">
              Menghubungkan perjalanan, membantu komunitas, dan menggerakkan kebutuhan warga setiap hari.
            </div>
          </div>

          {/* Live Stats Footer */}
          <div className="live-stats">
            <div className="stat-item">
              <div className="stat-number">12<em>aktif</em></div>
              <div className="stat-label">§ Kurir Online</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-number">847</div>
              <div className="stat-label">§ Order Selesai</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-number">98<em>%</em></div>
              <div className="stat-label">§ On-Time Rate</div>
            </div>
          </div>
        </div>

        {/* ═════ RIGHT: AUTHENTICATION PANEL ═════ */}
        <div className="auth-panel">
          <div className="auth-inner">

            <div className="section-index"><span>§ 01</span> · Admin Authentication</div>
            <h1 className="auth-title">Masuk ke Admin Portal</h1>
            <p className="auth-subtitle">Kelola operasional GiriGo dengan cepat dan aman</p>

            {/* Security Indicator Bar */}
            <div className="security-bar">
              <div className="security-item">
                <div className="security-dot" />
                Koneksi Terenkripsi
              </div>
              <div className="security-divider" />
              <div className="security-item">
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L2 3.5V7C2 9.76 4.24 12.35 7 13C9.76 12.35 12 9.76 12 7V3.5L7 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M5 7L6.5 8.5L9 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                SSL · 256-bit
              </div>
              <div className="security-divider" />
              <div className="security-item">
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M7 4.5V7L8.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Aman · Terverifikasi
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Email Field */}
              <div className={`form-group${emailError ? ' has-error' : ''}`}>
                <label className="form-label" htmlFor="email">Alamat Email</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="4" width="16" height="12" rx="2" strokeLinecap="round"/>
                    <path d="M2 7L10 12L18 7" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="admin@girigocourier.id"
                    autoComplete="email"
                    spellCheck={false}
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(false) }}
                    onBlur={() => {
                      if (email && !isValidEmail(email)) setEmailError(true)
                    }}
                  />
                </div>
                <div className="error-msg">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="#DC3545" strokeWidth="1.3"/>
                    <path d="M7 4.5V7.5" stroke="#DC3545" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="7" cy="9.5" r="0.8" fill="#DC3545"/>
                  </svg>
                  Format email tidak valid
                </div>
              </div>

              {/* Password Field */}
              <div className={`form-group${passError ? ' has-error' : ''}`}>
                <label className="form-label" htmlFor="password">Kata Sandi</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="4" y="9" width="12" height="9" rx="2" strokeLinecap="round"/>
                    <path d="M7 9V6a3 3 0 016 0v3" strokeLinecap="round"/>
                    <circle cx="10" cy="13.5" r="1.2" fill="currentColor"/>
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-input"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      setPassError(false)
                      setStrength(calcStrength(e.target.value))
                    }}
                    onBlur={() => {
                      if (password && password.length < 8) setPassError(true)
                    }}
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {!showPassword ? (
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:17,height:17}}>
                        <path d="M1 10S4 4 10 4s9 6 9 6-3 6-9 6-9-6-9-6z" strokeLinecap="round"/>
                        <circle cx="10" cy="10" r="2.5"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:17,height:17}}>
                        <path d="M3 3l14 14M8.4 8.5a2.5 2.5 0 003.5 3.5M5 5.5C3.3 6.9 2 8.7 1 10c0 0 3 6 9 6a9.3 9.3 0 004.5-1.2M15 14.5c1.4-1.4 2.5-3 3-4.5 0 0-3-6-9-6a9.3 9.3 0 00-2.7.4" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password strength bars */}
                <div className="password-strength">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`strength-bar${i <= strength ? ' active' : ''}`}
                      style={i <= strength ? { background: strengthColors[strength - 1] } : {}}
                    />
                  ))}
                </div>

                <div className="error-msg">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="#DC3545" strokeWidth="1.3"/>
                    <path d="M7 4.5V7.5" stroke="#DC3545" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="7" cy="9.5" r="0.8" fill="#DC3545"/>
                  </svg>
                  Kata sandi minimal 8 karakter
                </div>
              </div>

              {/* Options Row */}
              <div className="options-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <div className="checkbox-custom">
                    <svg viewBox="0 0 12 10" fill="none">
                      <path d="M1.5 5L4.5 8L10.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  Ingat saya
                </label>
                <a href="#" className="forgot-link" onClick={handleForgotPassword}>Lupa password?</a>
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                className={`btn-primary${submitting ? ' loading' : ''}${submitSuccess ? ' success' : ''}`}
                onClick={addRipple}
                disabled={submitting || submitSuccess}
              >
                <span className="btn-default-inner" style={{display:'flex',alignItems:'center',gap:8}}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 10H17M12 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Masuk
                </span>
                <span className="btn-success-inner">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2">
                    <path d="M4 10L8.5 14.5L16 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Berhasil Masuk!
                </span>
              </button>

              {/* Divider */}
              <div className="divider">
                <div className="divider-line" />
                <span className="divider-text">atau</span>
                <div className="divider-line" />
              </div>

              {/* Google SSO */}
              <a href="#" className="btn-google" onClick={handleGoogleSignIn}>
                <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Masuk dengan Google
              </a>

            </form>

            {/* 2FA Option */}
            <div className="twofa-row">
              <div className="twofa-left">
                <div className="twofa-icon">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="11" width="14" height="8" rx="2"/>
                    <path d="M7 11V7a3 3 0 016 0v4"/>
                    <circle cx="10" cy="15" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <div className="twofa-text">
                  <h4>Autentikasi Dua Faktor</h4>
                  <p>Verifikasi via SMS · Lebih aman</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={twoFa}
                  onChange={e => {
                    setTwoFa(e.target.checked)
                    showToast(
                      e.target.checked ? '2FA Diaktifkan' : '2FA Dinonaktifkan',
                      e.target.checked ? 'Verifikasi SMS akan diminta saat login.' : 'Login hanya menggunakan password.',
                      e.target.checked ? 'success' : 'info',
                    )
                  }}
                />
                <div className="toggle-track" />
                <div className="toggle-thumb" />
              </label>
            </div>

            {/* Last Login */}
            <div className="last-login">
              <div className="last-login-dot" />
              Sistem aman · Supabase Auth · TLS 1.3
            </div>

          </div>

          {/* Auth Footer */}
          <div className="auth-footer">
            © 2026 GiriGo Courier · <a href="#">Kebijakan Privasi</a> · <a href="#">Syarat Layanan</a> · <a href="#">Bantuan</a>
          </div>
        </div>

      </div>
    </div>
  )
}

// Suspense boundary required for useSearchParams in App Router
export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}

const strengthColors = ['#DC3545', '#FFC107', '#25D366', '#128C7E']
