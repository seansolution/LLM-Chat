import { NextResponse } from 'next/server'
import { getAuthFromRequest } from '../../../lib/auth'
import { queryAuthOne, execute } from '../../../lib/db'
import { writeAuditLog } from '../../../lib/rbac'

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export async function POST(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: ChangePasswordRequest = await req.json().catch(() => ({ currentPassword: '', newPassword: '' }))
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  const verify = await queryAuthOne<{ ok: boolean }>(
    `SELECT (password_hash = crypt($1, password_hash)) AS ok FROM users WHERE id = $2`,
    [currentPassword, auth.sub]
  )
  if (!verify?.ok) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  await execute(
    `UPDATE users
     SET password_hash = crypt($1, gen_salt('bf', 12)),
         force_password_change = FALSE,
         updated_at = NOW()
     WHERE id = $2`,
    [newPassword, auth.sub]
  )

  await writeAuditLog({
    tenantId: auth.tenant_id,
    actorId: auth.sub,
    actorEmail: auth.email,
    action: 'auth.change_password',
    resource: 'user',
    resourceId: auth.sub,
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ ok: true })
}
