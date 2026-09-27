// Text builders for /llms.txt and /llms-full.txt (https://llmstxt.org).
// Everything is generated from the database, so counts, prices and models
// never drift from the site. Absolute markdown links only.

import type { Brand, ModelRow } from "./types";
import { SITE_URL } from "./env";
import { fmtPrice, catLabel } from "./format";
import { absUrl, CONTACT_EMAIL, modelFactLine, modelFullName, modelPath, ORG_DISAMBIGUATION } from "./seo";
import { TUDASTAR_CHAPTERS } from "@/components/tudastar/content";

const m1 = (v: number) => v.toFixed(1).replace(".", ",");

function priceSpan(models: ModelRow[]): string | null {
  const p = models.flatMap((m) => [m.price_min_m_ft, m.price_max_m_ft]).filter((v): v is number => v != null);
  if (!p.length) return null;
  const lo = Math.min(...p), hi = Math.max(...p);
  return lo === hi ? `${m1(lo)} millió Ft` : `${m1(lo)}–${m1(hi)} millió Ft`;
}

function brandLine(b: Brand, models: ModelRow[]): string {
  const own = models.filter((m) => m.brand_slug === b.slug);
  const drives = [...new Set(own.map((m) => m.drive.toLowerCase()))].join(", ");
  const bits = [`${own.length} modell`];
  const span = priceSpan(own);
  if (span) bits.push(span);
  if (drives) bits.push(drives);
  if (b.importer_name) bits.push(`importőr: ${b.importer_name}`);
  const tag = b.tagline ? ` ${b.tagline.replace(/\.?$/, ".")}` : "";
  return `- [${b.name}](${absUrl(`/markak/${b.slug}`)}): ${bits.join("; ").replace(/\.$/, "")}.${tag}`;
}

function intro(models: ModelRow[], brandCount: number, lastUpdated: string): string[] {
  const span = priceSpan(models);
  return [
    "# kinaiauto.com",
    "",
    `> Független, magyar nyelvű tájékoztató oldal a Magyarországon hivatalosan kapható kínai autókról: ${models.length} modell ${brandCount} márkától, listaárakkal, műszaki adatokkal, összehasonlítással és márkakereskedőkkel.`,
    "",
    `A kinaiauto.com (írásmódok: kínaiautó.com, kinaiauto) Magyarország piacára szóló, magyar nyelvű autós iránytű. Vásárlói szemmel rendezi a kínálatot: kategória (városi kisautótól a nagy SUV-ig, szedán, kombi, egyterű, pickup), ársáv${span ? ` (${span})` : ""} és hajtás (benzin, öntöltő hibrid, plug-in hibrid, elektromos) szerint. Az árak és adatok a hivatalos importőri forrásokból származnak, tájékoztató jellegűek; utolsó adatfrissítés: ${lastUpdated}.`,
    "",
    `${ORG_DISAMBIGUATION} Az ajánlatkérési funkcióval a látogató egyszerre több márkakereskedőtől kérhet ajánlatot. Hivatalos webcím: ${SITE_URL}`,
    "",
  ];
}

const byBrandThenName = (a: ModelRow, b: ModelRow) =>
  a.brand_name.localeCompare(b.brand_name, "hu") || a.name.localeCompare(b.name, "hu");

export function buildLlmsTxt(brands: Brand[], allModels: ModelRow[], lastUpdated: string): string {
  const models = [...allModels].sort(byBrandThenName);
  const L: string[] = intro(models, brands.length, lastUpdated);

  L.push("## Főbb oldalak", "");
  L.push(`- [Modellkereső (főoldal)](${SITE_URL}/): a teljes kínálat kategória, ársáv, hajtás és márka szerint szűrve, modellkártyákkal`);
  L.push(`- [Kínálat](${SITE_URL}/kinalat): a modellek egy skálán ár, hatótáv, hossz, csomagtartó, akkumulátor vagy teljesítmény szerint`);
  L.push(`- [Összehasonlítás](${SITE_URL}/osszehasonlitas): legfeljebb 4 modell egymás mellett, soronként kiemelt legjobb értékkel`);
  L.push(`- [Tudástár](${SITE_URL}/tudastar): vásárlói útmutató — hajtástípusok, valós hatótáv, töltés, adózás, lízing`);
  L.push("");

  L.push("## Márkák", "");
  for (const b of brands) L.push(brandLine(b, models));
  L.push("");

  L.push("## Modellek", "");
  for (const m of models) L.push(`- [${modelFullName(m)}](${absUrl(modelPath(m))}): ${modelFactLine(m).replace(/^[^:]+:\s*/, "")}`);
  L.push("");

  L.push("## Tudástár fejezetek", "");
  for (const c of TUDASTAR_CHAPTERS) L.push(`- [${c.title}](${SITE_URL}/tudastar#${c.id}): ${c.summary}`);
  L.push("");

  L.push("## Kapcsolat", "");
  L.push(`- E-mail: ${CONTACT_EMAIL}`);
  L.push("");

  L.push("## Optional", "");
  L.push(`- [Teljes tartalom — minden modell részletes adatlapja szövegként](${SITE_URL}/llms-full.txt)`);
  L.push(`- [Oldaltérkép](${SITE_URL}/sitemap.xml)`);
  L.push("");
  return L.join("\n");
}

export function buildLlmsFullTxt(
  brands: Brand[],
  allModels: ModelRow[],
  cats: { label_hu: string }[],
  drives: { label_hu: string; short_code: string }[],
  lastUpdated: string,
): string {
  const models = [...allModels].sort(byBrandThenName);
  const L: string[] = intro(models, brands.length, lastUpdated);
  L[0] = "# kinaiauto.com — teljes tartalom";

  L.push("## Kategóriák", "");
  for (const c of cats) L.push(`- ${c.label_hu}`);
  L.push("", "## Hajtásmódok", "");
  for (const d of drives) L.push(`- ${d.label_hu} (${d.short_code})`);
  L.push("");

  L.push("## Márkák", "");
  for (const b of brands) {
    const own = models.filter((m) => m.brand_slug === b.slug);
    L.push(`### ${b.name}`);
    L.push(`URL: ${absUrl(`/markak/${b.slug}`)}`);
    L.push(`Modellek Magyarországon: ${own.length}${priceSpan(own) ? `, listaár ${priceSpan(own)}` : ""}`);
    if (b.tagline) L.push(`Szlogen: ${b.tagline}`);
    if (b.founded) L.push(`Alapítva: ${b.founded}`);
    if (b.hq) L.push(`Székhely: ${b.hq}`);
    if (b.parent_company) L.push(`Anyavállalat: ${b.parent_company}`);
    if (b.importer_name) L.push(`Magyar importőr: ${b.importer_name}`);
    if (b.importer_addr) L.push(`Importőr címe: ${b.importer_addr}`);
    if (b.importer_site) L.push(`Hivatalos magyar oldal: https://${b.importer_site}`);
    if (b.dealers_text) L.push(`Kereskedői hálózat: ${b.dealers_text}`);
    if (b.factories) L.push(`Gyárak: ${b.factories}`);
    if (b.description) L.push(`Leírás: ${b.description}`);
    L.push("");
  }

  L.push("## Modellek", "");
  for (const m of models) {
    L.push(`### ${modelFullName(m)}${modelFullName(m) === m.name ? ` (${m.brand_name})` : ""}`);
    L.push(`URL: ${absUrl(modelPath(m))}`);
    L.push(`Összefoglaló: ${modelFactLine(m)}`);
    L.push(`Kategória: ${catLabel(m.category, m.segment)}`);
    L.push(`Hajtás: ${m.drive}`);
    L.push(`Listaár: ${fmtPrice(m.price_min_m_ft)} — ${fmtPrice(m.price_max_m_ft)}${m.is_deal ? " (akciós)" : ""}`);
    const dims = [m.length_mm && `hossz ${m.length_mm}`, m.width_mm && `szélesség ${m.width_mm}`, m.height_mm && `magasság ${m.height_mm}`, m.wheelbase_mm && `tengelytáv ${m.wheelbase_mm}`].filter(Boolean);
    if (dims.length) L.push(`Méretek (mm): ${dims.join(", ")}`);
    if (m.trunk_l != null) L.push(`Csomagtartó: ${m.trunk_l} l`);
    if (m.seats != null) L.push(`Ülőhelyek: ${m.seats}`);
    if (m.power_hp) L.push(`Teljesítmény: ${m.power_hp} LE`);
    if (m.acceleration_s) L.push(`Gyorsulás 0–100 km/h: ${String(m.acceleration_s).replace(".", ",")} s`);
    if (m.battery_kwh) L.push(`Akkumulátor: ${m.battery_kwh} kWh`);
    if (m.range_km) L.push(`Hatótáv (WLTP): ${m.range_km} km`);
    if (m.consumption_text) L.push(`Fogyasztás: ${m.consumption_text}`);
    const charge = [m.charging_ac_kw && `AC ${m.charging_ac_kw} kW`, m.charging_dc_kw && `DC ${m.charging_dc_kw} kW`].filter(Boolean);
    if (charge.length || m.charging_text) L.push(`Töltés: ${[...charge, m.charging_text].filter(Boolean).join(", ")}`);
    const warr = [
      m.warranty_years && `${m.warranty_years} év${m.warranty_km ? ` / ${m.warranty_km.toLocaleString("hu-HU")} km` : ""} gyári garancia`,
      m.battery_warranty_years && `${m.battery_warranty_years} év${m.battery_warranty_km ? ` / ${m.battery_warranty_km.toLocaleString("hu-HU")} km` : ""} akkumulátor-garancia`,
    ].filter(Boolean);
    if (warr.length) L.push(`Garancia: ${warr.join(", ")}`);
    if (m.engine_options.length >= 2) {
      L.push("Változatok:");
      for (const o of m.engine_options) {
        const v = [
          o.power_hp && `${o.power_hp} LE`,
          o.battery_kwh && `${o.battery_kwh} kWh`,
          o.range_km && `${o.range_km} km WLTP`,
          o.trunk_l && `${o.trunk_l} l csomagtartó`,
          o.seats && `${o.seats} ülés`,
          o.acceleration_s && `0–100: ${String(o.acceleration_s).replace(".", ",")} s`,
        ].filter(Boolean);
        L.push(`- ${o.name || "Alap"}${v.length ? `: ${v.join(", ")}` : ""}`);
      }
    }
    if (m.brand_importer_name) L.push(`Importőr: ${m.brand_importer_name}`);
    if (m.source_url) L.push(`Hivatalos modelloldal: ${m.source_url}`);
    if (m.data_updated_at) L.push(`Adatok frissítve: ${m.data_updated_at.slice(0, 10)}`);
    L.push("");
  }

  L.push("## Tudástár — kivonat", "");
  for (const c of TUDASTAR_CHAPTERS) L.push(`- [${c.title}](${SITE_URL}/tudastar#${c.id}): ${c.summary}`);
  L.push("");
  L.push("**Hajtástípusok:** benzin (egyszerű, kiszámítható, magasabb városi fogyasztás); öntöltő hibrid (városban kisebb fogyasztás, nem kell külső töltés); plug-in hibrid (napi 30–80 km elektromosan, hosszú úton sincs hatótávgond, 2025-től cégautóadó-köteles); elektromos (otthoni töltéssel a legolcsóbb üzemeltetés, mentes a cégautóadó és a gépjárműadó alól).");
  L.push("");
  L.push("**Hatótáv télen:** az ADAC szerint fagypont körül kb. 15–25%-kal kevesebb; a Recurrent szerint 0 °C-on a maximális hatótáv kb. 78%-a, –7 °C-on kb. 70%-a.");
  L.push("");
  L.push("**Töltési szintek:** AC legfeljebb 22 kW (otthon, munkahely), DC 50–100 kW (főutak), 100 kW felett (autópálya-pihenők).");
  L.push("");
  L.push("**Adózás:** az elektromos (5E) és nulla emissziós (5Z) autók mentesek a cégautóadó, a vagyonszerzési illeték és a gépjárműadó alól. A plug-in hibrid 2025-től főszabály szerint cégautóadó-köteles.");
  L.push("");
  L.push("**Lízing:** a Széchenyi Lízing MAX+ tisztán elektromos autóra fix 3%/év kamattal, legfeljebb bruttó 25 millió Ft vételárig, vállalkozásonként legfeljebb 10 autóra.");
  L.push("");
  L.push(`Kapcsolat: ${CONTACT_EMAIL}`);
  L.push("");
  return L.join("\n");
}
