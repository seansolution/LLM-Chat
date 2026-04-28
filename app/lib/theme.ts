'use client'
// ─── Theme hook ───────────────────────────────────────────────────────────────
// Shared across chat UI and admin panel.
// Persists to localStorage; reads system preference as fallback.
// Applies/removes the "light-mode" class on <html>.

import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setThemeState] = useState<Theme>('dark')

  // Sync from localStorage + apply class on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    const preferLight = window.matchMedia('(prefers-color-scheme: light)').matches
    const resolved: Theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : preferLight ? 'light' : 'dark'
    apply(resolved)
    setThemeState(resolved)
  }, [])

  function apply(t: Theme) {
    document.documentElement.classList.toggle('light-mode', t === 'light')
  }

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    apply(next)
    setThemeState(next)
  }

  return { theme, toggle }
}
