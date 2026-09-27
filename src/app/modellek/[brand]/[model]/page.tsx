// The <main>, pagehead and brand/model strip are provided by
// /app/modellek/layout.tsx so they persist across navigations.
export const revalidate = 120;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCachedBrands,
  getCachedModels,
  getModelByBrandAndSlug,
  getPhotosForModel,
  getDealersForBrand,
} from "@/lib/data";
import { JsonLd } from "@/components/json-ld";
import { absUrl, breadcrumbSchema, carSchema, modelFactLine, modelFullName, modelPath, pageMeta, webPageSchema } from "@/lib/seo";
import { photoUrl } from "@/lib/media-urls";
import type { ModelRow } from "@/lib/types";
import { ModelDetail } from "@/components/model-detail/model-detail";

type Props = {
  params: Promise<{ brand: string; model: string }>;
};

export async function generateStaticParams() {
  const models = await getCachedModels();
  return models.map((m) => ({ brand: m.brand_slug, model: m.slug }));
}

function modelCopy(m: ModelRow) {
  const name = modelFullName(m);
  const price = m.price_min_m_ft != null ? m.price_min_m_ft.toFixed(1).replace(".", ",") : null;
  return {
    title: price ? `${name} ára és adatai — ${price} M Ft-tól` : `${name} — ár, adatok, adatlap`,
    description: `${modelFactLine(m, { short: true })} Adatlap, változatok, garancia, kereskedők.`,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, model } = await params;
  const m = await getModelByBrandAndSlug(brand, model);
  if (!m) return { title: "Modell" };
  const { title, description } = modelCopy(m);
  const photo = photoUrl(m.primary_photo_path);
  return pageMeta({
    title,
    description,
    path: modelPath(m),
    image: photo ? { url: photo, alt: modelFullName(m) } : null,
  });
}

export default async function ModelPage({ params }: Props) {
  const { brand, model } = await params;
  const [m, allBrands, allModels] = await Promise.all([
    getModelByBrandAndSlug(brand, model),
    getCachedBrands(),
    getCachedModels(),
  ]);
  const b = allBrands.find((x) => x.slug === brand);
  if (!m || !b) notFound();

  const [photos, dealers] = await Promise.all([
    getPhotosForModel(m.id),
    getDealersForBrand(b.id),
  ]);

  // Find similar models (same category or drive, exclude self)
  const similar = allModels
    .filter((x) => x.id !== m.id)
    .map((x) => {
      let s = 0;
      if (x.category === m.category) s += 3;
      if (x.drive === m.drive) s += 2;
      if (x.brand_slug === m.brand_slug) s += 1;
      if (Math.abs((x.price_min_m_ft ?? 0) - (m.price_min_m_ft ?? 0)) < 4) s += 1;
      return { x, s };
    })
    .filter((o) => o.s >= 3)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((o) => o.x);

  return (
    <>
      <ModelDetail model={m} brand={b} similar={similar} photos={photos} dealers={dealers} />

      <JsonLd
        data={webPageSchema({
          type: "ItemPage",
          path: modelPath(m),
          name: modelCopy(m).title,
          description: modelCopy(m).description,
          mainEntityId: absUrl(`${modelPath(m)}#car`),
          dateModified: m.data_updated_at ?? m.updated_at,
        })}
      />
      <JsonLd data={carSchema(m, { image: photoUrl(m.primary_photo_path) })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Főoldal", url: "/" },
          { name: m.brand_name, url: `/markak/${m.brand_slug}` },
          { name: m.name, url: `/modellek/${m.brand_slug}/${m.slug}` },
        ])}
      />
    </>
  );
}
