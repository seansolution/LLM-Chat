// ─── Multi-Model Registry ───────────────────────────────────────────────────
// Central definition of all supported AI models.
// `litellmModel` matches the model_name in infra/litellm/config.yaml
// `available` is set at runtime based on env var presence.

export type Provider = string

export interface ModelConfig {
  id: string               // Unique ID used in UI + API requests
  name: string             // Display name
  provider: Provider
  litellmModel: string     // Must match model_name in litellm/config.yaml
  description: string
  contextWindow: number    // Tokens
  strengths: string[]
  envKey: string           // Env var name that enables this model
  supportsVision: boolean
  supportsReasoning: boolean  // o-series, R1, etc.
  badge?: string           // Optional badge: 'Fast' | 'Smart' | 'Cheap' | 'Local'
}

export const MODELS: ModelConfig[] = [
  // ─── Local ─────────────────────────────────────────────────────────────────
  {
    id: 'qwen3',
    name: 'Qwen3 (Local)',
    provider: 'local',
    litellmModel: 'qwen3',
    description: 'Qwen3.5-9B running locally via LM Studio — private, no API cost',
    contextWindow: 32768,
    strengths: ['Thai', 'Coding', 'Offline'],
    envKey: 'LOCAL_LM_STUDIO',
    supportsVision: false,
    supportsReasoning: false,
    badge: 'Local',
  },
  {
    id: 'openthaigpt-thaillm-8b-instruct-v7.2',
    name: 'OpenThaiGPT 8B v7.2',
    provider: 'thaillm',
    litellmModel: 'openthaigpt-thaillm-8b-instruct-v7.2',
    description: 'ThaiLLM OpenThaiGPT 8B Instruct v7.2',
    contextWindow: 16384,
    strengths: ['Thai', 'Instruction', 'General chat'],
    envKey: 'THAILLM_API_KEY',
    supportsVision: false,
    supportsReasoning: false,
    badge: 'Smart',
  },
  {
    id: 'pathumma-thaillm-qwen3-8b-think-3.0.0',
    name: 'Pathumma Qwen3 8B Think 3.0.0',
    provider: 'thaillm',
    litellmModel: 'pathumma-thaillm-qwen3-8b-think-3.0.0',
    description: 'ThaiLLM Pathumma Qwen3 Think model',
    contextWindow: 16384,
    strengths: ['Thai', 'Reasoning', 'Analysis'],
    envKey: 'THAILLM_API_KEY',
    supportsVision: false,
    supportsReasoning: true,
    badge: 'Smart',
  },
  {
    id: 'typhoon-s-thaillm-8b-instruct',
    name: 'Typhoon-S 8B Instruct',
    provider: 'thaillm',
    litellmModel: 'typhoon-s-thaillm-8b-instruct',
    description: 'ThaiLLM Typhoon-S 8B Instruct',
    contextWindow: 16384,
    strengths: ['Thai', 'Fast', 'Instruction'],
    envKey: 'THAILLM_API_KEY',
    supportsVision: false,
    supportsReasoning: false,
    badge: 'Fast',
  },
  {
    id: 'thalle-0.2-thaillm-8b-fa',
    name: 'Thalle 0.2 8B FA',
    provider: 'thaillm',
    litellmModel: 'thalle-0.2-thaillm-8b-fa',
    description: 'ThaiLLM Thalle 0.2 8B',
    contextWindow: 16384,
    strengths: ['Thai', 'Chat', 'General'],
    envKey: 'THAILLM_API_KEY',
    supportsVision: false,
    supportsReasoning: false,
    badge: 'Fast',
  },

  // ─── OpenAI ────────────────────────────────────────────────────────────────
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    litellmModel: 'gpt-4o',
    description: 'OpenAI multimodal flagship — vision, coding, reasoning',
    contextWindow: 128000,
    strengths: ['Vision', 'Coding', 'Analysis'],
    envKey: 'OPENAI_API_KEY',
    supportsVision: true,
    supportsReasoning: false,
    badge: 'Smart',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai',
    litellmModel: 'gpt-4o-mini',
    description: 'Lightweight GPT-4o — fast and cost-efficient',
    contextWindow: 128000,
    strengths: ['Fast', 'Cheap', 'Chat'],
    envKey: 'OPENAI_API_KEY',
    supportsVision: true,
    supportsReasoning: false,
    badge: 'Fast',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    litellmModel: 'gpt-4.1',
    description: 'GPT-4.1 — improved instruction following and coding',
    contextWindow: 1000000,
    strengths: ['Coding', 'Instructions', 'Long context'],
    envKey: 'OPENAI_API_KEY',
    supportsVision: true,
    supportsReasoning: false,
    badge: 'Smart',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 mini',
    provider: 'openai',
    litellmModel: 'gpt-4.1-mini',
    description: 'GPT-4.1 mini — affordable with 1M token context',
    contextWindow: 1000000,
    strengths: ['Fast', 'Cheap', 'Long context'],
    envKey: 'OPENAI_API_KEY',
    supportsVision: true,
    supportsReasoning: false,
    badge: 'Fast',
  },
  {
    id: 'o3',
    name: 'o3',
    provider: 'openai',
    litellmModel: 'o3',
    description: 'OpenAI o3 reasoning model — deep thinking for hard problems',
    contextWindow: 200000,
    strengths: ['Math', 'Logic', 'Science'],
    envKey: 'OPENAI_API_KEY',
    supportsVision: true,
    supportsReasoning: true,
    badge: 'Smart',
  },
  {
    id: 'o4-mini',
    name: 'o4-mini',
    provider: 'openai',
    litellmModel: 'o4-mini',
    description: 'o4-mini — efficient reasoning at lower cost',
    contextWindow: 200000,
    strengths: ['Reasoning', 'Coding', 'Fast'],
    envKey: 'OPENAI_API_KEY',
    supportsVision: true,
    supportsReasoning: true,
    badge: 'Fast',
  },

  // ─── Anthropic (Claude) ────────────────────────────────────────────────────
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    litellmModel: 'claude-opus-4',
    description: 'Claude Opus 4 — most powerful Claude, best for complex tasks',
    contextWindow: 200000,
    strengths: ['Writing', 'Analysis', 'Research'],
    envKey: 'ANTHROPIC_API_KEY',
    supportsVision: true,
    supportsReasoning: false,
    badge: 'Smart',
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    litellmModel: 'claude-sonnet-4',
    description: 'Claude Sonnet 4 — balanced performance and cost',
    contextWindow: 200000,
    strengths: ['Coding', 'Writing', 'Analysis'],
    envKey: 'ANTHROPIC_API_KEY',
    supportsVision: true,
    supportsReasoning: false,
    badge: 'Smart',
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    litellmModel: 'claude-3-7-sonnet',
    description: 'Claude 3.7 Sonnet — extended thinking, excellent for coding',
    contextWindow: 200000,
    strengths: ['Coding', 'Thinking', 'Writing'],
    envKey: 'ANTHROPIC_API_KEY',
    supportsVision: true,
    supportsReasoning: true,
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude Haiku 3.5',
    provider: 'anthropic',
    litellmModel: 'claude-3-5-haiku',
    description: 'Claude Haiku 3.5 — fastest Claude, ideal for simple tasks',
    contextWindow: 200000,
    strengths: ['Fast', 'Cheap', 'Chat'],
    envKey: 'ANTHROPIC_API_KEY',
    supportsVision: true,
    supportsReasoning: false,
    badge: 'Fast',
  },

  // ─── Google (Gemini) ──────────────────────────────────────────────────────
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    litellmModel: 'gemini-2.5-flash',
    description: 'Gemini 2.5 Flash — best-in-class speed with 1M token context',
    contextWindow: 1000000,
    strengths: ['Fast', 'Long context', 'Multimodal'],
    envKey: 'GOOGLE_API_KEY',
    supportsVision: true,
    supportsReasoning: true,
    badge: 'Fast',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    litellmModel: 'gemini-2.5-pro',
    description: 'Gemini 2.5 Pro — Google\'s most intelligent model with 1M context',
    contextWindow: 1000000,
    strengths: ['Long context', 'Reasoning', 'Multimodal'],
    envKey: 'GOOGLE_API_KEY',
    supportsVision: true,
    supportsReasoning: true,
    badge: 'Smart',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    litellmModel: 'gemini-2.0-flash',
    description: 'Gemini 2.0 Flash — fast and efficient multimodal model',
    contextWindow: 1000000,
    strengths: ['Fast', 'Cheap', 'Multimodal'],
    envKey: 'GOOGLE_API_KEY',
    supportsVision: true,
    supportsReasoning: false,
    badge: 'Fast',
  },

  // ─── xAI (Grok) ─────────────────────────────────────────────────────────
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'xai',
    litellmModel: 'grok-3',
    description: 'Grok 3 — xAI\'s flagship model with real-time web access',
    contextWindow: 131072,
    strengths: ['Real-time info', 'Coding', 'Analysis'],
    envKey: 'XAI_API_KEY',
    supportsVision: false,
    supportsReasoning: false,
    badge: 'Smart',
  },
  {
    id: 'grok-3-mini',
    name: 'Grok 3 mini',
    provider: 'xai',
    litellmModel: 'grok-3-mini',
    description: 'Grok 3 mini — efficient reasoning model',
    contextWindow: 131072,
    strengths: ['Reasoning', 'Fast', 'Coding'],
    envKey: 'XAI_API_KEY',
    supportsVision: false,
    supportsReasoning: true,
    badge: 'Fast',
  },
  {
    id: 'grok-2',
    name: 'Grok 2',
    provider: 'xai',
    litellmModel: 'grok-2',
    description: 'Grok 2 — reliable xAI model with strong coding skills',
    contextWindow: 131072,
    strengths: ['Coding', 'Chat', 'Analysis'],
    envKey: 'XAI_API_KEY',
    supportsVision: false,
    supportsReasoning: false,
  },

  // ─── Deepseek ─────────────────────────────────────────────────────────────
  {
    id: 'deepseek-v3',
    name: 'Deepseek V3',
    provider: 'deepseek',
    litellmModel: 'deepseek-v3',
    description: 'Deepseek V3 — top open-source model, excellent coding',
    contextWindow: 64000,
    strengths: ['Coding', 'Math', 'Cheap'],
    envKey: 'DEEPSEEK_API_KEY',
    supportsVision: false,
    supportsReasoning: false,
    badge: 'Cheap',
  },
  {
    id: 'deepseek-r1',
    name: 'Deepseek R1',
    provider: 'deepseek',
    litellmModel: 'deepseek-r1',
    description: 'Deepseek R1 — reasoning model, matches o1 at fraction of cost',
    contextWindow: 64000,
    strengths: ['Reasoning', 'Math', 'Coding'],
    envKey: 'DEEPSEEK_API_KEY',
    supportsVision: false,
    supportsReasoning: true,
    badge: 'Smart',
  },

  // ─── Perplexity ───────────────────────────────────────────────────────────
  {
    id: 'perplexity-sonar',
    name: 'Perplexity Sonar',
    provider: 'perplexity',
    litellmModel: 'perplexity-sonar',
    description: 'Perplexity Sonar — online search + AI, real-time web answers',
    contextWindow: 127072,
    strengths: ['Web search', 'Real-time', 'Research'],
    envKey: 'PERPLEXITY_API_KEY',
    supportsVision: false,
    supportsReasoning: false,
    badge: 'Fast',
  },
  {
    id: 'perplexity-sonar-pro',
    name: 'Perplexity Sonar Pro',
    provider: 'perplexity',
    litellmModel: 'perplexity-sonar-pro',
    description: 'Perplexity Sonar Pro — deep web research with citations',
    contextWindow: 127072,
    strengths: ['Deep research', 'Citations', 'Web'],
    envKey: 'PERPLEXITY_API_KEY',
    supportsVision: false,
    supportsReasoning: false,
    badge: 'Smart',
  },

  // ─── Meta (Llama via Groq) ────────────────────────────────────────────────
  {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'meta',
    litellmModel: 'llama-4-scout',
    description: 'Meta Llama 4 Scout — fast multimodal open-source model via Groq',
    contextWindow: 131072,
    strengths: ['Fast', 'Open source', 'Multimodal'],
    envKey: 'GROQ_API_KEY',
    supportsVision: true,
    supportsReasoning: false,
    badge: 'Fast',
  },
  {
    id: 'llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'meta',
    litellmModel: 'llama-4-maverick',
    description: 'Meta Llama 4 Maverick — powerful mixture-of-experts open model',
    contextWindow: 131072,
    strengths: ['Coding', 'Analysis', 'Open source'],
    envKey: 'GROQ_API_KEY',
    supportsVision: true,
    supportsReasoning: false,
    badge: 'Smart',
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B',
    provider: 'meta',
    litellmModel: 'llama-3-3-70b',
    description: 'Meta Llama 3.3 70B — reliable open model, great all-rounder',
    contextWindow: 128000,
    strengths: ['Coding', 'Chat', 'Open source'],
    envKey: 'GROQ_API_KEY',
    supportsVision: false,
    supportsReasoning: false,
  },
]

// Provider display metadata
export const PROVIDER_META: Record<string, { label: string; color: string; icon: string }> = {
  openai:     { label: 'OpenAI',     color: '#10a37f', icon: '◎' },
  anthropic:  { label: 'Anthropic',  color: '#cc7a3e', icon: '◈' },
  google:     { label: 'Google',     color: '#4285f4', icon: '◆' },
  xai:        { label: 'xAI',        color: '#e5e5e5', icon: '✕' },
  deepseek:   { label: 'Deepseek',   color: '#4d7eff', icon: '◇' },
  perplexity: { label: 'Perplexity', color: '#20b2aa', icon: '◉' },
  meta:       { label: 'Meta',       color: '#0064e0', icon: '◎' },
  local:      { label: 'Local',      color: '#888888', icon: '◌' },
  thaillm:    { label: 'ThaiLLM',    color: '#e11d48', icon: 'ธ' },
}

// Check which models are available based on env vars
export function getAvailableModels(): ModelConfig[] {
  return MODELS.filter(m => {
    if (m.provider === 'local') return true // Always available if LM Studio is running
    return !!process.env[m.envKey]
  })
}

// Get models grouped by provider
export function getModelsByProvider(): Record<Provider, ModelConfig[]> {
  const grouped: Partial<Record<Provider, ModelConfig[]>> = {}
  for (const model of MODELS) {
    if (!grouped[model.provider]) grouped[model.provider] = []
    grouped[model.provider]!.push(model)
  }
  return grouped as Record<Provider, ModelConfig[]>
}

export function getModelById(id: string): ModelConfig | undefined {
  return MODELS.find(m => m.id === id)
}

export const DEFAULT_MODEL_ID = 'qwen3'
