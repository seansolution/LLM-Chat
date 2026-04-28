// GET /api/auth/me — return current user profile from JWT

import { NextResponse } from 'next/server'
import { getAuthFromRequest, profileFromPayload } from '../../../lib/auth'
import { queryAuthOne } from '../../../lib/db'

export async function GET(req: Request) {
  const payload = await getAuthFromRequest(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const row = await queryAuthOne<{ force_password_change: boolean; is_active: boolean }>(
    `SELECT force_password_change, is_active FROM users WHERE id = $1`,
    [payload.sub]
  )

  if (!row?.is_active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    user: profileFromPayload(payload),
    requiresPasswordChange: !!row.force_password_change,
  })
}
