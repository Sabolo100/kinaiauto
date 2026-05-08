# kinaiauto.com

Független magyar nyelvű kínai autó-iránytű — Next.js 15 (App Router) + TypeScript + Supabase, Vercel-ra optimalizálva.

## Stack

- **Next.js 15** App Router, server-rendered minden oldal (SEO + LLM friendly)
- **React 18** + **TypeScript** strict
- **Tailwind CSS 3** + globális design tokenek (`globals.css`)
- **Supabase** Postgres + Storage + RLS (publikus olvasás)
- **Lucide** ikonok (`lucide-react`)
- **Vercel** hosting + edge OG image generation

## Mappastruktúra

```
site/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Top-bar / footer / fonts / global JSON-LD
│   │   ├── page.tsx               # Főoldal
│   │   ├── kinalat/page.tsx       # Kínálat (függőleges vizualizáció)
│   │   ├── osszehasonlitas/page.tsx
│   │   ├── markak/{page,[slug]/page}.tsx
│   │   ├── modellek/{page,[brand]/[model]/page}.tsx
│   │   ├── tudastar/{page,[slug]/page}.tsx
│   │   ├── opengraph-image.tsx    # /opengraph-image — branded 1200x630 PNG
│   │   ├── icon.tsx               # Favicon
│   │   ├── sitemap.ts             # Dinamikus sitemap.xml
│   │   ├── robots.ts              # Dinamikus robots.txt (AI-bot allow-list)
│   │   ├── llms.txt/route.ts      # /llms.txt (LLM SEO konvenció)
│   │   └── llms-full.txt/route.ts # /llms-full.txt — teljes tartalmi dump
│   ├── components/                # UI komponensek (page-specifikus + shared)
│   ├── lib/                       # Adat-, env-, format- és SEO-helperek
│   └── data/seed.ts               # Lokális seed (fallback ha nincs Supabase)
├── public/assets/tiggo8-green.avif
├── supabase/schema.sql            # Teljes adatbázis-séma + seed (copy-paste)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                    # Header / redirect szabályok
├── .env.local.example
└── package.json
```

## Bejárás (helyi fejlesztés)

```bash
npm install
cp .env.local.example .env.local
# töltsd ki a NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY mezőket
npm run dev
```

A `.env.local` nélkül is elindul a site — ekkor a `src/data/seed.ts`-ben tárolt
seed dataset szolgálja ki a tartalmat (60 modell, 15 márka). Ez ugyanaz az
adatkészlet, ami a `supabase/schema.sql`-be is bekerül.

## Supabase felállítás

1. Hozz létre egy új Supabase projektet (régió: EU central / Frankfurt javasolt).
2. Másold be a `supabase/schema.sql` teljes tartalmát a Supabase **SQL Editor**ba és futtasd. Ez létrehozza:
   - tábláikat (`brands`, `models`, `model_trims`, `model_photos`,
     `categories`, `drives`, `price_bands`, `articles`, …)
   - indexeket
   - RLS policy-kat (publikus olvasás, írás csak service role)
   - Storage bucketeket (`car-photos`, `brand-logos`, `og-images`)
   - seed adatokat (15 márka, 60 modell, 180 trim, 8 cikk-vázat, site-settings)
   - convenience view-kat (`v_models`, `v_brand_summary`, `v_data_freshness`)
3. **Settings → API** menüben másold ki a *Project URL*-t és az *anon public* kulcsot.
4. Töltsd ki `.env.local`-ben:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SITE_URL=https://www.kinaiauto.com
   ```
5. (Opció) tölts fel egy Tiggo 8 fotót a Storage `car-photos` bucketbe
   `models/tiggo-8/hero.avif` útvonalra. A seedben a `model_photos` rekord már
   regisztrálva van — automatikusan megjelenik.

## Mezőnév-egyezőség

Minden frontend komponens **pontosan a Supabase oszlopneveket olvassa**
(`v_models` view-on keresztül). Cseréld a `seed.ts`-t Supabase queryre, és a
UI változtatás nélkül megy.

A leggyakoribb mezők (id-k snake_case-ben):

| ModelRow mező           | Forrás (SQL view)        |
|-------------------------|--------------------------|
| `id`                    | `models.id`              |
| `slug`                  | `models.slug`            |
| `name`                  | `models.name`            |
| `is_deal`               | `models.is_deal`         |
| `is_featured`           | `models.is_featured`     |
| `price_min_m_ft`        | `models.price_min_m_ft`  |
| `price_max_m_ft`        | `models.price_max_m_ft`  |
| `length_mm`             | `models.length_mm`       |
| `trunk_l`               | `models.trunk_l`         |
| `seats`                 | `models.seats`           |
| `power_hp`              | `models.power_hp`        |
| `battery_kwh`           | `models.battery_kwh`     |
| `range_km`              | `models.range_km`        |
| `brand_id/slug/name`    | `brands.id/slug/name`    |
| `category` / `drive`    | `categories.label_hu` / `drives.label_hu` |
| `primary_photo_path`    | LATERAL subquery a `model_photos`-ban |

## Vercel deploy

1. `gh repo create kinaiauto --public --source=site && git push` (vagy a
   Vercel dashboardon import-old a repót).
2. **Project Settings → Environment Variables**: állítsd be a 3 env változót
   (URL, anon key, site URL — Production / Preview / Development).
3. Domain: `www.kinaiauto.com` és apex `kinaiauto.com → www`.
4. Build settings: alapértelmezés (`next build`).

A `vercel.json` tartalmaz:
- Régi `*.html` → új útvonal 301 redirect-eket
- text/plain headert a `/llms.txt`-re
- biztonsági headereket

## SEO

- **Server-rendered** minden oldal — Google + LLM crawlers előbb látják a tartalmat
- **Metadata** per page (title, description, canonical, OG, Twitter)
- **JSON-LD**:
  - `Organization` + `WebSite` (gyökér layoutban)
  - `BreadcrumbList` minden subpage-en
  - `Vehicle` minden modell oldalon (Schema.org Vehicle)
  - `FAQPage` a Tudástár főoldalon
  - `Article` a cikk-oldalakon
- **`/sitemap.xml`** dinamikus, minden modell + márka + cikk benne
- **`/robots.txt`** allow-list AI crawlereknek (GPTBot, ClaudeBot, PerplexityBot…)
- **`/llms.txt`** + **`/llms-full.txt`** — strukturált LLM-ground content
- **OG image** edge-rendered, branded 1200×630 PNG (`/opengraph-image`)
- **`hreflang=hu-HU`** minden oldalon
- **Image optimization** Next/Image, AVIF + WebP

## Mobil-optimalizáció

- Hamburger menü 920px alatt — full-screen drawer
- Hero, finder, viz, gallery, sources, trim és specs grid mind reszponzív
- Sticky compare bar mobilon vízszintes ugrás helyett alulra rögzül
- Hős fotó középre hajtva, hero-tagek elrejtve
- Kínálat oldalon a jobb oldali részlet-kártya 1180px alatt elrejt, csak a hover-tooltip jelenik meg
- A főoldali hero gridben a kép a szöveg alá rendeződik
- Tudástár TOC mobilon vízszintes pirula-sorba rendezve
- Min 16px érintési target minden interaktív elemen

## Skálázás később

- **Admin CMS:** külön Next route + service role kliens, eredeti spec szerint nem most.
- **Real photos:** csak a `model_photos` táblába kell INSERT-elni storage path-okat.
- **Új modell:** INSERT a `models`-be, a `v_models` view automatikusan tartalmazza.
- **Új márka:** INSERT a `brands`-be — a `[slug]/page.tsx` route automatikusan generálódik.
- **Új cikk:** INSERT az `articles`-be — a `body_blocks` JSONB struktúrát ki kell tölteni; a renderer most placeholder, később bővítés.

## Licenc

Belső projekt. Minden adat / kép tájékoztató jellegű.
