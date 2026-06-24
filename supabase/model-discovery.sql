-- ─── Model discovery (Új modellek keresése) ──────────────────────────────────
-- Two tables that power the CMS "find new models" workflow:
--   • model_discovery_jobs  — async research jobs (mirrors test_link_search_jobs)
--   • discovered_models      — the work table (munkatábla) of candidate models
--                              that are NOT yet in the live `models` table.
--
-- Admin-only: neither table is exposed to anon/authenticated. Service role only.

-- ── Jobs ──────────────────────────────────────────────────────────────────────
create table if not exists model_discovery_jobs (
  id             uuid        primary key default gen_random_uuid(),
  status         text        not null default 'pending', -- pending | running | completed | failed
  brand_ids      jsonb       not null default '[]',      -- array of brand UUIDs being searched
  current_brand  text,                                   -- brand name currently being researched
  progress       jsonb       not null default '{}',      -- { [brandId]: { found, done, error? } }
  total_found    integer     not null default 0,
  error_msg      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table model_discovery_jobs enable row level security;

create policy "service role full access discovery jobs"
  on model_discovery_jobs for all to service_role
  using (true) with check (true);

-- ── Work table (candidate models) ─────────────────────────────────────────────
create table if not exists discovered_models (
  id                uuid        primary key default gen_random_uuid(),
  brand_id          uuid        not null references brands(id) on delete cascade,
  name              text        not null,                -- candidate model name, e.g. "Atto 2"
  category_guess    text,                                -- AI suggested category (slug or label)
  drive_guess       text,                                -- AI suggested drive (slug or label)
  reason            text,                                -- short AI note on why it's new / notable
  sources           jsonb       not null default '[]',   -- [{ url, title, date, kind }]
  confidence        text        not null default 'medium', -- high | medium | low
  status            text        not null default 'pending', -- pending | dismissed | promoted
  promoted_model_id uuid        references models(id) on delete set null,
  found_by_job      uuid        references model_discovery_jobs(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists ix_discovered_models_brand
  on discovered_models(brand_id, status);

alter table discovered_models enable row level security;

create policy "service role full access discovered models"
  on discovered_models for all to service_role
  using (true) with check (true);
