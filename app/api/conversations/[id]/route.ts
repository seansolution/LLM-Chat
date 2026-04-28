// GET    /api/conversations/[id]  — get conversation + messages
// PATCH  /api/conversations/[id]  — update title or system_prompt
// DELETE /api/conversations/[id]  — delete conversation

import { NextResponse } from 'next/server'
import { queryAuth, queryAuthOne, execute, type DbConversation, type DbMessage } from '../../../lib/db'
import { getAuthFromRequest } from '../../../lib/auth'

type Params = { params: { id: string } }

export async function GET(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  const [convRows, msgRows] = await Promise.all([
    queryAuth<DbConversation>(
      `SELECT id, title, mode, system_prompt, created_at, updated_at
       FROM conversations WHERE id = $1`,
      [id]
    ),
    queryAuth<DbMessage>(
      `SELECT id, role, content, model_id, provider, compare_group, latency_ms, created_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [id]
    ),
  ])

  if (!convRows[0]) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  return NextResponse.json({ conversation: convRows[0], messages: msgRows })
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  try {
    const body = await req.json().catch(() => ({}))
    const updates: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (typeof body.title === 'string') {
      updates.push(`title = $${idx++}`)
      values.push(body.title.slice(0, 200))
    }
    if (typeof body.systemPrompt === 'string') {
      updates.push(`system_prompt = $${idx++}`)
      values.push(body.systemPrompt || null)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const rows = await queryAuth<DbConversation>(
      `UPDATE conversations SET ${updates.join(', ')}
       WHERE id = $${idx}
       RETURNING id, title, mode, system_prompt, updated_at`,
      values
    )

    if (!rows[0]) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ conversation: rows[0] })
  } catch (err) {
    console.error('[Conversations PATCH]', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const auth = await getAuthFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  const count = await execute(`DELETE FROM conversations WHERE id = $1`, [id])
  if (count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ deleted: true })
}
