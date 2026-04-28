// GET /api/admin/audit — paginated audit log

import { NextResponse } from 'next/server'
import { queryAuth } from '../../../lib/db'
import { getAuthFromRequest, hasPermission } from '../../../lib/auth'
import type { AuditLogEntry, PaginatedResponse } from '../../../types/api'

export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'audit.read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const page     = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get('pageSize') || '50')))
  const action   = url.searchParams.get('action') || null
  const offset   = (page - 1) * pageSize

  const conditions: string[] = ['tenant_id = $1']
  const vals: unknown[] = [auth.tenant_id]
  let paramIdx = 2

  if (action) {
    conditions.push(`action = $${paramIdx++}`)
    vals.push(action)
  }

  const where = `WHERE ${conditions.join(' AND ')}`
  const limitIdx = paramIdx++
  const offsetIdx = paramIdx

  const [rows, countRow] = await Promise.all([
    queryAuth<{
      id: string; actor_email: string | null; action: string
      resource: string; resource_id: string | null; detail: Record<string, unknown>
      ip_address: string | null; created_at: string
    }>(
      `SELECT id, actor_email, action, resource, resource_id, detail, ip_address, created_at
       FROM audit_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...vals, pageSize, offset]
    ),
    queryAuth<{ count: string }>(
      `SELECT COUNT(*) AS count FROM audit_logs ${where}`,
      vals
    ),
  ])

  const total = parseInt(countRow[0]?.count ?? '0')
  const items: AuditLogEntry[] = rows.map(r => ({
    id: r.id,
    actor_email: r.actor_email ?? undefined,
    action: r.action,
    resource: r.resource,
    resource_id: r.resource_id ?? undefined,
    detail: r.detail,
    ip_address: r.ip_address ?? undefined,
    created_at: r.created_at,
  }))

  const response: PaginatedResponse<AuditLogEntry> = {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + pageSize < total,
  }

  return NextResponse.json(response)
}
