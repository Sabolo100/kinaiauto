// POST /api/cms/model-discovery/search
// Creates a discovery job (which brands to research) and returns the jobId.
// The client then fire-and-forget triggers /run.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sa = supabaseAdmin();

  // brand_ids optional — empty/missing means "all active brands".
  let brandIds: string[] = Array.isArray(body?.brand_ids) ? body.brand_ids : [];
  if (brandIds.length === 0) {
    const { data } = await sa
      .from("brands")
      .select("id")
      .eq("is_active", true)
      .order("sort_order");
    brandIds = (data ?? []).map((b) => b.id as string);
  }

  if (brandIds.length === 0) {
    return NextResponse.json({ error: "nincs kereshető márka" }, { status: 400 });
  }

  const { data: job, error } = await sa
    .from("model_discovery_jobs")
    .insert({ status: "pending", brand_ids: brandIds, progress: {}, total_found: 0 })
    .select()
    .single();

  if (error || !job) {
    return NextResponse.json({ error: error?.message ?? "failed to create job" }, { status: 500 });
  }

  return NextResponse.json({ jobId: job.id });
}
