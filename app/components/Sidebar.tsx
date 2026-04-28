'use client'
// ─── Sidebar — Conversation list ──────────────────────────────────────────────

import React from 'react'

export interface Conversation {
  id: string
  title: string
  mode: string
  updated_at: string
  _local?: boolean
}

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  loading: boolean
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  if (hr < 24) return `${hr}h ago`
  if (day < 7) return `${day}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function groupByDate(convs: Conversation[]): { label: string; items: Conversation[] }[] {
  const now = Date.now()
  const today: Conversation[] = []
  const yesterday: Conversation[] = []
  const thisWeek: Conversation[] = []
  const older: Conversation[] = []

  for (const c of convs) {
    const diff = now - new Date(c.updated_at).getTime()
    const day = diff / 86400000
    if (day < 1) today.push(c)
    else if (day < 2) yesterday.push(c)
    else if (day < 7) thisWeek.push(c)
    else older.push(c)
  }

  return [
    { label: 'Today', items: today },
    { label: 'Yesterday', items: yesterday },
    { label: 'This week', items: thisWeek },
    { label: 'Older', items: older },
  ].filter(g => g.items.length > 0)
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  loading,
}: SidebarProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState('')
  const [search, setSearch] = React.useState('')

  const filtered = search.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations

  const groups = groupByDate(filtered)

  function startEdit(c: Conversation, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(c.id)
    setEditTitle(c.title)
  }

  function commitEdit(id: string) {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-slate-800">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium text-slate-200 group"
        >
          <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 py-2">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {loading && (
          <div className="flex items-center justify-center py-8 text-xs text-slate-500">
            Loading…
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-slate-500">No conversations yet.</p>
            <p className="text-xs text-slate-600 mt-1">Click &ldquo;New Chat&rdquo; to start.</p>
          </div>
        )}

        {!loading && groups.map(group => (
          <div key={group.label}>
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              {group.label}
            </div>
            {group.items.map(conv => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group relative flex items-start px-3 py-2 cursor-pointer transition-colors ${
                  activeId === conv.id
                    ? 'bg-slate-800 text-slate-100'
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                {editingId === conv.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={() => commitEdit(conv.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit(conv.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                    className="w-full bg-slate-700 text-slate-100 text-xs px-2 py-1 rounded outline-none border border-slate-600"
                  />
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-snug">{conv.title}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{relativeTime(conv.updated_at)}</p>
                    </div>
                    {/* Actions (visible on hover) */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={e => startEdit(conv, e)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                        title="Rename"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81 3.23 11.33a.25.25 0 00-.064.108l-.665 2.328 2.328-.666a.25.25 0 00.108-.063l6.252-6.587z"/>
                        </svg>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          if (confirm('Delete this conversation?')) {
                            onDelete(conv.id)
                          }
                        }}
                        className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0110.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 111.492-.15z"/>
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
