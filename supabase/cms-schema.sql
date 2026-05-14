-- =====================================================================
-- kinaiauto.com — CMS schema additions
-- =====================================================================
-- Run AFTER schema.sql.  Adds:
--   - archived_at columns on brands / models   (soft delete / archive)
--   - model_extractions table                  (PDF/URL extraction staging)
--   - pdf-uploads storage bucket               (private — only service role)
--
-- Idempotent.
-- =====================================================================

-- ---- 1) Archive flags -----------------------------------------------
alter table brands add column if not exists archived_at timestamptz;
alter table models add column if not exists archived_at timestamptz;

-- Public read filters: archived rows are hidden from the public site.
do $$
begin
  -- Re-create brand policy to filter archived
  if exists (select 1 from pg_policies where policyname = 'public_read_brands') then
    drop policy public_read_brands on brands;
  end if;
  create policy public_read_brands on brands for select
    using (is_active and archived_at is null);

  if exists (select 1 from pg_policies where policyname = 'public_read_models') then
    drop policy public_read_models on models;
  end if;
  create policy public_read_models on models for select
    using (archived_at is null);
end $$;


-- ---- 2) model_extractions -------------------------------------------
-- Staging table for PDF / URL extractions awaiting admin approval.
create table if not exists model_extractions (
  id              uuid primary key default uuid_generate_v4(),
  model_id        uuid references models(id) on delete cascade,
  -- Source descriptor
  source_kind     text not null check (source_kind in ('pdf','url','image')),
  source_url      text,                              -- the original URL (or blank for PDF/image uploads)
  source_filename text,                              -- original filename
  storage_path    text,                              -- path in 'pdf-uploads' bucket (PDFs and images)
  -- Extraction
  llm_provider    text not null check (llm_provider in ('claude','openai')),
  llm_model       text,                              -- e.g. "claude-sonnet-4-6", "gpt-4o"
  raw_text        text,                              -- extracted text from PDF/HTML
  parsed_json     jsonb not null default '{}'::jsonb,-- structured fields suggested by the LLM
  -- Workflow
  status          text not null default 'pending'
                    check (status in ('pending','approved','rejected','failed')),
  error_message   text,
  decided_at      timestamptz,
  applied_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_extractions_model   on model_extractions(model_id);
create index if not exists idx_extractions_status  on model_extractions(status, created_at desc);

-- RLS: only service role can read/write (writes happen via the CMS routes
-- which use the service role key on the server).
alter table model_extractions enable row level security;
-- No public policy = anon cannot SELECT/INSERT/UPDATE/DELETE.
-- The service role bypasses RLS by default in Supabase.


-- ---- 3) pdf-uploads bucket (private) --------------------------------
insert into storage.buckets (id, name, public)
values ('pdf-uploads', 'pdf-uploads', false)
on conflict (id) do update set public = excluded.public;

-- No public policies on this bucket — only the service role accesses it.

-- =====================================================================
-- DONE.
-- =====================================================================
