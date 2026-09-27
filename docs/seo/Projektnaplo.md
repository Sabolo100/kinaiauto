# kinaiauto.com — láthatósági projektnapló

A Láthatósági kézikönyv (`../../../Lathatosag-Kezikonyv.md`) alapján. Alapállapot: `baseline-2026-09-27/` (élő oldal, 106 sitemap-URL). Helyi előélesítési audit: `local-2026-09-27/` (production build `NEXT_PUBLIC_SITE_URL=http://localhost:3100`-zal, `next start`).

## 2026-09-27 — alapállapot

| Terület | Lelet |
|---|---|
| Domain | http→https 308 ✅; apex → www **307** (ideiglenes), http-s apex 2 lépés |
| Sitemap | 106 URL; `/markak` és `/modellek` **307-es átirányítás**; 8 „hamarosan” helyőrző cikk; minden `lastmod` = „most” |
| Metaadat | **og:url 105/106 oldalon a főoldal** (gyökér-layout öröklés); og:title/description mindenhol a főoldalé; a jogi oldalak címében kétszer a márkanév; 23 cím és 24 leírás hosszon kívül; „60+ modell, 15 márka” beégetve (valós: 78 / 14) |
| H1 | 80 oldalon 2 H1: a Modellek-layout „Válassz márkát, majd modellt.” + a modell; `/kinalat`: a `loading.tsx` csontváza is H1-et tartalmaz |
| Tartalom a HTML-ben | a 78 modelloldal és a `/kinalat` tartalma a `</main>` után, `<div hidden id="S:0">`-ban (a `loading.tsx` Suspense-fallbackje a `<main>`-ben) |
| JSON-LD | 106/106 oldalon van; Organization `@id` perjel nélkül, `sameAs` üres, logó `/icon.png` (404); WebSite `SearchAction` nem létező `?q=` keresőre; Vehicle nem létező `vehicleLength` mezővel; a Tudástár FAQPage 6 kérdéséből 0 látható az oldalon; helyőrző cikkeken Article |
| Robots | AI-csoportok csak `Allow: /` → az `/api/` nekik nem tiltott; hiányzó robotok (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, Perplexity-User, Bingbot…) |
| Botok | 13 UA mind 200, azonos méret, nincs WAF; metaadat a `<head>`-ben |
| llms.txt | 2 link 307-re mutat; beégetett márkanevek; nincs megkülönböztető bekezdés, `## Optional` |
| Favicon | **`/favicon.ico` 404, nincs `<link rel=icon>`** — a PWA-munkában beállított `metadata.icons` kiütötte a fájlalapú `app/icon.tsx`-et |
| Képek | galéria-alt mindenhol „Külső”/„Belső” (236 ismétlés); nincs 300 kB feletti fájl |
| Impresszum | minden üzemeltetői mező helyőrző |

## 2026-09-27 — elvégzett, nem látható javítások (helyi commit, élesítés jóváhagyásra vár)

- `lib/seo.ts`: központi `pageMeta()` (címszabály: márka vagy 65 karakter felett abszolút cím; mondat-/szóhatáron vágott leírás; canonical = og:url; og + twitter minden oldalon), `modelFullName()` (nincs „MG MG3”), JSON-LD-építők.
- Gyökér-layout: nincs több öröklődő canonical/hreflang/og:url; egyetlen `@graph` (Organization + WebSite, `/#organization`, `/#website`, alternateName, disambiguatingDescription, e-mail, logó 512 px); favicon-készlet (ICO 16/32/48, 48 px PNG) a régi „k.” jellel.
- Oldalak: főoldal (valós számok), Kínálat, Összehasonlítás, Tudástár, márka (adatokból generált leírás, modellfotó mint og:image, Brand + CollectionPage + ItemList), modell (új címminta „… ára és adatai — X M Ft-tól”, fotó og:image, Car + ItemPage, breadcrumb márkán át), jogi oldalak (dupla márka javítva), helyőrző cikkek `noindex, follow` Article nélkül.
- H1: a Modellek-layout és a Kínálat-csontváz címe azonos kinézetű `<p>`; modell-H1-ben a márka vizuálisan rejtve; márka-H1 „X autók Magyarországon”.
- Galéria-alt: „BYD Sealion 7 — külső, fotó 2”.
- robots.txt: kereső/válaszadó és tréning-csoport, minden csoportban `Disallow: /api/`; a CMS útvonala nincs kiírva, helyette `X-Robots-Tag: noindex` fejléc (`/c4m5s6`, `/api`).
- Sitemap: 96 URL (átirányítók és helyőrzők nélkül), valós `lastmod` az adatokból.
- llms.txt / llms-full.txt: `lib/llms.ts`, az adatbázisból; megkülönböztető bekezdés, valós számok, márkánként modellszám/ársáv/importőr, 78 modell ténysorral, Tudástár-fejezetek horgonnyal, `## Optional`; a teljes változatban változatok, méretek, töltés, garancia, hivatalos forrás.
- `next.config`: `htmlLimitedBots: /.*/`, `poweredByHeader: false`.
- `seo-tools/` (2.2): új ellenőrzés a rejtett streamelt blokkra és a nem látható FAQPage-kérdésekre; `crawl-audit.sh` www-s végleges hostnál az apexet nézi (nem „www.www”).

**Helyi utóaudit (production build):** 350 → 96 tétel, és a 96 mind az egynyelvű oldalon indokolt „nincs hreflang”; 0 dupla H1, 0 hosszon kívüli cím/leírás, og:url = canonical 96/96, JSON-LD 96/96, 0 érvénytelen. Nyitott: `sameAs` (profilok), a rejtett blokk a modelloldalakon (jóváhagyási lista 1.), a Tudástár FAQPage (6.).

## 2026-09-27 — jóváhagyott látható tételek (1–8) és élesítés

A tulajdonos mind a 8 tételt és a pusht jóváhagyta. Commit `304f4c0`, Vercel-élesítés ~20 s alatt.

- `lib/answers.ts`: adatból generált válaszblokk és GYIK (főoldal, 78 modell, 14 márka), magyar névelő-szabállyal („az MG3”, „a BYD”); `components/faq-list.tsx`: látható `<details>` GYIK + ugyanabból a FAQPage; `speakable` → `.answer-capsule`.
- A modelloldal `loading.tsx`-e törölve → a teljes adatlap a `<main>`-ben.
- Főoldali bevezető mobilon is látszik.
- Tudástár: látható GYIK-fejezet (a FAQPage 6 kérdése), a helyőrző cikkek 308 → fejezet-horgony, a fejezetszám a listából számolva.
- „Önttöltő” → „Öntöltő”: a kód mindkét írásmódot elfogadja, élesítés után `scripts/data-fixes/2026-09-27-drive-label-typo.mts --apply` (1 sor, második futás: 0) — élesben 0 „Önttöltő”.

**Élő utóaudit (`audit-2026-09-27-live/`, a baseline paramétereivel):**

| Mérőszám | Alapállapot | Élesítés után |
|---|---|---|
| Auditprobléma (crawl) | 350 | 97 (96 indokolt „nincs hreflang” + 1) |
| Sitemap-URL nem 200 | 2 | 0 |
| og:url ≠ canonical | 105 | 0 |
| Dupla H1 | 80 | 0 |
| Cím / leírás hosszon kívül | 23 / 24 | 0 / 0 |
| Rejtett streamelt tartalom a `</main>` után | 80 oldal | 1 (`/kinalat`) |
| JSON-LD-probléma | 106 (sameAs) + SearchAction, /icon.png | csak sameAs (nincs profil) |
| Látható GYIK + FAQPage | 1 oldal (0/6 kérdés látható) | 93 oldal, minden kérdés látható |
| Favicon | 404, nincs link | ICO + 48 px, linkelve |
| llms.txt | 4,4 kB, 2 link 307 | 21,9 kB, minden link 200 |

**Maradék (nem jóváhagyási kör része):** `/kinalat` csontváza (dinamikus oldal, a betöltési visszajelzés miatt maradt); `/osszehasonlitas` és `/tudastar` csak menüből kap linket (tartalmi link egy rokon oldalról javasolt); a márkasáv első logója lusta betöltésű; apex 307 (Vercel-beállítás, tulajdonosi tétel).

## Következő lépések

1. Tulajdonosi tételek (`Tulajdonosi-Teendok.md` B.): impresszum, Vercel 308, GSC/Bing + indexelés kérése, profilok → `sameAs`, AI-alapállapot.
2. 2–4 hét múlva: GSC „Fejlesztések” (FAQ, termék), lekérdezések; havonta az audit újrafuttatása.
