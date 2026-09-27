// Quotable answer blocks and FAQs generated from the data.
// One source for the visible text AND the FAQPage JSON-LD, so the marked-up
// questions are always the ones on the page.

import type { Brand, Dealer, ModelRow } from "./types";
import { modelFullName } from "./seo";

export type FaqItem = { question: string; answer: string };

const m1 = (v: number) => v.toFixed(1).replace(".", ",");
const num = (v: number) => v.toLocaleString("hu-HU");

/** Hungarian definite article: "A BYD", "Az Omoda 5", "Az MG3", "Az XPENG". */
export function hunArticle(name: string): "A" | "Az" {
  const first = name.trim();
  if (/^[aáeéiíoóöőuúüű]/i.test(first)) return "Az";
  if (/^X/.test(first)) return "Az"; // "iksz…"
  // Short letter-name acronyms spoken with a vowel first: MG (em-gé), MG3 …
  const token = first.split(/\s+/)[0];
  const letters = token.replace(/[^A-Za-z]/g, "");
  if (/^[FLMNRS]/.test(token) && letters.length <= 2 && letters === letters.toUpperCase()) return "Az";
  return "A";
}
const art = (name: string) => hunArticle(name);
const artLc = (name: string) => hunArticle(name).toLowerCase();

/** "Középméretű SUV" → "középméretű SUV" (acronyms stay). */
function lcWords(s: string): string {
  return s
    .split(" ")
    .map((w) => (w.length > 1 && w[1] === w[1].toLowerCase() ? w[0].toLowerCase() + w.slice(1) : w))
    .join(" ");
}

function span(lo: number | null | undefined, hi: number | null | undefined, fmt: (v: number) => string): string | null {
  if (lo == null && hi == null) return null;
  const a = lo ?? hi!;
  const b = hi ?? lo!;
  return a === b ? fmt(a) : `${fmt(Math.min(a, b))}–${fmt(Math.max(a, b))}`;
}

const priceSpan = (m: ModelRow) => span(m.price_min_m_ft, m.price_max_m_ft, m1);
const rangeSpan = (m: ModelRow) => span(m.range_km, m.range_km_max, num);
const powerSpan = (m: ModelRow) => span(m.power_hp, m.power_hp_max, num);
const trunkSpan = (m: ModelRow) => span(m.trunk_l, m.trunk_l_max, num);
const seatsSpan = (m: ModelRow) => span(m.seats, m.seats_max, String);

const isEV = (m: ModelRow) => m.drive_code === "BEV" || /^elektromos$/i.test(m.drive);
const isPHEV = (m: ModelRow) => m.drive_code === "PHEV" || /^plug-in/i.test(m.drive);

function cityList(dealers: Dealer[], max = 4): string | null {
  const cities = [...new Set(dealers.map((d) => d.city).filter(Boolean))];
  if (!cities.length) return null;
  return cities.length > max ? `${cities.slice(0, max).join(", ")} és további városok` : cities.join(", ");
}

function warrantyText(m: ModelRow): string | null {
  if (!m.warranty_years) return null;
  let t = `${m.warranty_years} év${m.warranty_km ? ` vagy ${num(m.warranty_km)} km` : ""}`;
  if (m.battery_warranty_years) {
    t += `, az akkumulátorra ${m.battery_warranty_years} év${m.battery_warranty_km ? ` vagy ${num(m.battery_warranty_km)} km` : ""}`;
  }
  return t;
}

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Close a sentence without doubling an abbreviation's period ("Kft." stays "Kft."). */
const dot = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

// ─── Home ────────────────────────────────────────────────────────────────────

export function homeAnswer(models: ModelRow[], brandCount: number): string {
  const prices = models.flatMap((m) => [m.price_min_m_ft, m.price_max_m_ft]).filter((v): v is number => v != null);
  const ps = prices.length ? `, ${m1(Math.min(...prices))}–${m1(Math.max(...prices))} millió Ft listaáron` : "";
  return (
    `A kinaiauto.com független, magyar nyelvű iránytű a Magyarországon hivatalosan kapható kínai autókhoz: ` +
    `${models.length} modell ${brandCount} márkától${ps}. ` +
    `Kategória, ársáv és hajtás szerint szűrhetsz, egymás mellé teheted a modelleket, és egy kattintással több márkakereskedőtől kérhetsz ajánlatot. ` +
    `Nem vagyunk kereskedés és nem importőr: az adatokat a hivatalos importőri forrásokból gyűjtjük.`
  );
}

// ─── Model ───────────────────────────────────────────────────────────────────

export function modelAnswer(m: ModelRow, dealerCount: number): string {
  const name = modelFullName(m);
  const out: string[] = [];

  let s1 = `${art(name)} ${name} ${lcWords(m.category)}, ${lcWords(m.drive)} hajtással`;
  const p = priceSpan(m);
  if (p) s1 += `; Magyarországon ${p} millió Ft ${m.is_deal ? "akciós " : ""}listaáron kapható`;
  out.push(`${s1}.`);

  const bits: string[] = [];
  const r = rangeSpan(m);
  if (r && (isEV(m) || isPHEV(m))) bits.push(`${isEV(m) ? "WLTP hatótávja" : "gyári WLTP hatótávja"} ${r} km`);
  const hp = powerSpan(m);
  if (hp) bits.push(`teljesítménye ${hp} LE`);
  const seats = seatsSpan(m);
  if (seats) bits.push(`${seats} üléses`);
  const tr = trunkSpan(m);
  if (tr) bits.push(`csomagtartója ${tr} literes`);
  if (bits.length) out.push(`${capFirst(bits.join(", "))}.`);

  const w = warrantyText(m);
  if (w) out.push(`Gyári garancia: ${w}.`);

  if (m.brand_importer_name) {
    const imp = m.brand_importer_name.trim();
    out.push(
      dealerCount > 0
        ? `Magyarországi importőr: ${imp}; az oldalon ${dealerCount} márkakereskedőtől kérhetsz rá ajánlatot.`
        : dot(`Magyarországi importőr: ${imp}`),
    );
  }
  return out.join(" ");
}

export function modelFaq(m: ModelRow, dealers: Dealer[]): FaqItem[] {
  const name = modelFullName(m);
  const a = art(name);
  const al = artLc(name);
  const faq: FaqItem[] = [];

  const p = priceSpan(m);
  if (p) {
    faq.push({
      question: `Mennyibe kerül ${al} ${name} Magyarországon?`,
      answer:
        `${a} ${name} magyarországi listaára ${p} millió Ft` +
        (m.engine_options.length >= 2 ? ", változattól és felszereltségtől függően" : "") +
        `. Az árak tájékoztató jellegűek; az aktuális ajánlatot és kedvezményt a márkakereskedők adják — az oldalon egyszerre több kereskedőtől is kérhetsz ajánlatot.`,
    });
  }

  const r = rangeSpan(m);
  if (r && isEV(m)) {
    faq.push({
      question: `Mekkora ${al} ${name} hatótávja?`,
      answer: `A gyártó által megadott WLTP hatótáv ${r} km. A valós hatótáv ennél jellemzően kevesebb: fagypont körül az ADAC mérései szerint 15–25%-kal, és tartós autópályás tempónál is csökken.`,
    });
  } else if (r && isPHEV(m)) {
    faq.push({
      question: `Mekkora ${al} ${name} hatótávja?`,
      answer: `A gyártó által megadott WLTP hatótáv ${r} km. Plug-in hibridnél a hivatalos adatlap külön adja meg a tisztán elektromos és a benzinmotorral együtt értett hatótávot — vásárlás előtt érdemes mindkettőt megnézni.`,
    });
  }

  if (m.engine_options.length >= 2) {
    const list = m.engine_options
      .map((o) => {
        const v = [o.power_hp && `${o.power_hp} LE`, o.battery_kwh && `${o.battery_kwh} kWh`, o.range_km && `${num(o.range_km)} km`]
          .filter(Boolean)
          .join(", ");
        return `${o.name || "Alap"}${v ? ` (${v})` : ""}`;
      })
      .join("; ");
    faq.push({
      question: `Milyen változatokban kapható ${al} ${name}?`,
      answer: `${m.engine_options.length} változatban: ${list}.`,
    });
  }

  const tr = trunkSpan(m);
  const seats = seatsSpan(m);
  if (tr || seats) {
    const parts = [tr && `csomagtartója ${tr} literes`, seats && `${seats} üléses`, m.length_mm && `hossza ${num(m.length_mm)} mm`].filter(Boolean);
    faq.push({
      question: `Mekkora ${al} ${name} csomagtartója, és hány ülése van?`,
      answer: `${capFirst(parts.join(", "))}.`,
    });
  }

  const w = warrantyText(m);
  if (w) {
    faq.push({
      question: `Mennyi ${al} ${name} garanciája?`,
      answer: `A gyári garancia ${w}. A pontos feltételeket (kilométer-korlát, szervizelési előírások) a márkakereskedő adja meg.`,
    });
  }

  if (m.brand_importer_name || dealers.length) {
    const imp = m.brand_importer_name ? dot(`A hivatalos magyarországi importőr: ${m.brand_importer_name}`) : "";
    const cities = cityList(dealers);
    const dl = dealers.length
      ? ` Az oldalon ${dealers.length} ${m.brand_name} márkakereskedő szerepel${cities ? ` (${cities})` : ""}, és egyszerre többtől kérhetsz ajánlatot.`
      : "";
    faq.push({
      question: `Hol kapható ${al} ${name} Magyarországon?`,
      answer: `${imp}${dl}`.trim(),
    });
  }
  return faq;
}

// ─── Brand ───────────────────────────────────────────────────────────────────

export function brandAnswer(b: Brand, models: ModelRow[], dealers: Dealer[]): string {
  const out: string[] = [];
  const prices = models.flatMap((m) => [m.price_min_m_ft, m.price_max_m_ft]).filter((v): v is number => v != null);
  let s1 = `${art(b.name)} ${b.name} Magyarországon ${models.length} modellel van jelen`;
  if (prices.length) {
    const lo = Math.min(...prices), hi = Math.max(...prices);
    s1 += `, ${lo === hi ? m1(lo) : `${m1(lo)}–${m1(hi)}`} millió Ft listaáron`;
  }
  const drives = [...new Set(models.map((m) => lcWords(m.drive)))];
  if (drives.length) s1 += `, ${drives.join(", ")} hajtással`;
  out.push(`${s1}.`);
  if (b.importer_name) {
    out.push(dot(`Hivatalos importőr: ${b.importer_name.trim()}`) + (b.importer_site ? ` Honlap: ${b.importer_site}.` : ""));
  }
  if (dealers.length) {
    const cities = cityList(dealers);
    out.push(`Az oldalon ${dealers.length} márkakereskedő szerepel${cities ? `: ${cities}` : ""}.`);
  }
  const facts = [b.founded && `alapítás éve: ${b.founded}`, b.hq && `székhely: ${b.hq}`].filter(Boolean);
  if (facts.length) out.push(`${capFirst(facts.join("; "))}.`);
  return out.join(" ");
}

export function brandFaq(b: Brand, models: ModelRow[], dealers: Dealer[]): FaqItem[] {
  const faq: FaqItem[] = [];
  const al = artLc(b.name);
  const priced = models.filter((m) => m.price_min_m_ft != null).sort((x, y) => x.price_min_m_ft! - y.price_min_m_ft!);

  if (models.length) {
    const list = priced.length
      ? priced.map((m) => `${modelFullName(m)} (${m1(m.price_min_m_ft!)} M Ft-tól)`).join(", ")
      : models.map((m) => modelFullName(m)).join(", ");
    faq.push({
      question: `Milyen ${b.name} modellek kaphatók Magyarországon?`,
      answer: `${models.length} modell: ${list}.`,
    });
  }

  if (priced.length >= 2) {
    const cheap = priced[0];
    const dear = [...models].filter((m) => m.price_max_m_ft != null).sort((x, y) => y.price_max_m_ft! - x.price_max_m_ft!)[0];
    faq.push({
      question: `Mennyibe kerül a legolcsóbb ${b.name}?`,
      answer: `A legolcsóbb ${modelFullName(cheap)} listaára ${m1(cheap.price_min_m_ft!)} millió Ft-tól indul; a legdrágább ${modelFullName(dear)} legfeljebb ${m1(dear.price_max_m_ft!)} millió Ft. Az árak tájékoztató jellegűek.`,
    });
  }

  const byDrive = new Map<string, number>();
  for (const m of models) byDrive.set(lcWords(m.drive), (byDrive.get(lcWords(m.drive)) ?? 0) + 1);
  if (byDrive.size) {
    faq.push({
      question: `Milyen hajtással kaphatók ${al} ${b.name} autók?`,
      answer: `${capFirst([...byDrive].map(([d, n]) => `${d} (${n} modell)`).join(", "))}.`,
    });
  }

  if (b.importer_name) {
    faq.push({
      question: `Ki ${al} ${b.name} magyarországi importőre?`,
      answer: `${dot(b.importer_name)}${b.importer_site ? ` Hivatalos magyar oldal: ${b.importer_site}.` : ""}${b.dealers_text ? ` ${dot(b.dealers_text)}` : ""}`,
    });
  }

  if (dealers.length) {
    faq.push({
      question: `Hol vannak ${b.name} márkakereskedések?`,
      answer: `Az oldalon ${dealers.length} ${b.name} márkakereskedő szerepel: ${cityList(dealers, 12)}. A kereskedők listája és térképe ezen az oldalon található, és egyszerre több kereskedőtől is kérhetsz ajánlatot.`,
    });
  }
  return faq;
}
