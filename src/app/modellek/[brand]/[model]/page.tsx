export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBrands,
  getModelByBrandAndSlug,
  getModels,
  getTrimsForModel,
  getPhotosForModel,
} from "@/lib/data";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, vehicleSchema } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { ModelDetail } from "@/components/model-detail/model-detail";
import { ModelsBrowser } from "@/components/model-detail/models-browser";

type Props = {
  params: Promise<{ brand: string; model: string }>;
};

export async function generateStaticParams() {
  const models = await getModels();
  return models.map((m) => ({ brand: m.brand_slug, model: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, model } = await params;
  const m = await getModelByBrandAndSlug(brand, model);
  if (!m) return { title: "Modell" };
  const priceLine =
    m.price_min_m_ft != null
      ? ` · listaár ${m.price_min_m_ft.toFixed(1).replace(".", ",")} M Ft-tól`
      : "";
  return {
    title: `${m.brand_name} ${m.name} — adatlap${priceLine}`,
    description: `${m.brand_name} ${m.name} (${m.category}, ${m.drive.toLowerCase()}) magyarországi adatlap: ár, méretek, hatótáv, akkumulátor, töltés, garancia, importőri linkek.`,
    alternates: {
      canonical: `${SITE_URL}/modellek/${brand}/${model}`,
    },
  };
}

export default async function ModelPage({ params }: Props) {
  const { brand, model } = await params;
  const [m, allBrands, allModels] = await Promise.all([
    getModelByBrandAndSlug(brand, model),
    getBrands(),
    getModels(),
  ]);
  const b = allBrands.find((x) => x.slug === brand);
  if (!m || !b) notFound();
  const [trims, photos] = await Promise.all([
    getTrimsForModel(m.id),
    getPhotosForModel(m.id),
  ]);

  // Find similar (same category or drive, exclude self)
  const similar = allModels
    .filter((x) => x.id !== m.id)
    .map((x) => {
      let s = 0;
      if (x.category === m.category) s += 3;
      if (x.drive === m.drive) s += 2;
      if (x.brand_slug === m.brand_slug) s += 1;
      if (
        Math.abs((x.price_min_m_ft ?? 0) - (m.price_min_m_ft ?? 0)) < 4
      )
        s += 1;
      return { x, s };
    })
    .filter((o) => o.s >= 3)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((o) => o.x);

  return (
    <main>
      <section className="pagehead">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Főoldal</Link>
            <span className="sep">·</span>
            <Link href={`/markak/${m.brand_slug}`}>{m.brand_name}</Link>
            <span className="sep">·</span>
            <span>{m.name}</span>
          </div>
        </div>
      </section>

      <ModelsBrowser
        brands={allBrands}
        models={allModels}
        initialBrand={m.brand_slug}
        selectedModelSlug={m.slug}
        hideEmpty
      />

      <ModelDetail model={m} brand={b} trims={trims} similar={similar} photos={photos} />

      <JsonLd data={vehicleSchema(m)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Főoldal", url: "/" },
          { name: "Modellek", url: "/modellek" },
          { name: m.brand_name, url: `/markak/${m.brand_slug}` },
          {
            name: m.name,
            url: `/modellek/${m.brand_slug}/${m.slug}`,
          },
        ])}
      />
    </main>
  );
}
