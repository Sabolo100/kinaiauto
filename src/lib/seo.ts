// Structured data builders for JSON-LD.
// Schemas: Organization, WebSite (with SearchAction), BreadcrumbList,
// Vehicle (per model), FAQPage (Tudástár).

import { SITE_NAME, SITE_URL } from "./env";
import type { ModelRow } from "./types";

const SAME_AS: string[] = [
  // Add real social URLs here once available.
];

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    sameAs: SAME_AS,
    description:
      "Független magyar kínai autó-iránytű — modellkereső, összehasonlítás, márkák és tudástár.",
    inLanguage: "hu-HU",
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "hu-HU",
    publisher: { "@id": `${SITE_URL}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/kinalat?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

export function vehicleSchema(model: ModelRow): object {
  const offers =
    model.price_min_m_ft != null
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "HUF",
          lowPrice: Math.round(model.price_min_m_ft * 1_000_000),
          highPrice: Math.round((model.price_max_m_ft ?? model.price_min_m_ft) * 1_000_000),
          availability: model.is_available
            ? "https://schema.org/InStock"
            : "https://schema.org/PreOrder",
          areaServed: { "@type": "Country", name: "Hungary" },
        }
      : undefined;

  const fuelTypeMap: Record<string, string> = {
    Benzin: "Petrol",
    Dízel: "Diesel",
    "Önttöltő hibrid": "Hybrid",
    "Plug-in hibrid": "Plug-in hybrid",
    Elektromos: "Electric",
  };

  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${model.brand_name} ${model.name}`,
    brand: {
      "@type": "Brand",
      name: model.brand_name,
    },
    model: model.name,
    vehicleConfiguration: model.category,
    fuelType: fuelTypeMap[model.drive] ?? model.drive,
    numberOfAxles: 2,
    seatingCapacity: model.seats ?? undefined,
    bodyType: model.category,
    vehicleEngine:
      model.power_hp != null
        ? {
            "@type": "EngineSpecification",
            enginePower: {
              "@type": "QuantitativeValue",
              value: model.power_hp,
              unitCode: "BHP",
            },
          }
        : undefined,
    fuelEfficiency: model.consumption_text ?? undefined,
    fuelCapacity:
      model.battery_kwh != null
        ? {
            "@type": "QuantitativeValue",
            value: model.battery_kwh,
            unitCode: "KWH",
          }
        : undefined,
    cargoVolume:
      model.trunk_l != null
        ? {
            "@type": "QuantitativeValue",
            value: model.trunk_l,
            unitCode: "LTR",
          }
        : undefined,
    vehicleLength:
      model.length_mm != null
        ? {
            "@type": "QuantitativeValue",
            value: model.length_mm,
            unitCode: "MMT",
          }
        : undefined,
    offers,
    url: `${SITE_URL}/modellek/${model.brand_slug}/${model.slug}`,
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
    headline: opts.title,
    description: opts.description,
    inLanguage: "hu-HU",
    publisher: { "@id": `${SITE_URL}#organization` },
    author: { "@id": `${SITE_URL}#organization` },
    datePublished: opts.datePublished ?? "2026-05-04",
    dateModified: opts.dateModified ?? opts.datePublished ?? "2026-05-04",
    mainEntityOfPage: opts.url,
  };
}
