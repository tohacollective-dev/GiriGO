'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Package, ArrowLeft } from 'lucide-react'

export default function TrackingSearchPage() {
  const router   = useRouter()
  const [code,   setCode]   = useState('')
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Masukkan kode order terlebih dahulu'); return }

    // Basic format check: GG-YYMMDD-NNN
    if (!/^GG-\d{6}-\d{3}$/.test(trimmed)) {
      setError('Format kode tidak valid. Contoh: GG-250523-001')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/tracking/${trimmed}`)
      if (!res.ok) {
        setError('Order tidak ditemukan. Periksa kembali kode Anda.')
        setLoading(false)
        return
      }
      router.push(`/tracking/${trimmed}`)
    } catch {
      setError('Gagal menghubungi server. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-brand-900 text-white px-5 pt-10 pb-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Kembali ke Beranda
        </Link>
        <h1 className="text-2xl font-bold">Lacak Paket</h1>
        <p className="text-white/60 text-sm mt-1">Masukkan kode order dari WhatsApp Anda</p>
      </div>

      {/* Card */}
      <div className="max-w-md w-full mx-auto px-5 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Kode Order
              </label>
              <div className="relative">
                <Package size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                  placeholder="Contoh: GG-250523-001"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-mono
                    focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                    placeholder:text-gray-300"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              {error && (
                <p className="text-xs text-red-500 mt-1.5">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Cari Order
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Kode order dikirim otomatis ke WhatsApp Anda saat order dikonfirmasi.<br />
              Format: <span className="font-mono font-medium text-gray-600">GG-YYMMDD-NNN</span>
            </p>
          </div>
        </div>

        {/* Recent orders hint */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-700 font-medium mb-1">💡 Tip</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            Link tracking langsung juga dikirim ke WhatsApp Anda. Cukup klik link tersebut untuk melihat status terbaru secara real-time.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-auto py-10 text-center">
        <p className="text-sm text-gray-400 mb-3">Belum punya order?</p>
        <a
          href={`https://wa.me/6281234567890?text=${encodeURIComponent('Halo GiriGo! Saya ingin kirim paket.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Pesan via WhatsApp
        </a>
      </div>
    </div>
  )
}
