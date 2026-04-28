# Coding Rules

## Tech Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, pnpm
- Backend: Python 3.11, FastAPI, SQLAlchemy (async), Pydantic v2
- Infrastructure: Docker Compose (see docker-compose.yml)
- Package manager: pnpm (frontend), pip (backend)

## Rules
- Write readable, minimal code — no unnecessary abstraction
- Backend: async everywhere (asyncpg, httpx, nats-py)
- Frontend: proxy all /api/* to FastAPI via next.config.js rewrites
- No hardcoded secrets — use .env / environment variables
- No business logic outside knowledge files or RAG prompt

## Error Handling
- FastAPI: raise HTTPException with appropriate status codes
- Workers: catch exceptions, set document.status = "failed", ack message
- Frontend: display error text from API response

## Observability
- All FastAPI routes are auto-instrumented by prometheus-fastapi-instrumentator
- Use Langfuse for LLM trace logging
- Structured logs with [service] prefix
