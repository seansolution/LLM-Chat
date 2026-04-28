// ─── Retrieval Agent ──────────────────────────────────────────────────────────
// Optionally augments the system prompt with retrieved knowledge chunks.
//
// Backend selection via RETRIEVAL_BACKEND env var:
//   (unset) | 'none'  → null adapter — always returns []
//   'static'          → static in-memory snippets (dev placeholder)
//   'rag'             → pgvector similarity search via lib/knowledge.ts
//
// The agent is non-fatal: pipeline continues even if retrieval fails.
// ─────────────────────────────────────────────────────────────────────────────

import type { Agent, PipelineState, StepResult } from '../types'

export type RetrievalPort = {
  retrieve(query: string, tenantId?: string): Promise<string[]>
}

// ─── Null adapter ─────────────────────────────────────────────────────────────

const nullRetrieval: RetrievalPort = {
  retrieve: async () => [],
}

// ─── Static adapter (dev placeholder) ────────────────────────────────────────

const staticRetrieval: RetrievalPort = {
  retrieve: async () => [],
}

// ─── RAG adapter (pgvector) ───────────────────────────────────────────────────

class RagRetrieval implements RetrievalPort {
  async retrieve(queryText: string, tenantId?: string): Promise<string[]> {
    if (!tenantId) return []
    // Dynamic import avoids bundling the embedding client in Phase 1 builds.
    // Errors propagate to RetrievalAgent.run() which records them in the trace.
    const knowledgeLib = await import('../../../../lib/knowledge')
    const results = await knowledgeLib.searchKnowledge(tenantId, queryText)
    return results.map((r: { docTitle: string; content: string }) => `[${r.docTitle}] ${r.content}`)
  }
}

// ─── Adapter factory ──────────────────────────────────────────────────────────

function getAdapter(): RetrievalPort {
  const backend = (process.env.RETRIEVAL_BACKEND || '').toLowerCase()
  if (backend === 'rag') return new RagRetrieval()
  if (backend === 'static') return staticRetrieval
  return nullRetrieval
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export class RetrievalAgent implements Agent {
  name = 'retrieval'
  private adapter: RetrievalPort

  constructor() {
    this.adapter = getAdapter()
  }

  async run(state: PipelineState): Promise<StepResult> {
    const t0 = Date.now()

    // Skip retrieval in general mode unless RETRIEVAL_BACKEND forces it
    const backend = (process.env.RETRIEVAL_BACKEND || '').toLowerCase()
    if (state.ctx.mode !== 'knowledge' && backend !== 'rag') {
      state.trace.push({
        agentName: this.name,
        ok: true,
        data: { skipped: true, reason: 'mode=general, backend=none' },
        latencyMs: Date.now() - t0,
      })
      return { ok: true }
    }

    try {
      const snippets = await this.adapter.retrieve(
        state.processedMessage,
        state.ctx.tenantId
      )

      if (snippets.length > 0) {
        const contextBlock =
          `\n\n## Retrieved Context\n` +
          snippets.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')
        state.systemPrompt += contextBlock
      }

      state.trace.push({
        agentName: this.name,
        ok: true,
        data: {
          backend,
          snippetCount: snippets.length,
          mode: state.ctx.mode,
        },
        latencyMs: Date.now() - t0,
      })

      return { ok: true, data: { snippetCount: snippets.length } }
    } catch (err) {
      // Non-fatal — proceed without retrieval context
      state.trace.push({
        agentName: this.name,
        ok: false,
        error: err instanceof Error ? err.message : 'Retrieval error',
        latencyMs: Date.now() - t0,
      })
      return { ok: true }
    }
  }
}
