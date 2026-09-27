export const revalidate = 300;

import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, pageMeta, webPageSchema } from "@/lib/seo";
import {
  getBrands,
  getCategories,
  getDrives,
  getModels,
  getPriceBands,
} from "@/lib/data";
import { CatalogApp } from "@/components/catalog/catalog-app";

const TITLE = "Kínai autók kínálata ár, hatótáv és méret szerint";
const DESCRIPTION =
  "A Magyarországon kapható kínai autók egy vizuális hasábon: szűrj kategóriára, hajtásra, márkára és ársávra, és lásd arányosan az árat, hatótávot, csomagtartót, teljesítményt.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/kinalat" });

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; drive?: string }>;
}) {
  const [params, [models, brands, categories, drives, bands]] = await Promise.all([
    searchParams,
    Promise.all([getModels(), getBrands(), getCategories(), getDrives(), getPriceBands()]),
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
        initialCategory={params.category}
        initialDrive={params.drive}
      />

      <JsonLd
        data={webPageSchema({ type: "CollectionPage", path: "/kinalat", name: TITLE, description: DESCRIPTION })}
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
