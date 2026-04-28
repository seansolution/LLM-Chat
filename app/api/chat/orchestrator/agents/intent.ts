// ─── Intent Agent ─────────────────────────────────────────────────────────────
// Classifies the user message intent. In Phase 1 this is lightweight —
// it normalises the message and stamps an intent label for observability.
// Future phases can call an LLM classifier here.

import type { Agent, PipelineState, StepResult } from '../types'

export type Intent =
  | 'general_chat'
  | 'knowledge_query'
  | 'code_request'
  | 'compare_request'
  | 'admin_request'
  | 'unknown'

const CODE_PATTERNS = /\b(write|code|implement|function|script|debug|fix|refactor)\b/i
const KNOWLEDGE_PATTERNS = /\b(what is|how to|explain|tell me|describe|ข้อมูล|อธิบาย|คือ)\b/i
const COMPARE_PATTERNS = /\b(compare|versus|vs|better|difference|ต่าง|เปรียบ)\b/i

function classify(message: string, mode: string): Intent {
  if (mode === 'knowledge') return 'knowledge_query'
  if (COMPARE_PATTERNS.test(message)) return 'compare_request'
  if (CODE_PATTERNS.test(message)) return 'code_request'
  if (KNOWLEDGE_PATTERNS.test(message)) return 'knowledge_query'
  return 'general_chat'
}

export class IntentAgent implements Agent {
  name = 'intent'

  async run(state: PipelineState): Promise<StepResult> {
    const t0 = Date.now()
    const intent = classify(state.processedMessage, state.ctx.mode)

    state.trace.push({
      agentName: this.name,
      ok: true,
      data: { intent },
      latencyMs: Date.now() - t0,
    })

    // Store intent on state for downstream agents
    ;(state as PipelineState & { intent: Intent }).intent = intent

    return { ok: true, data: { intent } }
  }
}
