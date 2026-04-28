// GET   /api/shares/[shareId] — get share details
// PATCH /api/shares/[shareId] — update permission or expiry
// DELETE /api/shares/[shareId] — revoke share

import { NextResponse } from 'next/server'
import { queryOne, execute } from '../../../lib/db'
import { getAuthFromRequest, hasPermission } from '../../../lib/auth'
import { writeAuditLog } from '../../../lib/rbac'

type Params = { params: { shareId: string } }

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const share = await queryOne<{
    id: string; conversation_id: string; owner_user_id: string | null
    target_user_id: string | null; share_type: string; permission: string
    expires_at: string | null; revoked_at: string | null; created_at: string
  }>(
    `SELECT id, conversation_id, owner_user_id, target_user_id, share_type, permission,
            expires_at, revoked_at, created_at
     FROM chat_shares WHERE id = $1`,
    [params.shareId]
  )

  if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Must be owner, target, or have manage permission
  const canView =
    share.owner_user_id === auth.sub ||
    share.target_user_id === auth.sub ||
    hasPermission(auth, 'chat.share.manage')

  if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({ share })
}

// ── PATCH — update permission / expiry ────────────────────────────────────────
export async function PATCH(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const share = await queryOne<{ id: string; owner_user_id: string | null; revoked_at: string | null }>(
    `SELECT id, owner_user_id, revoked_at FROM chat_shares WHERE id = $1`,
    [params.shareId]
  )
  if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (share.revoked_at) return NextResponse.json({ error: 'Share is already revoked' }, { status: 400 })

  const isOwner = share.owner_user_id === auth.sub
  if (!isOwner && !hasPermission(auth, 'chat.share.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body: { permission?: string; expiresInDays?: number | null } = await req.json().catch(() => ({}))
  const updates: string[] = []
  const vals: unknown[] = []
  let idx = 1

  if (body.permission !== undefined) {
    updates.push(`permission = $${idx++}`)
    vals.push(body.permission)
  }
  if (body.expiresInDays !== undefined) {
    const exp = body.expiresInDays === null
      ? null
      : new Date(Date.now() + body.expiresInDays * 86400_000).toISOString()
    updates.push(`expires_at = $${idx++}`)
    vals.push(exp)
  }

  if (updates.length === 0) return NextResponse.json({ ok: true })

  vals.push(params.shareId)
  await execute(`UPDATE chat_shares SET ${updates.join(', ')} WHERE id = $${idx}`, vals)

  await execute(
    `INSERT INTO chat_share_audit_logs (share_id, actor_id, action, detail)
     VALUES ($1, $2, 'updated', $3)`,
    [params.shareId, auth.sub, JSON.stringify(body)]
  )

  return NextResponse.json({ ok: true })
}

// ── DELETE — revoke share ─────────────────────────────────────────────────────
export async function DELETE(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const share = await queryOne<{
    id: string; conversation_id: string; owner_user_id: string | null; revoked_at: string | null
  }>(
    `SELECT id, conversation_id, owner_user_id, revoked_at FROM chat_shares WHERE id = $1`,
    [params.shareId]
  )
  if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (share.revoked_at) return NextResponse.json({ error: 'Already revoked' }, { status: 400 })

  const isOwner = share.owner_user_id === auth.sub
  if (!isOwner && !hasPermission(auth, 'chat.share.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft revoke — immediate denial on next access attempt
  await execute(
    `UPDATE chat_shares SET revoked_at = NOW() WHERE id = $1`,
    [params.shareId]
  )

  await execute(
    `INSERT INTO chat_share_audit_logs (share_id, actor_id, action, detail)
     VALUES ($1, $2, 'revoked', '{}')`,
    [params.shareId, auth.sub]
  )

  await writeAuditLog({
    tenantId: auth.tenant_id,
    actorId: auth.sub,
    actorEmail: auth.email,
    action: 'chat.share.revoke',
    resource: 'conversation',
    resourceId: share.conversation_id,
    detail: { shareId: params.shareId },
  })

  return NextResponse.json({ ok: true })
}
