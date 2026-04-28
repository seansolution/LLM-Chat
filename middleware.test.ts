/** @jest-environment node */

import { NextRequest } from 'next/server'
import { middleware } from './middleware'
import { signJWT } from './app/lib/auth'

async function makeToken() {
  return signJWT({
    sub: '00000000-0000-0000-0000-000000000001',
    email: 'tester@example.com',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    roles: ['admin'],
    permissions: ['system.admin'],
  })
}

describe('middleware auth guard', () => {
  it('redirects unauthenticated user from / to /login', async () => {
    const req = new NextRequest('http://localhost/')
    const res = await middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('returns 401 for unauthenticated protected API', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    })
    const res = await middleware(req)

    expect(res.status).toBe(401)
  })

  it('allows authenticated API access via Bearer token header', async () => {
    const token = await makeToken()
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    })
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it('allows authenticated access to protected page', async () => {
    const token = await makeToken()
    const req = new NextRequest('http://localhost/admin/users', {
      headers: { cookie: `auth_token=${encodeURIComponent(token)}` },
    })
    const res = await middleware(req)

    expect(res.status).toBe(200)
  })

  it('redirects authenticated user away from /login', async () => {
    const token = await makeToken()
    const req = new NextRequest('http://localhost/login', {
      headers: { cookie: `auth_token=${encodeURIComponent(token)}` },
    })
    const res = await middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })
})
