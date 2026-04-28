#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

: "${DATABASE_URL:=postgresql://rag_app:ragapppassword@localhost:5432/ragdb}"
SUPERUSER_URL="${SUPERUSER_URL:-postgresql://rag:ragpassword@localhost:5432/ragdb}"
RBAC_URL="${RBAC_URL:-$SUPERUSER_URL}"
RLS_URL="${RLS_URL:-$SUPERUSER_URL}"

export PGPASSWORD="${PGPASSWORD:-ragpassword}"

run_sql() {
  local url="$1"
  local file="$2"

  if command -v psql >/dev/null 2>&1; then
    psql "$url" -v ON_ERROR_STOP=1 -f "$file"
  else
    docker compose exec -T postgres psql "$url" -v ON_ERROR_STOP=1 -f - < "$file"
  fi
}

echo "[ci-db-setup] Applying init.sql with superuser"
run_sql "$SUPERUSER_URL" "$ROOT_DIR/infra/postgres/init.sql"

echo "[ci-db-setup] Applying rbac.sql"
run_sql "$RBAC_URL" "$ROOT_DIR/infra/postgres/rbac.sql"

echo "[ci-db-setup] Applying rls.sql"
run_sql "$RLS_URL" "$ROOT_DIR/infra/postgres/rls.sql"

echo "[ci-db-setup] Done"
