// ─── Policy Agent ─────────────────────────────────────────────────────────────
// Checks that the calling user has the required permissions for the action.
// Phase 1: unauthenticated requests are allowed (open mode).
// Phase 2+: JWT claims are validated here.

import type { Agent, PipelineState, StepResult } from '../types'

export class PolicyAgent implements Agent {
  name = 'policy'

  async run(state: PipelineState): Promise<StepResult> {
    const t0 = Date.now()
    const { permissions } = state.ctx

    // chat.write permission required to send a message
    // In open mode (no auth), permissions array is empty but we still allow.
    const hasPermission =
      permissions.length === 0 ||          // open / unauthenticated
      permissions.includes('chat.write') ||
      permissions.includes('system.admin')

    if (!hasPermission) {
      state.trace.push({
        agentName: this.name,
        ok: false,
        error: 'Forbidden: missing chat.write permission',
        latencyMs: Date.now() - t0,
      })
      return {
        ok: false,
        abortMessage: 'You do not have permission to send messages.',
        abortStatus: 403,
      }
    }

    state.trace.push({
      agentName: this.name,
      ok: true,
      data: { allowed: true },
      latencyMs: Date.now() - t0,
    })

    return { ok: true }
  }
}
