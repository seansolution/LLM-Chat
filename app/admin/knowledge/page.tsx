'use client'
import React, { useEffect, useState, useCallback } from 'react'

interface KnowledgeDoc {
  id: string
  title: string
  source_url?: string
  mime_type: string
  language: string
  status: 'pending' | 'processing' | 'indexed' | 'failed'
  error_msg?: string
  chunk_count: number
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'text-slate-400 bg-slate-800',
  processing: 'text-yellow-400 bg-yellow-900/30',
  indexed:    'text-emerald-400 bg-emerald-900/30',
  failed:     'text-red-400 bg-red-900/30',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status] ?? 'text-slate-400 bg-slate-800'}`}>
      {status === 'processing' && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
      )}
      {status}
    </span>
  )
}

export default function KnowledgePage() {
  const [docs, setDocs]         = useState<KnowledgeDoc[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [filter, setFilter]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  // New-doc form state
  const [title, setTitle]       = useState('')
  const [content, setContent]   = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [language, setLanguage] = useState('th')

  const PAGE_SIZE = 20

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      })
      if (filter) params.set('status', filter)
      const res = await fetch(`/api/knowledge?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDocs(data.items ?? [])
        setTotal(data.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  // Poll while any doc is in pending/processing state
  useEffect(() => {
    const hasPending = docs.some(d => d.status === 'pending' || d.status === 'processing')
    if (!hasPending) return
    const id = setInterval(fetchDocs, 3000)
    return () => clearInterval(id)
  }, [docs, fetchDocs])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, sourceUrl: sourceUrl || undefined, language }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Error ${res.status}`)
        return
      }
      setShowModal(false)
      setTitle(''); setContent(''); setSourceUrl(''); setLanguage('th')
      fetchDocs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document and all its chunks?')) return
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    fetchDocs()
  }

  async function handleReindex(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: 'POST' })
    fetchDocs()
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Knowledge Base</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total} document{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError('') }}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          + Add Document
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'processing', 'indexed', 'failed'].map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              <th className="px-4 py-3 text-slate-400 font-medium">Title</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="px-4 py-3 text-slate-400 font-medium text-center">Chunks</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Lang</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && docs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                  Loading…
                </td>
              </tr>
            ) : docs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                  No documents found. Add one to get started.
                </td>
              </tr>
            ) : docs.map(doc => (
              <tr key={doc.id} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-slate-200 font-medium truncate max-w-xs">{doc.title}</div>
                  {doc.source_url && (
                    <div className="text-slate-500 text-xs truncate max-w-xs mt-0.5">{doc.source_url}</div>
                  )}
                  {doc.error_msg && (
                    <div className="text-red-400 text-xs mt-0.5 truncate max-w-xs" title={doc.error_msg}>
                      {doc.error_msg}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-4 py-3 text-center text-slate-300">
                  {doc.chunk_count > 0 ? doc.chunk_count : '—'}
                </td>
                <td className="px-4 py-3 text-slate-400 uppercase text-xs">{doc.language}</td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    {(doc.status === 'failed' || doc.status === 'pending') && (
                      <button
                        onClick={() => handleReindex(doc.id)}
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-slate-100 font-semibold">Add Knowledge Document</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Title *</label>
                <input
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="HR Policy 2025"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Source URL (optional)</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="th">Thai (ไทย)</option>
                  <option value="en">English</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Content * <span className="text-slate-600">({content.length.toLocaleString()} chars)</span>
                </label>
                <textarea
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={8}
                  placeholder="Paste document text here…"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y font-mono text-xs leading-relaxed"
                />
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {submitting ? 'Uploading…' : 'Add & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
