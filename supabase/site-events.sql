-- Lightweight event log for site usage analytics.
-- Written via service-role only (/api/track). No public read.
-- Events: model_view, gallery_open, filter_catalog, catalog_param

create table if not exists site_events (
  id         bigserial   primary key,
  type       text        not null,   -- event type
  model_id   uuid,                   -- optional model reference
  model_slug text,                   -- for display without join
  param      text,                   -- filter name / param id
  val        text,                   -- filter value / param label
  ts         timestamptz not null default now()
);

create index if not exists ix_site_events_type_ts
  on site_events(type, ts desc);

create index if not exists ix_site_events_model_ts
  on site_events(model_slug, ts desc);

alter table site_events enable row level security;

create policy "service role full access site_events"
  on site_events for all to service_role
  using (true) with check (true);
