#!/usr/bin/env bash
# Restore clean schema + data into the NEW Postgres, then create app roles.
set -euo pipefail
cd "$(dirname "$0")/../.."
set -a; source .env.migrate; set +a
: "${NEW_DB_URL:?}" "${RO_PASSWORD:?}" "${RW_PASSWORD:?}"
OUT=scripts/migrate/out
DBNAME=$(python3 -c 'import sys,urllib.parse as u; print(u.urlparse(sys.argv[1]).path.lstrip("/"))' "$NEW_DB_URL")
echo "→ schema"; psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -q -f "$OUT/schema.clean.sql"
echo "→ data";   psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -q -f "$OUT/data.sql"
echo "→ roles";  psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -q \
  -v ro_pw="$RO_PASSWORD" -v rw_pw="$RW_PASSWORD" -v dbname="$DBNAME" \
  -f scripts/migrate/03-roles.sql
echo "→ analyze"; psql "$NEW_DB_URL" -q -c 'ANALYZE;'
echo "✓ restore complete → now run: npx tsx scripts/migrate/05-verify-counts.ts"
