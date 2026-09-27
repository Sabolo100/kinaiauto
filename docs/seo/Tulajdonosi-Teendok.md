# kinaiauto.com — tulajdonosi teendők és jóváhagyásra váró tételek

*Utolsó frissítés: 2026-09-27. ✅ kész · ⬜ nyitott · ❓ döntés kell*

## A. A látogató számára is látható változtatások

2026-09-27: mind a 8 tételt jóváhagyta a tulajdonos („1-8 mehet, push is mehet”), elkészült és élesítve (`304f4c0`).

| # | Változtatás | Miért | Ajánlás |
|---|---|---|---|
| 1 | A modelladatlap betöltő-csontvázának (`loading.tsx`) eltávolítása | Ma a 78 modelloldal teljes tartalma a `</main>` után, egy rejtett blokkban van a HTML-ben; a JS-t nem futtató AI-robotok a fő tartalomban csak a szürke csontvázat látják. Helyben ellenőrizve: csontváz nélkül a tartalom a `<main>`-be kerül. Látható hatás: modellváltáskor nem villan fel a szürke váz, a régi oldal marad, amíg az új betölt (előtöltött statikus oldalak, gyors). | ✅ kész |
| 2 | Főoldal: entitásnévvel kezdődő, 40–80 szavas válaszblokk a hero első bekezdésében, mobilon is látható | Az AI bekezdést idéz; ma az első bekezdés nem tartalmazza a márkanevet, mobilon pedig rejtve van. | ✅ kész |
| 3 | Modelladatlap: az adatokból generált válaszblokk a mostani rövid alcím helyén („A BYD Sealion 7 középméretű elektromos SUV, Magyarországon 19,0–22,0 millió Ft listaáron…”) | 78 oldalon idézhető, tényszerű első bekezdés. | ✅ kész |
| 4 | Modelladatlap: 4–6 kérdéses GYIK az adatokból (ár, hatótáv, változatok, garancia, importőr/kereskedők) + FAQPage | A leggyakoribb keresési kérdésekre közvetlen válasz. | ✅ kész |
| 5 | Márkaoldal: válaszblokk + GYIK (hány modell, ársáv, hajtások, importőr, kereskedők) | Ugyanaz, 14 oldalon. | ✅ kész |
| 6 | Tudástár: a 6 GYIK-kérdés láthatóvá tétele („Gyakori kérdések” lenyíló lista) | Ma csak a strukturált adatban szerepelnek, az oldalon nem — a Google szerint a jelölt kérdésnek láthatónak kell lennie. Ha nem kell látható GYIK, a jelölést eltávolítom. | ✅ kész (láthatóvá téve) |
| 7 | Tudástár: a 8 „hamarosan elérhető” cikkoldal kártyái a megfelelő fejezetre mutassanak, a régi címek 301-gyel oda irányítsanak | Vékony helyőrző oldalak. Most már `noindex, follow`, és kikerültek a sitemapből és az llms.txt-ből. | ✅ kész (308 a fejezetekre) |
| 8 | Elírás: „Önttöltő hibrid” → „Öntöltő hibrid” a hajtások táblában | Mindenhol látszik (szűrők, kártyák, adatlap, llms). Éles adatbázis-módosítás, idempotens scripttel. | ✅ kész |

## B. Tulajdonosi teendők (csak te tudod megcsinálni vagy eldönteni)

| # | Teendő | Állapot |
|---|---|---|
| 1 | **Impresszum és adatkezelési tájékoztató**: minden üzemeltetői mező helyőrző („www.kinaiauto.com”) — üzemeltető neve, székhely, nyilvántartási szám, adószám, képviselő, e-mail, tárhelyszolgáltató. Jogi kötelezettség, és az AI-keresők „ki áll mögötte” kérdésére is ez a válasz. | ⬜ |
| 2 | **Vercel → Domains → kinaiauto.com**: a www-re irányítás legyen **308 (permanent)** — most 307, és a http-s apex két lépésben ér célba. | ⬜ |
| 3 | Google Search Console (Domain property, DNS TXT) + sitemap beküldése + Bing Webmaster Tools importja — ha még nincs meg. Az élesítés után: URL-ellenőrzés → főoldal + 2–3 modelloldal → Indexelés kérése. | ❓ megvan? |
| 4 | Hivatalos közösségi profilok URL-jei (Facebook, Instagram, YouTube, LinkedIn) → Organization `sameAs`. Ha nincsenek, érdemes legalább egyet létrehozni. | ⬜ |
| 5 | Tréning-robotok (GPTBot, Google-Extended, CCBot, Bytespider, meta-externalagent…): ma engedélyezve vannak. Maradjon így? A keresési láthatóságot nem befolyásolja. | ❓ |
| 6 | Adatbázis-hiba esetén az oldal csendben a régi mintaadatra vált (200-as válasszal) — a robotok ilyenkor elavult árakat indexelnek. Legyen inkább 503-as hibaoldal? (A 2026-09-14-i átállásnál is javasolt.) | ❓ |
| 7 | Jogi szöveg konzisztenciája: az impresszum szerint az oldal „nem minősül ajánlatközvetítőnek”, közben van ajánlatkérési funkció a kereskedők felé — jogásszal érdemes átnézni. | ❓ |
| 8 | AI-láthatósági alapállapot: az alábbi kérdések kézi lekérdezése ChatGPT-ben, Perplexityben, Google AI-ban, Copilotban (képernyőkép + dátum), majd havonta. | ⬜ |

**AI-alapállapot kérdései (8. pont):**
1. Milyen kínai autók kaphatók Magyarországon?
2. Melyik a legolcsóbb kínai elektromos autó Magyarországon?
3. Mennyibe kerül a BYD Sealion 7 Magyarországon?
4. Melyik kínai SUV-nak a legnagyobb a hatótávja?
5. Kínai plug-in hibrid SUV 15 millió Ft alatt?
6. Ki a BYD / MG / Chery magyar importőre?
7. Hol lehet kínai autókat összehasonlítani magyarul?
8. Megéri kínai autót venni Magyarországon?
9. Mekkora garanciát adnak a kínai autókra Magyarországon?
10. Mi az a kinaiauto.com?

## C. Kész (nem látható, technikai) — 2026-09-27

Lásd `Projektnaplo.md`.
