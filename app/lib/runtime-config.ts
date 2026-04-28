import { queryAuthOne, execute } from './db'

export interface ChatRuntimeConfig {
  defaultMaxTokens: number
  maxTokensCap: number
}

export const FALLBACK_CHAT_CONFIG: ChatRuntimeConfig = {
  defaultMaxTokens: 16384,
  maxTokensCap: 16384,
}

const CHAT_SETTINGS_KEY = 'chat.runtime'

function sanitize(v: unknown, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback
  return Math.max(64, Math.min(32768, Math.round(v)))
}

export async function getChatRuntimeConfig(tenantId: string): Promise<ChatRuntimeConfig> {
  const row = await queryAuthOne<{ value: { defaultMaxTokens?: number; maxTokensCap?: number } }>(
    `SELECT value FROM app_settings WHERE tenant_id = $1 AND key = $2`,
    [tenantId, CHAT_SETTINGS_KEY]
  )

  const defaultMaxTokens = sanitize(row?.value?.defaultMaxTokens, FALLBACK_CHAT_CONFIG.defaultMaxTokens)
  const maxTokensCap = sanitize(row?.value?.maxTokensCap, FALLBACK_CHAT_CONFIG.maxTokensCap)

  return {
    defaultMaxTokens: Math.min(defaultMaxTokens, maxTokensCap),
    maxTokensCap,
  }
}

export async function upsertChatRuntimeConfig(
  tenantId: string,
  updatedBy: string,
  input: Partial<ChatRuntimeConfig>
): Promise<ChatRuntimeConfig> {
  const current = await getChatRuntimeConfig(tenantId)
  const next: ChatRuntimeConfig = {
    defaultMaxTokens: sanitize(input.defaultMaxTokens ?? current.defaultMaxTokens, current.defaultMaxTokens),
    maxTokensCap: sanitize(input.maxTokensCap ?? current.maxTokensCap, current.maxTokensCap),
  }

  next.defaultMaxTokens = Math.min(next.defaultMaxTokens, next.maxTokensCap)

  await execute(
    `INSERT INTO app_settings (tenant_id, key, value, updated_by, updated_at)
     VALUES ($1, $2, $3::jsonb, $4, NOW())
     ON CONFLICT (tenant_id, key)
     DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
    [tenantId, CHAT_SETTINGS_KEY, JSON.stringify(next), updatedBy]
  )

  return next
}
