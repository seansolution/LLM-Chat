// POST /api/conversations/[id]/share
// Creates a public share link for a conversation.
// Returns: { token, shareUrl }

import { NextResponse } from 'next/server'
import { query, execute, type DbShareLink } from '../../../../lib/db'

type Params = { params: { id: string } }

export async function POST(req: Request, { params }: Params) {
  const { id } = params
  try {
    const body = await req.json().catch(() => ({}))
    // Optional: expiry in days (0 = never)
    const expiryDays: number = typeof body.expiryDays === 'number' ? body.expiryDays : 0

    // Check conversation exists
    const convRows = await query<{ id: string }>(
      `SELECT id FROM conversations WHERE id = $1`,
      [id]
    )
    if (!convRows[0]) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Generate a secure random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(18)))
      .map(b => b.toString(36).padStart(2, '0'))
      .join('')
      .slice(0, 24)

    const expiresAt = expiryDays > 0
      ? new Date(Date.now() + expiryDays * 86400_000).toISOString()
      : null

    const rows = await query<DbShareLink>(
      `INSERT INTO share_links (conversation_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, token, created_at, expires_at`,
      [id, token, expiresAt]
    )

    if (!rows[0]) {
      // Fallback token when DB is unavailable
      return NextResponse.json({
        token,
        shareUrl: `/share/${token}`,
        _local: true,
      })
    }

    return NextResponse.json({
      token: rows[0].token,
      shareUrl: `/share/${rows[0].token}`,
      expiresAt: rows[0].expires_at,
    }, { status: 201 })
  } catch (err) {
    console.error('[Share POST]', err)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = params
  await execute(`DELETE FROM share_links WHERE conversation_id = $1`, [id])
  return NextResponse.json({ deleted: true })
}
