// GET    /api/conversations/[id]/shares — list shares for a conversation
// POST   /api/conversations/[id]/shares — create a new share

import { NextResponse } from 'next/server'
import { query, queryOne, queryAuth, queryAuthOne, execute } from '../../../../lib/db'
import { getAuthFromRequest, hasPermission } from '../../../../lib/auth'
import { writeAuditLog } from '../../../../lib/rbac'
import type { CreateShareRequest, CreateShareResponse, ChatShare } from '../../../../types/api'

type Params = { params: { id: string } }

function generateToken(): string {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 24)
}

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Buffer.from(buf).toString('hex')
}

// ── GET — list shares ─────────────────────────────────────────────────────────
export async function GET(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'chat.read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const shares = await queryAuth<{
    id: string; conversation_id: string; owner_user_id: string | null
    target_user_id: string | null; share_type: string; permission: string
    expires_at: string | null; revoked_at: string | null; created_at: string
  }>(
    `SELECT id, conversation_id, owner_user_id, target_user_id, share_type, permission,
            expires_at, revoked_at, created_at
     FROM chat_shares WHERE conversation_id = $1
     ORDER BY created_at DESC`,
    [params.id]
  )

  return NextResponse.json({ shares })
}

// ── POST — create share ───────────────────────────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'chat.share')) {
    return NextResponse.json({ error: 'Forbidden: missing chat.share permission' }, { status: 403 })
  }

  const body: CreateShareRequest = await req.json().catch(() => ({}))
  const { shareType = 'link', permission = 'view', targetUserId, expiresInDays } = body

  // External link shares require chat.share.external
  if (shareType === 'link' && !hasPermission(auth, 'chat.share.external')) {
    return NextResponse.json({ error: 'Forbidden: missing chat.share.external permission' }, { status: 403 })
  }

  // Verify conversation ownership or share.manage
  const conv = await queryAuthOne<{ id: string; owner_id: string | null }>(
    `SELECT id, owner_id FROM conversations WHERE id = $1`,
    [params.id]
  )
  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  const isOwner = conv.owner_id === auth.sub || conv.owner_id === null
  if (!isOwner && !hasPermission(auth, 'chat.share.manage')) {
    return NextResponse.json({ error: 'Forbidden: not the conversation owner' }, { status: 403 })
  }

  let tokenPlain: string | null = null
  let tokenHash: string | null = null

  if (shareType === 'link') {
    tokenPlain = generateToken()
    tokenHash = await hashToken(tokenPlain)
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400_000).toISOString()
    : null

  const shareRow = await queryAuthOne<{ id: string; created_at: string }>(
    `INSERT INTO chat_shares
       (conversation_id, owner_user_id, target_user_id, share_type, permission, token_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, created_at`,
    [params.id, auth.sub, targetUserId ?? null, shareType, permission, tokenHash, expiresAt]
  )

  if (!shareRow) return NextResponse.json({ error: 'Failed to create share' }, { status: 500 })

  // Write audit
  await writeAuditLog({
    tenantId: auth.tenant_id,
    actorId: auth.sub,
    actorEmail: auth.email,
    action: 'chat.share.create',
    resource: 'conversation',
    resourceId: params.id,
    detail: { shareId: shareRow.id, shareType, permission, targetUserId, expiresInDays },
  })

  // Write share-specific audit
  await execute(
    `INSERT INTO chat_share_audit_logs (share_id, actor_id, action, detail)
     VALUES ($1, $2, 'created', $3)`,
    [shareRow.id, auth.sub, JSON.stringify({ shareType, permission })]
  )

  const share: ChatShare = {
    id: shareRow.id,
    conversation_id: params.id,
    owner_user_id: auth.sub,
    target_user_id: targetUserId,
    share_type: shareType,
    permission,
    token: tokenPlain ?? undefined,  // Return plain token only on creation
    expires_at: expiresAt ?? undefined,
    created_at: shareRow.created_at,
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const shareUrl = tokenPlain
    ? `${baseUrl}/share/${tokenPlain}`
    : undefined

  const response: CreateShareResponse = { share, shareUrl: shareUrl ?? '' }
  return NextResponse.json(response, { status: 201 })
}
