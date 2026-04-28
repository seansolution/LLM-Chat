import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-32chars!!'

function decodeBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
}

async function verifyJWT(token: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false

    const [header, payload, signature] = parts
    const data = `${header}.${payload}`
    const signatureBytes = decodeBase64Url(signature)

    const key = await importHmacKey(JWT_SECRET)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(data)
    )
    if (!valid) return false

    const payloadJson = new TextDecoder().decode(decodeBase64Url(payload))
    const claims = JSON.parse(payloadJson) as { exp?: number }
    if (!claims.exp) return false

    return claims.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

function isProtectedApi(pathname: string): boolean {
  if (pathname === '/api/chat') return true
  if (pathname.startsWith('/api/admin/')) return true
  if (pathname.startsWith('/api/conversations/')) return true
  if (pathname.startsWith('/api/shares/')) return true
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const authHeader = req.headers.get('authorization') || ''
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : undefined
  const cookieToken = req.cookies.get('auth_token')?.value
  const token = bearerToken || cookieToken
  const isAuthed = Boolean(token)

  const isProtectedPage = pathname === '/' || pathname.startsWith('/admin')

  if (isProtectedApi(pathname) && !isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isProtectedPage && !isAuthed) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' && isAuthed) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/api/chat', '/api/admin/:path*', '/api/conversations/:path*', '/api/shares/:path*'],
}
