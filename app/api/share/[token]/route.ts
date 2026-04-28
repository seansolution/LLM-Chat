// GET /api/share/[token]
// Returns the shared conversation + messages for public read-only view.
// Works with both old share_links table and new chat_shares table.

import { NextResponse } from 'next/server'
import { queryAuth, type DbConversation, type DbMessage } from '../../../lib/db'

type Params = { params: { token: string } }

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Buffer.from(buf).toString('hex')
}

export async function GET(_req: Request, { params }: Params) {
  const { token } = params
  if (!token) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  try {
    let conversationId: string | null = null
    let sharedAt: string | null = null
    let expiresAt: string | null = null

    // Try new chat_shares table first (token_hash)
    const tokenHash = await hashToken(token)
    const shareRows = await queryAuth<{
      id: string
      conversation_id: string
      created_at: string
      expires_at: string | null
      revoked_at: string | null
    }>(
      `SELECT id, conversation_id, created_at, expires_at, revoked_at
       FROM chat_shares
       WHERE token_hash = $1 AND share_type = 'link'
       LIMIT 1`,
      [tokenHash]
    )

    if (shareRows[0]) {
      const share = shareRows[0]
      if (share.revoked_at) {
        return NextResponse.json({ error: 'This share link has been revoked' }, { status: 410 })
      }
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
      }
      conversationId = share.conversation_id
      sharedAt = share.created_at
      expiresAt = share.expires_at
    } else {
      // Fallback: try old share_links table (plain token)
      const linkRows = await queryAuth<{
        id: string
        conversation_id: string
        created_at: string
        expires_at: string | null
      }>(
        `SELECT id, conversation_id, created_at, expires_at
         FROM share_links WHERE token = $1 LIMIT 1`,
        [token]
      )
      if (!linkRows[0]) {
        return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 })
      }
      const link = linkRows[0]
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
      }
      conversationId = link.conversation_id
      sharedAt = link.created_at
      expiresAt = link.expires_at
    }

    // Load conversation + messages
    const [convRows, msgRows] = await Promise.all([
      queryAuth<DbConversation>(
        `SELECT id, title, mode, created_at FROM conversations WHERE id = $1`,
        [conversationId]
      ),
      queryAuth<DbMessage>(
        `SELECT id, role, content, model_id, provider, compare_group, latency_ms, created_at
         FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC`,
        [conversationId]
      ),
    ])

    if (!convRows[0]) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({
      conversation: convRows[0],
      messages: msgRows,
      sharedAt,
      expiresAt,
    })
  } catch (err) {
    console.error('[Share GET]', err)
    return NextResponse.json({ error: 'Failed to load shared conversation' }, { status: 500 })
  }
}
