'use client'
// ─── Admin → Settings ─────────────────────────────────────────────────────────
// Chat runtime configuration: token caps, default limits.
// AI providers & models live in Admin → AI Config.

import React, { useEffect, useState } from 'react'

export default function AdminSettingsPage() {
  const [defaultMaxTokens, setDefaultMaxTokens] = useState(16384)
  const [maxTokensCap, setMaxTokensCap] = useState(16384)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function load() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (res.ok && data.chat) {
        setDefaultMaxTokens(Number(data.chat.defaultMaxTokens || 16384))
        setMaxTokensCap(Number(data.chat.maxTokensCap || 16384))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultMaxTokens, maxTokensCap }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ text: data.error || 'Save failed', ok: false })
        return
      }
      setDefaultMaxTokens(Number(data.chat?.defaultMaxTokens || defaultMaxTokens))
      setMaxTokensCap(Number(data.chat?.maxTokensCap || maxTokensCap))
      setMsg({ text: 'Saved successfully', ok: true })
    } catch {
      setMsg({ text: 'Network error', ok: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-100">Settings</h1>
      <p className="text-sm text-slate-400 mt-1 mb-8">
        Chat runtime limits. For AI providers and model configuration, go to{' '}
        <a href="/admin/ai" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
          AI Config
        </a>
        .
      </p>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading…</div>
      ) : (
        <form onSubmit={save} className="space-y-6">

          {/* Token limits card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 mb-0.5">Token Limits</h2>
              <p className="text-xs text-slate-500">Controls how many tokens the chat route may request per call.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Default max tokens
                  <span className="ml-1 text-slate-600">(per request)</span>
                </label>
                <input
                  type="number"
                  min={64}
                  max={32768}
                  value={defaultMaxTokens}
                  onChange={e => setDefaultMaxTokens(Number(e.target.value) || 16384)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <p className="text-xs text-slate-600 mt-1">Applied when the client doesn&apos;t specify maxTokens.</p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Hard cap
                  <span className="ml-1 text-slate-600">(max tokens ceiling)</span>
                </label>
                <input
                  type="number"
                  min={64}
                  max={32768}
                  value={maxTokensCap}
                  onChange={e => setMaxTokensCap(Number(e.target.value) || 16384)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <p className="text-xs text-slate-600 mt-1">Requests above this limit are clamped down.</p>
              </div>
            </div>

            {defaultMaxTokens > maxTokensCap && (
              <p className="text-xs text-yellow-400">
                ⚠ Default ({defaultMaxTokens}) is above the hard cap ({maxTokensCap}) — it will be clamped on save.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={load}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Reset
            </button>

            {msg && (
              <span className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {msg.text}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
