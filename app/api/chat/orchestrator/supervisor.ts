// ─── Supervisor ───────────────────────────────────────────────────────────────
// Orchestrates the agent pipeline.  Order:
//   Policy → Intent → Memory → Retrieval → Response → Guardrail
//
// Each agent receives the shared PipelineState and may:
//  • Mutate state fields (messages, systemPrompt, responses, etc.)
//  • Return ok:false with abortMessage to short-circuit the pipeline
//  • Push to state.trace for observability

import type { AgentContext, OrchestrationResult } from '../../../types/api'
import type { Agent, PipelineState } from './types'

import { PolicyAgent }    from './agents/policy'
import { IntentAgent }    from './agents/intent'
import { MemoryAgent }    from './agents/memory'
import { RetrievalAgent } from './agents/retrieval'
import { ResponseAgent }  from './agents/response'
import { GuardrailAgent } from './agents/guardrail'

const DEFAULT_SYSTEM_PROMPT_GENERAL =
  `You are a helpful, harmless, and honest AI assistant. ` +
  `Answer clearly and concisely. Match the language the user writes in.`

const DEFAULT_SYSTEM_PROMPT_KNOWLEDGE =
  `You are a helpful AI assistant. Answer based on the provided context. ` +
  `Be accurate and cite sources when available.`

export class Supervisor {
  private agents: Agent[]

  constructor() {
    this.agents = [
      new PolicyAgent(),
      new IntentAgent(),
      new MemoryAgent(),
      new RetrievalAgent(),
      new ResponseAgent(),
      new GuardrailAgent(),
    ]
  }

  async run(ctx: AgentContext): Promise<
    | { ok: true; result: OrchestrationResult }
    | { ok: false; message: string; status: number }
  > {
    const state: PipelineState = {
      ctx,
      processedMessage: ctx.userMessage,
      systemPrompt:
        ctx.systemPrompt ||
        (ctx.mode === 'knowledge'
          ? DEFAULT_SYSTEM_PROMPT_KNOWLEDGE
          : DEFAULT_SYSTEM_PROMPT_GENERAL),
      messages: [],
      responses: [],
      trace: [],
    }

    for (const agent of this.agents) {
      const step = await agent.run(state)
      if (!step.ok && step.abortMessage) {
        return {
          ok: false,
          message: step.abortMessage,
          status: step.abortStatus ?? 500,
        }
      }
    }

    return {
      ok: true,
      result: {
        responses: state.responses,
        agentTrace: state.trace,
        totalMs: Date.now() - ctx.startTime,
      },
    }
  }
}
