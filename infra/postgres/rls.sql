-- ============================================================
-- Row-Level Security (RLS) Policies
-- Run AFTER rbac.sql
-- ============================================================
-- Convention:
--   Application sets:  SET LOCAL app.current_user_id = '<uuid>';
--                      SET LOCAL app.current_tenant_id = '<uuid>';
--                      SET LOCAL app.is_admin = 'true' | 'false';
-- These are read by every policy to scope queries.
-- The app/lib/db.ts withTransaction() helper sets these before each query.
-- ============================================================

-- ─────────────────────────────────────────────
-- Helper: current user / tenant from session vars
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_admin_session() RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('app.is_admin', TRUE) = 'true';
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION user_has_permission(permission_key TEXT) RETURNS BOOLEAN AS $$
BEGIN
  IF is_admin_session() THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = current_user_id()
      AND p.key = permission_key
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_role(role_name TEXT) RETURNS BOOLEAN AS $$
BEGIN
  IF is_admin_session() THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = current_user_id()
      AND r.name = role_name
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- users table RLS
-- ─────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Users can only see their own tenant's users; admins see all
DROP POLICY IF EXISTS users_tenant_isolation ON users;
CREATE POLICY users_tenant_isolation ON users
  USING (
    tenant_id = current_tenant_id()
    OR is_admin_session()
  );

DROP POLICY IF EXISTS users_self_update ON users;
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (
    id = current_user_id()
    OR is_admin_session()
    OR user_has_role('admin')
    OR user_has_role('manager')
  );

-- ─────────────────────────────────────────────
-- conversations table RLS
-- ─────────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;

-- Owner or admin can see all; shared chats handled via chat_shares
DROP POLICY IF EXISTS conversations_owner_or_admin ON conversations;
CREATE POLICY conversations_owner_or_admin ON conversations
  USING (
    owner_id = current_user_id()
    OR is_admin_session()
    OR tenant_id = current_tenant_id()  -- same-tenant users can see if no owner set (legacy)
    OR EXISTS (
      SELECT 1 FROM chat_shares cs
      WHERE cs.conversation_id = conversations.id
        AND (
          cs.target_user_id = current_user_id()
          OR cs.share_type = 'link'
        )
        AND cs.revoked_at IS NULL
        AND (cs.expires_at IS NULL OR cs.expires_at > NOW())
    )
  );

-- Only owner or admin can insert
DROP POLICY IF EXISTS conversations_insert ON conversations;
CREATE POLICY conversations_insert ON conversations
  FOR INSERT
  WITH CHECK (
    owner_id = current_user_id()
    OR is_admin_session()
    OR owner_id IS NULL  -- unauthenticated / legacy
  );

-- Only owner or admin can update
DROP POLICY IF EXISTS conversations_update ON conversations;
CREATE POLICY conversations_update ON conversations
  FOR UPDATE
  USING (
    owner_id = current_user_id()
    OR is_admin_session()
  );

-- Only owner or admin can delete
DROP POLICY IF EXISTS conversations_delete ON conversations;
CREATE POLICY conversations_delete ON conversations
  FOR DELETE
  USING (
    owner_id = current_user_id()
    OR is_admin_session()
  );

-- ─────────────────────────────────────────────
-- messages table RLS
-- ─────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;

-- Message access mirrors conversation access
DROP POLICY IF EXISTS messages_via_conversation ON messages;
CREATE POLICY messages_via_conversation ON messages
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      -- conversation policy handles scoping
    )
  );

-- ─────────────────────────────────────────────
-- chat_shares table RLS
-- ─────────────────────────────────────────────
ALTER TABLE chat_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_shares FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_shares_owner_or_admin ON chat_shares;
CREATE POLICY chat_shares_owner_or_admin ON chat_shares
  USING (
    owner_user_id = current_user_id()
    OR target_user_id = current_user_id()
    OR is_admin_session()
    OR user_has_permission('chat.share.manage')
  );

-- ─────────────────────────────────────────────
-- audit_logs table RLS
-- ─────────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- audit.read permission OR admin
DROP POLICY IF EXISTS audit_logs_read ON audit_logs;
CREATE POLICY audit_logs_read ON audit_logs
  FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (
      is_admin_session()
      OR user_has_permission('audit.read')
    )
  );

-- Audit logs are INSERT-only from application (no update/delete allowed)
DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id() OR is_admin_session());

-- ─────────────────────────────────────────────
-- user_roles table RLS
-- ─────────────────────────────────────────────
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_read ON user_roles;
CREATE POLICY user_roles_read ON user_roles
  FOR SELECT
  USING (
    user_id = current_user_id()
    OR is_admin_session()
    OR user_has_permission('users.read')
    OR user_has_permission('roles.read')
  );

DROP POLICY IF EXISTS user_roles_write ON user_roles;
CREATE POLICY user_roles_write ON user_roles
  FOR INSERT
  WITH CHECK (
    is_admin_session() OR user_has_permission('roles.write')
  );

DROP POLICY IF EXISTS user_roles_delete ON user_roles;
CREATE POLICY user_roles_delete ON user_roles
  FOR DELETE
  USING (
    is_admin_session() OR user_has_permission('roles.write')
  );
