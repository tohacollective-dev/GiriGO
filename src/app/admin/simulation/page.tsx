'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Play, RotateCcw, CheckCircle, Circle, Loader2,
  ExternalLink, Package, Truck, MapPin, User, DollarSign
} from 'lucide-react'
import { formatIDR } from '@/lib/pricing'

// ── Types ─────────────────────────────────────────────────────────────────────
type StepStatus = 'idle' | 'running' | 'done' | 'error'

interface SimStep {
  id:     string
  label:  string
  desc:   string
  icon:   React.ElementType
  status: StepStatus
  result: string | null
}

interface SimState {
  courier_id:   string | null
  order_id:     string | null
  order_code:   string | null
  delivery_fee: number | null
  distance_km:  number | null
}

// ── Step definitions ──────────────────────────────────────────────────────────
const INITIAL_STEPS: SimStep[] = [
  {
    id:     'setup_courier',
    label:  '1. Siapkan Kurir',
    desc:   'Buat kurir simulasi (online, GPS di Giri Menang Square)',
    icon:   Truck,
    status: 'idle',
    result: null,
  },
  {
    id:     'create_order',
    label:  '2. Buat Order',
    desc:   'Customer simulasi pesan antar Jl. Sriwijaya → Karang Bongkot (~1.8 km)',
    icon:   Package,
    status: 'idle',
    result: null,
  },
  {
    id:     'accept_order',
    label:  '3. Kurir Terima',
    desc:   'Kurir menerima tawaran dispatch — status: ASSIGNED',
    icon:   User,
    status: 'idle',
    result: null,
  },
  {
    id:     'pickup_order',
    label:  '4. Barang Dijemput',
    desc:   'Kurir konfirmasi pickup di lokasi — status: PICKED_UP',
    icon:   MapPin,
    status: 'idle',
    result: null,
  },
  {
    id:     'deliver_order',
    label:  '5. Terkirim!',
    desc:   'Kurir tandai terkirim — ledger 85/15 dibuat otomatis',
    icon:   CheckCircle,
    status: 'idle',
    result: null,
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function SimulationPage() {
  const [steps,       setSteps]       = useState<SimStep[]>(INITIAL_STEPS)
  const [simState,    setSimState]    = useState<SimState>({
    courier_id: null, order_id: null, order_code: null,
    delivery_fee: null, distance_km: null,
  })
  const [running,     setRunning]     = useState(false)
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [autoPlay,    setAutoPlay]    = useState(false)
  const [log,         setLog]         = useState<{ time: string; msg: string; type: 'info' | 'success' | 'error' }[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  function addLog(msg: string, type: 'info' | 'success' | 'error' = 'info') {
    const time = new Date().toLocaleTimeString('id-ID')
    setLog(prev => {
      const next = [...prev, { time, msg, type }]
      setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50)
      return next
    })
  }

  function setStepStatus(id: string, status: StepStatus, result: string | null = null) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, result } : s))
  }

  async function runStep(stepId: string, currentSimState: SimState): Promise<SimState> {
    setStepStatus(stepId, 'running')
    addLog(`⏳ Menjalankan: ${INITIAL_STEPS.find(s => s.id === stepId)?.label}`)

    const body: Record<string, unknown> = {
      action:     stepId,
      order_id:   currentSimState.order_id,
      courier_id: currentSimState.courier_id,
    }

    const res  = await fetch('/api/simulate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      setStepStatus(stepId, 'error', data.error ?? 'Unknown error')
      addLog(`❌ Error: ${data.error}`, 'error')
      throw new Error(data.error)
    }

    setStepStatus(stepId, 'done', data.message)
    addLog(`✅ ${data.message}`, 'success')

    // Merge new IDs into sim state
    const next: SimState = { ...currentSimState }
    if (data.courier_id)  next.courier_id   = data.courier_id
    if (data.order_id)    next.order_id     = data.order_id
    if (data.order_code)  next.order_code   = data.order_code
    if (data.pricing)     next.delivery_fee = data.pricing.delivery_fee
    if (data.distance_km) next.distance_km  = data.distance_km

    return next
  }

  async function runNextStep() {
    const nextIdx = steps.findIndex(s => s.status === 'idle')
    if (nextIdx === -1) { addLog('Semua langkah selesai!', 'success'); return }

    setRunning(true)
    setCurrentStep(nextIdx)
    try {
      const updated = await runStep(steps[nextIdx].id, simState)
      setSimState(updated)
    } catch {
      // error already shown in log
    } finally {
      setRunning(false)
      setCurrentStep(-1)
    }
  }

  async function runAll() {
    setAutoPlay(true)
    setRunning(true)
    let state = simState
    for (const step of steps) {
      if (step.status !== 'idle') continue
      setCurrentStep(steps.indexOf(step))
      try {
        state = await runStep(step.id, state)
        setSimState(state)
        await delay(800)  // small pause so user can see each step
      } catch {
        break
      }
    }
    setRunning(false)
    setCurrentStep(-1)
    setAutoPlay(false)
  }

  async function cleanup() {
    setRunning(true)
    addLog('🧹 Membersihkan data simulasi...')
    try {
      const res  = await fetch('/api/simulate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'cleanup' }),
      })
      const data = await res.json()
      addLog(data.message ?? 'Cleanup selesai', 'success')
    } catch {
      addLog('Cleanup gagal', 'error')
    }
    setSteps(INITIAL_STEPS.map(s => ({ ...s })))
    setSimState({ courier_id: null, order_id: null, order_code: null, delivery_fee: null, distance_km: null })
    setLog([])
    setRunning(false)
  }

  const allDone    = steps.every(s => s.status === 'done')
  const hasStarted = steps.some(s => s.status !== 'idle')
  const nextIdle   = steps.findIndex(s => s.status === 'idle')

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Simulation</h2>
          <p className="text-sm text-gray-500 mt-1">
            Jalankan simulasi full-flow dari order masuk hingga terkirim — tanpa WhatsApp atau kurir nyata.
          </p>
        </div>
        <div className="flex gap-2">
          {hasStarted && (
            <button
              onClick={cleanup}
              disabled={running}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          )}
          {!allDone && (
            <>
              <button
                onClick={runNextStep}
                disabled={running || nextIdle === -1}
                className="btn-ghost flex items-center gap-2 text-sm border border-gray-200"
              >
                {running && !autoPlay
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Play size={15} />
                }
                Step Berikutnya
              </button>
              <button
                onClick={runAll}
                disabled={running}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {running && autoPlay
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Play size={15} />
                }
                Jalankan Semua
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Left: Steps ── */}
        <div className="lg:col-span-3 space-y-3">
          {steps.map((step, i) => {
            const Icon    = step.icon
            const isNext  = nextIdle === i && !running
            const isCurr  = currentStep === i
            return (
              <div
                key={step.id}
                className={`rounded-xl border-2 p-4 transition-all ${
                  step.status === 'done'    ? 'border-green-200 bg-green-50' :
                  step.status === 'error'   ? 'border-red-200 bg-red-50' :
                  step.status === 'running' ? 'border-brand-300 bg-brand-50 shadow-md' :
                  isNext                    ? 'border-brand-200 bg-white shadow-sm' :
                  'border-gray-100 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <div className={`mt-0.5 shrink-0 ${
                    step.status === 'done'    ? 'text-green-500' :
                    step.status === 'error'   ? 'text-red-500' :
                    step.status === 'running' ? 'text-brand-500' :
                    'text-gray-300'
                  }`}>
                    {step.status === 'done' ? (
                      <CheckCircle size={22} fill="currentColor" className="opacity-80" />
                    ) : step.status === 'running' ? (
                      <Loader2 size={22} className="animate-spin" />
                    ) : (
                      <Circle size={22} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={
                        step.status === 'done'  ? 'text-green-500' :
                        step.status === 'error' ? 'text-red-500' :
                        isCurr                  ? 'text-brand-500' :
                        'text-gray-400'
                      } />
                      <p className={`text-sm font-semibold ${
                        step.status === 'done'  ? 'text-green-800' :
                        step.status === 'error' ? 'text-red-700' :
                        isCurr                  ? 'text-brand-700' :
                        'text-gray-600'
                      }`}>
                        {step.label}
                      </p>
                      {isNext && (
                        <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                          Selanjutnya
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 ml-5">{step.desc}</p>
                    {step.result && (
                      <p className={`text-xs mt-1.5 ml-5 font-medium ${
                        step.status === 'done'  ? 'text-green-700' : 'text-red-600'
                      }`}>
                        {step.result}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Success banner */}
          {allDone && (
            <div className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-bold text-lg">Simulasi Selesai!</p>
              <p className="text-white/80 text-sm mt-1">
                Full flow berhasil: Order → Dispatch → Pickup → Delivered → Ledger
              </p>
              {simState.order_code && (
                <Link
                  href={`/tracking/${simState.order_code}`}
                  target="_blank"
                  className="mt-3 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  <ExternalLink size={14} />
                  Lihat Tracking Page
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Right: State panel + Log ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Live state card */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">State Simulasi</h3>
            <div className="space-y-2.5 text-sm">
              <StateRow
                label="Kurir ID"
                value={simState.courier_id ? simState.courier_id.slice(0, 8) + '…' : null}
                icon="🛵"
              />
              <StateRow
                label="Order Code"
                value={simState.order_code}
                icon="📦"
                link={simState.order_code ? `/tracking/${simState.order_code}` : undefined}
              />
              <StateRow
                label="Jarak"
                value={simState.distance_km ? `${simState.distance_km} km` : null}
                icon="📍"
              />
              <StateRow
                label="Ongkir"
                value={simState.delivery_fee ? formatIDR(simState.delivery_fee) : null}
                icon="💰"
              />
              {simState.delivery_fee && steps[4].status === 'done' && (
                <>
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <StateRow
                      label="Kurir (85%)"
                      value={formatIDR(Math.round(simState.delivery_fee * 0.85))}
                      icon="✅"
                      green
                    />
                    <StateRow
                      label="Platform (15%)"
                      value={formatIDR(Math.round(simState.delivery_fee * 0.15))}
                      icon="🏦"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location reference */}
          <div className="card text-xs text-gray-500 space-y-2">
            <p className="font-semibold text-gray-700 text-sm">Lokasi Simulasi</p>
            <div className="space-y-1.5">
              <p>🏙️ <span className="font-medium text-gray-700">Kurir:</span> Giri Menang Square</p>
              <p>🟢 <span className="font-medium text-gray-700">Pickup:</span> Jl. Sriwijaya No. 12</p>
              <p>🔴 <span className="font-medium text-gray-700">Dropoff:</span> Jl. Raya Karang Bongkot</p>
            </div>
            {simState.order_code && (
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/tracking/${simState.order_code}`}
                  target="_blank"
                  className="flex items-center gap-1 text-brand-500 hover:text-brand-700 font-medium"
                >
                  <ExternalLink size={11} /> Tracking
                </Link>
                <Link
                  href="/admin/map"
                  className="flex items-center gap-1 text-brand-500 hover:text-brand-700 font-medium"
                >
                  <ExternalLink size={11} /> Live Map
                </Link>
              </div>
            )}
          </div>

          {/* Activity log */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Activity Log</p>
              {log.length > 0 && (
                <button onClick={() => setLog([])} className="text-xs text-gray-400 hover:text-gray-600">
                  Clear
                </button>
              )}
            </div>
            <div
              ref={logRef}
              className="h-48 overflow-y-auto p-3 space-y-1.5 font-mono text-xs bg-gray-950"
            >
              {log.length === 0 && (
                <p className="text-gray-600 italic">Tekan "Jalankan Semua" untuk memulai simulasi...</p>
              )}
              {log.map((l, i) => (
                <p
                  key={i}
                  className={
                    l.type === 'success' ? 'text-green-400' :
                    l.type === 'error'   ? 'text-red-400' :
                    'text-gray-400'
                  }
                >
                  <span className="text-gray-600">[{l.time}]</span> {l.msg}
                </p>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────
function StateRow({
  label, value, icon, link, green
}: {
  label: string; value: string | null; icon: string; link?: string; green?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{icon} {label}</span>
      {value ? (
        link ? (
          <Link
            href={link}
            target="_blank"
            className="font-mono font-semibold text-brand-500 hover:text-brand-700 flex items-center gap-1"
          >
            {value} <ExternalLink size={10} />
          </Link>
        ) : (
          <span className={`font-semibold ${green ? 'text-green-600' : 'text-gray-900'}`}>{value}</span>
        )
      ) : (
        <span className="text-gray-300 text-xs">—</span>
      )}
    </div>
  )
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
