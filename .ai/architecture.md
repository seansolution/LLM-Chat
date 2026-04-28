# System Architecture — Enterprise RAG Platform

## Overview

```
User
 └─ Next.js (frontend, port 3000)
     └─ /api/* → rewrites → FastAPI (port 8001)
                  ├─ Authentik (SSO, port 9000)
                  ├─ RAG Orchestrator
                  │   ├─ Qdrant        → semantic retrieval (port 6333)
                  │   ├─ OpenSearch    → lexical / hybrid (port 9200)
                  │   ├─ PostgreSQL    → structured lookup / metadata (port 5432)
                  │   └─ HugeGraph     → graph traversal / GraphRAG (port 8080)
                  ├─ BGM Reranker (LLM cross-encoder)
                  ├─ LiteLLM (port 4000) → vLLM (port 8000) / Ollama fallback
                  └─ Langfuse tracing (port 3001)

Upload / Sync Pipeline:
  Client → POST /documents → SeaweedFS (filer port 8888)
                           → NATS JetStream (port 4222)
                               ├─ doc.parse  → Parser Worker
                               ├─ doc.embed  → Embedder Worker → Qdrant + OpenSearch
                               └─ doc.entity → Entity Extractor → HugeGraph

Observability:
  FastAPI → Prometheus (port 9090) → Grafana (port 3002)
  FastAPI → Langfuse (port 3001)
```

## Services

| Service           | Image                          | Port  | Role                        |
|-------------------|--------------------------------|-------|-----------------------------|
| postgres          | postgres:16-alpine             | 5432  | metadata, audit, versions   |
| qdrant            | qdrant/qdrant:v1.9.2           | 6333  | vector index                |
| opensearch        | opensearchproject/opensearch   | 9200  | lexical / hybrid index      |
| hugegraph         | hugegraph/hugegraph:1.3.0      | 8080  | entity graph / GraphRAG     |
| seaweedfs-master  | chrislusf/seaweedfs:3.68       | 9333  | object storage master       |
| seaweedfs-volume  | chrislusf/seaweedfs:3.68       | 8888  | object storage volume       |
| nats              | nats:2.10-alpine               | 4222  | async messaging             |
| authentik-server  | goauthentik/server             | 9000  | SSO / auth                  |
| vllm              | vllm/vllm-openai               | 8000  | GPU LLM inference           |
| litellm           | berriai/litellm                | 4000  | LLM gateway → LM Studio        |
| langfuse          | langfuse/langfuse:2            | 3001  | LLM tracing                 |
| prometheus        | prom/prometheus                | 9090  | metrics scrape              |
| grafana           | grafana/grafana                | 3002  | dashboards                  |
| backend           | ./backend (FastAPI)            | 8001  | RAG orchestrator + API      |
| frontend          | . (Next.js)                    | 3000  | chat UI                     |

## LLM
- Model: `Qwen3.5-9B-Q4_K_M.gguf` via LM Studio (host, port 1234)
- Path: `/Users/z/.lmstudio/models/lmstudio-community/Qwen3.5-9B-GGUF/Qwen3.5-9B-Q4_K_M.gguf`
- LiteLLM routes `http://host.docker.internal:1234/v1` (OpenAI-compatible)
- Embedding: `nomic-embed-text-v1.5` also loaded in LM Studio

1. User sends message → Next.js → FastAPI `/chat`
2. FastAPI embeds query via LiteLLM
3. Parallel retrieval: Qdrant (semantic) + OpenSearch (lexical) + HugeGraph (graph)
4. Merge + deduplicate candidates
5. BGM Reranker scores candidates via LLM cross-encoder
6. Build prompt with top-k context chunks
7. LiteLLM → vLLM (GPU) or Ollama (CPU fallback)
8. Return answer + citations
9. Log to PostgreSQL + Langfuse

## Document Ingestion Pipeline

1. Upload → FastAPI `/documents` → SeaweedFS storage
2. NATS `doc.parse` → Parser Worker: PDF/DOCX/MD → chunks → PostgreSQL
3. NATS `doc.embed` → Embedder Worker: LiteLLM embeddings → Qdrant + OpenSearch
4. NATS `doc.entity` → Entity Extractor: LLM NER → HugeGraph vertices/edges
