#!/usr/bin/env bash
# Restore clean schema + data into the NEW Postgres, then create app roles.
set -euo pipefail
cd "$(dirname "$0")/../.."
set -a; source .env.migrate; set +a
: "${NEW_DB_URL:?}" "${RO_PASSWORD:?}" "${RW_PASSWORD:?}"
OUT=scripts/migrate/out
DBNAME=$(python3 -c 'import sys,urllib.parse as u; print(u.urlparse(sys.argv[1]).path.lstrip("/"))' "$NEW_DB_URL")
# Create the target database if it does not exist yet (connect via the default "postgres" db).
ADMIN_URL=$(printf '%s' "$NEW_DB_URL" | sed "s#/${DBNAME}?#/postgres?#; s#/${DBNAME}\$#/postgres#")
if [ "$(psql "$ADMIN_URL" -tAc "select 1 from pg_database where datname='${DBNAME}'")" != "1" ]; then
  echo "→ create database ${DBNAME}"; psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -q -c "CREATE DATABASE \"${DBNAME}\" ENCODING 'UTF8'"
fi
echo "→ schema"; psql "$NEW_DB_URL" -1 -v ON_ERROR_STOP=1 -q -o /dev/null -f "$OUT/schema.clean.sql"
echo "→ data";   grep -v "^SET transaction_timeout" "$OUT/data.sql" | psql "$NEW_DB_URL" -1 -v ON_ERROR_STOP=1 -q -o /dev/null
echo "→ roles";  psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -q \
  -v ro_pw="$RO_PASSWORD" -v rw_pw="$RW_PASSWORD" -v dbname="$DBNAME" \
  -f scripts/migrate/03-roles.sql
echo "→ analyze"; psql "$NEW_DB_URL" -q -c 'ANALYZE;'
echo "✓ restore complete → now run: npx tsx scripts/migrate/05-verify-counts.mts"
