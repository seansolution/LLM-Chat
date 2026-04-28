/** @jest-environment node */

import { POST } from './route'

const mockGetAuthFromRequest = jest.fn()
const mockQueryAuthOne = jest.fn()
const mockExecute = jest.fn()
const mockWriteAuditLog = jest.fn()

jest.mock('../../../lib/auth', () => ({
  getAuthFromRequest: (...args: unknown[]) => mockGetAuthFromRequest(...args),
}))

jest.mock('../../../lib/db', () => ({
  queryAuthOne: (...args: unknown[]) => mockQueryAuthOne(...args),
  execute: (...args: unknown[]) => mockExecute(...args),
}))

jest.mock('../../../lib/rbac', () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}))

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/change-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetAuthFromRequest.mockResolvedValue(null)
    const res = await POST(makeReq({ currentPassword: 'old', newPassword: 'newpassword' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for short new password', async () => {
    mockGetAuthFromRequest.mockResolvedValue({ sub: 'u1', email: 'a@a.com', tenant_id: 't1' })
    const res = await POST(makeReq({ currentPassword: 'old', newPassword: '123' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when current password is wrong', async () => {
    mockGetAuthFromRequest.mockResolvedValue({ sub: 'u1', email: 'a@a.com', tenant_id: 't1' })
    mockQueryAuthOne.mockResolvedValue({ ok: false })

    const res = await POST(makeReq({ currentPassword: 'wrong', newPassword: 'newpassword' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toMatch(/incorrect/i)
  })

  it('updates password and writes audit log on success', async () => {
    mockGetAuthFromRequest.mockResolvedValue({ sub: 'u1', email: 'a@a.com', tenant_id: 't1' })
    mockQueryAuthOne.mockResolvedValue({ ok: true })
    mockExecute.mockResolvedValue(1)
    mockWriteAuditLog.mockResolvedValue(undefined)

    const res = await POST(makeReq({ currentPassword: 'oldpassword', newPassword: 'newpassword' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(mockExecute).toHaveBeenCalled()
    expect(mockWriteAuditLog).toHaveBeenCalled()
  })
})
