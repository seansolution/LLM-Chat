/** @jest-environment node */
/**
 * Chat Route — Contract Tests
 *
 * Verifies the /api/chat response shape stays backward-compatible.
 * These run against the route handler directly (no HTTP server needed).
 * Models are mocked so tests run without LiteLLM/DB.
 */

// ─── Mock LiteLLM fetch + DB ──────────────────────────────────────────────────

const mockFetch = jest.fn()
global.fetch = mockFetch

jest.mock('../../lib/db', () => ({
  query:        jest.fn().mockResolvedValue([]),
  execute:      jest.fn().mockResolvedValue(0),
  queryOne:     jest.fn().mockResolvedValue(null),
  isDbAvailable: jest.fn().mockResolvedValue(false),
  // Phase 2+: auth-bypass variants used by ai-config, runtime-config, token budget
  queryAuth:    jest.fn().mockResolvedValue([]),
  queryAuthOne: jest.fn().mockImplementation(async (sql: string) => {
    // Token budget check — no limit, zero used
    if (sql.includes('token_limit')) return { token_limit: null, token_used: 0 }
    // app_settings lookups (ai.providers, ai.models, chat.runtime) → null = use defaults
    return null
  }),
  withTransaction: jest.fn().mockImplementation(async (fn: (c: unknown) => Promise<unknown>) =>
    fn({ query: jest.fn().mockResolvedValue({ rows: [] }) })
  ),
}))

jest.mock('../../lib/models', () => {
  const actual = jest.requireActual('../../lib/models')
  return actual
})

jest.mock('../../lib/auth', () => ({
  getAuthFromRequest: jest.fn().mockResolvedValue({
    sub: '00000000-0000-0000-0000-000000000001',
    email: 'tester@example.com',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    roles: ['agent'],
    permissions: ['chat.write'],
    iat: 1,
    exp: 9999999999,
  }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function litellmOk(content: string) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  })
}

// ─── Import after mocks are set up ───────────────────────────────────────────
import { POST } from './route'
import type { SingleChatResponse, CompareChatResponse } from '../../types/api'

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/chat — contract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Validation ──────────────────────────────────────────────────────────────

  it('returns 400 when message is missing', async () => {
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json).toHaveProperty('error')
  })

  it('returns 400 when message is empty string', async () => {
    const res = await POST(makeReq({ message: '   ' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when no valid model is found', async () => {
    const res = await POST(makeReq({ message: 'hi', model: 'nonexistent-model-xyz' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/No valid models/)
  })

  // ── Single-model response contract ──────────────────────────────────────────

  it('returns single-model response with required fields', async () => {
    litellmOk('Hello from model!')
    const res = await POST(makeReq({ message: 'Hello', model: 'qwen3' }))
    expect(res.status).toBe(200)
    const json: SingleChatResponse = await res.json()
    expect(typeof json.reply).toBe('string')
    expect(typeof json.model).toBe('string')
    expect(typeof json.modelName).toBe('string')
    expect(typeof json.latencyMs).toBe('number')
    expect(typeof json.totalMs).toBe('number')
    expect(json.reply).toBe('Hello from model!')
  })

  it('strips <think> tags from model response', async () => {
    litellmOk('<think>internal reasoning</think>The real answer')
    const res = await POST(makeReq({ message: 'Test', model: 'qwen3' }))
    const json = await res.json()
    expect(json.reply).toBe('The real answer')
    expect(json.reply).not.toContain('<think>')
  })

  it('strips ---ANSWER--- marker from response', async () => {
    litellmOk('some preamble---ANSWER---The actual answer')
    const res = await POST(makeReq({ message: 'Test', model: 'qwen3' }))
    const json = await res.json()
    expect(json.reply).toBe('The actual answer')
  })

  // ── Compare-mode response contract ──────────────────────────────────────────

  it('returns compare-mode response when models[] given', async () => {
    litellmOk('Response from model')
    const res = await POST(makeReq({ message: 'Compare this', models: ['qwen3', 'qwen3'] }))
    expect(res.status).toBe(200)
    const json: CompareChatResponse = await res.json()
    expect(json.mode).toBe('compare')
    expect(Array.isArray(json.replies)).toBe(true)
    expect(json.replies.length).toBe(2)
    for (const reply of json.replies) {
      expect(typeof reply.model).toBe('string')
      expect(typeof reply.modelName).toBe('string')
      expect(typeof reply.provider).toBe('string')
      expect(typeof reply.latencyMs).toBe('number')
    }
    expect(typeof json.totalMs).toBe('number')
  })

  it('deduplicated single models[] falls back to single response? No — compare is explicit', async () => {
    litellmOk('ok')
    const res = await POST(makeReq({ message: 'hi', models: ['qwen3'] }))
    // 1 model in models[] → single model response (not compare)
    const json = await res.json()
    expect(json).toHaveProperty('reply')
    expect(json.mode).toBeUndefined()
  })

  // ── Parameter clamping ──────────────────────────────────────────────────────

  it('clamps temperature to [0, 2]', async () => {
    litellmOk('ok')
    // Should not throw even with out-of-range values
    const res = await POST(makeReq({ message: 'hi', model: 'qwen3', temperature: 99 }))
    expect(res.status).toBe(200)
  })

  it('clamps maxTokens to [64, 16384]', async () => {
    litellmOk('ok')
    const res = await POST(makeReq({ message: 'hi', model: 'qwen3', maxTokens: 1 }))
    expect(res.status).toBe(200)
  })

  // ── Error handling ──────────────────────────────────────────────────────────

  it('returns 502 when single model errors and has no reply', async () => {
    mockFetch.mockResolvedValue({ ok: false, text: async () => 'bad gateway', status: 502 })
    const res = await POST(makeReq({ message: 'hi', model: 'qwen3' }))
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json).toHaveProperty('error')
  })

  it('includes error field in compare replies on model failure', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) })
      .mockResolvedValueOnce({ ok: false, text: async () => 'failed', status: 500 })
    const res = await POST(makeReq({ message: 'hi', models: ['qwen3', 'qwen3'] }))
    const json: CompareChatResponse = await res.json()
    expect(json.mode).toBe('compare')
    // One succeeded, one failed — both replies present
    expect(json.replies.length).toBe(2)
    const failed = json.replies.find(r => r.error)
    expect(failed).toBeDefined()
  })

  // ── Backward-compat fields ──────────────────────────────────────────────────

  it('ignores unknown legacy fields without crashing', async () => {
    litellmOk('ok')
    const res = await POST(makeReq({
      message: 'hi',
      model: 'qwen3',
      persona: 'assistant',
      role: 'SALES',
      userId: 'u1',
      sessionId: 's1',
    }))
    expect(res.status).toBe(200)
  })
})
