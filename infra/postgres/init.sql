-- ============================================================
-- RAG Platform — PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- Documents — uploaded files / knowledge sources
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    mime_type   TEXT NOT NULL,
    size_bytes  BIGINT NOT NULL DEFAULT 0,
    storage_key TEXT NOT NULL,          -- SeaweedFS filer path
    checksum    TEXT,                   -- SHA-256
    language    TEXT DEFAULT 'th',
    status      TEXT NOT NULL DEFAULT 'pending',  -- pending|processing|indexed|failed
    publish_state TEXT NOT NULL DEFAULT 'draft',  -- draft|published|archived
    version     INTEGER NOT NULL DEFAULT 1,
    parent_id   UUID REFERENCES documents(id),    -- for versioning
    created_by  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Chunks — parsed + chunked document segments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chunks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content     TEXT NOT NULL,
    token_count INTEGER,
    qdrant_id   TEXT,                   -- point ID in Qdrant
    opensearch_id TEXT,                 -- doc ID in OpenSearch
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Entities — extracted from chunks
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entities (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id    UUID REFERENCES chunks(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,          -- PERSON, ORG, LAW, TAX_CODE, etc.
    value       TEXT NOT NULL,
    hugegraph_id TEXT,                  -- vertex ID in HugeGraph
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Audit log — all mutations
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor       TEXT,
    action      TEXT NOT NULL,
    resource    TEXT,
    resource_id TEXT,
    detail      JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Query log — RAG queries + answers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS query_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      TEXT,
    user_id         TEXT,
    query           TEXT NOT NULL,
    answer          TEXT,
    citations       JSONB DEFAULT '[]',
    retrieval_meta  JSONB DEFAULT '{}',  -- scores, sources used
    latency_ms      INTEGER,
    model           TEXT,
    langfuse_trace_id TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_publish_state ON documents(publish_state);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_entities_document_id ON entities(document_id);
CREATE INDEX IF NOT EXISTS idx_query_log_session ON query_log(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor);

-- ═══════════════════════════════════════════════════════════
-- Multi-Model Chat Platform Schema
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- Conversations — chat threads (one topic = one conversation)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       TEXT NOT NULL DEFAULT 'New Chat',
    mode        TEXT NOT NULL DEFAULT 'general',   -- general | knowledge
    system_prompt TEXT,                             -- custom system prompt
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Messages — individual chat turns within a conversation
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,           -- user | assistant
    content         TEXT NOT NULL,
    model_id        TEXT,                    -- which model generated this (null for user msgs)
    provider        TEXT,                    -- openai | anthropic | google | etc.
    compare_group   TEXT,                    -- UUID grouping parallel compare responses
    latency_ms      INTEGER,
    token_count     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Share Links — public read-only links to conversations
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS share_links (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    token           TEXT NOT NULL UNIQUE,    -- random token in URL: /share/TOKEN
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ              -- NULL = never expires
);

-- ─────────────────────────────────────────────
-- Indexes for chat platform tables
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_compare_group ON messages(compare_group) WHERE compare_group IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);

-- ─────────────────────────────────────────────
-- Application DB role (non-superuser, RLS enforced)
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rag_app') THEN
    CREATE ROLE rag_app LOGIN PASSWORD 'ragapppassword' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END $$;

GRANT CONNECT ON DATABASE ragdb TO rag_app;
GRANT USAGE ON SCHEMA public TO rag_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rag_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rag_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rag_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO rag_app;
