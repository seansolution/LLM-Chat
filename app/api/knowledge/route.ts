// ─── Knowledge Base API (/api/knowledge) ──────────────────────────────────────
// GET  — list documents for the current tenant
// POST — ingest a new document (text content or URL)
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { getAuthFromRequest } from '../../lib/auth'
import { query, execute } from '../../lib/db'
import { ingestDocument } from '../../lib/knowledge'
import type { KnowledgeDoc } from '../../lib/knowledge'

// ─── GET /api/knowledge ───────────────────────────────────────────────────────

export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!auth.permissions.includes('knowledge.read') && !auth.permissions.includes('system.admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const page     = Math.max(1, parseInt(url.searchParams.get('page')     || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)))
  const status   = url.searchParams.get('status') || undefined
  const offset   = (page - 1) * pageSize

  const whereParts = [`tenant_id = $1`]
  const params: unknown[] = [auth.tenant_id]

  if (status) {
    whereParts.push(`status = $${params.length + 1}`)
    params.push(status)
  }

  const where = whereParts.join(' AND ')

  const [rows, countRows] = await Promise.all([
    query<KnowledgeDoc>(
      `SELECT id, tenant_id, title, source_url, mime_type, language,
              status, error_msg, chunk_count, created_by, created_at, updated_at
       FROM knowledge_docs
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    ),
    query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM knowledge_docs WHERE ${where}`,
      params
    ),
  ])

  const total = parseInt(countRows[0]?.total || '0', 10)

  return NextResponse.json({
    items: rows,
    total,
    page,
    pageSize,
    hasMore: offset + rows.length < total,
  })
}

// ─── POST /api/knowledge ──────────────────────────────────────────────────────
// Body: { title, content, sourceUrl?, language?, mimeType? }

export async function POST(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!auth.permissions.includes('knowledge.write') && !auth.permissions.includes('system.admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as {
    title?: string
    content?: string
    sourceUrl?: string
    language?: string
    mimeType?: string
  }

  const title = (body.title || '').trim()
  const content = (body.content || '').trim()

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })
  if (content.length > 2_000_000) {
    return NextResponse.json({ error: 'content too large (max 2 MB text)' }, { status: 413 })
  }

  // Insert the document record
  const rows = await query<{ id: string }>(
    `INSERT INTO knowledge_docs
       (tenant_id, title, content, source_url, mime_type, language, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      auth.tenant_id,
      title,
      content,
      body.sourceUrl || null,
      body.mimeType || 'text/plain',
      body.language || 'th',
      auth.sub,
    ]
  )

  const docId = rows[0]?.id
  if (!docId) {
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }

  // Fire-and-forget ingestion (chunk + embed + index)
  // In production this would be a background queue job
  ingestDocument(docId).catch(err =>
    console.error('[knowledge] background ingest error:', err)
  )

  return NextResponse.json({ id: docId, status: 'pending' }, { status: 202 })
}
