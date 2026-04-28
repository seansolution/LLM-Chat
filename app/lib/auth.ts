// ─── JWT Auth Library ─────────────────────────────────────────────────────────
// Signs and verifies JWTs without external dependencies.
// Uses the WebCrypto API (available in Next.js Edge + Node ≥18).

import type { UserProfile, Permission } from '../types/api'

export interface JWTPayload {
  sub: string          // user ID
  email: string
  name?: string
  tenant_id: string
  roles: string[]
  permissions: Permission[]
  iat: number
  exp: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-32chars!!'
const TOKEN_TTL_SECONDS = 60 * 60 * 8  // 8 hours

// ─── Encoding helpers ─────────────────────────────────────────────────────────

function base64url(buf: Uint8Array): string {
  const b64 = Buffer.from(buf).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return new Uint8Array(Buffer.from(b64, 'base64'))
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const full: JWTPayload = { ...payload, iat: now, exp: now + TOKEN_TTL_SECONDS }

  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body   = base64url(new TextEncoder().encode(JSON.stringify(full)))
  const data   = `${header}.${body}`

  const key = await getKey(JWT_SECRET)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))

  return `${data}.${base64url(new Uint8Array(sig))}`
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, body, sig] = parts
    const data = `${header}.${body}`
    const key  = await getKey(JWT_SECRET)

    const sigBuf = base64urlDecode(sig)
    const dataBuf = new TextEncoder().encode(data)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuf.buffer as ArrayBuffer,
      dataBuf
    )
    if (!valid) return null

    const payload: JWTPayload = JSON.parse(
      Buffer.from(base64urlDecode(body)).toString('utf8')
    )

    if (payload.exp < Math.floor(Date.now() / 1000)) return null  // expired

    return payload
  } catch {
    return null
  }
}

// ─── Extract from request ─────────────────────────────────────────────────────

export async function getAuthFromRequest(req: Request): Promise<JWTPayload | null> {
  const authHeader = req.headers.get('authorization') || ''
  if (authHeader.startsWith('Bearer ')) {
    return verifyJWT(authHeader.slice(7))
  }
  // Also check cookie for browser-based requests
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/)
  if (match) {
    return verifyJWT(decodeURIComponent(match[1]))
  }
  return null
}

// ─── Permission check ─────────────────────────────────────────────────────────

export function hasPermission(payload: JWTPayload, ...required: Permission[]): boolean {
  if (payload.permissions.includes('system.admin')) return true
  return required.every(p => payload.permissions.includes(p))
}

// ─── Build UserProfile from JWT payload ──────────────────────────────────────

export function profileFromPayload(payload: JWTPayload): UserProfile {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    roles: payload.roles,
    permissions: payload.permissions,
    tenant_id: payload.tenant_id,
    created_at: new Date(payload.iat * 1000).toISOString(),
  }
}
