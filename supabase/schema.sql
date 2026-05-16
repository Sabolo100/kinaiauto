-- =====================================================================
-- kinaiauto.com — Supabase schema (PostgreSQL 15)
-- =====================================================================
-- Run order:
--   1) 01-extensions
--   2) 02-tables
--   3) 03-indexes
--   4) 04-rls
--   5) 05-storage
--   6) 06-seed-lookup
--   7) 07-seed-brands
--   8) 08-seed-models
--   9) 09-seed-trims
--  10) 10-seed-articles
--  11) 11-seed-site-settings
--
-- All identifiers are snake_case to match PostgreSQL conventions.
-- The Next.js client maps them to camelCase when needed.
-- =====================================================================


-- =====================================================================
-- 01) EXTENSIONS
-- =====================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "citext";
create extension if not exists "pg_trgm";


-- =====================================================================
-- 02) TABLES
-- =====================================================================

-- ---- Lookup: categories ---------------------------------------------
create table if not exists categories (
  id          serial primary key,
  slug        text not null unique,             -- e.g. "kompakt-suv"
  label_hu    text not null,                    -- e.g. "Kompakt SUV"
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---- Lookup: drives -------------------------------------------------
create table if not exists drives (
  id          serial primary key,
  slug        text not null unique,             -- "elektromos","plug-in-hibrid", etc
  label_hu    text not null,                    -- "Elektromos","Plug-in hibrid"
  short_code  text not null unique,             -- "BEV","PHEV","HEV","ICE","DIESEL"
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---- Lookup: price_bands --------------------------------------------
create table if not exists price_bands (
  id          text primary key,                 -- "5-8","9-11", ... "30+"
  label_hu    text not null,                    -- "5–8 M Ft"
  min_m_ft    numeric(5,2) not null,            -- inclusive
  max_m_ft    numeric(6,2) not null,            -- exclusive-ish (.999 sentinel keeps simple)
  sort_order  integer not null default 0
);

-- ---- Brands ---------------------------------------------------------
create table if not exists brands (
  id              uuid primary key default uuid_generate_v4(),
  slug            text not null unique,
  name            text not null unique,         -- "BYD","Chery","MG"...
  tagline         text,
  description     text,
  founded         text,                         -- free text (e.g. "1924 (UK), 2007-től SAIC")
  hq              text,
  factories       text,
  parent_company  text,
  importer_name   text,
  importer_addr   text,
  importer_site   text,                         -- domain only, e.g. "byd.com/hu"
  dealers_text    text,
  hero_color      text,                         -- hex like "#0a3d4e" used as accent on brand pages
  brand_tone      text,                         -- hex used on cards/badges (e.g. "#dc2626")
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---- Models ---------------------------------------------------------
create table if not exists models (
  id              uuid primary key default uuid_generate_v4(),
  brand_id        uuid not null references brands(id) on delete cascade,
  category_id     integer not null references categories(id),
  drive_id        integer not null references drives(id),
  slug            text not null,                -- "atto-3" ; unique per brand
  name            text not null,                -- "Atto 3"
  -- Pricing (millions of HUF).
  price_min_m_ft  numeric(6,2),
  price_max_m_ft  numeric(6,2),
  is_deal         boolean not null default false,
  deal_text       text,
  -- Dimensions
  length_mm       integer,
  width_mm        integer,
  height_mm       integer,
  wheelbase_mm    integer,
  trunk_l         integer,
  seats           smallint,
  -- Powertrain
  power_hp        integer,
  battery_kwh     numeric(5,2),
  range_km        integer,
  consumption_text text,                        -- "5,5 l/100 km" or "17 kWh/100 km"
  -- Charging
  charging_ac_kw  numeric(4,1),
  charging_dc_kw  integer,
  charging_text   text,                         -- free text supplement
  -- Acceleration / extras
  acceleration_s  numeric(3,1),
  -- Misc
  warranty_text   text,
  warranty_years  smallint,
  warranty_km     integer,
  battery_warranty_years smallint,
  battery_warranty_km    integer,
  -- EU segment letter (A/B/C/D/E/F/J/M/S); auto-suggested from category, manually overrideable
  segment         text,
  -- Availability
  is_available    boolean not null default true,
  is_featured     boolean not null default false, -- sets the "hero" model that uses the supplied photo
  -- Sources
  source_url      text,
  -- Visibility / SEO
  meta_title      text,
  meta_description text,
  -- Audit
  data_updated_at date,                         -- displayed "adatok 2026-MM-DD"
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (brand_id, slug)
);

-- ---- Model trims (felszereltségi szintek) ---------------------------
create table if not exists model_trims (
  id              uuid primary key default uuid_generate_v4(),
  model_id        uuid not null references models(id) on delete cascade,
  slug            text not null,                -- "comfort","style","lounge"
  name            text not null,                -- "Comfort","Style","Lounge"
  level_label     text,                         -- "Alapszint","Középszint","Csúcsszint"
  is_featured     boolean not null default false, -- middle "Ajánlott" tier
  price_m_ft      numeric(6,2),
  deal_price_m_ft numeric(6,2),                 -- "akciós ár"
  features        jsonb not null default '[]'::jsonb, -- ["LED fényszórók", ...]
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (model_id, slug)
);

-- ---- Model photos ---------------------------------------------------
-- Stored in Supabase Storage; this row holds the storage_path + metadata.
create table if not exists model_photos (
  id            uuid primary key default uuid_generate_v4(),
  model_id      uuid not null references models(id) on delete cascade,
  -- one of: 'exterior','interior','dashboard','rear','trunk','gallery','hero'
  kind          text not null check (kind in ('exterior','interior','dashboard','rear','trunk','gallery','hero')),
  storage_path  text not null,                  -- "models/byd-atto-3/exterior-1.jpg"
  alt_text      text,
  width         integer,
  height        integer,
  is_primary    boolean not null default false, -- one per model can be primary (used on cards)
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ---- Brand logos ---------------------------------------------------
create table if not exists brand_logos (
  id            uuid primary key default uuid_generate_v4(),
  brand_id      uuid not null references brands(id) on delete cascade,
  variant       text not null check (variant in ('primary','dark','light','square')),
  storage_path  text not null,
  width         integer,
  height        integer,
  created_at    timestamptz not null default now()
);

-- ---- Knowledge base (Tudástár) -------------------------------------
create table if not exists kb_categories (
  id          serial primary key,
  slug        text not null unique,             -- "technika","hatotav","toltes","penzugy","dontes","osszehasonlitas"
  label_hu    text not null,
  sort_order  integer not null default 0
);

create table if not exists articles (
  id              uuid primary key default uuid_generate_v4(),
  slug            text not null unique,         -- "hajtastipusok-egyszeruen"
  category_id     integer references kb_categories(id),
  title           text not null,
  subtitle        text,
  excerpt         text,
  -- Body. We store rich content as JSONB blocks so we can render it
  -- with the same components used on tudastar.html (callouts, tables, decision-cards, etc.)
  -- Block shape: { type: "paragraph"|"heading"|"callout"|"checklist"|"table"|"decision-grid"|"matrix"|"costchart"|"powertrain-grid"|"tabs"|"factor-cloud"|"app-grid"|"finance-accordion", ... }
  body_blocks     jsonb not null default '[]'::jsonb,
  reading_minutes smallint,
  is_published    boolean not null default true,
  -- SEO
  meta_title      text,
  meta_description text,
  og_image_path   text,
  -- Sources/citations
  sources         jsonb not null default '[]'::jsonb, -- [{label,url}, ...]
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- The Tudástár front page is also data-driven:
create table if not exists kb_pages (
  id              serial primary key,
  slug            text not null unique,         -- "tudastar"
  hero_eyebrow    text,
  hero_title      text,                         -- markdown-em-supported: "Kínai autók vásárlása __érthetően__."
  hero_lede       text,
  meta_sources    text,                         -- "NAV · ADAC · Recurrent · KAVOSZ"
  updated_at      timestamptz not null default now()
);

-- ---- FAQ items (tied to articles or standalone, used for SEO) ------
create table if not exists faqs (
  id            uuid primary key default uuid_generate_v4(),
  article_id    uuid references articles(id) on delete cascade,
  question      text not null,
  answer        text not null,                  -- plain text; rendered into JSON-LD FAQPage
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ---- Site settings (single-row; key/value model) -------------------
create table if not exists site_settings (
  key           text primary key,               -- "site_title","site_tagline","contact_email"...
  value         text,
  updated_at    timestamptz not null default now()
);


-- =====================================================================
-- 03) INDEXES
-- =====================================================================
create index if not exists idx_models_brand        on models(brand_id);
create index if not exists idx_models_category     on models(category_id);
create index if not exists idx_models_drive        on models(drive_id);
create index if not exists idx_models_price_min    on models(price_min_m_ft);
create index if not exists idx_models_price_max    on models(price_max_m_ft);
create index if not exists idx_models_is_available on models(is_available);
create index if not exists idx_models_is_deal      on models(is_deal);
create index if not exists idx_model_photos_model  on model_photos(model_id);
create index if not exists idx_model_trims_model   on model_trims(model_id);
create index if not exists idx_articles_category   on articles(category_id);
create index if not exists idx_articles_published  on articles(is_published, published_at desc);

-- Trigram index for model name search
create index if not exists idx_models_name_trgm    on models using gin (name gin_trgm_ops);
create index if not exists idx_brands_name_trgm    on brands using gin (name gin_trgm_ops);


-- =====================================================================
-- 04) ROW LEVEL SECURITY
-- =====================================================================
-- All public-facing tables are publicly readable; writes only via service role.
alter table categories     enable row level security;
alter table drives         enable row level security;
alter table price_bands    enable row level security;
alter table brands         enable row level security;
alter table models         enable row level security;
alter table model_trims    enable row level security;
alter table model_photos   enable row level security;
alter table brand_logos    enable row level security;
alter table kb_categories  enable row level security;
alter table articles       enable row level security;
alter table kb_pages       enable row level security;
alter table faqs           enable row level security;
alter table site_settings  enable row level security;

do $$
begin
  -- Public SELECT policies
  if not exists (select 1 from pg_policies where policyname = 'public_read_categories')   then create policy public_read_categories   on categories     for select using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_drives')       then create policy public_read_drives       on drives         for select using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_price_bands')  then create policy public_read_price_bands  on price_bands    for select using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_brands')       then create policy public_read_brands       on brands         for select using (is_active); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_models')       then create policy public_read_models       on models         for select using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_model_trims')  then create policy public_read_model_trims  on model_trims    for select using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_model_photos') then create policy public_read_model_photos on model_photos   for select using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_brand_logos')  then create policy public_read_brand_logos  on brand_logos    for select using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_kb_categories')then create policy public_read_kb_categories on kb_categories for select using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_articles')     then create policy public_read_articles     on articles       for select using (is_published); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_kb_pages')     then create policy public_read_kb_pages     on kb_pages       for select using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_faqs')         then create policy public_read_faqs         on faqs           for select using (true); end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_site_settings')then create policy public_read_site_settings on site_settings for select using (true); end if;
end $$;

-- Auto-update updated_at columns
create or replace function tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_brands_updated   on brands;
drop trigger if exists trg_models_updated   on models;
drop trigger if exists trg_articles_updated on articles;

create trigger trg_brands_updated   before update on brands   for each row execute function tg_set_updated_at();
create trigger trg_models_updated   before update on models   for each row execute function tg_set_updated_at();
create trigger trg_articles_updated before update on articles for each row execute function tg_set_updated_at();


-- =====================================================================
-- 05) STORAGE BUCKETS
-- =====================================================================
-- These need to be created via Storage UI or via the storage admin API.
-- The schema below describes the policy SQL. Buckets:
--   1) car-photos  (public, model_photos.storage_path lives here)
--   2) brand-logos (public)
--   3) og-images   (public, optional)
--
-- Run AFTER creating the buckets in the Supabase dashboard:

insert into storage.buckets (id, name, public)
values
  ('car-photos',  'car-photos',  true),
  ('brand-logos', 'brand-logos', true),
  ('og-images',   'og-images',   true)
on conflict (id) do update set public = excluded.public;

-- Public read for these buckets
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'public_read_car_photos') then
    create policy public_read_car_photos
      on storage.objects for select to anon
      using (bucket_id = 'car-photos');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_brand_logos_storage') then
    create policy public_read_brand_logos_storage
      on storage.objects for select to anon
      using (bucket_id = 'brand-logos');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_og_images') then
    create policy public_read_og_images
      on storage.objects for select to anon
      using (bucket_id = 'og-images');
  end if;
end $$;


-- =====================================================================
-- 06) SEED — Lookups (categories / drives / price_bands)
-- =====================================================================
insert into categories (slug, label_hu, sort_order) values
  ('varosi-kisauto',     'Városi kisautó',          10),
  ('mini-suv',           'Mini SUV',                20),
  ('kompakt-suv',        'Kompakt SUV',             30),
  ('kozepmeretu-suv',    'Középméretű SUV',         40),
  ('nagy-suv',           'Nagy SUV',                50),
  ('kompakt-ferdehatu',  'Kompakt ferdehátú',       60),
  ('premium-limuzin',    'Prémium limuzin',         70),
  ('kombi',              'Kombi',                   80),
  ('mpv',                'Egyterű / MPV',           90),
  ('pickup',             'Pickup',                 100),
  ('sedan',              'Szedán',                 110),
  ('roadster',           'Roadster',               120)
on conflict (slug) do update set
  label_hu = excluded.label_hu,
  sort_order = excluded.sort_order;

insert into drives (slug, label_hu, short_code, sort_order) values
  ('benzin',           'Benzin',           'ICE',    10),
  ('dizel',            'Dízel',            'DIESEL', 20),
  ('onttolto-hibrid',  'Önttöltő hibrid',  'HEV',    30),
  ('plug-in-hibrid',   'Plug-in hibrid',   'PHEV',   40),
  ('elektromos',       'Elektromos',       'BEV',    50)
on conflict (slug) do update set
  label_hu = excluded.label_hu,
  short_code = excluded.short_code,
  sort_order = excluded.sort_order;

insert into price_bands (id, label_hu, min_m_ft, max_m_ft, sort_order) values
  ('5-8',   '5–8 M Ft',          0,    8.999,  10),
  ('9-11',  '9–11 M Ft',         9,   11.999,  20),
  ('12-15', '12–15 M Ft',       12,   15.999,  30),
  ('16-19', '16–19 M Ft',       16,   19.999,  40),
  ('20-25', '20–25 M Ft',       20,   25.999,  50),
  ('25-30', '25–30 M Ft',       25,   30.999,  60),
  ('30+',   '30 M Ft felett',   30,  999,      70)
on conflict (id) do update set
  label_hu = excluded.label_hu,
  min_m_ft = excluded.min_m_ft,
  max_m_ft = excluded.max_m_ft,
  sort_order = excluded.sort_order;


-- =====================================================================
-- 07) SEED — Brands
-- =====================================================================
insert into brands
  (slug, name, tagline, description, founded, hq, factories, parent_company,
   importer_name, importer_addr, importer_site, dealers_text, hero_color, brand_tone, sort_order, is_active)
values
  ('byd', 'BYD',
   'A világ legnagyobb új energiás autógyártója.',
   'A BYD (Build Your Dreams) eredetileg akkumulátorgyártóként indult, ma a világ egyik legnagyobb új energiás autógyártója. A magyar piacon az elektromos és plug-in hibrid kínálatára épít, a városi kisautótól a hét üléses nagy SUV-ig.',
   '1995','Shenzhen, Kína','Xi''an, Changsha, Hefei, Csongrád (épülő, EU)','BYD Company Ltd. (független)',
   'BYD Hungary Kft.','1138 Budapest, Váci út 144–150.','byd.com/hu','10+ hivatalos márkakereskedő országosan','#0a3d4e','#dc2626',10,true),

  ('chery', 'Chery',
   'Kína egyik vezető exportőre, hatalmas globális hálózattal.',
   'A Chery Kína egyik legnagyobb és legrégebbi autógyártója, 80+ országban van jelen. A magyar piacon a Tiggo SUV-család áll a középpontban, hangsúlyos hibrid változatokkal.',
   '1997','Wuhu, Anhui','Wuhu, Dalian, Ordos + nemzetközi CKD üzemek','Chery Holding (részben állami)',
   'Magyar Autópiac Kft. (mychery.hu)','1191 Budapest, Vak Bottyán u. 75/A','mychery.hu','20+ kereskedő, nagyvárosokban','#7a2014','#0f766e',20,true),

  ('omoda', 'Omoda',
   'A Chery prémiumosabb, fiatalos almárkája.',
   'Az Omoda a Chery által 2022-ben indított globális almárka, kifejezetten az európai piacra hangolt termékpalettával. Magyarországon közös kereskedői hálózaton érhető el a Jaecoo-val.',
   '2022','Wuhu, Anhui','Chery anyavállalat üzemei','Chery Group',
   'Omoda & Jaecoo Hungary','Hivatalos hazai márkaoldal: omodajaecoo.hu','omodajaecoo.hu','Közös Omoda & Jaecoo szalonhálózat','#1e293b','#1e293b',30,true),

  ('jaecoo', 'Jaecoo',
   'Robusztus SUV-karakter, prémium technológia.',
   'A Jaecoo szintén a Chery csoport almárkája, de a klasszikus SUV-formanyelvre épít. Magyarországon az Omodával közös értékesítési hálózaton érhető el.',
   '2023','Wuhu, Anhui','Chery anyavállalat üzemei','Chery Group',
   'Omoda & Jaecoo Hungary','Hivatalos hazai márkaoldal: omodajaecoo.hu','omodajaecoo.hu','Közös Omoda & Jaecoo szalonhálózat','#3f3f46','#3f3f46',40,true),

  ('mg', 'MG',
   'Brit gyökerek, kínai hátszél — Európa egyik legsikeresebb kínai márkája.',
   'Az MG eredetileg brit sportkocsigyártó, ma a kínai SAIC tulajdonában. Európában és Magyarországon az egyik legrégebb óta jelen lévő, jól felépített hálózattal rendelkező kínai márka.',
   '1924 (UK), 2007-től SAIC','Sanghaj (SAIC) / Longbridge (UK design)','Nanjing, Sanghaj, Csenghszing','SAIC Motor (állami)',
   'MG Motor Hungary (Wallis)','1117 Budapest, Hauszmann Alajos u. 3.','mgmotor.hu','30+ kereskedő országosan','#7a1818','#b91c1c',50,true),

  ('nio', 'NIO',
   'Prémium elektromos márka csere-akkumulátoros technológiával.',
   'A NIO Kína prémium EV szegmensének egyik vezetője, jellegzetessége a NIO Power csere-akkumulátoros hálózat. Magyarországi indulását az AutoWallis hozta el 2024-ben.',
   '2014','Sanghaj','Hefei (Jianglai)','NIO Inc. (független)',
   'AutoWallis Group','1138 Budapest, Váci út 188.','nio.com/hu','Budapest, készülő bővítés','#0c5b80','#0ea5e9',60,true),

  ('firefly', 'Firefly',
   'A NIO új lifestyle almárkája — városi, design-fókuszú.',
   'A Firefly a NIO 2024-ben indított almárkája, kifejezetten a városi, fiatalabb vásárlóknak. Önálló magyar oldallal jelent meg.',
   '2024','Sanghaj','NIO partnerüzemek','NIO Inc.',
   'AutoWallis Group','1138 Budapest, Váci út 188.','firefly-auto.com','Budapest, készülő bővítés','#9b2566','#db2777',70,true),

  ('xpeng', 'XPENG',
   'Tech-fókuszú prémium EV-gyártó, erős vezető-asszisztensekkel.',
   'Az XPENG (Xiaopeng Motors) Kína egyik vezető prémium EV-startupja, fókuszában a vezetőtámogató rendszerek és az autonóm vezetés. Magyarországi értékesítés szintén az AutoWallison keresztül.',
   '2014','Kanton (Guangzhou)','Zhaoqing, Wuhan','XPeng Inc. (független)',
   'AutoWallis Group','1138 Budapest, Váci út 188.','xpeng.com/hu','Budapest, készülő bővítés','#066654','#059669',80,true),

  ('leapmotor', 'Leapmotor',
   'A Stellantis kínai stratégiai partnere — kedvező árú EV-k.',
   'A Leapmotor a Stellantis-szal kötött globális szövetség alapján kerül Európába, ezért a Duna Autó Csoport hozza Magyarországra. Az ár-érték arányra fókuszáló kínálatot képvisel.',
   '2015','Hangzhou','Hangzhou, Jinhua','Leapmotor + Stellantis (47% Stellantis)',
   'Duna Autó Zrt.','1239 Budapest, Európa út 24.','leapmotor.hu','Stellantis partnerszalonok','#0566a0','#0284c7',90,true),

  ('geely', 'Geely',
   'A kínai autóipar globális óriása — Volvo, Polestar, Lotus tulajdonos.',
   'A Geely Kína egyik legnagyobb magántulajdonú autógyártója, a Volvo, Polestar, Lotus, Lynk & Co tulajdonosa. Magyarországon önálló márkaként frissen indult, hibrid és elektromos modellekkel.',
   '1986','Hangzhou','Hangzhou, Ningbo, Csendu, sőt EU is','Geely Holding (független)',
   'Geely Hungary','Hivatalos hazai márkaoldal: geely.hu','geely.hu','Bővülő kereskedői hálózat','#1f3d8a','#1e40af',100,true),

  ('dongfeng', 'Dongfeng',
   'Kína egyik legnagyobb állami autógyártója, széles modellpalettával.',
   'A Dongfeng állami nagyvállalat, klasszikus tömegmárkák és prémium almárkák (Voyah, M-Hero) is alá tartoznak. Magyarországi képviselete személyautókat és kishaszonjárműveket egyaránt forgalmaz.',
   '1969','Wuhan, Hubei','Wuhan, Xiangyang, Liuzhou','Dongfeng Motor (állami)',
   'Dongfeng Motor Magyarország','Miskolci hivatalos szalon','dongfengmotor.hu','Miskolc, Budapest, bővülő hálózat','#5a2010','#7c2d12',110,true),

  ('voyah', 'Voyah',
   'A Dongfeng prémium elektromos / range extender almárkája.',
   'A Voyah a Dongfeng csoport prémium szegmense, plug-in hibrid és range extender modellekkel. Magyarországon az importőr önálló Voyah szalont működtet.',
   '2020','Wuhan','Wuhan','Dongfeng Motor',
   'Voyah Magyarország','Hivatalos hazai márkaoldal: voyah.hu','voyah.hu','Budapest, kiemelt szalonokban','#48157a','#581c87',120,true),

  ('baic', 'BAIC',
   'A Pekingi Autóipar (BAIC) klasszikus tömeggyártója.',
   'A BAIC Group Kína egyik legnagyobb állami autóipari konszernje. Magyarországon a Gablini csoporton keresztül érhető el, klasszikus benzines SUV-okkal.',
   '1958','Peking','Peking, Csucsing, Csangcsou','BAIC Group (állami)',
   'Gablini Csoport','1131 Budapest, Reitter Ferenc u. 132.','baic-gablini.hu','Gablini szalonok','#3a4046','#374151',130,true),

  ('seres', 'SERES',
   'Csúcstechnológiás új energiás márka — Huawei partnerséggel.',
   'A SERES (eredetileg DFSK új energiás üzletág) Kínában a Huawei Smart Selection programjának egyik kulcsmárkája. Magyarországon a Duna Autón keresztül érhető el.',
   '2016','Csungking','Csungking','Csungking Sokon Industry (DFSK)',
   'Duna Autó Zrt.','1239 Budapest, Európa út 24.','seres.hu','Duna Autó szalonok','#076380','#0891b2',140,true),

  ('maxus', 'Maxus',
   'A SAIC kishaszon-járműves és pickup márkája.',
   'A Maxus a SAIC tulajdonában lévő, főként haszonjárművekre, pickupokra szakosodott márka. Magyarországi kínálatát a hivatalos importőr építi.',
   '2011 (Maxus brand)','Sanghaj (SAIC)','Sanghaj, Wuxi','SAIC Motor',
   'Maxus Magyarország','Hivatalos hazai márkaoldal: maxus.hu','maxus.hu','Bővülő kereskedői hálózat','#754216','#92400e',150,true)
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  founded = excluded.founded,
  hq = excluded.hq,
  factories = excluded.factories,
  parent_company = excluded.parent_company,
  importer_name = excluded.importer_name,
  importer_addr = excluded.importer_addr,
  importer_site = excluded.importer_site,
  dealers_text = excluded.dealers_text,
  hero_color = excluded.hero_color,
  brand_tone = excluded.brand_tone,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;


-- =====================================================================
-- 08) SEED — Models (60 rows)
-- =====================================================================
-- Helper: insert via subqueries so we don't hard-code FK ids.
with seed(brand_slug, cat_slug, drive_slug, slug, name, price_min, price_max, length_mm, trunk_l, battery_kwh, range_km, power_hp, seats, is_deal, is_featured) as (
  values
    -- ——— BYD ———
    ('byd','varosi-kisauto','elektromos',         'dolphin-surf',  'Dolphin Surf',  7.9,  9.4, 3990, 308, 43.2, 322, 156, 5, true,  false),
    ('byd','kompakt-ferdehatu','elektromos',      'dolphin',       'Dolphin',      10.9, 13.2, 4290, 345, 60.4, 427, 204, 5, false, false),
    ('byd','mini-suv','elektromos',               'atto-2',        'Atto 2',       11.9, 13.9, 4310, 400, 45.1, 312, 177, 5, false, false),
    ('byd','mini-suv','plug-in-hibrid',           'atto-2-dm-i',   'Atto 2 DM-i',  12.5, 14.6, 4310, 400, 18.3,  90, 163, 5, false, false),
    ('byd','kompakt-suv','elektromos',            'atto-3',        'Atto 3',       13.9, 15.9, 4455, 440, 60.5, 420, 204, 5, false, false),
    ('byd','premium-limuzin','elektromos',        'seal',          'Seal',         16.9, 21.9, 4800, 402, 82.5, 570, 530, 5, false, false),
    ('byd','premium-limuzin','plug-in-hibrid',    'seal-6-dm-i',   'Seal 6 DM-i',  14.9, 18.5, 4840, 500, 18.3, 105, 218, 5, false, false),
    ('byd','kombi','plug-in-hibrid',              'seal-6-dm-i-touring','Seal 6 DM-i Touring',15.4,19.0,4840,520,18.3,105,218,5,false,false),
    ('byd','kozepmeretu-suv','elektromos',        'seal-u',        'Seal U',       17.9, 20.9, 4785, 552, 87,   500, 218, 5, false, false),
    ('byd','kozepmeretu-suv','plug-in-hibrid',    'seal-u-dm-i',   'Seal U DM-i',  14.9, 18.9, 4785, 552, 18.3, 125, 218, 5, false, false),
    ('byd','kozepmeretu-suv','elektromos',        'sealion-7',     'Sealion 7',    19.9, 24.9, 4830, 520, 91.3, 482, 530, 5, false, false),
    ('byd','nagy-suv','elektromos',               'tang',          'Tang',         24.9, 28.9, 4870, 235, 108.8,530, 517, 7, false, false),

    -- ——— MG ———
    ('mg','varosi-kisauto','onttolto-hibrid',     'mg3-hybrid-plus','MG3 Hybrid+',  7.4,  8.9, 4113, 293, null, null,194, 5, true,  false),
    ('mg','kompakt-ferdehatu','elektromos',       'mg4-electric',  'MG4 Electric', 11.9, 15.9, 4287, 363, 64,   435, 204, 5, false, false),
    ('mg','kompakt-suv','onttolto-hibrid',        'mg-zs-hybrid-plus','MG ZS Hybrid+',9.9,11.9,4430,443,null,null,196,5,false,false),
    ('mg','kompakt-suv','elektromos',             'mgs5-ev',       'MGS5 EV',      13.9, 16.5, 4476, 453, 64,   430, 170, 5, false, false),
    ('mg','kozepmeretu-suv','onttolto-hibrid',    'mg-hs-hybrid-plus','MG HS Hybrid+',13.4,15.9,4670,507,null,null,220,5,false,false),
    ('mg','kozepmeretu-suv','plug-in-hibrid',     'mg-hs-phev',    'MG HS PHEV',   15.9, 17.9, 4670, 441, 24.7, 120, 299, 5, false, false),
    ('mg','premium-limuzin','elektromos',         'mg-cyberster',  'MG Cyberster', 24.9, 29.9, 4535, 249, 77,   519, 510, 2, false, false),

    -- ——— Omoda ———
    ('omoda','kompakt-suv','benzin',              'omoda-5',       'Omoda 5',       9.9, 12.4, 4400, 380, null, null,147, 5, false, false),
    ('omoda','kompakt-suv','elektromos',          'omoda-e5',      'Omoda E5',     13.9, 15.9, 4424, 380, 61,   430, 204, 5, false, false),
    ('omoda','kompakt-suv','onttolto-hibrid',     'omoda-5-shs-h', 'Omoda 5 SHS-H',11.9, 13.5, 4400, 380, null, null,204, 5, false, false),
    ('omoda','kozepmeretu-suv','plug-in-hibrid',  'omoda-7-shs',   'Omoda 7 SHS',  14.9, 17.9, 4620, 480, 18.3,  90, 204, 5, false, false),
    ('omoda','nagy-suv','plug-in-hibrid',         'omoda-9-shs-p', 'Omoda 9 SHS-P',19.9, 23.9, 4775, 660, 34.5, 150, 449, 5, false, false),

    -- ——— Jaecoo ———
    ('jaecoo','kompakt-suv','benzin',             'jaecoo-5',      'Jaecoo 5',     10.9, 12.9, 4380, 480, null, null,147, 5, false, false),
    ('jaecoo','kompakt-suv','elektromos',         'jaecoo-5-ev',   'Jaecoo 5 EV',  13.9, 15.9, 4380, 480, 61,   401, 204, 5, false, false),
    ('jaecoo','kozepmeretu-suv','benzin',         'jaecoo-7',      'Jaecoo 7',     12.9, 15.4, 4500, 500, null, null,184, 5, false, false),
    ('jaecoo','kozepmeretu-suv','plug-in-hibrid', 'jaecoo-7-shs-p','Jaecoo 7 SHS-P',14.9,17.9, 4500, 500, 18.3,  90, 204, 5, false, false),

    -- ——— Chery ———
    ('chery','kompakt-suv','onttolto-hibrid',     'tiggo-4',       'Tiggo 4',       9.5, 11.5, 4318, 380, null, null,204, 5, true,  false),
    ('chery','kozepmeretu-suv','onttolto-hibrid', 'tiggo-7',       'Tiggo 7',      12.9, 15.9, 4500, 475, null, null,204, 5, false, false),
    ('chery','nagy-suv','onttolto-hibrid',        'tiggo-8',       'Tiggo 8',      15.9, 18.9, 4722, 889, null, null,204, 7, false, true),
    ('chery','nagy-suv','plug-in-hibrid',         'tiggo-9',       'Tiggo 9',      18.9, 22.9, 4820, 660, 34.5, 150, 449, 7, false, false),

    -- ——— NIO ———
    ('nio','premium-limuzin','elektromos',        'et5',           'ET5',          21.9, 25.9, 4790, 386, 75,   456, 489, 5, false, false),
    ('nio','kombi','elektromos',                  'et5-touring',   'ET5 Touring',  22.9, 26.9, 4790, 450, 75,   445, 489, 5, false, false),
    ('nio','nagy-suv','elektromos',               'el6',           'EL6',          26.9, 31.9, 4854, 579, 100,  529, 489, 5, false, false),

    -- ——— Firefly ———
    ('firefly','varosi-kisauto','elektromos',     'firefly',       'Firefly',      11.9, 13.9, 4003, 404, 42,   330, 142, 5, false, false),

    -- ——— XPENG ———
    ('xpeng','premium-limuzin','elektromos',      'p7',            'P7',           22.9, 27.9, 4888, 440, 82.7, 576, 341, 5, false, false),
    ('xpeng','premium-limuzin','elektromos',      'p7-plus',       'P7+',          24.9, 29.9, 5056, 725, 76,   602, 241, 5, false, false),
    ('xpeng','kozepmeretu-suv','elektromos',      'g6',            'G6',           18.9, 22.9, 4753, 571, 87.5, 570, 296, 5, false, false),
    ('xpeng','nagy-suv','elektromos',             'g9',            'G9',           27.9, 33.9, 4891, 660, 98,   570, 551, 5, false, false),

    -- ——— Leapmotor ———
    ('leapmotor','varosi-kisauto','elektromos',   't03',           'T03',           7.9,  8.9, 3620, 210, 37.3, 265,  95, 4, true,  false),
    ('leapmotor','kompakt-suv','elektromos',      'b10',           'B10',          13.9, 15.9, 4515, 430, 67.1, 434, 218, 5, false, false),
    ('leapmotor','kozepmeretu-suv','elektromos',  'c10',           'C10',          15.9, 18.9, 4739, 435, 69.9, 420, 218, 5, false, false),
    ('leapmotor','kozepmeretu-suv','plug-in-hibrid','c10-hibrid-ev','C10 Hibrid-EV',14.9,17.9, 4739, 435, 28.4, 145, 215, 5, false, false),

    -- ——— Geely ———
    ('geely','kozepmeretu-suv','elektromos',      'e5',            'E5',           13.9, 16.4, 4615, 438, 60.2, 430, 218, 5, false, false),
    ('geely','kozepmeretu-suv','plug-in-hibrid',  'starray-em-i',  'Starray EM-i', 13.9, 16.9, 4655, 540, 18.4, 125, 204, 5, false, false),

    -- ——— Dongfeng ———
    ('dongfeng','premium-limuzin','benzin',       'shine-gs',      'Shine GS',      8.9, 10.9, 4690, 470, null, null,184, 5, false, false),
    ('dongfeng','kompakt-suv','benzin',           'forthing-t5-evo','Forthing T5 EVO',9.9,12.4,4626,402,null,null,197,5,false,false),
    ('dongfeng','kompakt-suv','onttolto-hibrid',  'forthing-t5-evo-hev','Forthing T5 EVO HEV',11.9,13.9,4626,402,null,null,218,5,false,false),
    ('dongfeng','mpv','onttolto-hibrid',          'forthing-u-tour-hev','Forthing U-Tour HEV',13.9,15.9,5095,340,null,null,218,7,false,false),
    ('dongfeng','varosi-kisauto','elektromos',    'box-e1',        'Box E1',        7.4,  8.9, 3995, 326, 42.3, 330,  95, 4, false, false),

    -- ——— Voyah ———
    ('voyah','kozepmeretu-suv','elektromos',      'courage-ev',    'Courage EV',   21.9, 25.9, 4680, 580, 82,   520, 435, 5, false, false),
    ('voyah','nagy-suv','plug-in-hibrid',         'free-rev-318',  'Free REV 318', 23.9, 27.9, 4905, 560, 43,   200, 455, 5, false, false),
    ('voyah','mpv','plug-in-hibrid',              'dream-phev',    'Dream PHEV',   29.9, 34.9, 5315, 380, 43,   180, 435, 7, false, false),

    -- ——— BAIC ———
    ('baic','kompakt-suv','benzin',               'x55',           'X55',           9.9, 11.9, 4585, 480, null, null,177, 5, false, false),

    -- ——— SERES ———
    ('seres','mini-suv','elektromos',             'seres-3',       'Seres 3',      10.9, 12.9, 4385, 330, 53.6, 329, 163, 5, false, false),
    ('seres','kozepmeretu-suv','elektromos',      'seres-5',       'Seres 5',      18.9, 22.9, 4760, 445, 80,   483, 430, 5, false, false),

    -- ——— Maxus ———
    ('maxus','pickup','dizel',                    't60-max-pickup','T60 MAX Pickup',13.9,15.9, 5365,   0, null, null,218, 5, false, false)
)
insert into models
  (brand_id, category_id, drive_id, slug, name,
   price_min_m_ft, price_max_m_ft,
   length_mm, trunk_l, battery_kwh, range_km, power_hp, seats,
   is_deal, is_featured, data_updated_at, is_available)
select
  b.id, c.id, d.id, s.slug, s.name,
  s.price_min, s.price_max,
  s.length_mm, s.trunk_l, s.battery_kwh, s.range_km, s.power_hp, s.seats,
  s.is_deal, s.is_featured, '2026-05-04', true
from seed s
join brands     b on b.slug = s.brand_slug
join categories c on c.slug = s.cat_slug
join drives     d on d.slug = s.drive_slug
on conflict (brand_id, slug) do update set
  name = excluded.name,
  category_id = excluded.category_id,
  drive_id = excluded.drive_id,
  price_min_m_ft = excluded.price_min_m_ft,
  price_max_m_ft = excluded.price_max_m_ft,
  length_mm = excluded.length_mm,
  trunk_l = excluded.trunk_l,
  battery_kwh = excluded.battery_kwh,
  range_km = excluded.range_km,
  power_hp = excluded.power_hp,
  seats = excluded.seats,
  is_deal = excluded.is_deal,
  is_featured = excluded.is_featured,
  data_updated_at = excluded.data_updated_at,
  is_available = excluded.is_available;


-- =====================================================================
-- 09) SEED — Trims (3 generic levels per model: Comfort / Style / Lounge)
-- =====================================================================
-- We seed three trims per model with derived prices.
-- Customise per model later via admin; this gives the "Felszereltségi szintek"
-- block a working baseline matching the prototype.
insert into model_trims (model_id, slug, name, level_label, is_featured, price_m_ft, features, sort_order)
select m.id, t.slug, t.name, t.level_label, t.featured, t.price,
       to_jsonb(t.features), t.sort_order
from models m
cross join lateral (
  values
    ('comfort','Comfort','Alapszint', false, m.price_min_m_ft,
     array['LED fényszórók','Digitális műszerfal','Tempomat','Légkondicionáló','Tolatóradar + kamera','Multimédia érintőképernyővel'], 10),
    ('style','Style','Középszint',    true,  round(((m.price_min_m_ft + m.price_max_m_ft)/2)::numeric, 1),
     array['Adaptív tempomat','360° kamera','Bőr / textil ülőgarnitúra','Elektromos vezetőülés','Vezeték nélküli telefontöltő','Sávtartó és holttér-figyelő','Apple CarPlay / Android Auto'], 20),
    ('lounge','Lounge','Csúcsszint',  false, m.price_max_m_ft,
     array['Panorámatető','Prémium audio','Szellőztetett & fűthető ülések','Head-up display','Asszisztált sávváltás','Memória vezetőülés','Nagyobb felni opció'], 30)
) as t(slug, name, level_label, featured, price, features, sort_order)
on conflict (model_id, slug) do update set
  name = excluded.name,
  level_label = excluded.level_label,
  is_featured = excluded.is_featured,
  price_m_ft = excluded.price_m_ft,
  features = excluded.features,
  sort_order = excluded.sort_order;


-- =====================================================================
-- 09b) SEED — Featured model photo (Tiggo 8)
-- =====================================================================
-- The Tiggo 8 is the only model with a real photo in the seed bundle.
-- The actual file is uploaded to bucket 'car-photos' at path 'models/tiggo-8/hero.avif'
-- by the admin; this row registers it.
insert into model_photos (model_id, kind, storage_path, alt_text, is_primary, sort_order)
select m.id, 'hero', 'models/tiggo-8/hero.avif', 'Chery Tiggo 8 — külső, Aurora Green', true, 0
from models m join brands b on b.id = m.brand_id
where b.slug = 'chery' and m.slug = 'tiggo-8'
on conflict do nothing;


-- =====================================================================
-- 10) SEED — Knowledge base (Tudástár)
-- =====================================================================
insert into kb_categories (slug, label_hu, sort_order) values
  ('technika',         'Technika',                  10),
  ('hatotav',          'Hatótáv és fogyasztás',     20),
  ('toltes',           'Töltés',                    30),
  ('penzugy',          'Pénzügy / adózás / lízing', 40),
  ('dontes',           'Döntési segítség',          50),
  ('osszehasonlitas',  'Költségmátrix',             60),
  ('garancia',         'Garancia',                  70),
  ('vasarlas',         'Vásárlás',                  80)
on conflict (slug) do update set label_hu = excluded.label_hu, sort_order = excluded.sort_order;

insert into kb_pages (slug, hero_eyebrow, hero_title, hero_lede, meta_sources)
values (
  'tudastar',
  'Vásárlói útmutató · 8 fejezet · ~12 perc olvasás',
  'Kínai autók vásárlása __érthetően__.',
  'Nem az a kérdés, hogy van-e választék — hanem az, hogy a saját használati logikádhoz melyik hajtás, ársáv és finanszírozási forma illik. Ez a Tudástár ehhez ad gyakorlati támpontot.',
  'NAV · ADAC · Recurrent · KAVOSZ'
) on conflict (slug) do update set
  hero_eyebrow = excluded.hero_eyebrow,
  hero_title   = excluded.hero_title,
  hero_lede    = excluded.hero_lede,
  meta_sources = excluded.meta_sources,
  updated_at   = now();

-- 8 placeholder cards (linked-articles section). Real long-form bodies
-- live in body_blocks JSON — initialized empty here, fill in from admin.
insert into articles (slug, category_id, title, subtitle, excerpt, reading_minutes, is_published, sources)
select * from (values
  ('hajtastipusok-egyszeruen', (select id from kb_categories where slug='technika'),
   'Hajtástípusok egyszerűen', '7.1 · Technika',
   'Benzin, hibrid, PHEV, EV — melyik hogy működik és kinek való.', 6, true,
   '[{"label":"NAV","url":"https://nav.gov.hu"}]'::jsonb),
  ('miert-nem-annyi-a-valos-hatotav', (select id from kb_categories where slug='hatotav'),
   'Miért nem annyi a valós hatótáv?', '7.2 · Hatótáv',
   'Hideg, meleg, autópálya, fűtés, vezetési stílus hatása.', 5, true,
   '[{"label":"ADAC","url":"https://www.fiaregion1.com/adac-reassures-ev-drivers-of-range-during-winter-conditions/"}]'::jsonb),
  ('plug-in-hibrid-zsenialis-vagy-felreertett', (select id from kb_categories where slug='technika'),
   'Plug-in hibrid: zseniális vagy félreértett?', '7.3 · Hibrid',
   'Csak akkor igazán jó, ha rendszeresen töltik.', 5, true, '[]'::jsonb),
  ('otthoni-toltes-konnektor-wallbox-napelem', (select id from kb_categories where slug='toltes'),
   'Otthoni töltés: konnektor, wallbox, napelem', '7.4 · Töltés',
   'Gyakorlati útmutató vásárlás előtti ellenőrzéshez.', 7, true, '[]'::jsonb),
  ('nyilvanos-toltes-magyarorszagon', (select id from kb_categories where slug='toltes'),
   'Nyilvános töltés Magyarországon', '7.5 · Töltés',
   'Szolgáltatók, applikációk, töltőtípusok és árlogika.', 6, true,
   '[{"label":"MOL Plugee","url":"https://molplugee.hu/hu/araink"}]'::jsonb),
  ('elektromos-auto-ceges-vasarlasa', (select id from kb_categories where slug='penzugy'),
   'Elektromos autó céges vásárlása', '7.6 · Pénzügy',
   'Adózási, finanszírozási és lízing szempontok.', 8, true,
   '[{"label":"KAVOSZ","url":"https://www.kavosz.hu/hitelek/szechenyi-lizing-max-plusz/"}]'::jsonb),
  ('maganvasarlokent-mire-figyelj', (select id from kb_categories where slug='vasarlas'),
   'Magánvásárlóként mire figyelj?', '7.7 · Magán',
   'Ár, hatótáv, garancia, töltés, szerviz, biztosítás, értékvesztés.', 7, true, '[]'::jsonb),
  ('kinai-auto-garancia-es-szervizhatter', (select id from kb_categories where slug='garancia'),
   'Kínai autó garancia és szervizháttér', '7.8 · Garancia',
   'Márkánként eltérő — vásárlás előtt ellenőrizendő.', 5, true, '[]'::jsonb)
) as t(slug, category_id, title, subtitle, excerpt, reading_minutes, is_published, sources)
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  excerpt = excluded.excerpt,
  reading_minutes = excluded.reading_minutes,
  is_published = excluded.is_published,
  sources = excluded.sources;


-- =====================================================================
-- 11) SEED — Site settings
-- =====================================================================
insert into site_settings (key, value) values
  ('site_title',       'kinaiauto.com'),
  ('site_url',         'https://www.kinaiauto.com'),
  ('site_description', 'Független magyar nyelvű kínai autó-iránytű. Találd meg a számodra megfelelő kínai modellt — kategória, ársáv és hajtás alapján.'),
  ('contact_email',    'info@kinaiauto.com'),
  ('disclaimer_short', 'Az árak tájékoztató jellegűek. Vásárlás előtt minden esetben ellenőrizd az aktuális ajánlatot a hivatalos márkaoldalon vagy kereskedőnél.'),
  ('default_locale',   'hu'),
  ('default_currency', 'HUF')
on conflict (key) do update set value = excluded.value, updated_at = now();


-- =====================================================================
-- 12) VIEWS — convenience joins for the Next.js client
-- =====================================================================

-- Flattened model view used by listings, finder, viz
create or replace view v_models as
select
  m.id,
  m.slug,
  m.name,
  m.is_deal,
  m.is_available,
  m.is_featured,
  m.price_min_m_ft,
  m.price_max_m_ft,
  m.length_mm,
  m.width_mm,
  m.height_mm,
  m.wheelbase_mm,
  m.trunk_l,
  m.seats,
  m.power_hp,
  m.battery_kwh,
  m.range_km,
  m.acceleration_s,
  m.consumption_text,
  m.charging_ac_kw,
  m.charging_dc_kw,
  m.charging_text,
  m.warranty_years,
  m.warranty_km,
  m.battery_warranty_years,
  m.battery_warranty_km,
  m.data_updated_at,
  m.updated_at,
  b.id            as brand_id,
  b.slug          as brand_slug,
  b.name          as brand_name,
  b.brand_tone    as brand_tone,
  b.hero_color    as brand_hero_color,
  b.importer_name as brand_importer_name,
  b.importer_addr as brand_importer_addr,
  b.importer_site as brand_importer_site,
  b.dealers_text  as brand_dealers_text,
  c.id            as category_id,
  c.slug          as category_slug,
  c.label_hu      as category,
  d.id            as drive_id,
  d.slug          as drive_slug,
  d.label_hu      as drive,
  d.short_code    as drive_code,
  m.segment,
  -- primary photo storage path if any
  (select mp.storage_path
     from model_photos mp
    where mp.model_id = m.id and mp.is_primary
    order by mp.sort_order asc
    limit 1) as primary_photo_path
from models m
join brands     b on b.id = m.brand_id
join categories c on c.id = m.category_id
join drives     d on d.id = m.drive_id
where m.archived_at is null;          -- soft-deleted models are hidden from all public reads

grant select on v_models to anon, authenticated;

-- Brand summary with model counts
drop view if exists v_brand_summary cascade;
create view v_brand_summary as
select
  b.*,
  count(m.id)::int as models_count,
  min(m.price_min_m_ft) as min_price_m_ft,
  max(m.price_max_m_ft) as max_price_m_ft,
  array(
    select distinct d.label_hu
      from models m2
      join drives d on d.id = m2.drive_id
     where m2.brand_id = b.id
       and m2.archived_at is null
     order by d.label_hu
  ) as drives,
  array(
    select distinct c.label_hu
      from models m2
      join categories c on c.id = m2.category_id
     where m2.brand_id = b.id
       and m2.archived_at is null
     order by c.label_hu
  ) as categories
from brands b
left join models m on m.brand_id = b.id and m.is_available and m.archived_at is null
group by b.id;

grant select on v_brand_summary to anon, authenticated;

-- Returns the most-recently-updated model; used by topbar "Frissítve" pill.
drop view if exists v_data_freshness cascade;
create view v_data_freshness as
select max(coalesce(m.data_updated_at, m.updated_at::date)) as last_updated_at
from models m
where m.archived_at is null;

grant select on v_data_freshness to anon, authenticated;


-- ---- Dealers (márkakereskedők) ----------------------------------------
create table if not exists dealers (
  id              uuid primary key default uuid_generate_v4(),
  brand_id        uuid not null references brands(id) on delete cascade,
  name            text not null,
  city            text not null,
  zip_code        text,
  street          text,
  lat             numeric(9,6),
  lng             numeric(9,6),
  email           text,
  phone           text,
  website         text,
  notes           text,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Import columns
  extra_emails    jsonb not null default '[]'::jsonb,
  extra_phones    jsonb not null default '[]'::jsonb,
  source_url      text,
  data_quality    text,
  data_source     text,
  last_checked_at timestamptz
);

create table if not exists dealer_contacts (
  id          uuid primary key default uuid_generate_v4(),
  dealer_id   uuid not null references dealers(id) on delete cascade,
  name        text,
  email       text,
  phone       text,
  position    text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table dealers        enable row level security;
alter table dealer_contacts enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'public_read_dealers') then
    create policy public_read_dealers on dealers for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'public_read_dealer_contacts') then
    create policy public_read_dealer_contacts on dealer_contacts for select using (true);
  end if;
end $$;


-- =====================================================================
-- DONE.
-- =====================================================================
-- Verification queries (optional):
--   select count(*) from brands;       -- expect 15
--   select count(*) from models;       -- expect 60
--   select count(*) from model_trims;  -- expect 180
--   select * from v_data_freshness;    -- expect 2026-05-04


-- ---- Migration: add import columns to dealers ----------------------
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS extra_emails jsonb DEFAULT '[]'::jsonb;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS extra_phones jsonb DEFAULT '[]'::jsonb;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS data_quality text;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS data_source text;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;


-- =====================================================================
-- AJÁNLATKÉRÉS (Quote Requests) — feature added 2026-05
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
  ip_hash             text                                -- optional, anonymized
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

-- No public read policies — only the service role (admin API) reads/writes these.

-- ---- site_settings seed rows for the feature -------------------------
insert into site_settings (key, value) values
  ('resend_api_key',                  ''),
  ('resend_from_email',               'ajanlat@kinaiauto.com'),
  ('resend_from_name',                'kinaiauto.com'),
  ('quote_max_dealers_per_brand',     '3'),
  ('quote_email_subject_template',    'Ajánlatkérés – {brand} {models_count_text}'),
  ('quote_email_body_template',       '')
on conflict (key) do nothing;
