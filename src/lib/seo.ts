// Central SEO helpers: page metadata (title rule, description clamp,
// canonical = og:url, Open Graph, Twitter) and JSON-LD builders.
//
// Why central: in Next.js the root layout's `openGraph` / `alternates` are
// inherited by every page that does not set its own, and a child `openGraph`
// REPLACES the parent's instead of merging. One helper that always emits the
// full set keeps og:url = canonical on every page.

import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./env";
import type { Brand, ModelRow } from "./types";

// ─── Identity ────────────────────────────────────────────────────────────────

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Title template suffix set in the root layout (`%s — kinaiauto.com`). */
const TITLE_SUFFIX = ` — ${SITE_NAME}`;
const TITLE_MAX = 65;
const DESC_MAX = 158;

/** Public contact address (already published on the legal pages). */
export const CONTACT_EMAIL = "info@kinaiauto.com";

export const ORG_ALT_NAMES = ["kínaiautó.com", "kinaiauto", "Kínai Autó Iránytű"];

export const ORG_DESCRIPTION =
  "A kinaiauto.com független, magyar nyelvű tájékoztató oldal a Magyarországon hivatalosan kapható kínai autókról: modellkereső, összehasonlítás, márkaháttér, kereskedők és vásárlói tudástár.";

export const ORG_DISAMBIGUATION =
  "Információs és összehasonlító weboldal, nem hivatalos márkaoldal, nem autókereskedés és nem importőr; az árakat és adatokat a hivatalos importőri forrásokból gyűjti.";

/** Official profiles of kinaiauto.com (same entity only — never a person). */
const SAME_AS: string[] = [
  // Add the real profile URLs here once they exist (LinkedIn, Facebook, YouTube…).
];

// ─── Metadata ────────────────────────────────────────────────────────────────

/** Absolute URL for a site path ("/" → "https://www.kinaiauto.com/"). */
export function absUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Title rule: the template adds "— kinaiauto.com". If the title already names
 * the brand, or the suffix would push it past 65 characters, use it as an
 * absolute title (no suffix) — no brand duplication, no truncated SERP title.
 */
export function seoTitle(title: string): Metadata["title"] {
  const hasBrand = /kinaiauto|kínaiautó/i.test(title);
  if (hasBrand || [...title].length + [...TITLE_SUFFIX].length > TITLE_MAX) {
    return { absolute: title };
  }
  return title;
}

/** The title as it will actually render (for og:title). */
function renderedTitle(title: string): string {
  const t = seoTitle(title);
  return typeof t === "string" ? `${t}${TITLE_SUFFIX}` : title;
}

/** Cut at a sentence or word boundary around 158 characters, with "…". */
export function clampDescription(text: string, max = DESC_MAX): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if ([...clean].length <= max) return clean;
  const cut = [...clean].slice(0, max).join("");
  const sentence = cut.lastIndexOf(". ");
  if (sentence > max * 0.6) return cut.slice(0, sentence + 1);
  const word = cut.lastIndexOf(" ");
  return `${cut.slice(0, word > 0 ? word : max).replace(/[\s,;:—–-]+$/, "")}…`;
}

export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — független kínai autó iránytű Magyarországon`,
};

type PageMetaInput = {
  title: string;
  description: string;
  /** Site path of the canonical URL, e.g. "/kinalat". */
  path: string;
  /** Absolute or site-relative image URL; defaults to the site OG image. */
  image?: { url: string; alt?: string; width?: number; height?: number } | null;
  type?: "website" | "article";
  /** noindex, follow (thin/utility pages). */
  noindex?: boolean;
  /** noindex, nofollow (private flows: cart, offline). */
  noindexNofollow?: boolean;
};

/** Full metadata for a page: title rule, clamped description, canonical, OG, Twitter. */
export function pageMeta(p: PageMetaInput): Metadata {
  const url = absUrl(p.path);
  const description = clampDescription(p.description);
  const ogTitle = renderedTitle(p.title);
  const image = p.image ?? DEFAULT_OG_IMAGE;
  const images = [{ ...image, alt: image.alt ?? ogTitle }];

  const meta: Metadata = {
    title: seoTitle(p.title),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: p.type ?? "website",
      locale: "hu_HU",
      siteName: SITE_NAME,
      url,
      title: ogTitle,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: images.map((i) => i.url),
    },
  };
  if (p.noindexNofollow) meta.robots = { index: false, follow: false };
  else if (p.noindex) meta.robots = { index: false, follow: true };
  return meta;
}

// ─── JSON-LD ─────────────────────────────────────────────────────────────────

export function organizationNode() {
  const node: Record<string, unknown> = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: ORG_ALT_NAMES,
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icons/icon-512.png`,
      contentUrl: `${SITE_URL}/icons/icon-512.png`,
      width: 512,
      height: 512,
    },
    description: ORG_DESCRIPTION,
    disambiguatingDescription: ORG_DISAMBIGUATION,
    email: CONTACT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      availableLanguage: ["hu"],
      areaServed: "HU",
    },
    areaServed: { "@type": "Country", name: "Magyarország" },
    knowsAbout: [
      "kínai autók",
      "elektromos autók",
      "plug-in hibrid autók",
      "autóvásárlás Magyarországon",
      "autóösszehasonlítás",
    ],
  };
  if (SAME_AS.length) node.sameAs = SAME_AS;
  return node;
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    alternateName: ORG_ALT_NAMES,
    description: ORG_DESCRIPTION,
    inLanguage: "hu-HU",
    publisher: { "@id": ORG_ID },
  };
}

/** Site-wide graph (Organization + WebSite) — rendered once in the root layout. */
export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), websiteNode()],
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.url),
    })),
  };
}

/** WebPage / CollectionPage / ItemPage node tied to the site graph. */
export function webPageSchema(p: {
  type?: "WebPage" | "CollectionPage" | "ItemPage" | "AboutPage";
  path: string;
  name: string;
  description: string;
  mainEntityId?: string;
  about?: object;
  dateModified?: string | null;
}) {
  const url = absUrl(p.path);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": p.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: p.name,
    description: clampDescription(p.description, 300),
    inLanguage: "hu-HU",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
  };
  if (p.mainEntityId) node.mainEntity = { "@id": p.mainEntityId };
  if (p.about) node.about = p.about;
  if (p.dateModified) node.dateModified = p.dateModified.slice(0, 10);
  return node;
}

const FUEL_TYPE: Record<string, string> = {
  Benzin: "Petrol",
  Dízel: "Diesel",
  "Önttöltő hibrid": "Hybrid",
  "Öntöltő hibrid": "Hybrid",
  "Plug-in hibrid": "Plug-in hybrid",
  Elektromos: "Electric",
};

function qv(value: number, unitCode: string, unitText?: string) {
  return { "@type": "QuantitativeValue", value, unitCode, ...(unitText ? { unitText } : {}) };
}

function prop(name: string, value: number | string, unitText?: string) {
  return { "@type": "PropertyValue", name, value, ...(unitText ? { unitText } : {}) };
}

/** "BYD Sealion 7", but "MG3 Hybrid+" / "Omoda 5" when the model name already
 *  starts with the brand (no "MG MG3", "Omoda Omoda 5"). */
export function modelFullName(m: Pick<ModelRow, "brand_name" | "name">): string {
  const b = m.brand_name.toLowerCase();
  return m.name.toLowerCase().startsWith(b) ? m.name : `${m.brand_name} ${m.name}`;
}

export function modelPath(m: Pick<ModelRow, "brand_slug" | "slug">) {
  return `/modellek/${m.brand_slug}/${m.slug}`;
}

/** Lower-case the first letter unless the word is an acronym ("SUV"). */
function lcFirst(s: string): string {
  return s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s;
}

/** Short factual one-liner about a model (used in meta, JSON-LD, llms).
 *  `short` keeps only what fits a meta description. */
export function modelFactLine(m: ModelRow, opts: { short?: boolean } = {}): string {
  const parts: string[] = [];
  const cat = m.category.split(" ").map(lcFirst).join(" ");
  parts.push(`${modelFullName(m)}: ${cat}, ${lcFirst(m.drive)} hajtás`);
  if (m.price_min_m_ft != null) {
    const lo = m.price_min_m_ft.toFixed(1).replace(".", ",");
    const hi = m.price_max_m_ft != null && m.price_max_m_ft !== m.price_min_m_ft
      ? `–${m.price_max_m_ft.toFixed(1).replace(".", ",")}`
      : "";
    parts.push(`magyarországi listaár ${lo}${hi} millió Ft`);
  }
  const range = m.range_km_max ?? m.range_km;
  if (range) parts.push(`WLTP hatótáv ${m.range_km && m.range_km_max && m.range_km !== m.range_km_max ? `${m.range_km}–${m.range_km_max}` : range} km`);
  const hp = m.power_hp_max ?? m.power_hp;
  if (hp) parts.push(`${hp} LE`);
  if (!opts.short) {
    const seats = m.seats_max ?? m.seats;
    if (seats) parts.push(`${seats} ülés`);
    if (m.trunk_l) parts.push(`${m.trunk_l} literes csomagtartó`);
  }
  return `${parts.join(", ")}.`;
}

/** Car (schema.org Vehicle subtype) for a model page. */
export function carSchema(m: ModelRow, opts: { image?: string | null } = {}) {
  const url = absUrl(modelPath(m));
  const additional: object[] = [];
  if (m.length_mm) additional.push(prop("Hossz", m.length_mm, "mm"));
  if (m.battery_kwh) additional.push(prop("Akkumulátor-kapacitás", m.battery_kwh, "kWh"));
  if (m.range_km) additional.push(prop("WLTP hatótáv", m.range_km, "km"));
  if (m.charging_dc_kw) additional.push(prop("DC töltési teljesítmény", m.charging_dc_kw, "kW"));
  if (m.charging_ac_kw) additional.push(prop("AC töltési teljesítmény", m.charging_ac_kw, "kW"));
  if (m.consumption_text) additional.push(prop("Fogyasztás", m.consumption_text));
  if (m.battery_warranty_years) additional.push(prop("Akkumulátor-garancia", m.battery_warranty_years, "év"));

  const offers =
    m.price_min_m_ft != null
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "HUF",
          lowPrice: Math.round(m.price_min_m_ft * 1_000_000),
          highPrice: Math.round((m.price_max_m_ft ?? m.price_min_m_ft) * 1_000_000),
          availability: m.is_available ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
          itemCondition: "https://schema.org/NewCondition",
          areaServed: { "@type": "Country", name: "Magyarország" },
          url,
          ...(m.warranty_years
            ? {
                warranty: {
                  "@type": "WarrantyPromise",
                  durationOfWarranty: qv(m.warranty_years, "ANN", "év"),
                },
              }
            : {}),
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Car",
    "@id": `${url}#car`,
    name: modelFullName(m),
    url,
    description: modelFactLine(m),
    ...(opts.image ? { image: [opts.image] } : {}),
    brand: { "@type": "Brand", name: m.brand_name, url: absUrl(`/markak/${m.brand_slug}`) },
    model: m.name,
    bodyType: m.category,
    fuelType: FUEL_TYPE[m.drive] ?? m.drive,
    ...(m.seats ? { seatingCapacity: m.seats } : {}),
    ...(m.power_hp
      ? { vehicleEngine: { "@type": "EngineSpecification", enginePower: qv(m.power_hp, "BHP", "LE") } }
      : {}),
    ...(m.acceleration_s ? { accelerationTime: qv(m.acceleration_s, "SEC", "s (0–100 km/h)") } : {}),
    ...(m.trunk_l != null ? { cargoVolume: qv(m.trunk_l, "LTR", "l") } : {}),
    ...(m.width_mm ? { width: qv(m.width_mm, "MMT", "mm") } : {}),
    ...(m.height_mm ? { height: qv(m.height_mm, "MMT", "mm") } : {}),
    ...(m.wheelbase_mm ? { wheelbase: qv(m.wheelbase_mm, "MMT", "mm") } : {}),
    ...(additional.length ? { additionalProperty: additional } : {}),
    ...(offers ? { offers } : {}),
  };
}

/** Car brand page: the brand + the list of its models. */
export function brandSchema(b: Brand, opts: { logo?: string | null } = {}) {
  const url = absUrl(`/markak/${b.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Brand",
    "@id": `${url}#brand`,
    name: b.name,
    url,
    ...(opts.logo ? { logo: opts.logo } : {}),
    ...(b.tagline || b.description ? { description: b.description || b.tagline } : {}),
    ...(b.tagline ? { slogan: b.tagline } : {}),
  };
}

export function modelListSchema(path: string, models: ModelRow[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${absUrl(path)}#models`,
    numberOfItems: models.length,
    itemListElement: models.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absUrl(modelPath(m)),
      name: modelFullName(m),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.answer,
      },
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${absUrl(opts.url)}#article`,
    headline: opts.title,
    description: opts.description,
    inLanguage: "hu-HU",
    publisher: { "@id": ORG_ID },
    author: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    image: absUrl(DEFAULT_OG_IMAGE.url),
    datePublished: opts.datePublished ?? "2026-05-04",
    dateModified: opts.dateModified ?? opts.datePublished ?? "2026-05-04",
    mainEntityOfPage: absUrl(opts.url),
  };
}
