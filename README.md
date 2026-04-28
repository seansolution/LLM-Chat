# RAG Platform — Access URLs

Enterprise RAG platform running on Apple Silicon (M-series).
LLM is served by **LM Studio** on the host — must be running before starting services.

---

## Quick Start

```bash
# Requires LM Studio running first:
#   - nvidia/nemotron-3-nano-4b (chat / reasoning)
#   - google/gemma-3-4b (vision, optional)
#   - text-embedding-nomic-embed-text-v1.5 (embeddings)

make setup   # first time
make up      # subsequent starts
make down    # stop all
make logs    # tail backend + worker logs
make clean   # destroy all volumes (destructive)
```

---

## Build Commands (Full)

### 1) Install dependencies (local)

```bash
pnpm install
```

### 2) Build all Docker services

```bash
docker compose build
```

### 3) Build only frontend (when UI/API code changed)

```bash
docker compose build frontend
docker compose up -d frontend
```

### 4) Rebuild from scratch (force image refresh)

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

### 5) Start / Stop services

```bash
docker compose up -d
docker compose down
```

### 6) Health checks after start

```bash
curl -sS http://localhost:8001/health
curl -sS http://localhost:8001/ready
curl -sS -H "Authorization: Bearer sk-litellm-master" http://localhost:4000/v1/models
curl -sS http://192.168.250.9:1234/v1/models
```

### 7) Quick chat test

```bash
curl -sS -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"ตอบสั้นๆ ว่าระบบพร้อมแล้ว","model":"qwen3","temperature":0.2,"maxTokens":16384}'
```

Default chat `maxTokens` is now `16384` (16k). You can still override per request.

### 7.1) ThaiLLM models (direct provider)

Set these env vars in `.env`:

```bash
THAILLM_URL=http://thaillm.or.th/api/v1
THAILLM_API_KEY=your-key
THAILLM_CONSUMER_ID=484ef436-d51f-453b-ab76-a9c22f6a4788
```

Then call `/api/chat` with one of these model ids:

- `openthaigpt-thaillm-8b-instruct-v7.2`
- `pathumma-thaillm-qwen3-8b-think-3.0.0`
- `typhoon-s-thaillm-8b-instruct`
- `thalle-0.2-thaillm-8b-fa`

Example:

```bash
curl -sS -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"สวัสดี","model":"openthaigpt-thaillm-8b-instruct-v7.2","temperature":0.3,"maxTokens":16384}'
```

### 8) If build fails with lockfile mismatch

```bash
pnpm install
docker compose build frontend
docker compose up -d frontend
```

### 9) Verify core phases locally (chat contract + RLS)

```bash
# 1) Ensure PostgreSQL is running
docker compose up -d postgres

# 2) Apply DB schema for RBAC/RLS tests
bash scripts/ci-db-setup.sh

# 3) Run phase-gate verification
pnpm run verify:core
# or
make verify-core
```

---

## CI

GitHub Actions workflow: `.github/workflows/core-ci.yml`

What it does on push/PR:

1. Starts PostgreSQL service
2. Applies `init.sql`, `rbac.sql`, `rls.sql`
3. Runs `pnpm run verify:core`
4. Runs `pnpm run build`

---

## Service URLs

### User-Facing

| Service | URL | Notes |
|---|---|---|
| **Frontend** | http://localhost:3000 | Next.js chat UI |
| **Langfuse** | http://localhost:3001 | LLM observability & tracing |
| **Grafana** | http://localhost:3002 | Metrics dashboards — `admin / admin` |
| **Authentik** | http://localhost:9000 | SSO / identity provider |
| **LM Studio** | http://localhost:1234 | Host only — not in Docker |

### Backend API

| URL | Notes |
|---|---|
| http://localhost:8001/docs | Swagger UI (interactive) |
| http://localhost:8001/redoc | ReDoc API reference |

### Infrastructure

| Service | URL | Notes |
|---|---|---|
| **LiteLLM Gateway** | http://localhost:4000 | OpenAI-compatible LLM proxy |
| **Qdrant** | http://localhost:6333 | Vector DB — REST API |
| **Qdrant Dashboard** | http://localhost:6333/dashboard | Web UI |
| **OpenSearch** | http://localhost:9200 | Lexical / hybrid search |
| **HugeGraph** | http://localhost:8080 | Graph DB — REST API |
| **HugeGraph UI** | http://localhost:8080/apis | API explorer |
| **SeaweedFS Master** | http://localhost:9333 | Object storage master |
| **SeaweedFS Volume** | http://localhost:8888 | Object storage volume |
| **SeaweedFS Filer** | http://localhost:8889 | Object storage filer |
| **NATS** | nats://localhost:4222 | Message bus |
| **NATS Monitoring** | http://localhost:8222 | JetStream stats |
| **Prometheus** | http://localhost:9090 | Metrics scraper |
| **PostgreSQL** | localhost:5432 | `rag / ragpassword / ragdb` |

---

## Backend API Endpoints

Base URL: `http://localhost:8001`

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check — returns `{"status":"ok"}` |
| `GET` | `/ready` | Readiness check — pings Qdrant, OpenSearch, LiteLLM, HugeGraph |
| `GET` | `/metrics` | Prometheus metrics scrape endpoint |

### Chat (RAG)

| Method | Path | Description |
|---|---|---|
| `POST` | `/chat` | Send a message, get a RAG-grounded reply with citations |

**Request body:**
```json
{
  "message": "What are the requirements for company registration in Thailand?",
  "session_id": "optional-session-id",
  "use_graph": true,
  "top_k": 5
}
```

**Response:**
```json
{
  "reply": "...",
  "citations": [{"id": "...", "content": "...", "score": 0.92}],
  "retrieval_meta": {"vector_hits": 5, "graph_hits": 2},
  "latency_ms": 1240,
  "session_id": "session-abc123"
}
```

### Documents

| Method | Path | Description |
|---|---|---|
| `POST` | `/documents` | Upload a document (PDF, DOCX, MD) — triggers async parse → embed → entity pipeline |
| `GET` | `/documents` | List all documents (latest 100) |
| `PATCH` | `/documents/{doc_id}/publish` | Publish a document (makes it queryable) |
| `DELETE` | `/documents/{doc_id}` | Delete a document |

**Upload example:**
```bash
curl -X POST http://localhost:8001/documents \
  -F "file=@my-doc.pdf" \
  -F "language=th"
```

---

## LiteLLM Gateway

Base URL: `http://localhost:4000`  
API Key: `sk-litellm-master`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | UI / status page |
| `POST` | `/v1/chat/completions` | OpenAI-compatible chat — model: `qwen3` |
| `POST` | `/v1/embeddings` | OpenAI-compatible embeddings — model: `text-embedding-3-small` |
| `GET` | `/v1/models` | List available models |
| `GET` | `/health` | Health check (requires API key) |

**Chat example:**
```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-litellm-master" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3","messages":[{"role":"user","content":"Hello"}]}'
```

---

## Document Processing Pipeline

```
Upload (POST /documents)
  → SeaweedFS (file storage)
  → NATS: doc.parse
    → worker-parser (PDF/DOCX/MD → chunks → PostgreSQL)
    → NATS: doc.embed
      → worker-embedder (LiteLLM embeddings → Qdrant + OpenSearch)
      → NATS: doc.entity
        → worker-entity (LLM entity extraction → HugeGraph)
```

---

## Default Credentials

| Service | Username | Password |
|---|---|---|
| Grafana | `admin` | `admin` |
| PostgreSQL (main) | `rag` | `ragpassword` |
| PostgreSQL (app role, RLS) | `rag_app` | `ragapppassword` |
| PostgreSQL (langfuse) | `langfuse` | `langfusepassword` |
| PostgreSQL (authentik) | `authentik` | `authentikpassword` |
| LiteLLM | — | `sk-litellm-master` |
