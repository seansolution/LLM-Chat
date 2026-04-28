/** @jest-environment node */
/**
 * RLS Policy Tests
 *
 * These tests run against a real PostgreSQL instance (see DATABASE_URL).
 * They verify that row-level security correctly allows or denies access
 * based on tenant and user context.
 *
 * Skip if DATABASE_URL is not set (CI without a DB).
 */

import { Pool, PoolClient } from 'pg'
import { randomUUID } from 'crypto'

const DATABASE_URL = process.env.DATABASE_URL
const SKIP = !DATABASE_URL

// ─── Test fixtures ────────────────────────────────────────────────────────────

interface Fixture {
  tenantA: string
  tenantB: string
  userA: string   // agent in tenantA
  userB: string   // agent in tenantB
  adminUser: string
  convA: string   // conversation owned by userA
  convB: string   // conversation owned by userB
}

let pool: Pool
let fix: Fixture

function setSession(client: PoolClient, userId: string, tenantId: string, isAdmin = false) {
  return client.query(`
    SET LOCAL app.current_user_id = '${userId}';
    SET LOCAL app.current_tenant_id = '${tenantId}';
    SET LOCAL app.is_admin = '${isAdmin ? 'true' : 'false'}';
  `)
}

async function setupFixtures(client: PoolClient): Promise<Fixture> {
  await client.query(`
    SET LOCAL app.current_user_id = '';
    SET LOCAL app.current_tenant_id = '';
    SET LOCAL app.is_admin = 'true';
  `)

  const run = randomUUID().slice(0, 8)

  // Create two tenants
  const tA = (await client.query(
    `INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id`,
    [`Tenant A ${run}`, `tenant-a-test-${run}`]
  )).rows[0].id

  const tB = (await client.query(
    `INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id`,
    [`Tenant B ${run}`, `tenant-b-test-${run}`]
  )).rows[0].id

  // Create users
  const uA = (await client.query(
    `INSERT INTO users (tenant_id, email, password_hash) VALUES ($1, $2, 'x') RETURNING id`,
    [tA, `ua+${run}@test.com`]
  )).rows[0].id

  const uB = (await client.query(
    `INSERT INTO users (tenant_id, email, password_hash) VALUES ($1, $2, 'x') RETURNING id`,
    [tB, `ub+${run}@test.com`]
  )).rows[0].id

  const uAdmin = (await client.query(
    `INSERT INTO users (tenant_id, email, password_hash) VALUES ($1, $2, 'x') RETURNING id`,
    [tA, `admin+${run}@test.com`]
  )).rows[0].id

  // Create conversations
  const cA = (await client.query(
    `INSERT INTO conversations (owner_id, tenant_id, title) VALUES ($1, $2, 'Conv A') RETURNING id`,
    [uA, tA]
  )).rows[0].id

  const cB = (await client.query(
    `INSERT INTO conversations (owner_id, tenant_id, title) VALUES ($1, $2, 'Conv B') RETURNING id`,
    [uB, tB]
  )).rows[0].id

  return { tenantA: tA, tenantB: tB, userA: uA, userB: uB, adminUser: uAdmin, convA: cA, convB: cB }
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (SKIP) return
  pool = new Pool({ connectionString: DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    fix = await setupFixtures(client)
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
})

afterAll(async () => {
  if (SKIP) return
  // Cleanup in dependency order for schemas that don't cascade on tenant delete.
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`
      SET LOCAL app.current_user_id = '';
      SET LOCAL app.current_tenant_id = '';
      SET LOCAL app.is_admin = 'true';
    `)
    if (fix) {
      await client.query(`DELETE FROM audit_logs WHERE tenant_id = ANY($1::uuid[])`, [[fix.tenantA, fix.tenantB]])
      await client.query(`DELETE FROM chat_share_audit_logs WHERE share_id IN (SELECT id FROM chat_shares WHERE conversation_id = ANY($1::uuid[]))`, [[fix.convA, fix.convB]])
      await client.query(`DELETE FROM chat_shares WHERE conversation_id = ANY($1::uuid[])`, [[fix.convA, fix.convB]])
      await client.query(`DELETE FROM messages WHERE conversation_id = ANY($1::uuid[])`, [[fix.convA, fix.convB]])
      await client.query(`DELETE FROM conversations WHERE id = ANY($1::uuid[])`, [[fix.convA, fix.convB]])
      await client.query(`DELETE FROM user_roles WHERE user_id = ANY($1::uuid[])`, [[fix.userA, fix.userB, fix.adminUser]])
      await client.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [[fix.userA, fix.userB, fix.adminUser]])
      await client.query(`DELETE FROM roles WHERE tenant_id = ANY($1::uuid[])`, [[fix.tenantA, fix.tenantB]])
      await client.query(`DELETE FROM user_sessions WHERE user_id = ANY($1::uuid[])`, [[fix.userA, fix.userB, fix.adminUser]])
      await client.query(`DELETE FROM conversations WHERE tenant_id = ANY($1::uuid[])`, [[fix.tenantA, fix.tenantB]])
      await client.query(`DELETE FROM tenants WHERE id = ANY($1::uuid[])`, [[fix.tenantA, fix.tenantB]])
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
    await pool.end()
  }
})

// ─── Helper ───────────────────────────────────────────────────────────────────

async function withSession<T>(
  userId: string,
  tenantId: string,
  isAdmin: boolean,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await setSession(client, userId, tenantId, isAdmin)
    const result = await fn(client)
    await client.query('ROLLBACK') // always rollback test mutations
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

async function withCommittedSession<T>(
  userId: string,
  tenantId: string,
  isAdmin: boolean,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await setSession(client, userId, tenantId, isAdmin)
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// ─── Conversations — RLS tests ────────────────────────────────────────────────

describe('RLS: conversations', () => {
  const maybeIt = SKIP ? it.skip : it

  maybeIt('ALLOW — owner can read own conversation', async () => {
    const rows = await withSession(fix.userA, fix.tenantA, false, async client => {
      return (await client.query(
        'SELECT id FROM conversations WHERE id = $1', [fix.convA]
      )).rows
    })
    expect(rows.length).toBe(1)
  })

  maybeIt('DENY — user in tenantA cannot read tenantB conversation', async () => {
    const rows = await withSession(fix.userA, fix.tenantA, false, async client => {
      return (await client.query(
        'SELECT id FROM conversations WHERE id = $1', [fix.convB]
      )).rows
    })
    expect(rows.length).toBe(0)
  })

  maybeIt('ALLOW — admin session can read any conversation', async () => {
    const rows = await withSession(fix.adminUser, fix.tenantA, true, async client => {
      return (await client.query(
        'SELECT id FROM conversations WHERE id = ANY($1::uuid[])', [[fix.convA, fix.convB]]
      )).rows
    })
    expect(rows.length).toBe(2)
  })

  maybeIt('DENY — user in tenantB cannot read tenantA conversation', async () => {
    const rows = await withSession(fix.userB, fix.tenantB, false, async client => {
      return (await client.query(
        'SELECT id FROM conversations WHERE id = $1', [fix.convA]
      )).rows
    })
    expect(rows.length).toBe(0)
  })

  maybeIt('ALLOW — shared conversation is visible to target user', async () => {
    // Share convA with userB
    await withCommittedSession(fix.userA, fix.tenantA, false, async client => {
      await client.query(
        `INSERT INTO chat_shares (conversation_id, owner_user_id, target_user_id, share_type)
         VALUES ($1, $2, $3, 'user')`,
        [fix.convA, fix.userA, fix.userB]
      )
    })

    const rows = await withSession(fix.userB, fix.tenantB, false, async client => {
      return (await client.query(
        'SELECT id FROM conversations WHERE id = $1', [fix.convA]
      )).rows
    })
    // userB now sees convA through the share
    expect(rows.length).toBe(1)
  })

  maybeIt('DENY — revoked share removes access', async () => {
    // Revoke any existing share(s) from previous tests, then create+revoke one explicitly.
    await withCommittedSession(fix.userA, fix.tenantA, false, async client => {
      await client.query(
        `UPDATE chat_shares
         SET revoked_at = NOW()
         WHERE conversation_id = $1 AND target_user_id = $2 AND revoked_at IS NULL`,
        [fix.convA, fix.userB]
      )
    })

    await withCommittedSession(fix.userA, fix.tenantA, false, async client => {
      const r = await client.query(
        `INSERT INTO chat_shares (conversation_id, owner_user_id, target_user_id, share_type)
         VALUES ($1, $2, $3, 'user') RETURNING id`,
        [fix.convA, fix.userA, fix.userB]
      )
      const id = r.rows[0].id
      await client.query(
        `UPDATE chat_shares SET revoked_at = NOW() WHERE id = $1`, [id]
      )
    })

    const rows = await withSession(fix.userB, fix.tenantB, false, async client => {
      return (await client.query(
        'SELECT id FROM conversations WHERE id = $1',
        [fix.convA]
      )).rows
    })
    // Revoked share should not grant read access.
    expect(rows.length).toBe(0)
  })
})

// ─── Cross-tenant isolation — users table ─────────────────────────────────────

describe('RLS: users cross-tenant isolation', () => {
  const maybeIt = SKIP ? it.skip : it

  maybeIt('DENY — tenantA user cannot list tenantB users', async () => {
    const rows = await withSession(fix.userA, fix.tenantA, false, async client => {
      return (await client.query(
        'SELECT id FROM users WHERE tenant_id = $1', [fix.tenantB]
      )).rows
    })
    expect(rows.length).toBe(0)
  })

  maybeIt('ALLOW — admin sees all users', async () => {
    const rows = await withSession(fix.adminUser, fix.tenantA, true, async client => {
      return (await client.query(
        'SELECT id FROM users WHERE tenant_id = ANY($1::uuid[])', [[fix.tenantA, fix.tenantB]]
      )).rows
    })
    expect(rows.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── Audit logs — tenant scoped ──────────────────────────────────────────────

describe('RLS: audit_logs', () => {
  const maybeIt = SKIP ? it.skip : it

  maybeIt('DENY — user without audit.read cannot SELECT audit_logs', async () => {
    // userA has no permissions assigned in this test — should see nothing
    const rows = await withSession(fix.userA, fix.tenantA, false, async client => {
      return (await client.query('SELECT id FROM audit_logs LIMIT 10')).rows
    })
    expect(rows.length).toBe(0)
  })
})
