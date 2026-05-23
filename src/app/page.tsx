import Link from 'next/link'
import { Package, Clock, MapPin, Shield, ChevronRight, Star } from 'lucide-react'

const WA_NUMBER  = '6281234567890'   // ← ganti dengan nomor WhatsApp GiriGo
const WA_MESSAGE = encodeURIComponent('Halo GiriGo! Saya ingin kirim paket.')
const WA_LINK    = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`

const FEATURES = [
  {
    icon: Clock,
    title: 'Cepat & Real-Time',
    desc:  'Kurir dijemput otomatis dalam hitungan menit. Track posisi langsung dari WhatsApp.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: MapPin,
    title: 'Lokal Gerung',
    desc:  'Kami beroperasi di seluruh Kecamatan Gerung — dari Giri Menang Square ke seluruh penjuru.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Package,
    title: 'Semua Jenis Paket',
    desc:  'Dokumen, makanan, paket kecil hingga besar. COD & Transfer tersedia.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Shield,
    title: 'Aman & Terpercaya',
    desc:  'Setiap kurir terverifikasi. Bukti pengiriman foto dikirim ke WhatsApp Anda.',
    color: 'bg-amber-50 text-amber-600',
  },
]

const STEPS = [
  { no: '1', title: 'Chat WhatsApp',   desc: 'Ketik "Halo" ke nomor GiriGo — bot kami langsung respons.' },
  { no: '2', title: 'Konfirmasi Harga', desc: 'Kami kirim estimasi jarak, ETA, dan ongkir. Setujui dengan 1 ketuk.' },
  { no: '3', title: 'Kurir Berangkat',  desc: 'Kurir terdekat langsung dijemput otomatis. Anda dapat link tracking.' },
  { no: '4', title: 'Terkirim!',        desc: 'Foto bukti pengiriman dikirim ke WhatsApp Anda secara otomatis.' },
]

const TARIFFS = [
  { range: '0 – 2 km',  price: 'Rp 5.000',  note: 'Area Gerung Kota' },
  { range: '2 – 5 km',  price: 'Rp 5.000 + Rp 2.000/km', note: 'Area Gerung & sekitar' },
  { range: '5 – 10 km', price: 'Rp 5.000 + Rp 2.000/km', note: 'Area Lombok Barat' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛵</span>
            <span className="font-bold text-brand-900 text-lg">GiriGo</span>
            <span className="hidden sm:inline text-xs text-gray-400 ml-1">Courier</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/tracking" className="text-sm text-gray-600 hover:text-brand-500 transition-colors">
              Lacak Paket
            </Link>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Kirim Sekarang
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-14 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-5 py-20 md:py-28 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs font-medium mb-5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Beroperasi di Kecamatan Gerung, Lombok Barat
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Kurir Cepat<br />Berbasis WhatsApp
            </h1>
            <p className="mt-4 text-white/80 text-lg leading-relaxed max-w-lg">
              Pesan antar-jemput paket hanya lewat WhatsApp.
              Tidak perlu aplikasi, tidak perlu daftar. Langsung kirim.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-base"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat WhatsApp Sekarang
              </a>
              <Link
                href="/tracking"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-base border border-white/20"
              >
                Lacak Paket
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -right-8 top-40 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20V60Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 max-w-5xl mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Kenapa Pilih GiriGo?</h2>
          <p className="text-gray-500 mt-2">Kurir lokal yang ngerti area Gerung, ditenagai teknologi modern.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Cara Pakai GiriGo</h2>
            <p className="text-gray-500 mt-2">4 langkah mudah, semua lewat WhatsApp.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.no} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] right-0 h-px bg-brand-100 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-14 h-14 bg-brand-500 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                    {s.no}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tariff table ── */}
      <section className="py-20 max-w-5xl mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Tarif Ongkir</h2>
          <p className="text-gray-500 mt-2">Harga transparan, tidak ada biaya tersembunyi.</p>
        </div>
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-brand-900 text-white px-6 py-4 grid grid-cols-3 text-sm font-semibold">
              <span>Jarak</span>
              <span>Ongkir</span>
              <span>Keterangan</span>
            </div>
            {TARIFFS.map((t, i) => (
              <div
                key={t.range}
                className={`px-6 py-4 grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <span className="font-medium text-gray-900">{t.range}</span>
                <span className="font-bold text-brand-500">{t.price}</span>
                <span className="text-gray-500">{t.note}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            Tarif bisa berubah untuk jenis paket berat. Konfirmasi harga dikirim otomatis sebelum order dikonfirmasi.
          </p>
        </div>
      </section>

      {/* ── Testimonials placeholder ── */}
      <section className="py-16 bg-brand-50">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Dipercaya Warga Gerung</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { name: 'Ibu Sari', area: 'Gerung Kota',    text: 'Cepat banget! Kirim makanan dari warung saya sampai dalam 15 menit. Recommended!' },
              { name: 'Pak Hendra', area: 'Giri Menang', text: 'Gampang banget, tinggal WhatsApp langsung ada kurir. Harga juga transparan.' },
              { name: 'Bu Dewi',  area: 'Dasan Baru',    text: 'Sudah pakai GiriGo tiap hari buat kirim dokumen kantor. Nggak pernah telat.' },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.area}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-r from-brand-900 to-brand-700 text-white text-center">
        <div className="max-w-xl mx-auto px-5">
          <p className="text-4xl mb-4">🛵</p>
          <h2 className="text-3xl font-bold mb-3">Siap Kirim Sekarang?</h2>
          <p className="text-white/70 mb-8">Chat WhatsApp kami — bot kami siap 24 jam membantu proses order Anda.</p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-2xl transition-colors text-base shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Mulai Chat WhatsApp
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-brand-900 text-white/60 py-8">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛵</span>
            <span className="font-semibold text-white">GiriGo Courier</span>
            <span className="hidden sm:inline">— Gerung, Lombok Barat</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/tracking" className="hover:text-white transition-colors">Lacak Paket</Link>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
          </div>
          <p className="text-xs">© 2025 GiriGo Courier</p>
        </div>
      </footer>

    </div>
  )
}
