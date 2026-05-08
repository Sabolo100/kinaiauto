import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { getBrands, getModels } from "@/lib/data";
import { ModelsBrowser } from "@/components/model-detail/models-browser";

export const metadata: Metadata = {
  title: "Modellek — válassz márkát, majd modellt",
  description:
    "60+ kínai modell részletes adatlapja. Felül a márka, alatta a kiválasztott márka modelljei — bármelyikre kattintva a teljes adatlap megnyílik.",
  alternates: { canonical: `${SITE_URL}/modellek` },
};

export default async function ModelsBrowseRoot() {
  const [brands, models] = await Promise.all([getBrands(), getModels()]);

  return (
    <main>
      <section className="pagehead">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Főoldal</Link> · Modellek
          </div>
          <div className="eyebrow">
            Modell-kereső · {models.length} modell · {brands.length} márka
          </div>
          <h1>
            Válassz <em>márkát</em>, majd modellt.
          </h1>
          <p className="lede">
            Felül a márka, alatta a választott márka modelljei. Bármelyik
            modellre kattintva a teljes adatlap megnyílik.
          </p>
        </div>
      </section>

      <ModelsBrowser brands={brands} models={models} />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Főoldal", url: "/" },
          { name: "Modellek", url: "/modellek" },
        ])}
      />
    </main>
  );
}
