-- ============================================================
-- RBAC Schema Migration
-- Run AFTER init.sql
-- ============================================================

-- ─────────────────────────────────────────────
-- Tenants
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default tenant
INSERT INTO tenants (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default', 'default')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email                 TEXT NOT NULL,
    name                  TEXT,
    password_hash         TEXT NOT NULL,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    force_password_change BOOLEAN NOT NULL DEFAULT FALSE,
    token_limit           INTEGER,
    token_used            BIGINT NOT NULL DEFAULT 0,
    last_login_at         TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS token_limit INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_used BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- ─────────────────────────────────────────────
-- Tenant-scoped app settings (UI-configurable)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key         TEXT NOT NULL,
    value       JSONB NOT NULL DEFAULT '{}',
    updated_by  UUID REFERENCES users(id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_app_settings_tenant ON app_settings(tenant_id);

-- ─────────────────────────────────────────────
-- Roles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,                      -- admin | manager | agent | viewer
    description TEXT,
    is_builtin  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- ─────────────────────────────────────────────
-- Permissions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key         TEXT NOT NULL UNIQUE,               -- e.g. "chat.write"
    description TEXT,
    category    TEXT                                -- users | chat | knowledge | audit | system
);

-- Seed all permission keys
INSERT INTO permissions (key, description, category) VALUES
  ('users.read',          'View user list and profiles',           'users'),
  ('users.write',         'Create and update users',               'users'),
  ('users.delete',        'Delete / deactivate users',             'users'),
  ('roles.read',          'View roles and permission mappings',     'users'),
  ('roles.write',         'Create and update role permissions',     'users'),
  ('chat.read',           'Read conversations and messages',        'chat'),
  ('chat.write',          'Send messages and create conversations', 'chat'),
  ('chat.share',          'Share conversations with other users',   'chat'),
  ('chat.share.manage',   'Manage (revoke/update) any share',       'chat'),
  ('chat.share.external', 'Create public link shares',             'chat'),
  ('knowledge.read',      'Read knowledge base documents',         'knowledge'),
  ('knowledge.write',     'Upload and manage knowledge base',      'knowledge'),
  ('metrics.read',        'View dashboards and metrics',           'audit'),
  ('audit.read',          'View audit logs',                       'audit'),
  ('system.admin',        'Full system administration access',     'system')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- Role ↔ Permission mapping
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ─────────────────────────────────────────────
-- User ↔ Role assignment
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by  UUID REFERENCES users(id),
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- ─────────────────────────────────────────────
-- Sessions (JWT tracking / revocation)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    ip_address  TEXT,
    user_agent  TEXT,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);

-- ─────────────────────────────────────────────
-- Audit logs (enriched — replaces old audit_log)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   UUID REFERENCES tenants(id),
    actor_id    UUID REFERENCES users(id),
    actor_email TEXT,
    action      TEXT NOT NULL,
    resource    TEXT NOT NULL,
    resource_id TEXT,
    detail      JSONB DEFAULT '{}',
    ip_address  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant    ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor     ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action    ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created   ON audit_logs(created_at DESC);

-- ─────────────────────────────────────────────
-- Chat shares (enhanced — replaces share_links)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_shares (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    owner_user_id   UUID REFERENCES users(id),
    target_user_id  UUID REFERENCES users(id),
    share_type      TEXT NOT NULL DEFAULT 'link',   -- link | user
    permission      TEXT NOT NULL DEFAULT 'view',  -- view | comment
    token_hash      TEXT UNIQUE,                   -- for link shares
    expires_at      TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_shares_conv     ON chat_shares(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_shares_target   ON chat_shares(target_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_shares_token    ON chat_shares(token_hash) WHERE token_hash IS NOT NULL;

-- ─────────────────────────────────────────────
-- Chat share audit log
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_share_audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    share_id    UUID REFERENCES chat_shares(id),
    actor_id    UUID REFERENCES users(id),
    action      TEXT NOT NULL,  -- created | revoked | accessed | expired | updated
    detail      JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_audit_share ON chat_share_audit_logs(share_id);

-- ─────────────────────────────────────────────
-- Add owner tracking to conversations
-- ─────────────────────────────────────────────
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- ─────────────────────────────────────────────
-- Seed built-in roles for default tenant
-- ─────────────────────────────────────────────
DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
  v_admin_role_id   UUID;
  v_manager_role_id UUID;
  v_agent_role_id   UUID;
  v_viewer_role_id  UUID;
BEGIN
  -- Insert roles
  INSERT INTO roles (tenant_id, name, description, is_builtin)
  VALUES
    (v_tenant_id, 'admin',   'Full system access',                     TRUE),
    (v_tenant_id, 'manager', 'Manage users, view metrics and audit',   TRUE),
    (v_tenant_id, 'agent',   'Create and share conversations',         TRUE),
    (v_tenant_id, 'viewer',  'Read-only access to chat and knowledge', TRUE)
  ON CONFLICT (tenant_id, name) DO NOTHING;

  SELECT id INTO v_admin_role_id   FROM roles WHERE tenant_id = v_tenant_id AND name = 'admin';
  SELECT id INTO v_manager_role_id FROM roles WHERE tenant_id = v_tenant_id AND name = 'manager';
  SELECT id INTO v_agent_role_id   FROM roles WHERE tenant_id = v_tenant_id AND name = 'agent';
  SELECT id INTO v_viewer_role_id  FROM roles WHERE tenant_id = v_tenant_id AND name = 'viewer';

  -- admin → all permissions
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, id FROM permissions
    ON CONFLICT DO NOTHING;

  -- manager permissions
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_manager_role_id, id FROM permissions
    WHERE key IN ('users.read','roles.read','chat.read','chat.write','chat.share',
                  'chat.share.manage','knowledge.read','knowledge.write','metrics.read','audit.read')
    ON CONFLICT DO NOTHING;

  -- agent permissions
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_agent_role_id, id FROM permissions
    WHERE key IN ('chat.read','chat.write','chat.share','knowledge.read','metrics.read')
    ON CONFLICT DO NOTHING;

  -- viewer permissions
  INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_viewer_role_id, id FROM permissions
    WHERE key IN ('chat.read','knowledge.read')
    ON CONFLICT DO NOTHING;
END $$;
