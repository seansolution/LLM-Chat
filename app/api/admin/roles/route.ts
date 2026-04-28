// GET   /api/admin/roles — list roles with their permissions
// POST  /api/admin/roles — create a custom role (non-builtin)
// PATCH /api/admin/roles/[id] — update permissions

import { NextResponse } from 'next/server'
import { queryAuth, queryAuthOne, execute } from '../../../lib/db'
import { getAuthFromRequest, hasPermission } from '../../../lib/auth'
import { writeAuditLog } from '../../../lib/rbac'

function forbidden() { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

// GET /api/admin/roles
export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'roles.read')) return forbidden()

  const roles = await queryAuth<{ id: string; name: string; description: string | null; is_builtin: boolean }>(
    `SELECT id, name, description, is_builtin FROM roles WHERE tenant_id = $1 ORDER BY name`,
    [auth.tenant_id]
  )

  const permRows = await queryAuth<{ role_id: string; key: string; category: string | null }>(
    `SELECT rp.role_id, p.key, p.category
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     JOIN roles r ON r.id = rp.role_id
     WHERE r.tenant_id = $1`,
    [auth.tenant_id]
  )

  const permsByRole = permRows.reduce<Record<string, string[]>>((acc, r) => {
    acc[r.role_id] = [...(acc[r.role_id] || []), r.key]
    return acc
  }, {})

  return NextResponse.json({
    roles: roles.map(r => ({
      ...r,
      permissions: permsByRole[r.id] || [],
    })),
  })
}

// POST /api/admin/roles — create custom role
export async function POST(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'roles.write')) return forbidden()

  const body: { name: string; description?: string; permissions?: string[] } = await req.json().catch(() => ({}))
  if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const roleRow = await queryAuthOne<{ id: string }>(
    `INSERT INTO roles (tenant_id, name, description, is_builtin)
     VALUES ($1, $2, $3, FALSE) RETURNING id`,
    [auth.tenant_id, body.name, body.description ?? null]
  )
  if (!roleRow) return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })

  if (body.permissions?.length) {
    await execute(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT $1, id FROM permissions WHERE key = ANY($2::text[])
       ON CONFLICT DO NOTHING`,
      [roleRow.id, body.permissions]
    )
  }

  await writeAuditLog({
    tenantId: auth.tenant_id,
    actorId: auth.sub,
    actorEmail: auth.email,
    action: 'roles.create',
    resource: 'role',
    resourceId: roleRow.id,
    detail: { name: body.name, permissions: body.permissions },
  })

  return NextResponse.json({ id: roleRow.id }, { status: 201 })
}
