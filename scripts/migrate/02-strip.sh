#!/usr/bin/env bash
# Turn the Supabase schema dump into a clean bare-Postgres schema.
# Removes what would FAIL or is meaningless without Supabase:
#   • RLS enable + CREATE POLICY (roles anon/authenticated/service_role don't exist)
#   • GRANT/REVOKE to those roles
#   • `extensions.` schema prefix (Supabase installs extensions there; we use public)
#   • CREATE EXTENSION ... WITH SCHEMA extensions
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=scripts/migrate/out
IN="$OUT/schema.raw.sql"; CLEAN="$OUT/schema.clean.sql"
[ -f "$IN" ] || { echo "run 01-dump.sh first"; exit 1; }
perl -0777 -pe '
  s/^ALTER TABLE .*? ENABLE ROW LEVEL SECURITY;\n//mg;
  s/^CREATE POLICY .*?;\n//msg;
  s/^ALTER POLICY .*?;\n//msg;
  s/^(GRANT|REVOKE) .*?;\n//mg;
  s/^SET transaction_timeout = 0;\n//mg;   # pg_dump 17 emits this; PG16 does not know it
  s/^CREATE SCHEMA public;\n//mg;          # a fresh database already has it
  s/\bextensions\./public./g;             # keep objects schema-qualified: the dump runs with search_path=''
  s/^CREATE EXTENSION IF NOT EXISTS (\S+) WITH SCHEMA \S+;/CREATE EXTENSION IF NOT EXISTS $1;/mg;
' "$IN" > "$CLEAN"
# Make sure the three extensions we rely on are present up-front (idempotent).
{ printf 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\nCREATE EXTENSION IF NOT EXISTS citext;\nCREATE EXTENSION IF NOT EXISTS pg_trgm;\n\n'; cat "$CLEAN"; } > "$CLEAN.tmp" && mv "$CLEAN.tmp" "$CLEAN"
echo "✓ schema.clean.sql — leftover Supabase refs (should be 0):"
grep -ciE "row level security|create policy|to anon|service_role|authenticated|storage\.|auth\." "$CLEAN" || true
