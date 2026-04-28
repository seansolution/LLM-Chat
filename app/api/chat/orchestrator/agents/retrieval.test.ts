// ─── RetrievalAgent + chunkText unit tests ────────────────────────────────────
/** @jest-environment node */

import type { PipelineState } from '../types'
import type { AgentContext } from '../../../../types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<AgentContext> = {}): PipelineState {
  return {
    ctx: {
      requestId: 'req-test',
      userId: 'user-1',
      tenantId: 'tenant-1',
      userMessage: 'What is the leave policy?',
      modelIds: ['gpt-4o'],
      temperature: 0.7,
      maxTokens: 1024,
      mode: 'general',
      permissions: [],
      startTime: Date.now(),
      ...overrides,
    },
    processedMessage: 'What is the leave policy?',
    systemPrompt: 'You are a helpful assistant.',
    messages: [],
    responses: [],
    trace: [],
  }
}

// ─── chunkText — tested independently to avoid mock interference ──────────────

describe('chunkText', () => {
  // Import the real module once at the top of this suite (before any mocks)
  let chunkText: (text: string) => string[]

  beforeAll(async () => {
    const mod = await import('../../../../lib/knowledge')
    chunkText = mod.chunkText
  })

  it('splits long text into multiple chunks', () => {
    const para = 'A'.repeat(200)
    const text = [para, para, para, para].join('\n\n') // 800 chars across 4 paras
    const chunks = chunkText(text)
    expect(chunks.length).toBeGreaterThan(1)
    for (const c of chunks) {
      expect(c.length).toBeGreaterThan(0)
    }
  })

  it('returns a single chunk for short text', () => {
    const chunks = chunkText('Hello world.')
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toBe('Hello world.')
  })

  it('handles empty-ish text gracefully', () => {
    const chunks = chunkText('  \n\n  ')
    expect(chunks.length).toBeGreaterThan(0)
  })
})

// ─── RetrievalAgent — null backend ───────────────────────────────────────────

describe('RetrievalAgent — null backend (RETRIEVAL_BACKEND unset)', () => {
  beforeEach(() => {
    delete process.env.RETRIEVAL_BACKEND
    jest.resetModules()
  })

  it('skips retrieval in general mode and records a trace entry', async () => {
    const { RetrievalAgent } = await import('./retrieval')
    const agent = new RetrievalAgent()
    const state = makeState({ mode: 'general' })

    const result = await agent.run(state)

    expect(result.ok).toBe(true)
    expect(result.abortMessage).toBeUndefined()
    expect(state.trace).toHaveLength(1)
    expect(state.trace[0].agentName).toBe('retrieval')
    expect(state.trace[0].data).toMatchObject({ skipped: true })
    expect(state.systemPrompt).toBe('You are a helpful assistant.')
  })

  it('skips retrieval in knowledge mode when backend=none', async () => {
    process.env.RETRIEVAL_BACKEND = 'none'
    jest.resetModules()
    const { RetrievalAgent } = await import('./retrieval')
    const agent = new RetrievalAgent()
    const state = makeState({ mode: 'knowledge' })

    const result = await agent.run(state)
    expect(result.ok).toBe(true)
    expect(state.systemPrompt).toBe('You are a helpful assistant.')
  })
})

// ─── RetrievalAgent — static backend ─────────────────────────────────────────

describe('RetrievalAgent — static backend', () => {
  beforeEach(() => {
    process.env.RETRIEVAL_BACKEND = 'static'
    jest.resetModules()
  })
  afterEach(() => { delete process.env.RETRIEVAL_BACKEND })

  it('runs in knowledge mode but returns no snippets (static adapter is empty)', async () => {
    const { RetrievalAgent } = await import('./retrieval')
    const agent = new RetrievalAgent()
    const state = makeState({ mode: 'knowledge' })

    const result = await agent.run(state)

    expect(result.ok).toBe(true)
    expect(state.trace[0].data).toMatchObject({ snippetCount: 0 })
    expect(state.systemPrompt).not.toContain('## Retrieved Context')
  })
})

// ─── RetrievalAgent — rag backend (mocked) ───────────────────────────────────

describe('RetrievalAgent — rag backend (mocked knowledge lib)', () => {
  const MOCK_RESULTS = [
    { chunkId: 'c1', docId: 'd1', docTitle: 'HR Policy', content: 'Employees get 15 days annual leave.', similarity: 0.92 },
    { chunkId: 'c2', docId: 'd1', docTitle: 'HR Policy', content: 'Public holidays are additional.', similarity: 0.80 },
  ]

  beforeEach(() => {
    process.env.RETRIEVAL_BACKEND = 'rag'
    jest.resetModules()
  })
  afterEach(() => { delete process.env.RETRIEVAL_BACKEND })

  it('injects retrieved context into systemPrompt', async () => {
    jest.doMock('../../../../lib/knowledge', () => ({
      searchKnowledge: jest.fn().mockResolvedValue(MOCK_RESULTS),
      chunkText: jest.fn(),
    }))

    const { RetrievalAgent } = await import('./retrieval')
    const agent = new RetrievalAgent()
    const state = makeState({ mode: 'knowledge', tenantId: 'tenant-abc' })

    const result = await agent.run(state)

    expect(result.ok).toBe(true)
    expect(state.systemPrompt).toContain('## Retrieved Context')
    expect(state.systemPrompt).toContain('HR Policy')
    expect(state.systemPrompt).toContain('15 days annual leave')
    expect(state.trace[0].data).toMatchObject({ snippetCount: 2 })
  })

  it('is non-fatal when RAG search throws', async () => {
    jest.doMock('../../../../lib/knowledge', () => ({
      searchKnowledge: jest.fn().mockRejectedValue(new Error('pgvector unavailable')),
      chunkText: jest.fn(),
    }))

    const { RetrievalAgent } = await import('./retrieval')
    const agent = new RetrievalAgent()
    const state = makeState({ mode: 'knowledge' })

    const result = await agent.run(state)

    // Pipeline must NOT abort
    expect(result.ok).toBe(true)
    expect(result.abortMessage).toBeUndefined()
    // Trace records the failure
    expect(state.trace[0].ok).toBe(false)
    expect(state.trace[0].error).toContain('pgvector unavailable')
    // System prompt unchanged
    expect(state.systemPrompt).not.toContain('Retrieved Context')
  })

  it('skips when tenantId is absent', async () => {
    jest.doMock('../../../../lib/knowledge', () => ({
      searchKnowledge: jest.fn(),
      chunkText: jest.fn(),
    }))

    const { RetrievalAgent } = await import('./retrieval')
    const agent = new RetrievalAgent()
    const state = makeState({ mode: 'knowledge', tenantId: undefined })

    const result = await agent.run(state)
    expect(result.ok).toBe(true)
    // searchKnowledge never called for missing tenantId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('../../../../lib/knowledge') as any
    expect(mod.searchKnowledge).not.toHaveBeenCalled()
  })
})
