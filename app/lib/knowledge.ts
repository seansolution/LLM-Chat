// ─── Knowledge Base Library ───────────────────────────────────────────────────
// Handles document ingestion: chunking → embedding → storing in pgvector.
// Also exposes the vector search helper used by the RetrievalAgent.
// ─────────────────────────────────────────────────────────────────────────────

import { query, execute, queryAuthOne } from './db'

// ─── Config ───────────────────────────────────────────────────────────────────

const EMBEDDING_URL  = process.env.EMBEDDING_URL  || process.env.LITELLM_URL || 'http://litellm:4000'
const EMBEDDING_KEY  = process.env.EMBEDDING_API_KEY || process.env.LITELLM_API_KEY || 'sk-litellm-master'
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL  || 'text-embedding-3-small'
const CHUNK_SIZE     = parseInt(process.env.CHUNK_SIZE  || '400', 10)   // tokens ≈ chars/4
const CHUNK_OVERLAP  = parseInt(process.env.CHUNK_OVERLAP || '80',  10)
const RETRIEVAL_TOP_K = parseInt(process.env.RETRIEVAL_TOP_K || '5', 10)
const RETRIEVAL_THRESHOLD = parseFloat(process.env.RETRIEVAL_THRESHOLD || '0.30')

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgeDoc {
  id: string
  tenant_id: string
  title: string
  source_url?: string
  mime_type: string
  language: string
  status: 'pending' | 'processing' | 'indexed' | 'failed'
  error_msg?: string
  chunk_count: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SearchResult {
  chunkId: string
  docId: string
  docTitle: string
  content: string
  similarity: number
}

// ─── Chunking ─────────────────────────────────────────────────────────────────

/**
 * Splits text into overlapping chunks of approximately CHUNK_SIZE characters.
 * Tries to break on sentence/paragraph boundaries.
 */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const paragraphs = normalized.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)

  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    // If adding this paragraph exceeds the chunk size, flush and start new chunk
    if (current.length + para.length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim())
      // Start next chunk with overlap from tail of previous
      const tail = current.slice(Math.max(0, current.length - CHUNK_OVERLAP))
      current = tail + '\n\n' + para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }

  if (current.trim()) chunks.push(current.trim())

  // Edge case: single large paragraph — split by sentence
  if (chunks.length === 0 && text.trim()) {
    const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text]
    let chunk = ''
    for (const s of sentences) {
      if (chunk.length + s.length > CHUNK_SIZE && chunk.length > 0) {
        chunks.push(chunk.trim())
        chunk = chunk.slice(Math.max(0, chunk.length - CHUNK_OVERLAP)) + ' ' + s
      } else {
        chunk += ' ' + s
      }
    }
    if (chunk.trim()) chunks.push(chunk.trim())
  }

  return chunks.length > 0 ? chunks : [text.slice(0, CHUNK_SIZE)]
}

// ─── Embedding API ────────────────────────────────────────────────────────────

/**
 * Embeds a single text via LiteLLM /embeddings endpoint.
 * Returns null on any error (caller treats as non-fatal).
 */
export async function embedText(text: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${EMBEDDING_URL.replace(/\/$/, '')}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${EMBEDDING_KEY}`,
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.warn('[knowledge] embedText error', res.status, err.slice(0, 200))
      return null
    }

    const data = await res.json()
    const embedding: number[] = data?.data?.[0]?.embedding
    if (!Array.isArray(embedding) || embedding.length === 0) return null
    return embedding
  } catch (err) {
    console.warn('[knowledge] embedText exception:', err)
    return null
  }
}

/**
 * Batch-embeds multiple texts. Returns an array of same length; null entries
 * indicate failed embeddings.
 */
export async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  // Embed in serial to avoid hammering the embedding API
  const results: (number[] | null)[] = []
  for (const t of texts) {
    results.push(await embedText(t))
  }
  return results
}

// ─── Ingestion ────────────────────────────────────────────────────────────────

/**
 * Full ingestion pipeline: chunk → embed → store.
 * This mutates the knowledge_docs row (status, chunk_count) in-place.
 * Call this from a background job or the POST /api/knowledge handler.
 */
export async function ingestDocument(docId: string): Promise<void> {
  // Mark as processing
  await execute(
    `UPDATE knowledge_docs SET status = 'processing', updated_at = NOW() WHERE id = $1`,
    [docId]
  )

  try {
    const doc = await queryAuthOne<{
      id: string; tenant_id: string; content: string; title: string
    }>(
      `SELECT id, tenant_id, content, title FROM knowledge_docs WHERE id = $1`,
      [docId]
    )

    if (!doc) throw new Error('Document not found')

    const chunks = chunkText(doc.content)
    const embeddings = await embedBatch(chunks)

    // Upsert chunks
    let indexed = 0
    for (let i = 0; i < chunks.length; i++) {
      const emb = embeddings[i]
      const embStr = emb ? `[${emb.join(',')}]` : null

      await execute(
        `INSERT INTO knowledge_chunks
           (doc_id, tenant_id, chunk_index, content, token_count, embedding)
         VALUES ($1, $2, $3, $4, $5, $6::vector)
         ON CONFLICT DO NOTHING`,
        [
          docId,
          doc.tenant_id,
          i,
          chunks[i],
          Math.round(chunks[i].length / 4),
          embStr,
        ]
      )
      if (emb) indexed++
    }

    await execute(
      `UPDATE knowledge_docs
       SET status = 'indexed', chunk_count = $1, error_msg = NULL, updated_at = NOW()
       WHERE id = $2`,
      [chunks.length, docId]
    )

    console.log(`[knowledge] Indexed doc ${docId}: ${chunks.length} chunks, ${indexed} embedded`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[knowledge] ingestDocument failed:', msg)
    await execute(
      `UPDATE knowledge_docs
       SET status = 'failed', error_msg = $1, updated_at = NOW()
       WHERE id = $2`,
      [msg.slice(0, 500), docId]
    )
  }
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

/**
 * Searches the vector store for chunks relevant to `queryText`.
 * Returns snippets formatted for injection into the system prompt.
 * Returns [] if embeddings fail or no relevant chunks found.
 */
export async function searchKnowledge(
  tenantId: string,
  queryText: string,
  topK = RETRIEVAL_TOP_K,
  threshold = RETRIEVAL_THRESHOLD
): Promise<SearchResult[]> {
  const embedding = await embedText(queryText)
  if (!embedding) return []

  const embStr = `[${embedding.join(',')}]`

  try {
    const rows = await query<{
      chunk_id: string
      doc_id: string
      doc_title: string
      content: string
      similarity: number
    }>(
      `SELECT chunk_id, doc_id, doc_title, content, similarity
       FROM knowledge_search($1, $2::vector, $3, $4)`,
      [tenantId, embStr, topK, threshold]
    )

    return rows.map(r => ({
      chunkId: r.chunk_id,
      docId: r.doc_id,
      docTitle: r.doc_title,
      content: r.content,
      similarity: Number(r.similarity),
    }))
  } catch (err) {
    console.warn('[knowledge] searchKnowledge error:', err)
    return []
  }
}
