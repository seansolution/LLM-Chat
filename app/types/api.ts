// ─── API Contract Types ────────────────────────────────────────────────────────
// Shared request/response interfaces used across all API routes.
// Client code should import from here to stay in sync with the server.

// ──────────────────────────────────────────────────────────────────────────────
// Chat API  (/api/chat)
// ──────────────────────────────────────────────────────────────────────────────

export interface ChatRequest {
  message: string
  /** Single-model ID (defaults to DEFAULT_MODEL_ID) */
  model?: string
  /** Two-to-four model IDs → triggers compare mode */
  models?: string[]
  conversationId?: string
  systemPrompt?: string
  temperature?: number   // 0.0–2.0, default 0.7
  maxTokens?: number     // 64–32768, clamped by tenant UI settings
  mode?: 'general' | 'knowledge'
}

export interface SingleChatResponse {
  reply: string
  model: string
  modelName: string
  latencyMs: number
  totalMs: number
  conversationId?: string
}

export interface CompareReply {
  model: string
  modelName: string
  provider: string
  reply: string
  error?: string
  latencyMs: number
}

export interface CompareChatResponse {
  mode: 'compare'
  replies: CompareReply[]
  totalMs: number
  conversationId?: string
}

export type ChatResponse = SingleChatResponse | CompareChatResponse

// ──────────────────────────────────────────────────────────────────────────────
// Conversation API  (/api/conversations)
// ──────────────────────────────────────────────────────────────────────────────

export interface ConversationSummary {
  id: string
  title: string
  mode: string
  created_at: string
  updated_at: string
  owner_id?: string
}

export interface ConversationDetail extends ConversationSummary {
  system_prompt?: string
  messages: MessageRecord[]
}

export interface MessageRecord {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  model_id?: string
  provider?: string
  compare_group?: string
  latency_ms?: number
  token_count?: number
  created_at: string
}

export interface CreateConversationRequest {
  title?: string
  mode?: 'general' | 'knowledge'
  systemPrompt?: string
}

export interface UpdateConversationRequest {
  title?: string
  systemPrompt?: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Share API  (/api/conversations/[id]/share)
// ──────────────────────────────────────────────────────────────────────────────

export type SharePermission = 'view' | 'comment'
export type ShareType = 'link' | 'user'

export interface ChatShare {
  id: string
  conversation_id: string
  owner_user_id?: string
  target_user_id?: string
  share_type: ShareType
  permission: SharePermission
  token?: string
  expires_at?: string
  revoked_at?: string
  created_at: string
}

export interface CreateShareRequest {
  shareType: ShareType
  permission?: SharePermission
  targetUserId?: string
  expiresInDays?: number
}

export interface CreateShareResponse {
  share: ChatShare
  shareUrl: string
}

export interface RevokeShareRequest {
  shareId?: string  // revoke specific share; omit to revoke all
}

// ──────────────────────────────────────────────────────────────────────────────
// Auth API  (/api/auth/*)
// ──────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: UserProfile
  requiresPasswordChange?: boolean
}

export interface UserProfile {
  id: string
  email: string
  name?: string
  roles: string[]
  permissions: string[]
  tenant_id: string
  created_at: string
}

// ──────────────────────────────────────────────────────────────────────────────
// RBAC  — permissions
// ──────────────────────────────────────────────────────────────────────────────

export const PERMISSIONS = [
  'users.read',
  'users.write',
  'users.delete',
  'roles.read',
  'roles.write',
  'chat.read',
  'chat.write',
  'chat.share',
  'chat.share.manage',
  'chat.share.external',
  'knowledge.read',
  'knowledge.write',
  'metrics.read',
  'audit.read',
  'system.admin',
] as const

export type Permission = typeof PERMISSIONS[number]

export const ROLES = ['admin', 'manager', 'agent', 'viewer'] as const
export type Role = typeof ROLES[number]

/** Default permission set per built-in role */
export const ROLE_DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [...PERMISSIONS],      // full permission
  manager: [
    'users.read', 'roles.read',
    'chat.read', 'chat.write', 'chat.share', 'chat.share.manage',
    'knowledge.read', 'knowledge.write', 'metrics.read', 'audit.read',
  ],
  agent: [
    'chat.read', 'chat.write', 'chat.share',
    'knowledge.read', 'metrics.read',
  ],
  viewer: ['chat.read', 'knowledge.read'],
}

// ──────────────────────────────────────────────────────────────────────────────
// Admin API  (/api/admin/*)
// ──────────────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  email: string
  name?: string
  roles: string[]
  is_active: boolean
  force_password_change: boolean
  token_limit?: number | null
  token_used?: number
  created_at: string
  last_login_at?: string
}

export interface CreateUserRequest {
  email: string
  name?: string
  password: string
  roles?: Role[]
  token_limit?: number | null
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  is_active?: boolean
  token_limit?: number | null
  token_used?: number
}

export interface AssignRoleRequest {
  userId: string
  role: Role
}

export interface AuditLogEntry {
  id: string | number
  actor_id?: string
  actor_email?: string
  action: string
  resource: string
  resource_id?: string
  detail?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Orchestrator internal types
// ──────────────────────────────────────────────────────────────────────────────

export interface AgentContext {
  requestId: string
  userId?: string
  tenantId?: string
  conversationId?: string
  userMessage: string
  systemPrompt?: string
  modelIds: string[]
  temperature: number
  maxTokens: number
  mode: 'general' | 'knowledge'
  permissions: Permission[]
  startTime: number
}

export interface AgentResult<T = unknown> {
  agentName: string
  ok: boolean
  data?: T
  error?: string
  latencyMs: number
}

export interface OrchestrationResult {
  responses: LLMModelResponse[]
  agentTrace: AgentResult[]
  totalMs: number
}

export interface LLMModelResponse {
  modelId: string
  reply: string
  latencyMs: number
  error?: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Pagination helper
// ──────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
