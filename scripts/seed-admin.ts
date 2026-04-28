#!/usr/bin/env ts-node
/**
 * seed-admin — Bootstrap the first admin user.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_INITIAL_PASSWORD=changeme123 npx ts-node scripts/seed-admin.ts
 *
 * If an admin user already exists, the script exits without creating a duplicate.
 */

import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const email    = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  const password = process.env.ADMIN_INITIAL_PASSWORD
  const tenantId = process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001'

  if (!email || !password) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD must be set')
    process.exit(1)
  }

  const client = await pool.connect()
  try {
    // Check if any admin exists in this tenant
    const existing = await client.query(
      `SELECT u.id FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE u.tenant_id = $1 AND r.name = 'admin'
       LIMIT 1`,
      [tenantId]
    )

    if (existing.rowCount && existing.rowCount > 0) {
      console.log('Admin user already exists — skipping seed.')
      return
    }

    // Check user with this email
    const emailExists = await client.query(
      `SELECT id FROM users WHERE email = $1 AND tenant_id = $2`,
      [email, tenantId]
    )

    let userId: string

    if (emailExists.rowCount && emailExists.rowCount > 0) {
      userId = emailExists.rows[0].id
      console.log(`User ${email} exists — promoting to admin.`)
    } else {
      // Create user with bcrypt hash via pgcrypto
      const created = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, force_password_change)
         VALUES ($1, $2, crypt($3, gen_salt('bf', 12)), TRUE)
         RETURNING id`,
        [tenantId, email, password]
      )
      userId = created.rows[0].id
      console.log(`Created user: ${email} (id: ${userId})`)
    }

    // Assign admin role
    const roleRow = await client.query(
      `SELECT id FROM roles WHERE tenant_id = $1 AND name = 'admin'`,
      [tenantId]
    )
    if (roleRow.rowCount === 0) {
      console.error('ERROR: admin role not found. Run rbac.sql migration first.')
      process.exit(1)
    }

    const roleId = roleRow.rows[0].id
    await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, roleId]
    )

    // Write audit log
    await client.query(
      `INSERT INTO audit_logs (tenant_id, actor_email, action, resource, resource_id, detail)
       VALUES ($1, $2, 'admin.bootstrap', 'user', $3, '{"source":"seed-admin script"}')`,
      [tenantId, email, userId]
    )

    console.log(`✓ Admin seeded: ${email}`)
    console.log(`  Force password change: true`)
    console.log(`  Login at /login and change your password immediately.`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
