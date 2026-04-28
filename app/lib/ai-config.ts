import { queryAuthOne, execute } from './db'
import { MODELS, PROVIDER_META, type ModelConfig } from './models'

const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm:4000'
const LITELLM_KEY = process.env.LITELLM_API_KEY || 'sk-litellm-master'
const THAILLM_URL = process.env.THAILLM_URL || 'http://thaillm.or.th/api/v1'
const THAILLM_KEY = process.env.THAILLM_API_KEY || ''

export type ProviderAuthType = 'bearer' | 'x-api-key' | 'custom' | 'none'

export interface ProviderRuntimeConfig {
  provider: string
  label?: string
  color?: string
  icon?: string
  enabled?: boolean
  baseUrl: string
  chatPath?: string
  authType: ProviderAuthType
  secret?: string
  authHeader?: string
  authPrefix?: string
}

export interface TenantAIConfig {
  providers: Record<string, ProviderRuntimeConfig>
  models: ModelConfig[]
}

function parseJson<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback
  try {
    if (typeof raw === 'string') return JSON.parse(raw) as T
    return raw as T
  } catch {
    return fallback
  }
}

function defaultProviders(): Record<string, ProviderRuntimeConfig> {
  return {
    local: {
      provider: 'local', label: 'Local', color: '#888888', icon: '◌', enabled: true,
      baseUrl: LITELLM_URL, chatPath: '/v1/chat/completions', authType: 'bearer', secret: LITELLM_KEY,
    },
    thaillm: {
      provider: 'thaillm', label: 'ThaiLLM', color: '#e11d48', icon: 'ธ', enabled: true,
      baseUrl: THAILLM_URL, chatPath: '/chat/completions', authType: 'bearer', secret: THAILLM_KEY,
    },
    openai: {
      provider: 'openai', label: 'OpenAI', color: '#10a37f', icon: '◎', enabled: true,
      baseUrl: LITELLM_URL, chatPath: '/v1/chat/completions', authType: 'bearer', secret: LITELLM_KEY,
    },
    anthropic: {
      provider: 'anthropic', label: 'Anthropic', color: '#cc7a3e', icon: '◈', enabled: true,
      baseUrl: LITELLM_URL, chatPath: '/v1/chat/completions', authType: 'bearer', secret: LITELLM_KEY,
    },
    google: {
      provider: 'google', label: 'Google', color: '#4285f4', icon: '◆', enabled: true,
      baseUrl: LITELLM_URL, chatPath: '/v1/chat/completions', authType: 'bearer', secret: LITELLM_KEY,
    },
    xai: {
      provider: 'xai', label: 'xAI', color: '#e5e5e5', icon: '✕', enabled: true,
      baseUrl: LITELLM_URL, chatPath: '/v1/chat/completions', authType: 'bearer', secret: LITELLM_KEY,
    },
    deepseek: {
      provider: 'deepseek', label: 'Deepseek', color: '#4d7eff', icon: '◇', enabled: true,
      baseUrl: LITELLM_URL, chatPath: '/v1/chat/completions', authType: 'bearer', secret: LITELLM_KEY,
    },
    perplexity: {
      provider: 'perplexity', label: 'Perplexity', color: '#20b2aa', icon: '◉', enabled: true,
      baseUrl: LITELLM_URL, chatPath: '/v1/chat/completions', authType: 'bearer', secret: LITELLM_KEY,
    },
    meta: {
      provider: 'meta', label: 'Meta', color: '#0064e0', icon: '◎', enabled: true,
      baseUrl: LITELLM_URL, chatPath: '/v1/chat/completions', authType: 'bearer', secret: LITELLM_KEY,
    },
  }
}

export async function getTenantAIConfig(tenantId: string): Promise<TenantAIConfig> {
  const [providersRow, modelsRow] = await Promise.all([
    queryAuthOne<{ value: unknown }>(`SELECT value FROM app_settings WHERE tenant_id = $1 AND key = 'ai.providers'`, [tenantId]),
    queryAuthOne<{ value: unknown }>(`SELECT value FROM app_settings WHERE tenant_id = $1 AND key = 'ai.models'`, [tenantId]),
  ])

  const providers = {
    ...defaultProviders(),
    ...parseJson<Record<string, ProviderRuntimeConfig>>(providersRow?.value, {}),
  }

  const customModels = parseJson<ModelConfig[]>(modelsRow?.value, [])
  const merged = [...MODELS]
  for (const cm of customModels) {
    if (!cm?.id) continue
    const idx = merged.findIndex(m => m.id === cm.id)
    if (idx >= 0) merged[idx] = { ...merged[idx], ...cm }
    else merged.push(cm)
  }

  const enabledModels = merged.filter(m => providers[m.provider]?.enabled !== false)

  return { providers, models: enabledModels }
}

export async function upsertTenantAIConfig(
  tenantId: string,
  updatedBy: string,
  payload: { providers?: Record<string, ProviderRuntimeConfig>; models?: ModelConfig[] }
): Promise<TenantAIConfig> {
  if (payload.providers) {
    await execute(
      `INSERT INTO app_settings (tenant_id, key, value, updated_by, updated_at)
       VALUES ($1, 'ai.providers', $2::jsonb, $3, NOW())
       ON CONFLICT (tenant_id, key)
       DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [tenantId, JSON.stringify(payload.providers), updatedBy]
    )
  }

  if (payload.models) {
    await execute(
      `INSERT INTO app_settings (tenant_id, key, value, updated_by, updated_at)
       VALUES ($1, 'ai.models', $2::jsonb, $3, NOW())
       ON CONFLICT (tenant_id, key)
       DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [tenantId, JSON.stringify(payload.models), updatedBy]
    )
  }

  return getTenantAIConfig(tenantId)
}

export async function getModelForTenant(tenantId: string, modelId: string): Promise<ModelConfig | undefined> {
  const cfg = await getTenantAIConfig(tenantId)
  return cfg.models.find(m => m.id === modelId)
}

export function providerHeaders(p: ProviderRuntimeConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (p.authType === 'bearer' && p.secret) headers.Authorization = `Bearer ${p.secret}`
  if (p.authType === 'x-api-key' && p.secret) headers['x-api-key'] = p.secret
  if (p.authType === 'custom' && p.secret && p.authHeader) {
    headers[p.authHeader] = p.authPrefix ? `${p.authPrefix}${p.secret}` : p.secret
  }
  return headers
}

export function providerEndpoint(p: ProviderRuntimeConfig): string {
  const path = p.chatPath || '/v1/chat/completions'
  return `${p.baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

export function providerMetaFromConfig(providers: Record<string, ProviderRuntimeConfig>) {
  const meta: Record<string, { label: string; color: string; icon: string }> = { ...PROVIDER_META }
  for (const [k, v] of Object.entries(providers)) {
    meta[k] = {
      label: v.label || k,
      color: v.color || '#888888',
      icon: v.icon || '◌',
    }
  }
  return meta
}
