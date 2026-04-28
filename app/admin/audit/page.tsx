'use client'
import React, { useEffect, useState, useCallback } from 'react'
import type { AuditLogEntry, PaginatedResponse } from '../../types/api'

const ACTION_COLORS: Record<string, string> = {
  'auth.login':           'text-emerald-400',
  'users.create':         'text-blue-400',
  'users.update':         'text-blue-300',
  'users.delete':         'text-red-400',
  'roles.create':         'text-violet-400',
  'roles.update_permissions': 'text-violet-300',
  'chat.share.create':    'text-amber-400',
  'chat.share.revoke':    'text-red-300',
  'admin.bootstrap':      'text-emerald-300',
}

function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action] || 'text-slate-400'
  return <span className={`font-mono text-xs ${color}`}>{action}</span>
}

export default function AdminAuditPage() {
  const [data, setData] = useState<PaginatedResponse<AuditLogEntry> | null>(null)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '50' })
      if (actionFilter) params.set('action', actionFilter)
      const res = await fetch(`/api/admin/audit?${params}`)
      const json = await res.json()
      setData(json)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter])

  useEffect(() => { loadLogs() }, [loadLogs])

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data?.total ?? 0} total entries</p>
        </div>
        <div className="flex gap-2">
          <input
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1) }}
            placeholder="Filter by action…"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={loadLogs}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm px-3 py-2 rounded-lg transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Time</th>
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Actor</th>
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Action</th>
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Resource</th>
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading…</td></tr>
            )}
            {!loading && data?.items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No entries found</td></tr>
            )}
            {(data?.items || []).map(entry => (
              <tr key={entry.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                  {formatTime(entry.created_at)}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-300 max-w-[160px] truncate">
                  {entry.actor_email || <span className="text-slate-600 italic">system</span>}
                </td>
                <td className="px-4 py-2.5">
                  <ActionBadge action={entry.action} />
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-400">
                  {entry.resource}
                  {entry.resource_id && (
                    <span className="text-slate-600 ml-1 font-mono">
                      {entry.resource_id.slice(0, 8)}…
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-600 max-w-[240px] truncate font-mono">
                  {entry.detail && Object.keys(entry.detail).length > 0
                    ? JSON.stringify(entry.detail).slice(0, 80)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data && (data.hasMore || page > 1) && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-slate-500">Page {page}</span>
            <button
              disabled={!data.hasMore}
              onClick={() => setPage(p => p + 1)}
              className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
