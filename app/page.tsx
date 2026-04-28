'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ClientChat from './components/ClientChat'
import ThemeToggle from './components/ThemeToggle'

export default function Page() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setAuthed(true)
        } else {
          router.replace('/login')
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setChecking(false))
  }, [router])

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    )
  }

  if (!authed) return null

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      <nav className="flex-shrink-0 border-b border-slate-800 px-5 py-3 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <span className="text-slate-100 font-semibold text-sm tracking-tight">Multi-Model Chat</span>
          <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
            LiteLLM · 20+ models
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle variant="icon" />
          <a
            href="/admin/users"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Admin
          </a>
          <a
            href="/change-password"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Change password
          </a>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              router.replace('/login')
            }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="flex-1 min-h-0 overflow-hidden">
        <ClientChat />
      </main>
    </div>
  )
}
