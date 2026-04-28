import { NextResponse } from 'next/server'
import { getAuthFromRequest, hasPermission } from '../../../lib/auth'
import { getChatRuntimeConfig, upsertChatRuntimeConfig } from '../../../lib/runtime-config'
import { writeAuditLog } from '../../../lib/rbac'

function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'system.admin')) return forbidden()

  const chat = await getChatRuntimeConfig(auth.tenant_id)
  return NextResponse.json({ chat })
}

export async function PATCH(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'system.admin')) return forbidden()

  const body = await req.json().catch(() => ({})) as { defaultMaxTokens?: number; maxTokensCap?: number }
  const chat = await upsertChatRuntimeConfig(auth.tenant_id, auth.sub, {
    defaultMaxTokens: body.defaultMaxTokens,
    maxTokensCap: body.maxTokensCap,
  })

  await writeAuditLog({
    tenantId: auth.tenant_id,
    actorId: auth.sub,
    actorEmail: auth.email,
    action: 'settings.chat.update',
    resource: 'app_settings',
    resourceId: 'chat.runtime',
    detail: chat as unknown as Record<string, unknown>,
  })

  return NextResponse.json({ chat })
}
