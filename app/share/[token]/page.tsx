'use client'
// ─── Public Share View ────────────────────────────────────────────────────────
// Read-only view of a shared conversation, accessible without login.

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MessageContent } from '../../components/CodeBlock'
import { MODELS, PROVIDER_META, type Provider } from '../../lib/models'

interface SingleReply {
  model: string
  modelName: string
  provider: string
  reply: string
  error?: string
  latencyMs: number
}

interface Message {
  id: string
  role: string
  content: string
  model_id: string | null
  provider: string | null
  compare_group: string | null
  latency_ms: number | null
  created_at: string
}

interface Conversation {
  id: string
  title: string
  mode: string
  created_at: string
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function providerColor(provider: string): string {
  return PROVIDER_META[provider as Provider]?.color || '#888'
}

function providerIcon(provider: string): string {
  return PROVIDER_META[provider as Provider]?.icon || '◌'
}

// ─── Message rendering ────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] sm:max-w-[65%] bg-violet-600/20 border border-violet-700/40 rounded-2xl rounded-tr-md px-4 py-3">
        <MessageContent content={content} />
      </div>
    </div>
  )
}

function AssistantBubble({ msg }: { msg: Message }) {
  const color = providerColor(msg.provider || '')
  const icon = providerIcon(msg.provider || '')
  const modelName = MODELS.find(m => m.id === msg.model_id)?.name || msg.model_id || 'Assistant'

  return (
    <div className="flex gap-2.5">
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm mt-1"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium" style={{ color }}>{modelName}</span>
          {msg.latency_ms != null && (
            <span className="text-[10px] text-slate-600">{formatLatency(msg.latency_ms)}</span>
          )}
        </div>
        <div className="text-[15px] text-slate-200 leading-relaxed">
          <MessageContent content={msg.content} />
        </div>
      </div>
    </div>
  )
}

function CompareGroup({ messages }: { messages: Message[] }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${Math.min(2, messages.length)}, 1fr)` }}
    >
      {messages.map((msg, i) => {
        const color = providerColor(msg.provider || '')
        const icon = providerIcon(msg.provider || '')
        const modelName = MODELS.find(m => m.id === msg.model_id)?.name || msg.model_id || 'Model'
        return (
          <div key={i} className="flex flex-col rounded-xl border border-slate-700/60 bg-slate-800/30 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border-b border-slate-700/40">
              <span style={{ color }} className="text-base leading-none">{icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{modelName}</p>
                {msg.latency_ms != null && (
                  <p className="text-[10px] text-slate-500">{formatLatency(msg.latency_ms)}</p>
                )}
              </div>
            </div>
            <div className="flex-1 p-3 text-sm text-slate-200 overflow-y-auto max-h-96">
              <MessageContent content={msg.content} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SharePage() {
  const params = useParams()
  const token = params?.token as string

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sharedAt, setSharedAt] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`/api/share/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setConversation(data.conversation)
        setMessages(data.messages || [])
        setSharedAt(data.sharedAt)
        setExpiresAt(data.expiresAt)
      })
      .catch(() => setError('Failed to load shared conversation'))
      .finally(() => setLoading(false))
  }, [token])

  // Group compare messages
  const rendered: React.ReactNode[] = []
  const seenGroups = new Set<string>()

  for (const msg of messages) {
    if (msg.role === 'user') {
      rendered.push(<UserBubble key={msg.id} content={msg.content} />)
    } else if (msg.compare_group) {
      if (!seenGroups.has(msg.compare_group)) {
        seenGroups.add(msg.compare_group)
        const group = messages.filter(m => m.compare_group === msg.compare_group)
        rendered.push(<CompareGroup key={msg.compare_group} messages={group} />)
      }
    } else {
      rendered.push(<AssistantBubble key={msg.id} msg={msg} />)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-slate-100 font-semibold text-sm">
            {conversation?.title || 'Shared Conversation'}
          </span>
          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            Read-only
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          {sharedAt && (
            <span>Shared {new Date(sharedAt).toLocaleDateString()}</span>
          )}
          {expiresAt && (
            <span>Expires {new Date(expiresAt).toLocaleDateString()}</span>
          )}
          <a href="/" className="text-violet-400 hover:text-violet-300 transition-colors">
            Open Chat →
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {loading && (
            <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
              Loading…
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="text-4xl">🔒</div>
              <p className="text-slate-300 font-medium">{error}</p>
              <p className="text-slate-500 text-sm">This link may have expired or been revoked.</p>
              <a
                href="/"
                className="mt-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors"
              >
                Go to Chat
              </a>
            </div>
          )}

          {!loading && !error && (
            <div className="flex flex-col gap-5">
              {rendered.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-10">No messages in this conversation.</p>
              )}
              {rendered}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
