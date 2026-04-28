import { NextResponse } from 'next/server'
import { getAuthFromRequest, hasPermission } from '../../../lib/auth'
import { getTenantAIConfig, upsertTenantAIConfig, type ProviderRuntimeConfig } from '../../../lib/ai-config'
import type { ModelConfig } from '../../../lib/models'
import { writeAuditLog } from '../../../lib/rbac'

function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

function maskProviders(providers: Record<string, ProviderRuntimeConfig>) {
  const out: Record<string, ProviderRuntimeConfig> = {}
  for (const [k, v] of Object.entries(providers)) {
    out[k] = { ...v, secret: v.secret ? '********' : '' }
  }
  return out
}

export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'system.admin')) return forbidden()

  const cfg = await getTenantAIConfig(auth.tenant_id)
  return NextResponse.json({ providers: maskProviders(cfg.providers), models: cfg.models })
}

export async function PATCH(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(auth, 'system.admin')) return forbidden()

  const body = await req.json().catch(() => ({})) as {
    providers?: Record<string, ProviderRuntimeConfig>
    models?: ModelConfig[]
  }

  // Preserve existing secrets when client sends masked values
  let providers = body.providers
  if (providers) {
    const current = await getTenantAIConfig(auth.tenant_id)
    providers = Object.fromEntries(Object.entries(providers).map(([k, v]) => {
      const prev = current.providers[k]
      const secret = v.secret === '********' ? prev?.secret : v.secret
      return [k, { ...v, secret }]
    }))
  }

  const updated = await upsertTenantAIConfig(auth.tenant_id, auth.sub, {
    providers,
    models: body.models,
  })

  await writeAuditLog({
    tenantId: auth.tenant_id,
    actorId: auth.sub,
    actorEmail: auth.email,
    action: 'settings.ai.update',
    resource: 'app_settings',
    resourceId: 'ai.providers+ai.models',
  })

  return NextResponse.json({ providers: maskProviders(updated.providers), models: updated.models })
}
