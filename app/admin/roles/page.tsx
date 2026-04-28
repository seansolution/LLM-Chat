'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { PERMISSIONS } from '../../types/api'

interface RoleEntry {
  id: string
  name: string
  description: string | null
  is_builtin: boolean
  permissions: string[]
}

const PERMISSION_CATEGORIES: Record<string, string[]> = {
  Users: ['users.read', 'users.write', 'users.delete', 'roles.read', 'roles.write'],
  Chat: ['chat.read', 'chat.write', 'chat.share', 'chat.share.manage', 'chat.share.external'],
  Knowledge: ['knowledge.read', 'knowledge.write'],
  Observability: ['metrics.read', 'audit.read'],
  System: ['system.admin'],
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<RoleEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const [editPerms, setEditPerms] = useState<Set<string>>(new Set())

  const loadRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/roles')
      const data = await res.json()
      setRoles(data.roles || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRoles() }, [loadRoles])

  function selectRole(role: RoleEntry) {
    setSelectedRole(role)
    setEditPerms(new Set(role.permissions))
  }

  function togglePerm(key: string) {
    setEditPerms(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  async function savePermissions() {
    if (!selectedRole) return
    setSaving(true)
    try {
      await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: Array.from(editPerms) }),
      })
      await loadRoles()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-slate-100 mb-6">Roles & Permissions</h1>
      <div className="flex gap-6">
        {/* Role list */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {loading && <div className="p-4 text-sm text-slate-500">Loading…</div>}
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => selectRole(role)}
                className={`w-full text-left px-4 py-3 text-sm border-b border-slate-800 last:border-0 transition-colors ${
                  selectedRole?.id === role.id
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-medium">{role.name}</div>
                {role.is_builtin && (
                  <div className="text-[10px] text-slate-500 mt-0.5">built-in</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Permission editor */}
        <div className="flex-1">
          {!selectedRole ? (
            <div className="text-slate-500 text-sm mt-4">Select a role to view permissions</div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">{selectedRole.name}</h2>
                  {selectedRole.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{selectedRole.description}</p>
                  )}
                </div>
                {!selectedRole.is_builtin && (
                  <button
                    onClick={savePermissions}
                    disabled={saving}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                )}
                {selectedRole.is_builtin && (
                  <span className="text-xs text-slate-500 italic">Built-in role — read only</span>
                )}
              </div>
              {Object.entries(PERMISSION_CATEGORIES).map(([cat, keys]) => (
                <div key={cat} className="mb-5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{cat}</h3>
                  <div className="space-y-1.5">
                    {keys.map(key => (
                      <label
                        key={key}
                        className={`flex items-center gap-3 text-sm cursor-pointer group ${selectedRole.is_builtin ? 'cursor-default' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={editPerms.has(key)}
                          onChange={() => !selectedRole.is_builtin && togglePerm(key)}
                          disabled={selectedRole.is_builtin}
                          className="w-4 h-4 rounded accent-violet-500"
                        />
                        <span className={editPerms.has(key) ? 'text-slate-200' : 'text-slate-500'}>
                          {key}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
