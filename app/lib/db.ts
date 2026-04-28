// ─── PostgreSQL Connection Pool ──────────────────────────────────────────────
// Singleton Pool — shared across all API route invocations in the same process.
// Falls back gracefully to in-memory storage when PostgreSQL is unavailable.

import { Pool, type PoolClient } from 'pg'

let pool: Pool | null = null
let dbAvailable = false

function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://rag_app:ragapppassword@localhost:5432/ragdb'

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000, // Fail fast if DB unreachable
    })

    pool.on('error', (err) => {
      console.warn('[DB] Pool error:', err.message)
    })
  }
  return pool
}

// Test DB connection on first use
async function ensureConnected(): Promise<boolean> {
  if (dbAvailable) return true
  try {
    const client = await getPool().connect()
    await client.query('SELECT 1')
    client.release()
    dbAvailable = true
    console.log('[DB] PostgreSQL connected ✓')
    return true
  } catch (err) {
    console.warn('[DB] PostgreSQL unavailable — using in-memory fallback:', (err as Error).message)
    return false
  }
}

// ─── Query helpers ───────────────────────────────────────────────────────────

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const ok = await ensureConnected()
  if (!ok) return []
  try {
    const result = await getPool().query(sql, params)
    return result.rows as T[]
  } catch (err) {
    console.error('[DB] Query error:', err)
    return []
  }
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(sql: string, params?: unknown[]): Promise<number> {
  const ok = await ensureConnected()
  if (!ok) return 0
  try {
    const result = await getPool().query(sql, params)
    return result.rowCount ?? 0
  } catch (err) {
    console.error('[DB] Execute error:', err)
    return 0
  }
}

// ─── Transaction helper ──────────────────────────────────────────────────────

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T | null> {
  const ok = await ensureConnected()
  if (!ok) return null
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[DB] Transaction error:', err)
    return null
  } finally {
    client.release()
  }
}

// ─── DB availability check ───────────────────────────────────────────────────
export async function isDbAvailable(): Promise<boolean> {
  return ensureConnected()
}

// ─── Auth query — bypasses RLS by setting is_admin session var ───────────────
// Use ONLY for login/auth flows where no user session exists yet.
export async function queryAuth<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const ok = await ensureConnected()
  if (!ok) return []
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await client.query(`SET LOCAL app.is_admin = 'true'`)
    await client.query(`SET LOCAL app.current_tenant_id = '00000000-0000-0000-0000-000000000001'`)
    const result = await client.query(sql, params)
    await client.query('COMMIT')
    return result.rows as T[]
  } catch (err) {
    try { await client.query('ROLLBACK') } catch { /* ignore */ }
    console.error('[DB] queryAuth error:', err)
    return []
  } finally {
    client.release()
  }
}

export async function queryAuthOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await queryAuth<T>(sql, params)
  return rows[0] ?? null
}

// ─── Typed DB operations for conversations ───────────────────────────────────

export interface DbConversation {
  id: string
  title: string
  mode: string
  system_prompt: string | null
  created_at: string
  updated_at: string
}

export interface DbMessage {
  id: string
  conversation_id: string
  role: string
  content: string
  model_id: string | null
  provider: string | null
  compare_group: string | null
  latency_ms: number | null
  token_count: number | null
  created_at: string
}

export interface DbShareLink {
  id: string
  conversation_id: string
  token: string
  created_at: string
  expires_at: string | null
}
