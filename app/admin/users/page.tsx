'use client'
import React, { useEffect, useState, useCallback } from 'react'
import type { AdminUser, Role } from '../../types/api'

const ROLES: Role[] = ['admin', 'manager', 'agent', 'viewer']

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${color}`}>
      {label}
    </span>
  )
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    admin: 'bg-violet-500/20 text-violet-300',
    manager: 'bg-blue-500/20 text-blue-300',
    agent: 'bg-emerald-500/20 text-emerald-300',
    viewer: 'bg-slate-500/20 text-slate-300',
  }
  return <Badge key={role} label={role} color={map[role] || 'bg-slate-700 text-slate-400'} />
}

interface CreateModalProps {
  onClose: () => void
  onCreated: () => void
}

function CreateUserModal({ onClose, onCreated }: CreateModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['viewer'])
  const [tokenLimit, setTokenLimit] = useState<number>(16384)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, roles: selectedRoles, token_limit: tokenLimit }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      onCreated()
      onClose()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  function toggleRole(role: Role) {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Create User</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email *</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Temporary Password *</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRole(r)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedRoles.includes(r)
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Token limit per user</label>
            <input
              type="number"
              min={0}
              value={tokenLimit}
              onChange={e => setTokenLimit(Number(e.target.value || 0))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm py-2 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
              {loading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function toggleActive(user: AdminUser) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !user.is_active }),
    })
    loadUsers()
  }

  async function saveLimit(user: AdminUser, value: number) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_limit: Number(value) }),
    })
    loadUsers()
  }

  async function resetUsed(user: AdminUser) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_used: 0 }),
    })
    loadUsers()
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New User
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        className="w-full max-w-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 mb-4"
      />

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">User</th>
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Roles</th>
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Status</th>
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Token Budget</th>
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Last Login</th>
              <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500 text-sm">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500 text-sm">No users found</td></tr>
            )}
            {filtered.map((u, i) => (
              <tr key={u.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${!u.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="text-slate-200 font-medium">{u.name || '—'}</div>
                  <div className="text-slate-500 text-xs">{u.email}</div>
                  {u.force_password_change && (
                    <span className="text-[10px] text-amber-400">⚠ Must change password</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length > 0 ? u.roles.map(r => roleBadge(r)) : <span className="text-slate-600 text-xs">none</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-slate-300">
                    Used: {Number(u.token_used || 0).toLocaleString()} / {u.token_limit ?? '∞'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={0}
                      defaultValue={u.token_limit ?? 0}
                      onBlur={e => saveLimit(u, Number(e.target.value || 0))}
                      className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                    />
                    <button
                      onClick={() => resetUsed(u)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Reset used
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(u)}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={loadUsers} />
      )}
    </div>
  )
}
