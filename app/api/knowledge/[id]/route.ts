// ─── Knowledge Document API (/api/knowledge/[id]) ─────────────────────────────
// GET    — fetch document details + chunk count
// DELETE — remove document and all its chunks
// POST   — re-trigger ingestion (if failed or pending)
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { getAuthFromRequest } from '../../../lib/auth'
import { query, execute } from '../../../lib/db'
import { ingestDocument } from '../../../lib/knowledge'
import type { KnowledgeDoc } from '../../../lib/knowledge'

type Ctx = { params: Promise<{ id: string }> }

// ─── GET /api/knowledge/[id] ──────────────────────────────────────────────────

export async function GET(req: Request, { params }: Ctx) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.permissions.includes('knowledge.read') && !auth.permissions.includes('system.admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const rows = await query<KnowledgeDoc>(
    `SELECT id, tenant_id, title, source_url, mime_type, language,
            status, error_msg, chunk_count, created_by, created_at, updated_at
     FROM knowledge_docs
     WHERE id = $1 AND tenant_id = $2`,
    [id, auth.tenant_id]
  )

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(rows[0])
}

// ─── DELETE /api/knowledge/[id] ───────────────────────────────────────────────

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.permissions.includes('knowledge.write') && !auth.permissions.includes('system.admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Verify ownership
  const doc = await query<{ id: string }>(
    `SELECT id FROM knowledge_docs WHERE id = $1 AND tenant_id = $2`,
    [id, auth.tenant_id]
  )
  if (!doc[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Chunks are deleted via CASCADE
  const deleted = await execute(
    `DELETE FROM knowledge_docs WHERE id = $1 AND tenant_id = $2`,
    [id, auth.tenant_id]
  )

  if (!deleted) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// ─── POST /api/knowledge/[id] — re-ingest ─────────────────────────────────────

export async function POST(req: Request, { params }: Ctx) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.permissions.includes('knowledge.write') && !auth.permissions.includes('system.admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const rows = await query<{ id: string; status: string }>(
    `SELECT id, status FROM knowledge_docs WHERE id = $1 AND tenant_id = $2`,
    [id, auth.tenant_id]
  )
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Reset chunks and re-ingest
  await execute(`DELETE FROM knowledge_chunks WHERE doc_id = $1`, [id])
  await execute(
    `UPDATE knowledge_docs SET status = 'pending', chunk_count = 0, error_msg = NULL, updated_at = NOW() WHERE id = $1`,
    [id]
  )

  ingestDocument(id).catch(err =>
    console.error('[knowledge] re-ingest error:', err)
  )

  return NextResponse.json({ id, status: 'pending' }, { status: 202 })
}
