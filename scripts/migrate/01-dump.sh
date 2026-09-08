#!/usr/bin/env bash
# Dump SCHEMA and DATA of the `public` schema from Supabase.  READ-ONLY.
# --schema=public        → excludes Supabase's auth/storage/extensions schemas
# --no-owner/--no-acl    → drops Supabase owners + most grants automatically
set -euo pipefail
cd "$(dirname "$0")/../.."
set -a; source .env.migrate; set +a
: "${SUPABASE_DB_URL:?set SUPABASE_DB_URL in .env.migrate}"
export PGSSLMODE="${PGSSLMODE:-require}"
# pg_dump must be >= the server's major version (Supabase projects are often PG17).
srv=$(psql "$SUPABASE_DB_URL" -tAc "show server_version_num" 2>/dev/null | tr -d '[:space:]')
loc=$(pg_dump --version | grep -oE '[0-9]+' | head -1)
if [ -n "$srv" ]; then
  srv_major=$((srv / 10000))
  if [ "$srv_major" -gt "$loc" ]; then
    echo "✗ Supabase server is PostgreSQL $srv_major but local pg_dump is $loc (too old)."
    echo "  Fix: brew install postgresql@$srv_major  →  then run with:"
    echo "  PATH=\"/opt/homebrew/opt/postgresql@$srv_major/bin:\$PATH\" scripts/migrate/01-dump.sh"
    exit 1
  fi
  echo "→ server PG$srv_major, local pg_dump $loc — ok"
else
  echo "⚠ could not read server version (connection?) — continuing, pg_dump will report"
fi
OUT=scripts/migrate/out
echo "→ schema-only dump"
pg_dump "$SUPABASE_DB_URL" --schema=public --schema-only \
  --no-owner --no-acl --no-comments --no-publications --no-subscriptions \
  > "$OUT/schema.raw.sql"
echo "→ data-only dump (COPY format, fast)"
pg_dump "$SUPABASE_DB_URL" --schema=public --data-only \
  --no-owner --no-acl --disable-triggers \
  > "$OUT/data.sql"
echo "✓ $(wc -l < "$OUT/schema.raw.sql") schema lines, $(du -h "$OUT/data.sql" | cut -f1) data"
