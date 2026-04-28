// ─── RBAC helper ─────────────────────────────────────────────────────────────
// Server-side permission checks and user/role queries.

import { query, queryAuth, queryOne, execute } from './db'
import type { Permission, Role } from '../types/api'

// ─── User permissions from DB ─────────────────────────────────────────────────

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const rows = await queryAuth<{ key: string }>(
    `SELECT DISTINCT p.key
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = $1`,
    [userId]
  )
  return rows.map(r => r.key as Permission)
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const rows = await queryAuth<{ name: string }>(
    `SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1`,
    [userId]
  )
  return rows.map(r => r.name)
}

// ─── Audit log helper ─────────────────────────────────────────────────────────

export async function writeAuditLog(opts: {
  tenantId?: string
  actorId?: string
  actorEmail?: string
  action: string
  resource: string
  resourceId?: string
  detail?: Record<string, unknown>
  ipAddress?: string
}): Promise<void> {
  try {
    await execute(
      `INSERT INTO audit_logs
         (tenant_id, actor_id, actor_email, action, resource, resource_id, detail, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        opts.tenantId ?? null,
        opts.actorId ?? null,
        opts.actorEmail ?? null,
        opts.action,
        opts.resource,
        opts.resourceId ?? null,
        JSON.stringify(opts.detail ?? {}),
        opts.ipAddress ?? null,
      ]
    )
  } catch (err) {
    console.error('[AuditLog] write error:', err)
  }
}

// ─── Role assignment ──────────────────────────────────────────────────────────

export async function assignRole(
  userId: string,
  role: Role,
  tenantId: string,
  grantedBy?: string
): Promise<void> {
  const roleRow = await queryOne<{ id: string }>(
    `SELECT id FROM roles WHERE tenant_id = $1 AND name = $2`,
    [tenantId, role]
  )
  if (!roleRow) throw new Error(`Role "${role}" not found in tenant ${tenantId}`)

  await execute(
    `INSERT INTO user_roles (user_id, role_id, granted_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, role_id) DO NOTHING`,
    [userId, roleRow.id, grantedBy ?? null]
  )
}

export async function revokeRole(
  userId: string,
  role: Role,
  tenantId: string
): Promise<void> {
  await execute(
    `DELETE FROM user_roles ur
     USING roles r
     WHERE ur.role_id = r.id
       AND ur.user_id = $1
       AND r.tenant_id = $2
       AND r.name = $3`,
    [userId, tenantId, role]
  )
}
