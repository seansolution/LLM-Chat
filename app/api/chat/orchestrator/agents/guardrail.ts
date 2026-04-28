// ─── Guardrail Agent ─────────────────────────────────────────────────────────
// Post-processes model responses for safety.
// Phase 1: lightweight keyword filter + strips dangerous HTML.
// Future: integrate a content-safety API.

import type { Agent, PipelineState, StepResult } from '../types'

// Simple pattern list — extend as needed
const BLOCKED_PATTERNS: RegExp[] = [
  // Prompt injection patterns
  /ignore (all |previous |prior )?instructions/i,
  /disregard (your |the )?(system |)prompt/i,
]

function containsInjection(text: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(text))
}

export class GuardrailAgent implements Agent {
  name = 'guardrail'

  async run(state: PipelineState): Promise<StepResult> {
    const t0 = Date.now()

    // Check incoming user message for prompt injection
    if (containsInjection(state.processedMessage)) {
      state.trace.push({
        agentName: this.name,
        ok: false,
        error: 'Prompt injection detected',
        latencyMs: Date.now() - t0,
      })
      return {
        ok: false,
        abortMessage: 'Message blocked by content policy.',
        abortStatus: 422,
      }
    }

    // Sanitise outgoing responses — strip any script tags that leaked through
    state.responses = state.responses.map(r => ({
      ...r,
      reply: r.reply
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/javascript:/gi, ''),
    }))

    state.trace.push({
      agentName: this.name,
      ok: true,
      data: { passed: true },
      latencyMs: Date.now() - t0,
    })

    return { ok: true }
  }
}
