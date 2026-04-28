'use client'
// ─── ModelSelector — Multi-model picker grouped by provider ──────────────────
// Single-select or multi-select (compare mode) with provider grouping.

import React from 'react'
import { PROVIDER_META, type ModelConfig } from '../lib/models'

interface ModelSelectorProps {
  models: ModelConfig[]
  providerMeta?: Record<string, { label: string; color: string; icon: string }>
  selectedIds: string[]
  onChange: (ids: string[]) => void
  compareMode: boolean
  onCompareModeChange: (v: boolean) => void
}

const PROVIDER_ORDER: string[] = [
  'local', 'thaillm', 'openai', 'anthropic', 'google', 'xai', 'deepseek', 'perplexity', 'meta',
]

function badgeColor(badge?: string): string {
  switch (badge) {
    case 'Fast':  return 'bg-emerald-900/60 text-emerald-300'
    case 'Smart': return 'bg-violet-900/60 text-violet-300'
    case 'Cheap': return 'bg-yellow-900/60 text-yellow-300'
    case 'Local': return 'bg-slate-700 text-slate-300'
    default:      return 'bg-slate-800 text-slate-400'
  }
}

export default function ModelSelector({
  models,
  providerMeta,
  selectedIds,
  onChange,
  compareMode,
  onCompareModeChange,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function toggleModel(id: string) {
    if (compareMode) {
      // Multi-select (max 4)
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter(s => s !== id))
      } else if (selectedIds.length < 4) {
        onChange([...selectedIds, id])
      }
    } else {
      onChange([id])
      setOpen(false)
    }
  }

  // Group models by provider
  const grouped = PROVIDER_ORDER.reduce<Record<string, ModelConfig[]>>((acc, p) => {
    const items = models.filter(m => m.provider === p)
    if (items.length > 0) acc[p] = items
    return acc
  }, {})
  const extraProviders = Array.from(new Set(models.map(m => m.provider))).filter(p => !PROVIDER_ORDER.includes(p))
  for (const p of extraProviders) {
    grouped[p] = models.filter(m => m.provider === p)
  }

  const primaryId = selectedIds[0] || 'qwen3'
  const primaryModel = models.find(m => m.id === primaryId)

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-sm"
      >
        <span className="font-medium text-slate-100 truncate max-w-[140px]">
          {compareMode
            ? `${selectedIds.length} models`
            : primaryModel?.name || primaryId}
        </span>
        {compareMode && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-violet-900/60 text-violet-300 font-medium">
            Compare
          </span>
        )}
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 max-h-[480px] overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 scrollbar-thin">
          {/* Compare mode toggle */}
          <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {compareMode ? `Select up to 4 models` : 'Select a model'}
            </span>
            <button
              onClick={() => {
                const next = !compareMode
                onCompareModeChange(next)
                if (!next) {
                  // Revert to single selection
                  onChange(selectedIds.slice(0, 1))
                }
              }}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                compareMode
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {compareMode ? '⊞ Compare ON' : '⊞ Compare'}
            </button>
          </div>

          {/* Provider groups */}
          {PROVIDER_ORDER.filter(p => grouped[p]).map(p => {
            const meta = providerMeta?.[p] || PROVIDER_META[p] || { label: p, color: '#888888', icon: '◌' }
            return (
              <div key={p} className="py-1">
                <div className="px-3 py-1.5 flex items-center gap-2">
                  <span className="text-lg leading-none" style={{ color: meta.color }}>
                    {meta.icon}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {meta.label}
                  </span>
                </div>
                {grouped[p].map(model => {
                  const selected = selectedIds.includes(model.id)
                  const disabled = compareMode && !selected && selectedIds.length >= 4
                  return (
                    <button
                      key={model.id}
                      onClick={() => !disabled && toggleModel(model.id)}
                      disabled={disabled}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                        selected
                          ? 'bg-violet-900/30 border-l-2 border-violet-500'
                          : disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-slate-800 border-l-2 border-transparent'
                      }`}
                    >
                      {compareMode && (
                        <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                          selected ? 'bg-violet-500 border-violet-500' : 'border-slate-600'
                        }`}>
                          {selected && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M10 3L5 8 2 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                            </svg>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${selected ? 'text-slate-100' : 'text-slate-200'}`}>
                            {model.name}
                          </span>
                          {model.badge && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeColor(model.badge)}`}>
                              {model.badge}
                            </span>
                          )}
                          {model.supportsReasoning && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-900/50 text-amber-300">
                              Reasoning
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {model.description}
                        </p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {model.strengths.map(s => (
                            <span key={s} className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
