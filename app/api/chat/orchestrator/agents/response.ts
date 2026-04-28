// ─── Response Agent ───────────────────────────────────────────────────────────
// Calls LiteLLM for each requested model in parallel.
// Strips chain-of-thought tags. Enforces timeout.

import type { Agent, PipelineState, StepResult, LLMModelResponse } from '../types'
import { getModelForTenant, getTenantAIConfig, providerEndpoint, providerHeaders } from '../../../../lib/ai-config'
const TIMEOUT_MS = 120_000

function normalizeContent(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim()
  if (Array.isArray(raw)) {
    return raw
      .map(part => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) {
          const t = (part as { text?: unknown }).text
          return typeof t === 'string' ? t : ''
        }
        return ''
      })
      .join('\n')
      .trim()
  }
  return ''
}

async function callModel(
  tenantId: string,
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number,
  signal: AbortSignal
): Promise<LLMModelResponse> {
  const t0 = Date.now()
  try {
    const model = await getModelForTenant(tenantId, modelId)
    if (!model) {
      return { modelId, reply: '', latencyMs: Date.now() - t0, error: `Unknown model: ${modelId}` }
    }
    const tenantAi = await getTenantAIConfig(tenantId)
    const providerCfg = tenantAi.providers[model.provider]
    if (!providerCfg || providerCfg.enabled === false) {
      return { modelId, reply: '', latencyMs: Date.now() - t0, error: `Provider disabled: ${model.provider}` }
    }

    const endpoint = providerEndpoint(providerCfg)
    const headers = providerHeaders(providerCfg)

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model.litellmModel,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return {
        modelId,
        reply: '',
        latencyMs: Date.now() - t0,
        error: `API error ${res.status}: ${errText.slice(0, 200)}`,
      }
    }

    const data = await res.json()
    const message = data?.choices?.[0]?.message
    let content = normalizeContent(message?.content)

    // Strip chain-of-thought tags (Qwen3, Deepseek R1, Claude extended thinking)
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    if (content.includes('---ANSWER---')) {
      content = content.split('---ANSWER---').pop()!.trim()
    }

    // Some models may return empty content on the first pass.
    // Retry once with a stricter final-answer instruction.
    if (!content) {
      const retryRes = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model.litellmModel,
          messages: [
            ...messages,
            { role: 'system', content: 'Return final answer only. No internal reasoning.' },
          ],
          temperature: Math.min(temperature, 0.2),
          max_tokens: maxTokens,
          stream: false,
        }),
        signal,
      })

      if (retryRes.ok) {
        const retryData = await retryRes.json()
        const retryMessage = retryData?.choices?.[0]?.message
        content = normalizeContent(retryMessage?.content)
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .trim()
      }
    }

    return {
      modelId,
      reply: content || 'ขออภัยค่ะ รุ่นโมเดลไม่ส่งข้อความตอบกลับ กรุณาลองใหม่อีกครั้ง',
      latencyMs: Date.now() - t0,
    }
  } catch (err) {
    return {
      modelId,
      reply: '',
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export class ResponseAgent implements Agent {
  name = 'response'

  async run(state: PipelineState): Promise<StepResult> {
    const t0 = Date.now()
    const { modelIds, temperature, maxTokens, tenantId } = state.ctx

    const controller = new AbortController()
    const timeoutHandle = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const responses = await Promise.all(
        modelIds.map(modelId =>
          callModel(
            tenantId || '',
            modelId,
            state.messages,
            temperature,
            maxTokens,
            controller.signal
          )
        )
      )

      state.responses = responses

      state.trace.push({
        agentName: this.name,
        ok: true,
        data: {
          modelCount: responses.length,
          errors: responses.filter(r => r.error).length,
        },
        latencyMs: Date.now() - t0,
      })

      return { ok: true }
    } finally {
      clearTimeout(timeoutHandle)
    }
  }
}
