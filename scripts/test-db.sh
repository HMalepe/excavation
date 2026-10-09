#!/usr/bin/env bash
# Spins up a throwaway Postgres 16 cluster, applies the Supabase stub + all migrations,
# then runs the RLS test-suite against it. Usage: npm run test:db
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
DATA="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"
cleanup() { "$PGBIN/pg_ctl" -D "$DATA" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

if [ "$(id -u)" = "0" ]; then
  # initdb refuses to run as root; use the postgres OS user when we are root (CI containers).
  chown -R postgres "$DATA"
  RUN=(runuser -u postgres --)
else
  RUN=()
fi
"${RUN[@]}" "$PGBIN/initdb" -D "$DATA" -A trust -U postgres >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp -c listen_addresses=127.0.0.1" -l "$DATA/log" -w start >/dev/null

PSQL=(psql -v ON_ERROR_STOP=1 -q -h 127.0.0.1 -p "$PORT" -U postgres -d postgres)
"${PSQL[@]}" -f "$ROOT/tests/db/supabase_stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "applying $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

export TEST_DATABASE_URL="postgres://postgres@127.0.0.1:$PORT/postgres"
cd "$ROOT" && npx vitest run --config vitest.db.config.ts "$@"
