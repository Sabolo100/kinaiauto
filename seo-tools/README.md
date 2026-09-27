# seo-tools — újrafuttatható láthatósági audit (bármely domainre)

**Verzió: 2.2 (2026-09-27, kinaiauto.com).** Újdonságok a 2.1-hez képest: `page-audit.py` jelzi a React-streaming miatt a `</main>` után, `<div hidden id="S:n">`-ben ülő tartalmat (Next.js `loading.tsx` / Suspense-fallback a HTML-ben); `jsonld-check.py` jelzi a FAQPage-kérdéseket, amelyek nem látszanak az oldal szövegében; `crawl-audit.sh` www-s végleges hostnál az apex változatot vizsgálja (korábban „www.www.domain” lett belőle).

**Élesítés előtti helyi audit (Next.js):** `NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build && NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next start -p 3100`, majd `DELAY=0 python3 page-audit.py http://localhost:3100 --cache cache --out local` és `python3 jsonld-check.py --sitemap http://localhost:3100 --cache cache`. Így a sitemap, a canonical és a JSON-LD a helyi szerverre mutat, az éles oldalt nem terheli, és push előtt látszik az eredmény. Utána normál build (a helyi `.next` ne maradjon localhost-os).

Csak a Python standard könyvtárát és a `curl`-t használják; macOS rendszer-Pythonnal (3.9) és bash 3.2-vel is futnak. Egyszer töltik le az oldalakat, közös lemezes gyorsítótárba (`--cache DIR` / `CACHE=`), így a négy vizsgálat nem négyszer crawlol, és offline újrafuttatható. Csak GET/HEAD kéréseket küldenek, udvarias szünettel (`DELAY`, alapból 0,3 s).

**Futtasd egy dátumozott munkamappából, ne a repó gyökeréből** (a `cache/` és a CSV-k oda kerülnek; a `cache/` ne kerüljön a repóba):

```bash
mkdir -p docs/seo/audit-$(date +%F) && cd docs/seo/audit-$(date +%F)
T=../../../seo-tools
DATE=$(date +%F) CACHE=cache BRAND=ARworks bash $T/crawl-audit.sh arworks.hu "sslip.io,localhost" arworks.com
python3 $T/jsonld-check.py --sitemap arworks.hu --cache cache \
  --expect '^/(munkaink|en/works)/[^/?]+$=CreativeWork|BreadcrumbList' \
  --expect '^/(tudaster|en/knowledge)/[^/?]+$=Article|Course|BreadcrumbList' \
  --expect '^/(megoldasok|en/solutions)/[^/?]+$=Service|BreadcrumbList'
python3 $T/internal-links.py arworks.hu --cache cache --focus /megoldasok --focus /szektorok \
  --outlink-check '^/munkaink/[^/?]+$=^/(megoldasok|szektorok|szolgaltatasok|technologiak|munkaink\?)'
python3 $T/image-audit.py arworks.hu --cache cache
bash $T/site-checks.sh arworks.hu / /munkaink /munkaink/medtronic /megoldasok /tudaster/webar-a-kampanyokban
```

Friss adatokhoz töröld a `cache/` mappát (vagy `--refresh`).

| Script | Mit ellenőriz |
|---|---|
| `crawl-audit.sh` | domain-változatok teljes átirányítási lánca (301/308 vs 302/307, több lépés), robots.txt teljes tartalma és robotonkénti ítélet, sitemap; oldalanként státusz, canonical, robots meta / X-Robots-Tag, cím (karakterben), leírás, og:*, twitter:card, hreflang-párok kölcsönössége, H1, html lang, JSON-LD-blokkok, **a metaadat a `<body>`-ba került-e** (Next.js streaming), tiltott szövegek (régi domain, staging), **belsős fájlmegosztó-linkek** (Google Drive/Docs — a nyilvános Google Forms kivételével —, Dropbox, OneDrive, SharePoint, WeTransfer; a CMS-szövegbe másolt „Fotók: https://drive…” jellegű linkek, JSON-ban escape-elt alakban is) → `audit-DOMAIN-DATUM-{pages,issues,hreflang}.csv` |
| `page-audit.py` | a fenti oldalankénti motor (a crawl-audit hívja) |
| `robots-check.py` | robots.txt robotonként, a Google szabálya szerint (a leghosszabb illeszkedő szabály nyer — a Python `robotparser` ezt rosszul csinálja) |
| `jsonld-check.py` | JSON-LD érvényesség, típusonként kötelező mezők, beágyazott objektumok, Organization `@id` / `sameAs` / logo, oldalcsoportonként elvárt típusok (`--expect`), látható GYIK FAQPage nélkül, videó VideoObject nélkül |
| `internal-links.py` | tartalmi (menü/lábléc nélküli) bejövő linkek oldalanként, sablonlinkek kiszűrése („editorial”), árva oldalak két fajtája, `--focus`, `--outlink-check` (pl. linkelnek-e a projektoldalak a megoldásoldalakra) |
| `image-audit.py` | alt-állapot szerepkör szerint (dekoratív / linkcímkén belüli / tartalmi), ismétlődő alt, >300 kB fájlok, formátum (Content-Type), cache-fejlécek, első kép lusta betöltése, legnehezebb oldalak |
| `site-checks.sh` + `html-facts.py` | AI- és keresőrobotok hozzáférése user-agenttel (státusz, méret, tartalom), CDN/WAF-fejlécek, llms.txt-család és linkjei, szerveroldali renderelés (H1 + első bekezdés nyers HTML-ben), favicon (a Google favicon-szolgáltatásával), időzítés, tömörítés, cache |
| `seo_common.py` | közös letöltő (gyorsítótár, időkorlát, újrapróbálás, Retry-After), HTML-parser, sitemap-olvasó, URL-normalizálás |

Tanulságok a scriptek fejlesztéséből: lásd a kézikönyv B. fejezetét (pl. a „GYIK” szót ne részszóként keresd — benne van az „egyik”-ben; a React camelCase attribútumai miatt kis-nagybetű-érzéketlen parser kell; a streamelt metaadat időzítésfüggő, egyetlen letöltés nem elég).
