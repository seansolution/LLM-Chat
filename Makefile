# ============================================================
# RAG Platform — Apple Silicon (M4) helper commands
# LLM: LM Studio running Qwen3.5-9B-Q4_K_M on host port 1234
# ============================================================

.PHONY: up down check-lmstudio logs clean setup verify-core

## Check LM Studio is reachable before starting
check-lmstudio:
	@echo "Checking LM Studio at http://localhost:1234/v1/models ..."
	@curl -sf http://localhost:1234/v1/models > /dev/null || \
		(echo "\n❌  LM Studio not reachable on port 1234." \
		 && echo "    1. Open LM Studio" \
		 && echo "    2. Load: lmstudio-community/Qwen3.5-9B-GGUF/Qwen3.5-9B-Q4_K_M.gguf" \
		 && echo "    3. Start the local server (Developer tab → Start Server)" \
		 && exit 1)
	@echo "✓ LM Studio is running"
	@echo "  Models available:"
	@curl -sf http://localhost:1234/v1/models | python3 -c "import sys,json; [print('   -', m['id']) for m in json.load(sys.stdin)['data']]"

## Start all services
up:
	cp -n .env.example .env 2>/dev/null || true
	docker compose up -d

## First-time setup: verify LM Studio then start
setup: check-lmstudio up
	@echo ""
	@echo "✓ Setup complete. Services:"
	@echo "  Frontend  → http://localhost:3000"
	@echo "  API docs  → http://localhost:8001/docs"
	@echo "  Langfuse  → http://localhost:3001"
	@echo "  Grafana   → http://localhost:3002  (admin / admin)"
	@echo "  Authentik → http://localhost:9000"
	@echo "  LM Studio → http://localhost:1234  (host, not Docker)"

## Stop all services
down:
	docker compose down

## Tail backend + worker logs
logs:
	docker compose logs -f backend worker-embedder worker-parser worker-entity

## Remove all volumes (destructive)
clean:
	docker compose down -v

## Verify core backend compatibility and data-layer RLS
verify-core:
	pnpm run verify:core
