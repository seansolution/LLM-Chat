'use client'
// ─── ClientChat — Multi-Model Chat UI ────────────────────────────────────────

import React from 'react'
import ModelSelector from './ModelSelector'
import Sidebar, { type Conversation } from './Sidebar'
import { MessageContent } from './CodeBlock'
import { MODELS, PROVIDER_META, type ModelConfig } from '../lib/models'
import ShareModal from './ShareModal'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  role: 'user' | 'assistant'
  content: string
  replies?: SingleReply[]
  singleReply?: SingleReply
  timestamp: string
  isStreaming?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(): string {
  return typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36)
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function providerColor(provider: string, providerMeta?: Record<string, { label: string; color: string; icon: string }>): string {
  return providerMeta?.[provider]?.color || PROVIDER_META[provider]?.color || '#888'
}

function providerIcon(provider: string, providerMeta?: Record<string, { label: string; color: string; icon: string }>): string {
  return providerMeta?.[provider]?.icon || PROVIDER_META[provider]?.icon || '◌'
}

// ─── System Prompt Modal ──────────────────────────────────────────────────────

function SystemPromptModal({
  value,
  onSave,
  onClose,
}: {
  value: string
  onSave: (v: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = React.useState(value)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100">System Prompt</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-3">
            Customize the AI&apos;s personality and behavior for this conversation.
          </p>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={8}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-slate-500 resize-y"
            placeholder="You are a helpful assistant..."
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { onSave(draft); onClose() }}
              className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Compare Reply Card ───────────────────────────────────────────────────────

function CompareCard({ reply, providerMeta }: { reply: SingleReply; providerMeta?: Record<string, { label: string; color: string; icon: string }> }) {
  const color = providerColor(reply.provider, providerMeta)
  const icon = providerIcon(reply.provider, providerMeta)

  return (
    <div className={`flex flex-col rounded-xl border overflow-hidden ${
      reply.error ? 'border-red-900/60 bg-red-950/20' : 'border-slate-700/60 bg-slate-800/30'
    }`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border-b border-slate-700/40">
        <span style={{ color }} className="text-base leading-none flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate">
            {reply.modelName || reply.model}
          </p>
          <p className="text-[10px] text-slate-500">{formatLatency(reply.latencyMs)}</p>
        </div>
      </div>
      <div className="flex-1 p-3 text-sm text-slate-200 overflow-y-auto max-h-96">
        {reply.error ? (
          <p className="text-red-400 text-xs">⚠ {reply.error}</p>
        ) : (
          <MessageContent content={reply.reply} />
        )}
      </div>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, providerMeta }: { msg: Message; providerMeta?: Record<string, { label: string; color: string; icon: string }> }) {
  const isUser = msg.role === 'user'
  const isCompare = msg.replies && msg.replies.length > 1

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] sm:max-w-[65%] bg-violet-600/20 border border-violet-700/40 rounded-2xl rounded-tr-md px-4 py-3">
          <MessageContent content={msg.content} />
        </div>
      </div>
    )
  }

  if (isCompare && msg.replies) {
    const cols = msg.replies.length <= 2 ? 2 : 2
    return (
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.min(cols, msg.replies.length)}, 1fr)` }}>
        {msg.replies.map((r, i) => (
          <CompareCard key={r.model + i} reply={r} providerMeta={providerMeta} />
        ))}
      </div>
    )
  }

  const r = msg.singleReply
  const color = r ? providerColor(r.provider, providerMeta) : '#888'
  const icon = r ? providerIcon(r.provider, providerMeta) : '◌'

  return (
    <div className="flex gap-2.5">
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm mt-1"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        {r && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium" style={{ color }}>
              {r.modelName || r.model}
            </span>
            <span className="text-[10px] text-slate-600">{formatLatency(r.latencyMs)}</span>
          </div>
        )}
        <div className="text-[15px] text-slate-200 leading-relaxed">
          {msg.isStreaming ? (
            <span className="flex items-center gap-2 text-slate-400">
              <span className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
              Thinking…
            </span>
          ) : r?.error ? (
            <p className="text-red-400 text-sm">⚠ {r.error}</p>
          ) : (
            <MessageContent content={r?.reply || msg.content || ''} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientChat() {
  const [models, setModels] = React.useState<ModelConfig[]>(MODELS)
  const [providerMeta, setProviderMeta] = React.useState<Record<string, { label: string; color: string; icon: string }>>(PROVIDER_META)
  const [selectedIds, setSelectedIds] = React.useState<string[]>(['qwen3'])
  const [compareMode, setCompareMode] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null)
  const [convLoading, setConvLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [systemPrompt, setSystemPrompt] = React.useState('')
  const [showSystemPrompt, setShowSystemPrompt] = React.useState(false)
  const [showShareModal, setShowShareModal] = React.useState(false)

  const bottomRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  async function loadConversations() {
    setConvLoading(true)
    try {
      const res = await fetch('/api/conversations', { cache: 'no-store' })
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch {
      setConversations([])
    } finally {
      setConvLoading(false)
    }
  }

  React.useEffect(() => { loadConversations() }, [])
  React.useEffect(() => {
    fetch('/api/models', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.models) && data.models.length > 0) setModels(data.models)
        if (data.providerMeta) setProviderMeta(data.providerMeta)
      })
      .catch(() => {})
  }, [])
  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function selectConversation(id: string) {
    setLoading(false)
    setActiveConvId(id)
    setShowShareModal(false)
    try {
      const res = await fetch(`/api/conversations/${id}`, { cache: 'no-store' })
      const data = await res.json()
      if (!data.conversation) return
      setSystemPrompt(data.conversation.system_prompt || '')

      const dbMsgs: {
        id: string; role: string; content: string;
        model_id: string | null; provider: string | null;
        compare_group: string | null; latency_ms: number | null;
        created_at: string;
      }[] = data.messages || []

      const compareGroups = new Map<string, typeof dbMsgs>()
      for (const m of dbMsgs) {
        if (m.compare_group) {
          const g = compareGroups.get(m.compare_group) || []
          g.push(m); compareGroups.set(m.compare_group, g)
        }
      }

      const msgs: Message[] = []
      const seenGroups = new Set<string>()
      for (const m of dbMsgs) {
        if (m.role === 'user') {
          msgs.push({ id: m.id, role: 'user', content: m.content, timestamp: m.created_at })
        } else if (m.compare_group && !seenGroups.has(m.compare_group)) {
          seenGroups.add(m.compare_group)
          const group = compareGroups.get(m.compare_group) || []
          msgs.push({
            id: m.id, role: 'assistant', content: '',
            replies: group.map(g => ({
              model: g.model_id || 'unknown',
              modelName: models.find(mo => mo.id === g.model_id)?.name || g.model_id || 'unknown',
              provider: g.provider || 'local',
              reply: g.content,
              latencyMs: g.latency_ms || 0,
            })),
            timestamp: m.created_at,
          })
        } else if (!m.compare_group) {
          msgs.push({
            id: m.id, role: 'assistant', content: m.content,
            singleReply: {
              model: m.model_id || 'unknown',
              modelName: models.find(mo => mo.id === m.model_id)?.name || m.model_id || 'unknown',
              provider: m.provider || 'local',
              reply: m.content,
              latencyMs: m.latency_ms || 0,
            },
            timestamp: m.created_at,
          })
        }
      }
      setMessages(msgs)
    } catch { /* ignore */ }
  }

  async function newConversation() {
    setLoading(false)
    setMessages([]); setActiveConvId(null); setShowShareModal(false); setSystemPrompt('')
    inputRef.current?.focus()
  }

  async function deleteConversation(id: string) {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    if (activeConvId === id) newConversation()
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  async function renameConversation(id: string, title: string) {
    await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c))
  }

  async function ensureConversation(): Promise<string | null> {
    if (activeConvId) return activeConvId
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat', mode: 'general', systemPrompt: systemPrompt || null }),
      })
      const data = await res.json()
      const conv = data.conversation
      if (conv?.id) { setActiveConvId(conv.id); setConversations(prev => [conv, ...prev]); return conv.id }
    } catch { /* DB unavailable */ }
    return null
  }

  function openShareModal() {
    if (activeConvId) setShowShareModal(true)
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput(''); setLoading(true)

    const userMsg: Message = { id: genId(), role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])

    const streamingId = genId()
    const isCompare = compareMode && selectedIds.length > 1
    setMessages(prev => [...prev, {
      id: streamingId, role: 'assistant', content: '', isStreaming: true,
      timestamp: new Date().toISOString(),
      ...(isCompare ? {
        replies: selectedIds.map(id => ({
          model: id, modelName: models.find(m => m.id === id)?.name || id,
          provider: models.find(m => m.id === id)?.provider || 'local', reply: '', latencyMs: 0,
        })),
      } : {
        singleReply: {
          model: selectedIds[0], modelName: models.find(m => m.id === selectedIds[0])?.name || selectedIds[0],
          provider: models.find(m => m.id === selectedIds[0])?.provider || 'local', reply: '', latencyMs: 0,
        },
      }),
    }])

    const convId = await ensureConversation()

    try {
      const payload: Record<string, unknown> = {
        message: text, conversationId: convId, mode: 'general', temperature: 0.7, maxTokens: 16384,
      }
      if (systemPrompt) payload.systemPrompt = systemPrompt
      if (isCompare) payload.models = selectedIds
      else payload.model = selectedIds[0]

      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)

      if (convId) loadConversations()

      if (data.mode === 'compare') {
        const replies: SingleReply[] = data.replies || []
        setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, replies, isStreaming: false } : m))
      } else {
        const sr: SingleReply = {
          model: data.model || selectedIds[0],
          modelName: data.modelName || models.find(m => m.id === data.model)?.name || data.model,
          provider: models.find(m => m.id === data.model)?.provider || 'local',
          reply: data.reply || '', latencyMs: data.latencyMs || 0,
        }
        setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, singleReply: sr, isStreaming: false } : m))
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setMessages(prev => prev.map(m => m.id === streamingId ? {
        ...m, isStreaming: false,
        singleReply: {
          model: selectedIds[0],
          modelName: models.find(mo => mo.id === selectedIds[0])?.name || selectedIds[0],
          provider: 'local', reply: '', error: errorMsg, latencyMs: 0,
        },
      } : m))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Sidebar */}
      <div className={`flex-shrink-0 transition-all duration-200 overflow-hidden ${sidebarOpen ? 'w-60' : 'w-0'}`}>
        {sidebarOpen && (
          <Sidebar
            conversations={conversations} activeId={activeConvId}
            onSelect={selectConversation} onNew={newConversation}
            onDelete={deleteConversation} onRename={renameConversation}
            loading={convLoading}
          />
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <ModelSelector
            models={models}
            providerMeta={providerMeta}
            selectedIds={selectedIds} onChange={setSelectedIds}
            compareMode={compareMode} onCompareModeChange={setCompareMode}
          />

          <div className="flex-1" />

          <button
            onClick={() => setShowSystemPrompt(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              systemPrompt ? 'bg-amber-900/40 text-amber-300 border border-amber-800/60' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {systemPrompt ? 'Prompt ✓' : 'Prompt'}
          </button>

          {activeConvId && (
            <button
              onClick={openShareModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl text-slate-400">◈</div>
                <div>
                  <p className="text-slate-300 font-semibold text-lg">
                    {compareMode ? 'Compare Mode' : 'How can I help?'}
                  </p>
                  <p className="text-slate-600 text-sm mt-1">
                    {compareMode
                      ? `${selectedIds.length} model${selectedIds.length !== 1 ? 's' : ''} selected`
                      : `Chatting with ${models.find(m => m.id === selectedIds[0])?.name || selectedIds[0]}`}
                  </p>
                </div>
                {compareMode && selectedIds.length < 2 && (
                  <p className="text-amber-400 text-xs bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-800/40">
                    Select at least 2 models to compare
                  </p>
                )}
              </div>
            )}
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} providerMeta={providerMeta} />)}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900 px-4 py-3">
          <div className="max-w-4xl mx-auto">

            <form onSubmit={sendMessage} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    compareMode && selectedIds.length > 1
                      ? `Compare ${selectedIds.length} models… (Enter to send)`
                      : `Message ${models.find(m => m.id === selectedIds[0])?.name || selectedIds[0]}… (Enter)`
                  }
                  rows={1}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 resize-none overflow-hidden transition-colors disabled:opacity-50"
                  style={{ minHeight: '48px', maxHeight: '200px' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim() || (compareMode && selectedIds.length < 2)}
                className="flex-shrink-0 w-11 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <svg className="w-4 h-4 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
            <p className="text-center text-[10px] text-slate-700 mt-2">Shift+Enter for new line</p>
          </div>
        </div>
      </div>

      {showSystemPrompt && (
        <SystemPromptModal
          value={systemPrompt}
          onSave={v => {
            setSystemPrompt(v)
            if (activeConvId) {
              fetch(`/api/conversations/${activeConvId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt: v }),
              })
            }
          }}
          onClose={() => setShowSystemPrompt(false)}
        />
      )}
      {showShareModal && activeConvId && (
        <ShareModal
          conversationId={activeConvId}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
