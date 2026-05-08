import type { Metadata } from "next";
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
import { HomeApp } from "@/components/home/home-app";

export const metadata: Metadata = {
  title: "Találd meg a számodra megfelelő kínai modellt — kategória, ársáv, hajtás",
  description:
    "Kategória, ársáv és hajtás alapján szűrhető 60+ kínai autómodell, 15 márkától. Vizuális kínálat-számegyenes, modellösszehasonlítás, importőri linkek — egy oldalon.",
  alternates: { canonical: SITE_URL },
};

export default async function HomePage() {
  const [models, brands, categories, drives, bands] = await Promise.all([
    getModels(),
    getBrands(),
    getCategories(),
    getDrives(),
    getPriceBands(),
  ]);

  return (
    <main>
      <HomeApp
        models={models}
        brands={brands}
        categories={categories}
        drives={drives}
        bands={bands}
      />

      <JsonLd
        data={breadcrumbSchema([{ name: "Főoldal", url: "/" }])}
      />
    </main>
  );
}
