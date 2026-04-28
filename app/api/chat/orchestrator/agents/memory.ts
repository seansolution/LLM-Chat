// ─── Memory Agent ─────────────────────────────────────────────────────────────
// Loads conversation history from PostgreSQL and builds the messages array.
// Falls back gracefully when DB is unavailable.

import type { Agent, PipelineState, StepResult } from '../types'
import { query, type DbMessage } from '../../../../lib/db'

const HISTORY_LIMIT = 20

export class MemoryAgent implements Agent {
  name = 'memory'

  async run(state: PipelineState): Promise<StepResult> {
    const t0 = Date.now()
    const { conversationId } = state.ctx

    // Start with system prompt
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: state.systemPrompt },
    ]

    if (conversationId) {
      try {
        const history = await query<DbMessage>(
          `SELECT role, content FROM messages
           WHERE conversation_id = $1
             AND compare_group IS NULL
           ORDER BY created_at ASC
           LIMIT $2`,
          [conversationId, HISTORY_LIMIT]
        )
        for (const msg of history) {
          messages.push({ role: msg.role, content: msg.content })
        }
      } catch (err) {
        // DB unavailable — proceed without history
        console.warn('[MemoryAgent] DB error, skipping history:', err)
      }
    }

    // Append current user message
    messages.push({ role: 'user', content: state.processedMessage })

    state.messages = messages

    state.trace.push({
      agentName: this.name,
      ok: true,
      data: { historyLength: messages.length - 2 }, // subtract system + current user
      latencyMs: Date.now() - t0,
    })

    return { ok: true, data: { messageCount: messages.length } }
  }
}
