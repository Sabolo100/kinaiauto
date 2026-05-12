// The pagehead + brand/model strip live in layout.tsx so they persist.
// This page only contributes SEO metadata and structured data.
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  title: "Modellek — válassz márkát, majd modellt",
  description:
    "60+ kínai modell részletes adatlapja. Felül a márka, alatta a kiválasztott márka modelljei — bármelyikre kattintva a teljes adatlap megnyílik.",
  alternates: { canonical: `${SITE_URL}/modellek` },
};

export default function ModelsBrowseRoot() {
  return (
    <JsonLd
      data={breadcrumbSchema([
        { name: "Főoldal", url: "/" },
        { name: "Modellek", url: "/modellek" },
      ])}
    />
  );
}
