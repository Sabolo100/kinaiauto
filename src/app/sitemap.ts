import type { MetadataRoute } from "next";
import { getBrands, getModels, getArticleIndex } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, models, articles] = await Promise.all([
    getBrands(),
    getModels(),
    getArticleIndex(),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,                 lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/kinalat`,          lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/osszehasonlitas`,  lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/markak`,           lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/modellek`,         lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/tudastar`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const brandPages: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${SITE_URL}/markak/${b.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const modelPages: MetadataRoute.Sitemap = models.map((m) => ({
    url: `${SITE_URL}/modellek/${m.brand_slug}/${m.slug}`,
    lastModified: m.data_updated_at ? new Date(m.data_updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/tudastar/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...brandPages, ...modelPages, ...articlePages];
}
