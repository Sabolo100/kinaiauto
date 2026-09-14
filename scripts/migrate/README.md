# Supabase → Postgres (Coolify/Hetzner) + S3 — migration runbook

All scripts read secrets from **`site/.env.migrate`** (git-ignored; template: `.env.migrate.example`).
Nothing here modifies Supabase — every Supabase access is read-only (dump / list / download).

## 0. Prerequisites (you)
| What | Where / notes |
|---|---|
| Postgres **16** on Coolify | New resource `kinaiauto`, enable **public port**, note the URL → `NEW_DB_URL`. Check the **SSL** option: `DATABASE_SSL=require` needs the server to speak TLS. |
| Object storage | **MinIO on Coolify** as a *Docker Compose Empty* resource using `scripts/migrate/minio.compose.yaml` (Traefik labels + `coolify` network declared explicitly — Coolify did not generate labels for this service). Use the **API** URL (`https://minio.kinaiauto.com`) everywhere. Buckets + public-read are created by `00-minio-buckets.mts`. |
| Supabase direct DB URL | Dashboard → Settings → Database → **Direct / Session, port 5432** (not the 6543 transaction pooler). |
| Local tools | `pg_dump`/`psql` ≥ the Supabase server major (script checks), Node 18+, `npx tsx`. |

## 1. Run order
```bash
cd site
npx tsx scripts/migrate/00-minio-buckets.mts   # creates car-photos, brand-logos (public-read), pdf-uploads (private)
scripts/migrate/01-dump.sh                 # schema.raw.sql + data.sql   (read-only vs Supabase)
scripts/migrate/02-strip.sh                # → schema.clean.sql (removes RLS/policies/grants/storage.*)
scripts/migrate/04-restore.sh              # schema → data → 03-roles.sql → ANALYZE  (NEW db)
npx tsx scripts/migrate/05-verify-counts.mts   # per-table row counts Supabase vs new — must be all ✓
npx tsx scripts/migrate/06-sync-storage.mts    # copies every object of the 3 buckets → S3 (idempotent)
npx tsx scripts/migrate/07-smoke-test.mts      # key app queries + type/jsonb behaviour on the new DB
```
`05` and `07` exit non-zero on any problem — **do not cut over** until both pass.

## 2. Cutover
1. Vercel → Environment Variables (Production): **add** `DATABASE_URL`, `DATABASE_URL_RO`, `DATABASE_SSL`,
   `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`,
   `NEXT_PUBLIC_S3_PUBLIC_BASE` (mark it "Config"/non-sensitive — it is a public hostname by design).
   **Do NOT delete** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` yet:
   the currently deployed (old) code still needs them — any redeploy of `main` before cutover would fall back to seed data.
2. **Only then** merge `postgres-migration` → `main` and push (= cutover). Pushing earlier = live site falls back to seed data, CMS errors.
3. After the new deployment is live and verified, delete the three Supabase variables.
4. Test public site + CMS (photos, uploads, quote e-mail, CMS edits).

## 3. Decommission (explicit confirmation required)
Only after the site has run correctly on the new stack: delete the Supabase project.
Rollback before that point: `git checkout main -- .` restores the old code; Supabase is untouched.
