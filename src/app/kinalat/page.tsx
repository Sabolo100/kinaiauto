import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import {
  getBrands,
  getCategories,
  getDrives,
  getModels,
  getPriceBands,
} from "@/lib/data";
import { CatalogApp } from "@/components/catalog/catalog-app";

export const metadata: Metadata = {
  title: "Kínálat — vizuális hasáb a kínai modellekről",
  description:
    "Szűrj kategóriára, hajtásra, márkára, ársávra. Válaszd ki, melyik adatot mutassuk: ár, hatótáv, csomagtartó, teljesítmény. A modellek a függőleges hasábon arányosan helyezkednek el.",
  alternates: { canonical: `${SITE_URL}/kinalat` },
};

export default async function CatalogPage() {
  const [models, brands, categories, drives, bands] = await Promise.all([
    getModels(),
    getBrands(),
    getCategories(),
    getDrives(),
    getPriceBands(),
  ]);

  return (
    <main>
      <section className="pagehead">
        <div className="container-wide">
          <div className="breadcrumbs">
            <Link href="/">Főoldal</Link> · Kínálat
          </div>
          <div className="eyebrow">
            A teljes kínai kínálat egyetlen vizuális hasábon
          </div>
          <h1>
            Lásd a <em>tényleges</em> különbségeket.
          </h1>
          <p className="lede">
            Szűrj kategóriára, hajtásra, márkára, ársávra. Válaszd ki, melyik
            adatot mutassuk: ár, hatótáv, csomagtartó, teljesítmény. A modellek
            a függőleges hasábon arányosan helyezkednek el a kiválasztott érték
            szerint.
          </p>
        </div>
      </section>

      <CatalogApp
        models={models}
        brands={brands}
        categories={categories}
        drives={drives}
        bands={bands}
      />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Főoldal", url: "/" },
          { name: "Kínálat", url: "/kinalat" },
        ])}
      />
    </main>
  );
}
