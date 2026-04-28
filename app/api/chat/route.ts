// ─── Multi-Model Chat API ──────────────────────────────────────────────────────
// All business logic is delegated to the Supervisor orchestrator.
// This file remains thin — validation, context building, persistence,
// and response serialisation only.

import { NextResponse } from 'next/server'
import { query, execute, withTransaction, queryAuthOne, type DbMessage } from '../../lib/db'
import { getModelById, DEFAULT_MODEL_ID } from '../../lib/models'
import { Supervisor } from './orchestrator/supervisor'
import { getAuthFromRequest } from '../../lib/auth'
import { getChatRuntimeConfig } from '../../lib/runtime-config'
import { getTenantAIConfig } from '../../lib/ai-config'
import type { AgentContext, Permission } from '../../types/api'
import type { ChatRequest } from '../../types/api'

// Singleton supervisor — shared across requests (stateless)
const supervisor = new Supervisor()

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    const auth = await getAuthFromRequest(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ChatRequest & {
      // Legacy / backward-compat fields
      persona?: string
      role?: string
      userId?: string
      sessionId?: string
    } = await req.json().catch(() => ({}))

    const userMessage = (body.message || '').trim()
    if (!userMessage) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // ── Determine which models to call ────────────────────
    const requestedModelIds: string[] = body.models?.length
      ? body.models
      : [body.model || DEFAULT_MODEL_ID]

    const aiCfg = await getTenantAIConfig(auth.tenant_id)
    const modelById = new Map(aiCfg.models.map(m => [m.id, m]))
    const validModelIds = requestedModelIds.filter(id => modelById.has(id))
    if (validModelIds.length === 0) {
      return NextResponse.json(
        { error: `No valid models found. Requested: ${requestedModelIds.join(', ')}` },
        { status: 400 }
      )
    }

    const chatRuntimeConfig = await getChatRuntimeConfig(auth.tenant_id)

    // ── Per-user token budget check ───────────────────────
    const userBudget = await queryAuthOne<{ token_limit: number | null; token_used: number }>(
      `SELECT token_limit, token_used FROM users WHERE id = $1 AND tenant_id = $2`,
      [auth.sub, auth.tenant_id]
    )

    const requestedMaxTokens = Math.max(64, Math.min(chatRuntimeConfig.maxTokensCap, body.maxTokens ?? chatRuntimeConfig.defaultMaxTokens))
    const tokenLimit = userBudget?.token_limit ?? null
    const tokenUsed = Number(userBudget?.token_used || 0)
    if (tokenLimit !== null && tokenLimit >= 0 && tokenUsed + requestedMaxTokens > tokenLimit) {
      return NextResponse.json(
        {
          error: 'Token limit exceeded for this user',
          tokenLimit,
          tokenUsed,
          requested: requestedMaxTokens,
          remaining: Math.max(0, tokenLimit - tokenUsed),
        },
        { status: 429 }
      )
    }

    // ── Build agent context ───────────────────────────────
    // Phase 2 will extract userId/tenantId from JWT; for now use request body or anonymous.
    const ctx: AgentContext = {
      requestId: crypto.randomUUID(),
      userId: auth.sub,
      tenantId: auth.tenant_id,
      conversationId: body.conversationId,
      userMessage,
      systemPrompt: body.systemPrompt,
      modelIds: validModelIds,
      temperature: Math.max(0, Math.min(2, body.temperature ?? 0.7)),
      maxTokens: requestedMaxTokens,
      mode: body.mode || 'general',
      permissions: auth.permissions as Permission[],
      startTime,
    }

    // ── Run orchestrator ──────────────────────────────────
    const outcome = await supervisor.run(ctx)

    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.message }, { status: outcome.status })
    }

    const { responses, totalMs } = outcome.result

    // ── Persist to DB ─────────────────────────────────────
    if (ctx.conversationId) {
      const compareGroup = responses.length > 1 ? crypto.randomUUID() : undefined
      await saveMessages(
        ctx.conversationId,
        userMessage,
        responses,
        compareGroup,
        { userId: auth.sub, tenantId: auth.tenant_id }
      )
    }

    await execute(
      `UPDATE users SET token_used = COALESCE(token_used, 0) + $1 WHERE id = $2 AND tenant_id = $3`,
      [ctx.maxTokens, auth.sub, auth.tenant_id]
    )

    // ── Single-model response ─────────────────────────────
    if (responses.length === 1) {
      const r = responses[0]
      if (r.error && !r.reply) {
        return NextResponse.json({ error: `Model error: ${r.error}` }, { status: 502 })
      }
      return NextResponse.json({
        reply: r.reply,
        model: r.modelId,
        modelName: modelById.get(r.modelId)?.name ?? r.modelId,
        latencyMs: r.latencyMs,
        totalMs,
        conversationId: ctx.conversationId,
      })
    }

    // ── Compare-mode response ─────────────────────────────
    return NextResponse.json({
      mode: 'compare',
      replies: responses.map(r => ({
        model: r.modelId,
        modelName: modelById.get(r.modelId)?.name ?? r.modelId,
        provider: modelById.get(r.modelId)?.provider ?? 'unknown',
        reply: r.reply,
        error: r.error,
        latencyMs: r.latencyMs,
      })),
      totalMs,
      conversationId: ctx.conversationId,
    })
  } catch (err) {
    console.error('[Chat API] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DB persistence (unchanged from v1) ──────────────────────────────────────

async function saveMessages(
  conversationId: string,
  userMessage: string,
  responses: Array<{ modelId: string; reply: string; latencyMs: number; error?: string }>,
  compareGroup?: string,
  actor?: { userId: string; tenantId: string }
): Promise<void> {
  try {
    if (actor) {
      await withTransaction(async (client) => {
        await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [actor.userId])
        await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [actor.tenantId])
        await client.query(`SELECT set_config('app.is_admin', 'false', true)`)

        await client.query(
          `INSERT INTO messages (conversation_id, role, content, user_id) VALUES ($1, 'user', $2, $3)`,
          [conversationId, userMessage, actor.userId]
        )

        for (const r of responses) {
          const modelConfig = getModelById(r.modelId)
          await client.query(
            `INSERT INTO messages
               (conversation_id, role, content, model_id, provider, compare_group, latency_ms, user_id)
             VALUES ($1, 'assistant', $2, $3, $4, $5, $6, $7)`,
            [
              conversationId,
              r.reply || r.error || '',
              r.modelId,
              modelConfig?.provider ?? null,
              compareGroup ?? null,
              r.latencyMs,
              actor.userId,
            ]
          )
        }

        await client.query(
          `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
          [conversationId]
        )
      })
    } else {
      await execute(
        `INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', $2)`,
        [conversationId, userMessage]
      )
      for (const r of responses) {
        const modelConfig = getModelById(r.modelId)
        await execute(
          `INSERT INTO messages
             (conversation_id, role, content, model_id, provider, compare_group, latency_ms)
           VALUES ($1, 'assistant', $2, $3, $4, $5, $6)`,
          [
            conversationId,
            r.reply || r.error || '',
            r.modelId,
            modelConfig?.provider ?? null,
            compareGroup ?? null,
            r.latencyMs,
          ]
        )
      }
      await execute(
        `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
        [conversationId]
      )
    }
    // Auto-title from first user message
    const rows = await query<DbMessage & { title: string }>(
      `SELECT title FROM conversations WHERE id = $1`,
      [conversationId]
    )
    if ((rows[0] as { title: string } | undefined)?.title === 'New Chat') {
      const autoTitle = userMessage.slice(0, 60).replace(/\n/g, ' ')
      await execute(
        `UPDATE conversations SET title = $1 WHERE id = $2`,
        [autoTitle, conversationId]
      )
    }
  } catch (err) {
    console.error('[DB] saveMessages error:', err)
  }
}
