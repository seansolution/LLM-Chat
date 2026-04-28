// POST /api/auth/login — email + password → JWT

import { NextResponse } from 'next/server'
import { queryOne, queryAuthOne, execute } from '../../../lib/db'
import { signJWT } from '../../../lib/auth'
import { getUserPermissions, getUserRoles, writeAuditLog } from '../../../lib/rbac'
import type { LoginRequest, LoginResponse } from '../../../types/api'

export async function POST(req: Request) {
  try {
    const body: LoginRequest = await req.json().catch(() => ({}))
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
    }

    // Lookup user — use queryAuthOne to bypass RLS (no session exists yet at login)
    const user = await queryAuthOne<{
      id: string
      email: string
      name: string | null
      password_hash: string
      is_active: boolean
      force_password_change: boolean
      tenant_id: string
    }>(
      `SELECT id, email, name, password_hash, is_active, force_password_change, tenant_id
       FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    )

    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password via pgcrypto bcrypt
    const verifyRow = await queryAuthOne<{ ok: boolean }>(
      `SELECT (password_hash = crypt($1, password_hash)) AS ok FROM users WHERE id = $2`,
      [password, user.id]
    )
    if (!verifyRow?.ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Load roles + permissions
    const [roles, permissions] = await Promise.all([
      getUserRoles(user.id),
      getUserPermissions(user.id),
    ])

    // Sign JWT
    const token = await signJWT({
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
      tenant_id: user.tenant_id,
      roles,
      permissions,
    })

    // Update last_login_at
    await execute(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    )

    await writeAuditLog({
      tenantId: user.tenant_id,
      actorId: user.id,
      actorEmail: user.email,
      action: 'auth.login',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const response: LoginResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        roles,
        permissions,
        tenant_id: user.tenant_id,
        created_at: new Date().toISOString(),
      },
      requiresPasswordChange: user.force_password_change,
    }

    // Also set HttpOnly cookie for browser clients
    const res = NextResponse.json(response)
    const forceSecureCookie = process.env.COOKIE_SECURE
    const secureCookie = forceSecureCookie
      ? forceSecureCookie === 'true'
      : process.env.NODE_ENV === 'production' && (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://')

    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[Auth] login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
