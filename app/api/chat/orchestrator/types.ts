// ─── Orchestrator Internal Types ──────────────────────────────────────────────

import type { AgentContext, AgentResult, LLMModelResponse, Permission } from '../../../types/api'

export type { AgentContext, AgentResult, LLMModelResponse, Permission }

// Agent pipeline step result
export interface StepResult {
  ok: boolean
  /** If false, abort the pipeline and return this error to the client */
  abortMessage?: string
  abortStatus?: number
  data?: Record<string, unknown>
}

// What the Supervisor passes between agents
export interface PipelineState {
  ctx: AgentContext
  /** Possibly enriched/rewritten user message */
  processedMessage: string
  /** System prompt (may be augmented by knowledge agent) */
  systemPrompt: string
  /** Messages array ready to send to LLM */
  messages: Array<{ role: string; content: string }>
  /** LLM responses after response agent runs */
  responses: LLMModelResponse[]
  /** Instrumentation trace */
  trace: AgentResult[]
}

// Each agent must implement this interface
export interface Agent {
  name: string
  run(state: PipelineState): Promise<StepResult>
}
