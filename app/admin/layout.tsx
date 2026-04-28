'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '../components/ThemeToggle'

interface UserProfile {
  id: string
  email: string
  name?: string
  roles: string[]
  permissions: string[]
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user) { router.push('/login'); return }
        const u: UserProfile = data.user
        const isAdmin = u.permissions.includes('system.admin') || u.roles.includes('admin')
        if (!isAdmin) { router.push('/?error=forbidden'); return }
        setUser(u)
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    )
  }

  if (!user) return null

  const navLinks = [
    { href: '/admin/users',     label: 'Users' },
    { href: '/admin/roles',     label: 'Roles' },
    { href: '/admin/audit',     label: 'Audit Log' },
    { href: '/admin/knowledge', label: 'Knowledge' },
    { href: '/admin/settings',  label: 'Settings' },
    { href: '/admin/ai',        label: 'AI Config' },
  ]

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-800">
          <span className="text-slate-100 font-semibold text-sm">Admin Panel</span>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname.startsWith(link.href)
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/"
            className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            ← Back to Chat
          </Link>
        </nav>
        <div className="px-4 py-3 border-t border-slate-800 space-y-1.5">
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
          <ThemeToggle variant="full" />
          <Link
            href="/change-password"
            className="block text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Change password
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      {/* Content */}
      <main className="flex-1 min-h-screen overflow-auto bg-slate-950">
        {children}
      </main>
    </div>
  )
}
