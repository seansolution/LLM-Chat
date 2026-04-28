// GET   /api/admin/users/[id] — get user detail
// PATCH /api/admin/users/[id] — update user
// DELETE /api/admin/users/[id] — deactivate user

import { NextResponse } from 'next/server'
import { queryAuthOne, execute } from '../../../../lib/db'
import { getAuthFromRequest, hasPermission } from '../../../../lib/auth'
import { assignRole, revokeRole, writeAuditLog } from '../../../../lib/rbac'
import type { UpdateUserRequest, Role } from '../../../../types/api'

type Params = { params: { id: string } }

function forbidden() { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(_req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'users.read')) return forbidden()

  const user = await queryAuthOne<{
    id: string; email: string; name: string | null
    is_active: boolean; force_password_change: boolean
    token_limit: number | null; token_used: number
    created_at: string; last_login_at: string | null; tenant_id: string
  }>(
    `SELECT id, email, name, is_active, force_password_change, token_limit, token_used, created_at, last_login_at, tenant_id
     FROM users WHERE id = $1 AND tenant_id = $2`,
    [params.id, auth.tenant_id]
  )
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ user })
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'users.write')) return forbidden()

  const body: UpdateUserRequest & { roles?: Role[] } = await req.json().catch(() => ({}))
  const { name, email, is_active, roles, token_limit, token_used } = body

  // Update scalar fields
  const updates: string[] = []
  const vals: unknown[] = []
  let idx = 1
  if (name !== undefined) { updates.push(`name = $${idx++}`); vals.push(name) }
  if (email !== undefined) { updates.push(`email = $${idx++}`); vals.push(email.toLowerCase().trim()) }
  if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); vals.push(is_active) }
  if (token_limit !== undefined) { updates.push(`token_limit = $${idx++}`); vals.push(token_limit) }
  if (token_used !== undefined) { updates.push(`token_used = $${idx++}`); vals.push(Math.max(0, Number(token_used) || 0)) }

  if (updates.length > 0) {
    updates.push(`updated_at = NOW()`)
    vals.push(params.id, auth.tenant_id)
    await execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx}`,
      vals
    )
  }

  // Role reassignment
  if (roles !== undefined) {
    // Remove all current roles, add new ones
    await execute(
      `DELETE FROM user_roles ur
       USING roles r
       WHERE ur.role_id = r.id AND ur.user_id = $1 AND r.tenant_id = $2`,
      [params.id, auth.tenant_id]
    )
    for (const role of roles) {
      await assignRole(params.id, role, auth.tenant_id, auth.sub)
    }
  }

  await writeAuditLog({
    tenantId: auth.tenant_id,
    actorId: auth.sub,
    actorEmail: auth.email,
    action: 'users.update',
    resource: 'user',
    resourceId: params.id,
    detail: body as Record<string, unknown>,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'users.delete')) return forbidden()

  // Prevent self-deletion
  if (params.id === auth.sub) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  await execute(
    `UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
    [params.id, auth.tenant_id]
  )

  await writeAuditLog({
    tenantId: auth.tenant_id,
    actorId: auth.sub,
    actorEmail: auth.email,
    action: 'users.delete',
    resource: 'user',
    resourceId: params.id,
  })

  return NextResponse.json({ ok: true })
}
