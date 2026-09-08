import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/cms-shell";
import { BrandForm } from "@/components/cms/brand-form";
import { db } from "@/lib/db";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

type BrandDbRow = Brand & { archived_at: string | null };

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = db();
  const [[r], [logo]] = await Promise.all([
    sql<BrandDbRow[]>`select * from brands where id = ${id}`,
    sql<{ storage_path: string }[]>`
      select storage_path from brand_logos where brand_id = ${id}
      order by created_at desc limit 1`,
  ]);
  if (!r) return notFound();

  return (
    <CmsShell>
      <h1>{r.name}</h1>
      <p className="lede">Slug: <code>{r.slug}</code></p>
      <BrandForm
        mode="edit"
        initial={{
          id: r.id,
          slug: r.slug ?? "",
          name: r.name ?? "",
          tagline: r.tagline ?? "",
          description: r.description ?? "",
          founded: r.founded ?? "",
          hq: r.hq ?? "",
          factories: r.factories ?? "",
          parent_company: r.parent_company ?? "",
          importer_name: r.importer_name ?? "",
          importer_addr: r.importer_addr ?? "",
          importer_site: r.importer_site ?? "",
          dealers_text: r.dealers_text ?? "",
          hero_color: r.hero_color ?? "",
          brand_tone: r.brand_tone ?? "",
          sort_order: r.sort_order ?? 0,
          is_active: r.is_active ?? true,
          archived_at: r.archived_at ?? null,
          logo_path: logo?.storage_path ?? null,
        }}
      />
    </CmsShell>
  );
}
