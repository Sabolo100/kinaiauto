// ISR: revalidate every 2 minutes — brand/model data changes rarely,
// so caching is safe. Force-dynamic caused a full server render + 6 DB
// queries on every brand tab click, making navigation feel slow.
export const revalidate = 120;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCachedBrands, getCachedModels, getDealersForBrand, getPhotoMapForModels } from "@/lib/data";
import { brandLogoUrl, photoUrl } from "@/lib/media-urls";
import { JsonLd } from "@/components/json-ld";
import { absUrl, brandSchema, breadcrumbSchema, modelListSchema, pageMeta, webPageSchema } from "@/lib/seo";
import type { Brand, ModelRow } from "@/lib/types";
import { BrandPage } from "@/components/brands/brand-page";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const brands = await getCachedBrands();
  return brands.map((b) => ({ slug: b.slug }));
}

const fmtM = (v: number) => v.toFixed(1).replace(".", ",");

/** Factual brand summary built from the data (meta description, JSON-LD). */
function brandCopy(brand: Brand, models: ModelRow[]) {
  const prices = models.flatMap((m) => [m.price_min_m_ft, m.price_max_m_ft]).filter((v): v is number => v != null);
  const drives = [...new Set(models.map((m) => m.drive.toLowerCase()))];
  const parts = [`${brand.name} autók Magyarországon: ${models.length} modell`];
  if (prices.length) {
    const lo = Math.min(...prices), hi = Math.max(...prices);
    parts[0] += ` ${lo === hi ? fmtM(lo) : `${fmtM(lo)}–${fmtM(hi)}`} millió Ft listaáron`;
  }
  if (drives.length) parts[0] += `, ${drives.join(", ")} hajtással`;
  const tail: string[] = [];
  if (brand.importer_name) tail.push(`Importőr: ${brand.importer_name.replace(/\.$/, "")}.`);
  if (brand.tagline) tail.push(brand.tagline.replace(/\.?$/, "."));
  return {
    title: `${brand.name} autók Magyarországon — modellek, árak`,
    description: `${parts.join("")}. ${tail.join(" ")} Modellek, adatok, kereskedők egy helyen.`,
  };
}

function brandOgImage(models: ModelRow[], brand: Brand) {
  const withPhoto = [...models].sort((a, b) => Number(b.is_featured) - Number(a.is_featured)).find((m) => m.primary_photo_path);
  const url = withPhoto ? photoUrl(withPhoto.primary_photo_path) : null;
  return url ? { url, alt: `${brand.name} ${withPhoto!.name}` } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [brands, models] = await Promise.all([getCachedBrands(), getCachedModels()]);
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) return { title: "Márka" };
  const brandModels = models.filter((m) => m.brand_slug === slug);
  const { title, description } = brandCopy(brand, brandModels);
  return pageMeta({ title, description, path: `/markak/${slug}`, image: brandOgImage(brandModels, brand) });
}

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params;

  // Single getBrands() call — eliminates the duplicate that getBrandBySlug caused
  const [allBrands, models] = await Promise.all([getCachedBrands(), getCachedModels()]);
  const brand = allBrands.find((b) => b.slug === slug);
  if (!brand) notFound();

  const brandModels = models.filter((m) => m.brand_slug === slug);
  const brandCounts: Record<string, number> = {};
  for (const m of models) {
    brandCounts[m.brand_slug] = (brandCounts[m.brand_slug] ?? 0) + 1;
  }
  // Run photoMap and dealers fetch in parallel
  const [photoMap, dealers] = await Promise.all([
    getPhotoMapForModels(brandModels.map((m) => m.id)),
    getDealersForBrand(brand.id),
  ]);

  const copy = brandCopy(brand, brandModels);

  return (
    <main>
      <section className="pagehead">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Főoldal</Link> ·{" "}
            <Link href="/markak">Márkák</Link> · {brand.name}
          </div>
        </div>
      </section>

      <BrandPage
        brand={brand}
        brands={allBrands}
        models={brandModels}
        dealers={dealers}
        brandCounts={brandCounts}
        photoMap={photoMap}
      />

      <JsonLd
        data={webPageSchema({
          type: "CollectionPage",
          path: `/markak/${slug}`,
          name: copy.title,
          description: copy.description,
          mainEntityId: absUrl(`/markak/${slug}#models`),
          about: { "@id": absUrl(`/markak/${slug}#brand`) },
        })}
      />
      <JsonLd data={brandSchema(brand, { logo: brandLogoUrl(brand.logo_path) })} />
      <JsonLd data={modelListSchema(`/markak/${slug}`, brandModels)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Főoldal", url: "/" },
          { name: "Márkák", url: "/markak" },
          { name: brand.name, url: `/markak/${slug}` },
        ])}
      />
    </main>
  );
}
