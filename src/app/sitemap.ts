import type { MetadataRoute } from "next";
import { getBrands, getModels } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { TUDASTAR_UPDATED } from "@/components/tudastar/content";

// Only indexable, 200-status, self-canonical pages belong here.
//  - /markak and /modellek are redirects (to a brand / a daily model) → omitted.
//  - /tudastar/<slug> are placeholder pages (noindex, follow) → omitted until
//    the articles are written.
// lastModified comes from the data, not from "now", so it means something.

function newest(dates: (string | null | undefined)[]): Date | undefined {
  const ts = dates
    .filter((d): d is string => Boolean(d))
    .map((d) => Date.parse(d))
    .filter((t) => !Number.isNaN(t));
  return ts.length ? new Date(Math.max(...ts)) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, models] = await Promise.all([getBrands(), getModels()]);

  const modelDate = (m: (typeof models)[number]) => newest([m.data_updated_at, m.updated_at]);
  const catalogDate = newest(models.flatMap((m) => [m.data_updated_at, m.updated_at]));

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: catalogDate, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/kinalat`, lastModified: catalogDate, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/osszehasonlitas`, lastModified: catalogDate, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/tudastar`, lastModified: new Date(TUDASTAR_UPDATED), changeFrequency: "monthly", priority: 0.7 },
  ];

  const brandPages: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${SITE_URL}/markak/${b.slug}`,
    lastModified: newest(
      models.filter((m) => m.brand_slug === b.slug).flatMap((m) => [m.data_updated_at, m.updated_at]),
    ),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const modelPages: MetadataRoute.Sitemap = models.map((m) => ({
    url: `${SITE_URL}/modellek/${m.brand_slug}/${m.slug}`,
    lastModified: modelDate(m),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...brandPages, ...modelPages];
}
