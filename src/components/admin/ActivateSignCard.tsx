'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MonitorPlay, MonitorOff, Loader2, X, AlertTriangle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SignageState {
  active:     boolean
  updated_at: string | null
}

// ── Inline micro-toast — no ToastProvider dependency ─────────────────────────

interface MicroToast { id: number; type: 'success' | 'error'; msg: string }

function useMicroToast() {
  const [list, setList] = useState<MicroToast[]>([])
  const seq = useRef(0)

  const push = useCallback((type: 'success' | 'error', msg: string) => {
    const id = ++seq.current
    setList(t => [...t.slice(-1), { id, type, msg }])
    setTimeout(() => setList(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  return { list, push }
}

// ── Relative time helper ──────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return 'Belum pernah diubah'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return 'Baru saja'
  if (diff < 3600)  return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActivateSignCard() {
  const [state,       setState]       = useState<SignageState>({ active: false, updated_at: null })
  const [fetching,    setFetching]    = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { list: toasts, push: pushToast } = useMicroToast()

  // ── Fetch current state ────────────────────────────────────────────────────

  const fetchState = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/signage')
      if (!res.ok) throw new Error('Failed to fetch signage state')
      const json = await res.json()
      setState({ active: Boolean(json.active), updated_at: json.updated_at ?? null })
    } catch {
      // silently fall back to default false; dashboard still usable
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => { fetchState() }, [fetchState])

  // ── Save new state ─────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    setShowConfirm(false)
    setSaving(true)
    const next = !state.active
    try {
      const res  = await fetch('/api/admin/signage', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ active: next }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Gagal menyimpan')
      const json = await res.json()
      setState({ active: Boolean(json.active), updated_at: json.updated_at ?? null })
      pushToast('success', next ? 'Sign diaktifkan' : 'Sign dinonaktifkan')
    } catch (err: any) {
      pushToast('error', err?.message ?? 'Terjadi kesalahan, coba lagi')
    } finally {
      setSaving(false)
    }
  }

  // ── Derived visuals ────────────────────────────────────────────────────────

  const Icon      = state.active ? MonitorPlay : MonitorOff
  const nextLabel = state.active ? 'Nonaktifkan Sign' : 'Aktifkan Sign'
  const btnClass  = state.active
    ? 'text-xs font-semibold px-4 py-2 rounded-lg transition-colors bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-[0.97]'
    : 'text-xs font-semibold px-4 py-2 rounded-lg transition-colors bg-brand-500 text-white border border-brand-500 hover:bg-brand-600 active:scale-[0.97]'

  return (
    <>
      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex items-center gap-4 animate-fade-in">

        {/* Icon */}
        <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
          fetching          ? 'bg-gray-100' :
          state.active      ? 'bg-green-500' : 'bg-gray-200'
        }`}>
          {fetching
            ? <Loader2 size={18} className="text-gray-400 animate-spin" />
            : <Icon size={18} className={state.active ? 'text-white' : 'text-gray-500'} />
          }
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-700">Activate Sign</p>
            {!fetching && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                state.active
                  ? 'text-green-700 bg-green-50 border border-green-200'
                  : 'text-gray-500 bg-gray-50 border border-gray-200'
              }`}>
                {state.active ? '● Aktif' : '○ Nonaktif'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {fetching ? 'Memuat status...' : `Terakhir diubah: ${relativeTime(state.updated_at)}`}
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={fetching || saving}
          className={`${btnClass} shrink-0 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving
            ? <><Loader2 size={13} className="animate-spin" /><span>Menyimpan...</span></>
            : <span>{nextLabel}</span>
          }
        </button>
      </div>

      {/* ── Inline micro-toasts ────────────────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 bg-white rounded-xl shadow-toast border
            p-3.5 min-w-[240px] max-w-[320px] animate-slide-in pointer-events-auto text-sm font-semibold
            ${t.type === 'success' ? 'border-green-100 text-green-700' : 'border-red-100 text-red-600'}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── Confirmation modal ─────────────────────────────────────────────── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setShowConfirm(false) }}
        >
          <div className="bg-white rounded-2xl shadow-toast p-6 w-full max-w-sm mx-4 animate-slide-down">

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className={`p-2 rounded-xl shrink-0 ${state.active ? 'bg-red-50' : 'bg-brand-50'}`}>
                <AlertTriangle size={18} className={state.active ? 'text-red-500' : 'text-brand-500'} />
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors mt-0.5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <h3 className="text-base font-bold text-gray-900 mb-1">Konfirmasi Perubahan</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {state.active
                ? 'Anda akan menonaktifkan sign GiriGo. Tampilan operasional akan dimatikan.'
                : 'Anda akan mengaktifkan sign GiriGo. Tampilan operasional akan ditampilkan.'
              }
            </p>

            {/* Actions */}
            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors active:scale-[0.97] ${
                  state.active
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                }`}
              >
                {state.active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
