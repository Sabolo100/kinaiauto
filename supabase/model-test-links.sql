-- ─── model_test_links ────────────────────────────────────────────────────────
-- Stores curated test/review links (articles + videos) per model.
-- is_approved = false → awaiting admin review (found by auto-search)
-- is_approved = true  → visible on the public model detail page

create table if not exists model_test_links (
  id           uuid        primary key default gen_random_uuid(),
  model_id     uuid        not null references models(id) on delete cascade,
  url          text        not null,
  title        text,                         -- display title
  source_name  text,                         -- e.g. 'vezess.hu', 'totalcar.hu', 'youtube'
  kind         text        not null default 'article', -- 'article' | 'video'
  is_approved  boolean     not null default false,
  found_by     text        not null default 'manual', -- 'manual' | 'auto'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists ix_model_test_links_model
  on model_test_links(model_id, is_approved);

alter table model_test_links enable row level security;

-- Public: only approved links are readable
create policy "public read approved test links"
  on model_test_links for select to anon, authenticated
  using (is_approved = true);

-- Service role: full access
create policy "service role full access test links"
  on model_test_links for all to service_role
  using (true) with check (true);

grant select on model_test_links to anon, authenticated;

-- ─── test_link_search_jobs ────────────────────────────────────────────────────
-- Tracks background web search jobs for auto-finding test links.

create table if not exists test_link_search_jobs (
  id             uuid        primary key default gen_random_uuid(),
  status         text        not null default 'pending', -- pending | running | completed | failed
  model_ids      jsonb       not null default '[]',      -- array of model UUIDs
  current_model  text,                                   -- brand + model name currently being searched
  progress       jsonb       not null default '{}',      -- { [modelId]: { found: n, done: bool } }
  total_found    integer     not null default 0,
  error_msg      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table test_link_search_jobs enable row level security;

-- Only service role accesses this table
create policy "service role full access search jobs"
  on test_link_search_jobs for all to service_role
  using (true) with check (true);
