import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/cms-shell";
import { BrandForm } from "@/components/cms/brand-form";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sa = supabaseAdmin();
  const [b, logo] = await Promise.all([
    sa.from("brands").select("*").eq("id", id).single(),
    sa
      .from("brand_logos")
      .select("storage_path")
      .eq("brand_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (b.error || !b.data) return notFound();

  const r = b.data;
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
          logo_path: logo.data?.storage_path ?? null,
        }}
      />
    </CmsShell>
  );
}
