// POST /api/auth/logout — clear auth cookie

import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  const forceSecureCookie = process.env.COOKIE_SECURE
  const secureCookie = forceSecureCookie
    ? forceSecureCookie === 'true'
    : process.env.NODE_ENV === 'production' && (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://')

  res.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: secureCookie,
    expires: new Date(0),
    path: '/',
  })
  return res
}
