import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandBySlug, getBrands, getModels } from "@/lib/data";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { BrandPage } from "@/components/brands/brand-page";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return { title: "Márka" };
  return {
    title: `${brand.name} — modellek és háttér`,
    description: brand.tagline ?? brand.description ?? `${brand.name} modellek a magyar piacon — kínálat, importőr, hivatalos források.`,
    alternates: { canonical: `${SITE_URL}/markak/${slug}` },
  };
}

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params;
  const [brand, allBrands, models] = await Promise.all([
    getBrandBySlug(slug),
    getBrands(),
    getModels(),
  ]);
  if (!brand) notFound();

  const brandModels = models.filter((m) => m.brand_slug === slug);
  const brandCounts: Record<string, number> = {};
  for (const m of models) {
    brandCounts[m.brand_slug] = (brandCounts[m.brand_slug] ?? 0) + 1;
  }

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
        brandCounts={brandCounts}
      />

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
