// GET /api/cms/model-discovery
// Returns the work table: pending candidates, the brands that can be searched,
// each brand's current live models (for the per-row popup), and the latest job.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { DISCOVERY_PROVIDER } from "@/lib/model-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sa = supabaseAdmin();

  const [candidatesRes, brandsRes, modelsRes, jobRes] = await Promise.all([
    sa
      .from("discovered_models")
      .select("*, brand:brands(id,name,slug)")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    sa
      .from("brands")
      .select("id,name,slug,importer_site,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    sa.from("models").select("id,name,slug,brand_id").order("name"),
    sa
      .from("model_discovery_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Group existing live models by brand for the popup list.
  const existingByBrand: Record<string, { id: string; name: string; slug: string }[]> = {};
  for (const m of (modelsRes.data ?? []) as { id: string; name: string; slug: string; brand_id: string }[]) {
    (existingByBrand[m.brand_id] ??= []).push({ id: m.id, name: m.name, slug: m.slug });
  }

  return NextResponse.json({
    candidates: candidatesRes.data ?? [],
    brands: brandsRes.data ?? [],
    existingByBrand,
    latestJob: jobRes.data ?? null,
    provider: DISCOVERY_PROVIDER,
  });
}
