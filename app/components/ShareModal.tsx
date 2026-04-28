'use client'
// ─── ShareModal — Create / manage shares for a conversation ───────────────────

import React, { useState, useEffect, useCallback } from 'react'
import type { ChatShare, SharePermission } from '../types/api'

interface Props {
  conversationId: string
  onClose: () => void
}

interface ShareRow extends ChatShare {
  isNew?: boolean
}

export default function ShareModal({ conversationId, onClose }: Props) {
  const [shares, setShares] = useState<ShareRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newShareType, setNewShareType] = useState<'link' | 'user'>('link')
  const [newPermission, setNewPermission] = useState<SharePermission>('view')
  const [targetEmail, setTargetEmail] = useState('')
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('')
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadShares = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/shares`)
      const data = await res.json()
      setShares(data.shares || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => { loadShares() }, [loadShares])

  async function createShare() {
    setError('')
    setCreating(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareType: newShareType,
          permission: newPermission,
          targetUserId: newShareType === 'user' ? targetEmail : undefined,
          expiresInDays: expiresInDays !== '' ? expiresInDays : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create share'); return }

      // If link share, auto-copy the URL
      if (data.shareUrl) {
        const absoluteUrl = String(data.shareUrl).startsWith('http')
          ? data.shareUrl
          : `${window.location.origin}${data.shareUrl}`
        navigator.clipboard.writeText(absoluteUrl).catch(() => {})
        setCopiedId(data.share.id)
        setTimeout(() => setCopiedId(null), 3000)
      }

      await loadShares()
      setTargetEmail('')
      setExpiresInDays('')
    } catch {
      setError('Network error')
    } finally {
      setCreating(false)
    }
  }

  async function revokeShare(shareId: string) {
    if (!confirm('Revoke this share? Access will be denied immediately.')) return
    await fetch(`/api/shares/${shareId}`, { method: 'DELETE' })
    loadShares()
  }

  async function updatePermission(shareId: string, permission: SharePermission) {
    await fetch(`/api/shares/${shareId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission }),
    })
    setShares(prev => prev.map(s => s.id === shareId ? { ...s, permission } : s))
  }

  function isExpired(share: ChatShare) {
    return share.expires_at ? new Date(share.expires_at) < new Date() : false
  }

  function shareStatus(share: ChatShare) {
    if (share.revoked_at) return { label: 'Revoked', cls: 'text-red-400' }
    if (isExpired(share)) return { label: 'Expired', cls: 'text-amber-400' }
    return { label: 'Active', cls: 'text-emerald-400' }
  }

  const activeShares = shares.filter(s => !s.revoked_at && !isExpired(s))
  const inactiveShares = shares.filter(s => s.revoked_at || isExpired(s))

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-100">Share Conversation</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Create new share */}
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Create Share</h3>

            {/* Share type toggle */}
            <div className="flex rounded-lg overflow-hidden border border-slate-700 text-sm">
              {(['link', 'user'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setNewShareType(t)}
                  className={`flex-1 py-1.5 capitalize transition-colors ${
                    newShareType === t
                      ? 'bg-violet-600 text-white'
                      : 'bg-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t === 'link' ? '🔗 Link' : '👤 User'}
                </button>
              ))}
            </div>

            {newShareType === 'user' && (
              <input
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                placeholder="User email or ID"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            )}

            <div className="flex gap-2">
              {/* Permission */}
              <select
                value={newPermission}
                onChange={e => setNewPermission(e.target.value as SharePermission)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="view">View only</option>
                <option value="comment">Can comment</option>
              </select>

              {/* Expiry */}
              <select
                value={expiresInDays}
                onChange={e => setExpiresInDays(e.target.value === '' ? '' : Number(e.target.value))}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="">No expiry</option>
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={createShare}
              disabled={creating || (newShareType === 'user' && !targetEmail)}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {creating ? 'Creating…' : newShareType === 'link' ? 'Generate Link' : 'Share with User'}
            </button>
          </div>

          {/* Active shares */}
          {loading && <div className="text-slate-500 text-sm text-center py-4">Loading…</div>}

          {!loading && activeShares.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Shares</h3>
              <div className="space-y-2">
                {activeShares.map(share => {
                  const status = shareStatus(share)
                  return (
                    <div key={share.id} className="bg-slate-800 rounded-lg p-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate-300 font-medium">
                            {share.share_type === 'link' ? '🔗 Link' : `👤 ${share.target_user_id?.slice(0, 8)}…`}
                          </span>
                          <span className={`text-[10px] font-medium ${status.cls}`}>{status.label}</span>
                          {copiedId === share.id && (
                            <span className="text-[10px] text-emerald-400">✓ Copied!</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {/* Permission selector */}
                          <select
                            value={share.permission}
                            onChange={e => updatePermission(share.id, e.target.value as SharePermission)}
                            className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                          >
                            <option value="view">View only</option>
                            <option value="comment">Can comment</option>
                          </select>
                          {share.expires_at && (
                            <span className="text-[10px] text-slate-500">
                              Expires {new Date(share.expires_at).toLocaleDateString()}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-600">
                            Created {new Date(share.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {share.share_type === 'link' && share.token && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/share/${share.token}`)
                              setCopiedId(share.id)
                              setTimeout(() => setCopiedId(null), 3000)
                            }}
                            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            Copy Link
                          </button>
                        )}
                        <button
                          onClick={() => revokeShare(share.id)}
                          className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Revoked / expired shares (collapsed) */}
          {!loading && inactiveShares.length > 0 && (
            <details className="group">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors">
                {inactiveShares.length} revoked / expired share{inactiveShares.length > 1 ? 's' : ''}
              </summary>
              <div className="mt-2 space-y-2">
                {inactiveShares.map(share => {
                  const status = shareStatus(share)
                  return (
                    <div key={share.id} className="bg-slate-800/50 rounded-lg p-3 opacity-60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {share.share_type === 'link' ? '🔗 Link' : '👤 User'}
                        </span>
                        <span className={`text-[10px] ${status.cls}`}>{status.label}</span>
                        <span className="text-[10px] text-slate-600 ml-auto">
                          {share.revoked_at
                            ? `Revoked ${new Date(share.revoked_at).toLocaleDateString()}`
                            : `Expired ${new Date(share.expires_at!).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          )}

          {!loading && shares.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-2">No shares yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
