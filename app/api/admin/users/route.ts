// GET  /api/admin/users — list all users in tenant
// POST /api/admin/users — create a new user

import { NextResponse } from 'next/server'
import { queryAuth, queryAuthOne } from '../../../lib/db'
import { getAuthFromRequest, hasPermission } from '../../../lib/auth'
import { assignRole, writeAuditLog } from '../../../lib/rbac'
import type { AdminUser, CreateUserRequest } from '../../../types/api'

function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'users.read')) return forbidden()

  const users = await queryAuth<{
    id: string; email: string; name: string | null
    is_active: boolean; force_password_change: boolean
    token_limit: number | null; token_used: number
    created_at: string; last_login_at: string | null
  }>(
    `SELECT id, email, name, is_active, force_password_change, token_limit, token_used, created_at, last_login_at
     FROM users WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [auth.tenant_id]
  )

  const userIds = users.map(u => u.id)
  const roleRows = userIds.length > 0
    ? await queryAuth<{ user_id: string; name: string }>(
        `SELECT ur.user_id, r.name
         FROM user_roles ur JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = ANY($1::uuid[])`,
        [userIds]
      )
    : []

  const rolesByUser = roleRows.reduce<Record<string, string[]>>((acc, r) => {
    acc[r.user_id] = [...(acc[r.user_id] || []), r.name]
    return acc
  }, {})

  const result: AdminUser[] = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name ?? undefined,
    roles: rolesByUser[u.id] || [],
    is_active: u.is_active,
    force_password_change: u.force_password_change,
    token_limit: u.token_limit,
    token_used: Number(u.token_used || 0),
    created_at: u.created_at,
    last_login_at: u.last_login_at ?? undefined,
  }))

  return NextResponse.json({ users: result })
}

export async function POST(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'users.write')) return forbidden()

  const body: CreateUserRequest = await req.json().catch(() => ({}))
  const { email, name, password, roles = ['viewer'], token_limit = null } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
  }

  const existing = await queryAuthOne<{ id: string }>(
    `SELECT id FROM users WHERE tenant_id = $1 AND email = $2`,
    [auth.tenant_id, email.toLowerCase().trim()]
  )
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const userRow = await queryAuthOne<{ id: string }>(
    `INSERT INTO users (tenant_id, email, name, password_hash, force_password_change, token_limit, token_used)
     VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), TRUE, $5, 0)
     RETURNING id`,
    [auth.tenant_id, email.toLowerCase().trim(), name ?? null, password, token_limit]
  )

  if (!userRow) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }

  for (const role of roles) {
    try {
      await assignRole(userRow.id, role as import('../../../types/api').Role, auth.tenant_id, auth.sub)
    } catch (e) {
      console.error('[Admin] role assign error:', e)
    }
  }

  await writeAuditLog({
    tenantId: auth.tenant_id,
    actorId: auth.sub,
    actorEmail: auth.email,
    action: 'users.create',
    resource: 'user',
    resourceId: userRow.id,
    detail: { email, roles, token_limit },
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ id: userRow.id, email, roles, token_limit }, { status: 201 })
}
