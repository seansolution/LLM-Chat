'use client'

import React, { useEffect, useMemo, useState } from 'react'

type AuthType = 'bearer' | 'x-api-key' | 'custom' | 'none'

type ProviderConfig = {
  provider: string
  label?: string
  color?: string
  icon?: string
  enabled?: boolean
  baseUrl: string
  chatPath?: string
  authType: AuthType
  secret?: string
  authHeader?: string
  authPrefix?: string
}

type ModelConfig = {
  id: string
  name: string
  provider: string
  litellmModel: string
  description: string
  contextWindow: number
  strengths: string[]
  envKey: string
  supportsVision: boolean
  supportsReasoning: boolean
  badge?: string
}

const AUTH_TYPES: AuthType[] = ['bearer', 'x-api-key', 'custom', 'none']

function emptyModel(provider = 'local'): ModelConfig {
  return {
    id: '',
    name: '',
    provider,
    litellmModel: '',
    description: '',
    contextWindow: 16384,
    strengths: [],
    envKey: '',
    supportsVision: false,
    supportsReasoning: false,
    badge: '',
  }
}

export default function AIConfigManager({ title = 'AI Providers & Models' }: { title?: string }) {
  const [providers, setProviders] = useState<Record<string, ProviderConfig>>({})
  const [models, setModels] = useState<ModelConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [showJson, setShowJson] = useState(false)
  const [providersJson, setProvidersJson] = useState('{}')
  const [modelsJson, setModelsJson] = useState('[]')

  const providerKeys = useMemo(() => Object.keys(providers).sort(), [providers])

  function syncJson(nextProviders: Record<string, ProviderConfig>, nextModels: ModelConfig[]) {
    setProvidersJson(JSON.stringify(nextProviders, null, 2))
    setModelsJson(JSON.stringify(nextModels, null, 2))
  }

  async function load() {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/ai-config', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error || 'Load failed')
        return
      }
      const p = (data.providers || {}) as Record<string, ProviderConfig>
      const m = (data.models || []) as ModelConfig[]
      setProviders(p)
      setModels(m)
      syncJson(p, m)
    } catch {
      setMsg('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function updateProvider(key: string, patch: Partial<ProviderConfig>) {
    setProviders(prev => {
      const next = { ...prev, [key]: { ...prev[key], ...patch } }
      syncJson(next, models)
      return next
    })
  }

  function removeProvider(key: string) {
    setProviders(prev => {
      const next = { ...prev }
      delete next[key]
      syncJson(next, models)
      return next
    })
  }

  function addProvider() {
    const key = `provider_${Date.now()}`
    const next: ProviderConfig = {
      provider: key,
      label: key,
      enabled: true,
      color: '#888888',
      icon: '◌',
      baseUrl: 'http://localhost:4000',
      chatPath: '/v1/chat/completions',
      authType: 'bearer',
      secret: '',
      authHeader: '',
      authPrefix: '',
    }
    setProviders(prev => {
      const merged = { ...prev, [key]: next }
      syncJson(merged, models)
      return merged
    })
  }

  function updateModel(index: number, patch: Partial<ModelConfig>) {
    setModels(prev => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      syncJson(providers, next)
      return next
    })
  }

  function addModel() {
    const provider = providerKeys[0] || 'local'
    setModels(prev => {
      const next = [...prev, emptyModel(provider)]
      syncJson(providers, next)
      return next
    })
  }

  function removeModel(index: number) {
    setModels(prev => {
      const next = prev.filter((_, i) => i !== index)
      syncJson(providers, next)
      return next
    })
  }

  async function save() {
    setSaving(true)
    setMsg('')
    try {
      const payload = { providers, models }
      const res = await fetch('/api/admin/ai-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error || 'Save failed')
        return
      }
      const p = (data.providers || {}) as Record<string, ProviderConfig>
      const m = (data.models || []) as ModelConfig[]
      setProviders(p)
      setModels(m)
      syncJson(p, m)
      setMsg('Saved. Chat model selector will reflect this config immediately.')
    } catch {
      setMsg('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function saveJsonMode() {
    setSaving(true)
    setMsg('')
    try {
      const p = JSON.parse(providersJson) as Record<string, ProviderConfig>
      const m = JSON.parse(modelsJson) as ModelConfig[]
      const res = await fetch('/api/admin/ai-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers: p, models: m }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error || 'Save failed')
        return
      }
      setProviders(data.providers || {})
      setModels(data.models || [])
      syncJson(data.providers || {}, data.models || [])
      setMsg('Saved from JSON mode')
    } catch {
      setMsg('Invalid JSON format')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJson(v => !v)}
            className="px-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            {showJson ? 'Hide JSON Mode' : 'Show JSON Mode'}
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white"
          >
            {saving ? 'Saving…' : 'Save AI Config'}
          </button>
        </div>
      </div>

      {msg && <p className="text-xs text-slate-400">{msg}</p>}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading…</div>
      ) : (
        <>
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200">Providers</h3>
              <button onClick={addProvider} className="text-xs px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white">+ Add provider</button>
            </div>
            <div className="space-y-3">
              {providerKeys.map(key => {
                const p = providers[key]
                return (
                  <div key={key} className="rounded-lg border border-slate-700 p-3 bg-slate-950/40">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input value={p.provider || ''} onChange={e => updateProvider(key, { provider: e.target.value })} placeholder="provider key" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                      <input value={p.label || ''} onChange={e => updateProvider(key, { label: e.target.value })} placeholder="label" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                      <div className="flex items-center gap-2"><label className="text-xs text-slate-400">Enabled</label><input type="checkbox" checked={p.enabled !== false} onChange={e => updateProvider(key, { enabled: e.target.checked })} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      <input value={p.baseUrl || ''} onChange={e => updateProvider(key, { baseUrl: e.target.value })} placeholder="https://api.example.com" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                      <input value={p.chatPath || ''} onChange={e => updateProvider(key, { chatPath: e.target.value })} placeholder="/v1/chat/completions" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                      <select value={p.authType} onChange={e => updateProvider(key, { authType: e.target.value as AuthType })} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200">{AUTH_TYPES.map(a => <option key={a} value={a}>{a}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      <input value={p.secret || ''} onChange={e => updateProvider(key, { secret: e.target.value })} placeholder="api key / secret" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                      <input value={p.authHeader || ''} onChange={e => updateProvider(key, { authHeader: e.target.value })} placeholder="custom header name" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                      <input value={p.authPrefix || ''} onChange={e => updateProvider(key, { authPrefix: e.target.value })} placeholder="header prefix e.g. Bearer " className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      <input value={p.color || ''} onChange={e => updateProvider(key, { color: e.target.value })} placeholder="#10a37f" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                      <input value={p.icon || ''} onChange={e => updateProvider(key, { icon: e.target.value })} placeholder="icon" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                      <button onClick={() => removeProvider(key)} className="text-xs px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white">Remove provider</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200">Models</h3>
              <button onClick={addModel} className="text-xs px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white">+ Add model</button>
            </div>
            <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
              {models.map((m, i) => (
                <div key={`${m.id || 'new'}-${i}`} className="rounded-lg border border-slate-700 p-3 bg-slate-950/40">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input value={m.id} onChange={e => updateModel(i, { id: e.target.value })} placeholder="model id" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                    <input value={m.name} onChange={e => updateModel(i, { name: e.target.value })} placeholder="display name" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                    <select value={m.provider} onChange={e => updateModel(i, { provider: e.target.value })} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200">{providerKeys.map(pk => <option key={pk} value={pk}>{pk}</option>)}</select>
                    <input value={m.litellmModel} onChange={e => updateModel(i, { litellmModel: e.target.value })} placeholder="remote model id" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
                    <input value={m.description} onChange={e => updateModel(i, { description: e.target.value })} placeholder="description" className="md:col-span-2 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                    <input type="number" value={m.contextWindow} onChange={e => updateModel(i, { contextWindow: Number(e.target.value || 0) })} placeholder="context" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                    <input value={m.badge || ''} onChange={e => updateModel(i, { badge: e.target.value })} placeholder="badge" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
                    <input value={(m.strengths || []).join(', ')} onChange={e => updateModel(i, { strengths: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="strengths comma-separated" className="md:col-span-2 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                    <input value={m.envKey || ''} onChange={e => updateModel(i, { envKey: e.target.value })} placeholder="envKey (optional)" className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-300 border border-slate-700 rounded px-2 py-1.5">
                      <label className="flex items-center gap-1"><input type="checkbox" checked={!!m.supportsVision} onChange={e => updateModel(i, { supportsVision: e.target.checked })} />Vision</label>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={!!m.supportsReasoning} onChange={e => updateModel(i, { supportsReasoning: e.target.checked })} />Reasoning</label>
                    </div>
                  </div>
                  <div className="mt-2"><button onClick={() => removeModel(i)} className="text-xs px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white">Remove model</button></div>
                </div>
              ))}
            </div>
          </section>

          {showJson && (
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Advanced JSON Mode</h3>
              <textarea value={providersJson} onChange={e => setProvidersJson(e.target.value)} rows={10} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono" />
              <textarea value={modelsJson} onChange={e => setModelsJson(e.target.value)} rows={10} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono" />
              <button onClick={saveJsonMode} disabled={saving} className="px-3 py-2 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white">{saving ? 'Saving…' : 'Save JSON'}</button>
            </section>
          )}
        </>
      )}
    </section>
  )
}
