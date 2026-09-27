export const revalidate = 300;

import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { pageMeta, webPageSchema, ORG_ID } from "@/lib/seo";
import {
  getBrands,
  getCategories,
  getDrives,
  getModels,
  getPriceBands,
} from "@/lib/data";
import { HomeApp } from "@/components/home/home-app";
import { homeAnswer } from "@/lib/answers";

function homeCopy(modelCount: number, brandCount: number) {
  return {
    title: `kinaiauto.com — kínai autók Magyarországon, ${modelCount} modell`,
    description: `Független magyar kínai autó-iránytű: ${modelCount} Magyarországon kapható modell ${brandCount} márkától, kategória, ársáv és hajtás szerint szűrve. Árak, adatok, összehasonlítás, kereskedők.`,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const models = await getModels();
  const brandCount = new Set(models.map((m) => m.brand_name)).size;
  const { title, description } = homeCopy(models.length, brandCount);
  return pageMeta({ title, description, path: "/" });
}

export default async function HomePage() {
  const [models, brands, categories, drives, bands] = await Promise.all([
    getModels(),
    getBrands(),
    getCategories(),
    getDrives(),
    getPriceBands(),
  ]);

  const copy = homeCopy(models.length, new Set(models.map((m) => m.brand_name)).size);

  return (
    <main>
      <HomeApp
        answer={homeAnswer(models, new Set(models.map((m) => m.brand_name)).size)}
        models={models}
        brands={brands}
        categories={categories}
        drives={drives}
        bands={bands}
      />

      <JsonLd
        data={webPageSchema({
          path: "/",
          name: copy.title,
          description: copy.description,
          about: { "@id": ORG_ID },
          speakable: true,
        })}
      />
    </main>
  );
}
