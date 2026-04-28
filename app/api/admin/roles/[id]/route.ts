// PATCH /api/admin/roles/[id] — update permissions for a non-builtin role

import { NextResponse } from 'next/server'
import { queryAuthOne, execute } from '../../../../lib/db'
import { getAuthFromRequest, hasPermission } from '../../../../lib/auth'
import { writeAuditLog } from '../../../../lib/rbac'

type Params = { params: { id: string } }

export async function PATCH(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'roles.write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const role = await queryAuthOne<{ id: string; is_builtin: boolean; tenant_id: string }>(
    `SELECT id, is_builtin, tenant_id FROM roles WHERE id = $1`,
    [params.id]
  )
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (role.is_builtin) {
    return NextResponse.json({ error: 'Cannot modify built-in roles' }, { status: 403 })
  }
  if (role.tenant_id !== auth.tenant_id && !hasPermission(auth, 'system.admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body: { permissions?: string[] } = await req.json().catch(() => ({}))
  const perms = body.permissions ?? []

  // Replace all permissions for this role
  await execute(`DELETE FROM role_permissions WHERE role_id = $1`, [params.id])
  if (perms.length > 0) {
    await execute(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT $1, id FROM permissions WHERE key = ANY($2::text[])
       ON CONFLICT DO NOTHING`,
      [params.id, perms]
    )
  }

  await writeAuditLog({
    tenantId: auth.tenant_id,
    actorId: auth.sub,
    actorEmail: auth.email,
    action: 'roles.update_permissions',
    resource: 'role',
    resourceId: params.id,
    detail: { permissions: perms },
  })

  return NextResponse.json({ ok: true })
}
