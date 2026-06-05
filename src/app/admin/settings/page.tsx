'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Settings, Save, X, Edit3, RefreshCw, Plus,
  ToggleLeft, ToggleRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { TableRowSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

// ── Types ────────────────────────────────────────────────────────────────────

interface SystemSetting {
  key:        string
  value:      Record<string, unknown>
  updated_by: string | null
  updated_at: string
}

// ── Edit Panel ───────────────────────────────────────────────────────────────

function EditPanel({
  setting,
  onSave,
  onClose,
  saving,
}: {
  setting:    SystemSetting | null
  onSave:     (key: string, value: string) => Promise<void>
  onClose:    () => void
  saving:     boolean
}) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError]       = useState('')

  useEffect(() => {
    if (setting) {
      setJsonText(JSON.stringify(setting.value, null, 2))
      setError('')
    }
  }, [setting])

  if (!setting) return null

  const handleSave = async () => {
    try {
      JSON.parse(jsonText)
      setError('')
      await onSave(setting.key, jsonText)
      onClose()
    } catch {
      setError('Invalid JSON format')
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[700] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 z-[750] w-[480px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">Edit Setting</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{setting.key}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-3">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            JSON Value
          </label>
          <textarea
            value={jsonText}
            onChange={e => { setJsonText(e.target.value); setError('') }}
            className="input font-mono text-xs w-full min-h-[300px] resize-none"
            placeholder='{ "key": "value" }'
          />
          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1" disabled={saving}>
            Batal
          </button>
          <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={saving}>
            {saving ? 'Saving…' : (
              <>
                <Save size={15} />
                Simpan
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings,     setSettings]     = useState<SystemSetting[]>([])
  const [loading,      setLoading]      = useState(true)
  const [editing,      setEditing]      = useState<SystemSetting | null>(null)
  const [saving,       setSaving]       = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (res.ok) setSettings(data.settings ?? [])
    } catch { /* keep stale data */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async (key: string, jsonStr: string) => {
    setSaving(true)
    try {
      const value = JSON.parse(jsonStr)
      await fetch('/api/admin/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key, value }),
      })
      fetchSettings()
    } finally {
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="p-6 space-y-5 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings size={24} className="text-brand-500" />
              System Settings
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Konfigurasi platform — pricing, dispatch, general
            </p>
          </div>
          <button onClick={fetchSettings} disabled={loading} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Key', 'Value', 'Last Updated', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && Array.from({ length: 3 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={4} />
                ))}

                {!loading && settings.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={Settings}
                        title="Belum ada pengaturan"
                        message="System settings akan muncul di sini setelah ditambahkan."
                      />
                    </td>
                  </tr>
                )}

                {!loading && settings.map(s => (
                  <tr key={s.key} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                        {s.key}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded block max-w-xs truncate">
                        {JSON.stringify(s.value)}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      <p>{formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}</p>
                      {s.updated_by && (
                        <p className="text-[10px] text-gray-300">by {s.updated_by}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditing(s)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors text-gray-500"
                        title="Edit"
                      >
                        <Edit3 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Panel */}
      <EditPanel
        setting={editing}
        onSave={handleSave}
        onClose={() => setEditing(null)}
        saving={saving}
      />
    </>
  )
}
