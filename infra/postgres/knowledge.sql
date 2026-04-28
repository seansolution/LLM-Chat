-- ─── Knowledge Base Schema ────────────────────────────────────────────────────
-- Multi-tenant knowledge documents with pgvector embeddings.
-- Run AFTER rbac.sql (depends on tenants table).
-- Requires: CREATE EXTENSION vector;  (pgvector)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;

-- ─── knowledge_docs ────────────────────────────────────────────────────────────
-- One row per ingested document (text or URL).
-- Full text is stored in `content`; chunks are in knowledge_chunks.

CREATE TABLE IF NOT EXISTS knowledge_docs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,                    -- original full text
  source_url   TEXT,                             -- optional originating URL
  mime_type    TEXT NOT NULL DEFAULT 'text/plain',
  language     TEXT NOT NULL DEFAULT 'th',
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending|processing|indexed|failed
  error_msg    TEXT,
  chunk_count  INTEGER DEFAULT 0,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_docs_tenant_idx ON knowledge_docs(tenant_id);
CREATE INDEX IF NOT EXISTS knowledge_docs_status_idx ON knowledge_docs(status);

-- ─── knowledge_chunks ──────────────────────────────────────────────────────────
-- One row per chunk, with pgvector embedding.
-- Embedding dimension 1536 matches text-embedding-3-small / ada-002.

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id       UUID NOT NULL REFERENCES knowledge_docs(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL,                    -- denormalised for query speed
  chunk_index  INTEGER NOT NULL,
  content      TEXT NOT NULL,
  token_count  INTEGER,
  embedding    vector(1536),
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_doc_idx    ON knowledge_chunks(doc_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_tenant_idx ON knowledge_chunks(tenant_id);

-- IVFFlat index for approximate nearest-neighbour search (cosine).
-- Build AFTER the table has data: CREATE INDEX ... WITH (lists = 100)
-- For now use a partial index that only covers rows with embeddings.
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10)
  WHERE embedding IS NOT NULL;

-- ─── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE knowledge_docs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_docs   FORCE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks FORCE ROW LEVEL SECURITY;

-- knowledge_docs
DROP POLICY IF EXISTS knowledge_docs_tenant_iso ON knowledge_docs;
CREATE POLICY knowledge_docs_tenant_iso ON knowledge_docs
  USING (
    is_admin_session()
    OR tenant_id = current_tenant_id()
  );

-- knowledge_chunks (read-only via app; writes go through ingestion service)
DROP POLICY IF EXISTS knowledge_chunks_tenant_iso ON knowledge_chunks;
CREATE POLICY knowledge_chunks_tenant_iso ON knowledge_chunks
  USING (
    is_admin_session()
    OR tenant_id = current_tenant_id()
  );

-- ─── Helper: vector search ─────────────────────────────────────────────────────
-- Returns top-k chunks ordered by cosine similarity to the query embedding.
-- Called by the retrieval agent. Uses SECURITY DEFINER so RLS is bypassed
-- inside the function, but tenant isolation is enforced by the WHERE clause.

CREATE OR REPLACE FUNCTION knowledge_search(
  p_tenant_id   UUID,
  p_embedding   vector(1536),
  p_top_k       INTEGER DEFAULT 5,
  p_threshold   FLOAT  DEFAULT 0.3
)
RETURNS TABLE (
  chunk_id    UUID,
  doc_id      UUID,
  doc_title   TEXT,
  content     TEXT,
  similarity  FLOAT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    kc.id                                AS chunk_id,
    kc.doc_id,
    kd.title                             AS doc_title,
    kc.content,
    1 - (kc.embedding <=> p_embedding)   AS similarity
  FROM  knowledge_chunks kc
  JOIN  knowledge_docs   kd ON kd.id = kc.doc_id
  WHERE kc.tenant_id = p_tenant_id
    AND kd.status    = 'indexed'
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> p_embedding) >= p_threshold
  ORDER BY kc.embedding <=> p_embedding
  LIMIT p_top_k;
$$;
