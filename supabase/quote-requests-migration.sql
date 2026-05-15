-- =====================================================================
-- AJÁNLATKÉRÉS (Quote Requests) — 2026-05 migration
-- Paste this into the Supabase SQL editor and run once.
-- =====================================================================

-- ---- quote_requests: one row per user submission ---------------------
create table if not exists quote_requests (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  customer_name       text not null,
  customer_email      text not null,
  customer_phone      text not null,
  gdpr_accepted_at    timestamptz not null,
  status              text not null default 'pending',  -- pending | sent | partial | error
  notes               text,
  user_agent          text,
  ip_hash             text
);

-- ---- quote_request_items: one row per (request, model) ---------------
create table if not exists quote_request_items (
  id                  uuid primary key default uuid_generate_v4(),
  quote_request_id    uuid not null references quote_requests(id) on delete cascade,
  brand_id            uuid not null references brands(id) on delete restrict,
  model_id            uuid not null references models(id) on delete restrict,
  brand_name_snapshot text not null,
  model_name_snapshot text not null,
  model_slug_snapshot text,
  brand_slug_snapshot text,
  created_at          timestamptz not null default now()
);

-- ---- quote_request_dispatches: one row per (request, brand, dealer) --
create table if not exists quote_request_dispatches (
  id                  uuid primary key default uuid_generate_v4(),
  quote_request_id    uuid not null references quote_requests(id) on delete cascade,
  brand_id            uuid not null references brands(id) on delete restrict,
  dealer_id           uuid not null references dealers(id) on delete restrict,
  dealer_email        text not null,
  subject             text,
  sent_at             timestamptz,
  success             boolean not null default false,
  error_message       text,
  resend_message_id   text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_qr_items_request   on quote_request_items(quote_request_id);
create index if not exists idx_qr_items_brand     on quote_request_items(brand_id);
create index if not exists idx_qr_disp_request    on quote_request_dispatches(quote_request_id);
create index if not exists idx_qr_disp_dealer     on quote_request_dispatches(dealer_id);

alter table quote_requests             enable row level security;
alter table quote_request_items        enable row level security;
alter table quote_request_dispatches   enable row level security;

-- Settings rows for the feature (no-op if already present)
insert into site_settings (key, value) values
  ('resend_api_key',                  ''),
  ('resend_from_email',               'ajanlat@kinaiauto.com'),
  ('resend_from_name',                'kinaiauto.com'),
  ('quote_max_dealers_per_brand',     '3'),
  ('quote_email_subject_template',    'Ajánlatkérés – {brand} {models_count_text}'),
  ('quote_email_body_template',       '')
on conflict (key) do nothing;

-- =====================================================================
-- DONE. Verify with:
--   select count(*) from quote_requests;
--   select * from site_settings where key like 'quote_%' or key like 'resend_%';
-- =====================================================================
