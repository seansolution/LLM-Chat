'use client'
import { useTheme } from '../lib/theme'

interface Props {
  /** 'icon' = icon only (sidebar/compact), 'full' = icon + label */
  variant?: 'icon' | 'full'
  className?: string
}

export default function ThemeToggle({ variant = 'full', className = '' }: Props) {
  const { theme, toggle } = useTheme()
  const isLight = theme === 'light'

  const label = isLight ? 'Dark mode' : 'Light mode'

  // Sun icon (light mode active)
  const SunIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="5"  />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.22" y1="4.22"  x2="6.34"  y2="6.34"  />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2"  y1="12" x2="5"  y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
      <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"  />
    </svg>
  )

  // Moon icon (dark mode active)
  const MoonIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        title={label}
        aria-label={label}
        className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ${className}`}
      >
        {isLight ? MoonIcon : SunIcon}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label={label}
      className={`flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors ${className}`}
    >
      {isLight ? MoonIcon : SunIcon}
      <span>{label}</span>
    </button>
  )
}
