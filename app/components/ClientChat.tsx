'use client'
import React from 'react'
import { ScrollArea } from './ui/scroll-area'
import { Avatar } from './ui/avatar'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface ClientChatProps {
  isDark: boolean
}

export default function ClientChat({ isDark }: ClientChatProps) {
  const [input, setInput] = React.useState('')
  const [messages, setMessages] = React.useState<{ role: string; text: string }[]>([])
  const [loading, setLoading] = React.useState(false)
  const chatEndRef = React.useRef<HTMLDivElement>(null)
  const messagesContainerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (chatEndRef.current && messagesContainerRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text) return
    const userMsg = { role: 'user', text }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error')
        console.error('API error:', res.status, errorText)
        setMessages((m) => [...m, { 
          role: 'assistant', 
          text: `เกิดข้อผิดพลาด (${res.status}): ${errorText || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'}` 
        }])
        return
      }
      
      const data = await res.json()
      const reply = data?.reply || 'ไม่มีการตอบกลับ'
      if (typeof reply === 'string') {
        setMessages((m) => [...m, { role: 'assistant', text: reply }])
      } else {
        console.error('Invalid reply format:', reply)
        setMessages((m) => [...m, { role: 'assistant', text: 'เกิดข้อผิดพลาดในการรับคำตอบ' }])
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setMessages((m) => [...m, { 
        role: 'assistant', 
        text: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err instanceof Error ? err.message : 'Unknown error'}` 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea
        ref={messagesContainerRef}
        className="flex-1 flex flex-col gap-6 min-h-0 px-1 py-6 scrollbar-thin"
      >
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-full text-slate-400 text-lg font-medium">
            Start a conversation
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-[messageEnter_0.25s_ease-out] ${
              m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {m.role === 'assistant' && (
              <Avatar className="w-8 h-8 bg-slate-800 text-slate-300 text-xs font-medium flex-shrink-0 mt-1">
                AI
              </Avatar>
            )}
            <div className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-[70%]`}>
              <div
                className={`rounded-2xl px-4 py-3 text-[16px] leading-[1.6] whitespace-pre-wrap break-words ${
                  m.role === 'user'
                    ? 'bg-accent text-white rounded-br-sm'
                    : 'bg-slate-800/60 text-slate-100 rounded-bl-sm border border-slate-700/50'
                }`}
              >
                {m.text}
              </div>
            </div>
            {m.role === 'user' && (
              <Avatar className="w-8 h-8 bg-slate-700 text-slate-200 text-xs font-medium flex-shrink-0 mt-1">
                You
              </Avatar>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 flex-row items-start animate-[messageEnter_0.25s_ease-out]">
            <Avatar className="w-8 h-8 bg-slate-800 text-slate-300 text-xs font-medium flex-shrink-0 mt-1">
              AI
            </Avatar>
            <div className="flex flex-col gap-1 items-start max-w-[75%] sm:max-w-[70%]">
              <div className="bg-slate-800/60 text-slate-400 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 border border-slate-700/50">
                <span className="text-[16px]">Thinking</span>
                <span className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-[typingDot_1.4s_infinite] opacity-30"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-[typingDot_1.4s_infinite] opacity-30" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-[typingDot_1.4s_infinite] opacity-30" style={{ animationDelay: '0.3s' }}></span>
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </ScrollArea>

      <div className="flex-shrink-0 pt-4 pb-2 border-t border-slate-800">
        <form
          onSubmit={handleSend}
          className="flex gap-3 items-center"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 px-4 py-3.5 bg-slate-800/60 border-slate-700 text-slate-100 placeholder-slate-500 text-[16px] rounded-2xl focus-visible:ring-accent/50 focus-visible:border-accent/50"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3.5 rounded-2xl text-[16px] bg-accent text-white hover:opacity-90 disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-50 shadow-lg shadow-accent/20"
          >
            Send
          </Button>
        </form>
      </div>

      <style jsx>{`
        @keyframes messageEnter {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes typingDot {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.9);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
