// GET  /api/conversations  — list all conversations (most recent first)
// POST /api/conversations  — create a new conversation

import { NextResponse } from 'next/server'
import { queryAuth, type DbConversation } from '../../lib/db'
import { getAuthFromRequest } from '../../lib/auth'

export async function GET(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await queryAuth<DbConversation>(
    `SELECT id, title, mode, system_prompt, created_at, updated_at
     FROM conversations
     WHERE owner_id = $1 OR owner_id IS NULL
     ORDER BY updated_at DESC
     LIMIT 100`,
    [auth.sub]
  )
  return NextResponse.json({ conversations: rows })
}

export async function POST(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const title: string = (body.title || 'New Chat').slice(0, 200)
    const mode: string = body.mode || 'general'
    const systemPrompt: string | null = body.systemPrompt || null

    const rows = await queryAuth<DbConversation>(
      `INSERT INTO conversations (title, mode, system_prompt, owner_id, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, mode, system_prompt, created_at, updated_at`,
      [title, mode, systemPrompt, auth.sub, auth.tenant_id]
    )

    if (!rows[0]) {
      return NextResponse.json({
        conversation: {
          id: crypto.randomUUID(),
          title, mode,
          system_prompt: systemPrompt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _local: true,
        },
      })
    }

    return NextResponse.json({ conversation: rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[Conversations POST]', err)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
