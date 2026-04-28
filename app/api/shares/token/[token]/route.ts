// GET /api/shares/token/[token] — validate a link-share token and return conversation

import { NextResponse } from 'next/server'
import { queryOne, query, execute } from '../../../../lib/db'
import type { ConversationDetail, MessageRecord } from '../../../../types/api'

type Params = { params: { token: string } }

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Buffer.from(buf).toString('hex')
}

export async function GET(req: Request, { params }: Params) {
  const tokenHash = await hashToken(params.token)

  // Look up share by token hash
  const share = await queryOne<{
    id: string; conversation_id: string; permission: string
    expires_at: string | null; revoked_at: string | null
  }>(
    `SELECT id, conversation_id, permission, expires_at, revoked_at
     FROM chat_shares
     WHERE token_hash = $1 AND share_type = 'link'`,
    [tokenHash]
  )

  if (!share) {
    return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
  }

  // Check revocation — immediate denial
  if (share.revoked_at) {
    return NextResponse.json({ error: 'This share link has been revoked' }, { status: 403 })
  }

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This share link has expired' }, { status: 403 })
  }

  // Load conversation
  const conv = await queryOne<{
    id: string; title: string; mode: string
    system_prompt: string | null; created_at: string; updated_at: string
  }>(
    `SELECT id, title, mode, system_prompt, created_at, updated_at
     FROM conversations WHERE id = $1`,
    [share.conversation_id]
  )

  if (!conv) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Load messages (read-only)
  const messages = await query<{
    id: string; conversation_id: string; role: string; content: string
    model_id: string | null; provider: string | null; compare_group: string | null
    latency_ms: number | null; token_count: number | null; created_at: string
  }>(
    `SELECT id, conversation_id, role, content, model_id, provider,
            compare_group, latency_ms, token_count, created_at
     FROM messages WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [share.conversation_id]
  )

  // Write access event to share audit log
  await execute(
    `INSERT INTO chat_share_audit_logs (share_id, action, detail)
     VALUES ($1, 'accessed', $2)`,
    [share.id, JSON.stringify({ via: 'link', ip: req.headers.get('x-forwarded-for') })]
  ).catch(() => {}) // non-fatal

  const detail: ConversationDetail = {
    id: conv.id,
    title: conv.title,
    mode: conv.mode,
    system_prompt: conv.system_prompt ?? undefined,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
    messages: messages.map((m): MessageRecord => ({
      id: m.id,
      conversation_id: m.conversation_id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      model_id: m.model_id ?? undefined,
      provider: m.provider ?? undefined,
      compare_group: m.compare_group ?? undefined,
      latency_ms: m.latency_ms ?? undefined,
      token_count: m.token_count ?? undefined,
      created_at: m.created_at,
    })),
  }

  return NextResponse.json({
    conversation: detail,
    sharePermission: share.permission,
    expiresAt: share.expires_at,
  })
}
