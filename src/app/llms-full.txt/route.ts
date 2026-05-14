// /llms-full.txt — comprehensive plain-text content dump for LLM grounding.
// Includes every model's full spec sheet so AI assistants can answer
// "Mi a BYD Atto 3 hatótávja?" or "Mennyibe kerül egy Chery Tiggo 8?" without
// needing to JS-render pages.

import { getBrands, getModels, getCategories, getDrives } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { fmtPrice, catLabel } from "@/lib/format";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const [brands, models, cats, drives] = await Promise.all([
    getBrands(),
    getModels(),
    getCategories(),
    getDrives(),
  ]);

  const lines: string[] = [];
  lines.push("# kinaiauto.com — full content");
  lines.push("");
  lines.push(
    "Független magyar kínai autó-iránytű. Az oldal célja, hogy egy helyen megmutassa a Magyarországon hivatalosan kapható kínai autókat, vásárlói (nem márka-) gondolkodás szerint.",
  );
  lines.push("");
  lines.push("Locale: hu-HU");
  lines.push(`Source: ${SITE_URL}`);
  lines.push("Last updated: " + new Date().toISOString().slice(0, 10));
  lines.push("");

  lines.push("## Kategóriák");
  for (const c of cats) lines.push(`- ${c.label_hu}`);
  lines.push("");

  lines.push("## Hajtásmódok");
  for (const d of drives) lines.push(`- ${d.label_hu} (${d.short_code})`);
  lines.push("");

  lines.push("## Márkák");
  lines.push("");
  for (const b of brands) {
    lines.push(`### ${b.name}`);
    lines.push(`URL: ${SITE_URL}/markak/${b.slug}`);
    if (b.tagline) lines.push(`Tagline: ${b.tagline}`);
    if (b.founded) lines.push(`Alapítva: ${b.founded}`);
    if (b.hq) lines.push(`Székhely: ${b.hq}`);
    if (b.parent_company) lines.push(`Anyavállalat: ${b.parent_company}`);
    if (b.importer_name) lines.push(`Magyar importőr: ${b.importer_name}`);
    if (b.importer_addr) lines.push(`Cím: ${b.importer_addr}`);
    if (b.importer_site) lines.push(`Honlap: https://${b.importer_site}`);
    if (b.dealers_text) lines.push(`Hálózat: ${b.dealers_text}`);
    if (b.factories) lines.push(`Gyárak: ${b.factories}`);
    if (b.description) lines.push(`Leírás: ${b.description}`);
    lines.push("");
  }

  lines.push("## Modellek");
  lines.push("");
  for (const m of models) {
    lines.push(`### ${m.brand_name} ${m.name}`);
    lines.push(`URL: ${SITE_URL}/modellek/${m.brand_slug}/${m.slug}`);
    lines.push(`Kategória: ${catLabel(m.category, m.segment)}`);
    lines.push(`Hajtás: ${m.drive}`);
    lines.push(`Listaár: ${fmtPrice(m.price_min_m_ft)} — ${fmtPrice(m.price_max_m_ft)}`);
    if (m.is_deal) lines.push(`Akciós: igen`);
    if (m.length_mm) lines.push(`Hossz: ${m.length_mm} mm`);
    if (m.trunk_l != null) lines.push(`Csomagtartó: ${m.trunk_l} l`);
    if (m.seats != null) lines.push(`Ülőhelyek: ${m.seats}`);
    if (m.power_hp) lines.push(`Teljesítmény: ${m.power_hp} LE`);
    if (m.battery_kwh) lines.push(`Akkumulátor: ${m.battery_kwh} kWh`);
    if (m.range_km) lines.push(`Hatótáv (WLTP): ${m.range_km} km`);
    lines.push("");
  }

  lines.push("## Tudástár — kivonat");
  lines.push("");
  lines.push("**Hajtástípusok:**");
  lines.push("- Benzin (ICE): egyszerű, kiszámítható, magasabb városi fogyasztás, cégautóadó-köteles");
  lines.push("- Önttöltő hibrid (HEV): városban kisebb fogyasztás, nem szükséges külső töltés");
  lines.push("- Plug-in hibrid (PHEV): napi 30–80 km elektromosan, hosszú úton sincs hatótávgond, 2025-től cégautóadó-köteles");
  lines.push("- Elektromos (BEV): otthoni töltéssel a legolcsóbb üzemeltetés, mentes a cégautóadó és gépjárműadó alól");
  lines.push("");
  lines.push("**Hatótáv télen:** ADAC szerint fagypont körül kb. 15–25%-kal kevesebb. Recurrent: 0 °C-on a max. hatótáv kb. 78%-a, –7 °C-on kb. 70%-a.");
  lines.push("");
  lines.push("**Töltési szintek:** AC ≤ 22 kW (otthon, munkahely), DC 50–100 kW (főutak), Ultra 100+ kW (autópálya pihenők).");
  lines.push("");
  lines.push("**Adózás:** elektromos (5E) és nulla emissziós (5Z) gépjárművek mentesek a cégautóadó, vagyonszerzési illeték és gépjárműadó alól. Plug-in hibrid 2025-től főszabály szerint cégautóadó-köteles.");
  lines.push("");
  lines.push("**Lízing:** Széchenyi Lízing MAX+ tisztán elektromos autóra fix 3% / év kamat, max. bruttó 25M Ft vételár, vállalkozásonként max. 10 EV.");
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
