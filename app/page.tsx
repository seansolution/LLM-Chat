'use client'
import React from 'react'
import ClientChat from './components/ClientChat'

export default function Page() {
  const [isDark, setIsDark] = React.useState(true)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={`h-screen flex flex-col bg-slate-900 transition-opacity duration-250 ${mounted ? 'opacity-100' : 'opacity-0'} overflow-hidden`}>
      <nav className="flex-shrink-0 border-b border-slate-800 px-6 py-3 flex justify-between items-center bg-slate-900">
        <div className="text-sm font-medium text-slate-100 tracking-tight">
          SEAN SOLUTION
        </div>
        <button
          onClick={() => setIsDark(!isDark)}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
        >
          {isDark ? 'Light' : 'Dark'}
        </button>
      </nav>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden max-w-4xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="flex-1 flex flex-col min-h-0">
          <ClientChat isDark={isDark} />
        </div>
      </main>
    </div>
  )
}
