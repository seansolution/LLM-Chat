'use client'
// ─── CodeBlock — Syntax-highlighted code with copy button ─────────────────────
// Pure CSS-based highlighting — no heavy packages needed.
// Supports: JavaScript/TypeScript, Python, SQL, Bash, JSON, HTML/CSS, and more.

import React from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

const LANG_ALIASES: Record<string, string> = {
  js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
  py: 'python', sh: 'bash', shell: 'bash', zsh: 'bash',
  yml: 'yaml', tf: 'terraform', rb: 'ruby', rs: 'rust',
  go: 'go', java: 'java', cpp: 'cpp', c: 'c', cs: 'csharp',
}

function normalizeLanguage(lang: string): string {
  const lower = lang.toLowerCase().trim()
  return LANG_ALIASES[lower] || lower
}

// Minimal token-based highlighter — regex patterns per language category
function highlight(code: string, lang: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Patterns: order matters — more specific first
  type Replacer = string | ((...args: string[]) => string)
  const patterns: [RegExp, Replacer][] = []

  // Strings (double, single, backtick)
  patterns.push([/(&#x60;[^&#x60;]*&#x60;|&quot;(?:[^&]|&(?!quot;))*&quot;|&#39;[^&#39;]*&#39;)/g, 'str'])

  if (['javascript', 'typescript', 'jsx', 'tsx', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'swift'].includes(lang)) {
    patterns.push([/\b(const|let|var|function|class|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|import|export|from|default|async|await|try|catch|finally|throw|void|null|undefined|true|false|this|super|extends|implements|interface|type|enum|namespace|module|require|of|in|yield|static|public|private|protected|readonly|abstract|override)\b/g, 'kw'])
    patterns.push([/\b([A-Z][A-Za-z0-9_]*)\b/g, 'type'])
    patterns.push([/\/\/.*/g, 'cmt'])
    patterns.push([/\/\*[\s\S]*?\*\//g, 'cmt'])
  }

  if (lang === 'python') {
    patterns.push([/\b(def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|pass|break|continue|yield|lambda|and|or|not|in|is|None|True|False|async|await|global|nonlocal|del|assert)\b/g, 'kw'])
    patterns.push([/\b([A-Z][A-Za-z0-9_]*)\b/g, 'type'])
    patterns.push([/#.*/g, 'cmt'])
    patterns.push([/("""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\')/g, 'str'])
  }

  if (lang === 'sql') {
    patterns.push([/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|VIEW|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|DEFAULT|NULL|NOT NULL|IF|EXISTS|DISTINCT|COUNT|SUM|AVG|MIN|MAX|COALESCE|CAST|CASE|WHEN|THEN|ELSE|END|WITH|RETURNING|EXPLAIN|BEGIN|COMMIT|ROLLBACK|TRANSACTION)\b/gi, 'kw'])
    patterns.push([/--.*$/gm, 'cmt'])
  }

  if (['bash', 'shell'].includes(lang)) {
    patterns.push([/\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|export|local|readonly|declare|echo|cd|ls|grep|awk|sed|curl|wget|mkdir|rm|cp|mv|chmod|chown|source|exec)\b/g, 'kw'])
    patterns.push([/#.*/g, 'cmt'])
  }

  if (lang === 'json') {
    patterns.push([/("[^"]*")(\s*:)/g, (_m: string, k: string, c: string) => `<span class="hl-key">${k}</span>${c}`])
    patterns.push([/\b(true|false|null)\b/g, 'kw'])
  }

  // Numbers
  patterns.push([/\b(\d+\.?\d*)\b/g, 'num'])

  // Apply patterns
  let result = escaped
  for (const [pattern, cls] of patterns) {
    if (typeof cls === 'function') {
      result = result.replace(pattern, cls)
    } else {
      result = result.replace(pattern, (m: string) => `<span class="hl-${cls}">${m}</span>`)
    }
  }

  return result
}

export default function CodeBlock({ code, language = '', className = '' }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)
  const lang = normalizeLanguage(language)
  const highlighted = highlight(code, lang)

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }).catch(() => {
      // Fallback: create temp textarea
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className={`relative group my-3 rounded-xl overflow-hidden border border-slate-700/60 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/60">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors px-2 py-1 rounded hover:bg-slate-700/60"
          title="Copy code"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/>
                <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed bg-slate-900/80 text-slate-200 font-mono">
        <code
          dangerouslySetInnerHTML={{ __html: highlighted }}
          className="hljs"
        />
      </pre>
      <style>{`
        .hl-kw  { color: #c792ea; }
        .hl-str { color: #c3e88d; }
        .hl-cmt { color: #546e7a; font-style: italic; }
        .hl-num { color: #f78c6c; }
        .hl-type { color: #82aaff; }
        .hl-key { color: #89ddff; }
      `}</style>
    </div>
  )
}

// ─── Parse message content into text + code blocks ───────────────────────────
interface Part {
  type: 'text' | 'code'
  content: string
  language?: string
}

export function parseMessageContent(text: string): Part[] {
  const parts: Part[] = []
  const regex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'code', language: match[1] || '', content: match[2].trim() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}

// ─── MessageContent — renders text + code blocks ─────────────────────────────
export function MessageContent({ content }: { content: string }) {
  const parts = parseMessageContent(content)

  return (
    <div className="flex flex-col gap-1">
      {parts.map((part, i) => {
        if (part.type === 'code') {
          return <CodeBlock key={i} code={part.content} language={part.language} />
        }
        // Render text with basic markdown: **bold**, *italic*, `inline code`
        const rendered = part.content
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
        return (
          <p
            key={i}
            className="whitespace-pre-wrap break-words leading-relaxed"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        )
      })}
    </div>
  )
}
