// POST /api/cms/model-discovery/search/[jobId]/run
// Runs the discovery research per brand. Called fire-and-forget by the client.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  discoverNewModelsForBrand,
  normalizeModelName,
} from "@/lib/model-discovery";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min on Vercel Pro

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  const sa = supabaseAdmin();

  const { data: jobRow } = await sa
    .from("model_discovery_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!jobRow || jobRow.status === "completed" || jobRow.status === "running") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const brandIds = jobRow.brand_ids as string[];

  const { data: brands } = await sa
    .from("brands")
    .select("id,name,importer_site")
    .in("id", brandIds)
    .order("sort_order");

  if (!brands?.length) {
    await sa
      .from("model_discovery_jobs")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", jobId);
    return NextResponse.json({ ok: true });
  }

  await sa
    .from("model_discovery_jobs")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  const progress: Record<string, { found: number; done: boolean; error?: string }> = {};
  let totalFound = 0;

  for (const brand of brands) {
    const brandId = brand.id as string;
    const brandName = brand.name as string;

    await sa
      .from("model_discovery_jobs")
      .update({
        current_brand: brandName,
        progress,
        total_found: totalFound,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    progress[brandId] = { found: 0, done: false };

    try {
      // Existing live models for this brand
      const { data: liveModels } = await sa
        .from("models")
        .select("name")
        .eq("brand_id", brandId);
      const existingNames = (liveModels ?? []).map((m) => m.name as string);

      // Already-pending candidates for this brand (avoid re-adding duplicates)
      const { data: pendingRows } = await sa
        .from("discovered_models")
        .select("name")
        .eq("brand_id", brandId)
        .eq("status", "pending");
      const pendingSet = new Set(
        (pendingRows ?? []).map((r) => normalizeModelName(r.name as string)),
      );

      const result = await discoverNewModelsForBrand(
        { name: brandName, importer_site: brand.importer_site as string | null },
        existingNames,
      );

      if (result.error && result.candidates.length === 0) {
        progress[brandId] = { found: 0, done: true, error: result.error };
      } else {
        const toInsert = result.candidates.filter(
          (c) => !pendingSet.has(normalizeModelName(c.name)),
        );

        if (toInsert.length > 0) {
          await sa.from("discovered_models").insert(
            toInsert.map((c) => ({
              brand_id: brandId,
              name: c.name,
              category_guess: c.category_guess,
              drive_guess: c.drive_guess,
              reason: c.reason,
              sources: c.sources,
              confidence: c.confidence,
              status: "pending",
              found_by_job: jobId,
            })),
          );
        }

        progress[brandId] = { found: toInsert.length, done: true };
        totalFound += toInsert.length;
      }
    } catch (e) {
      progress[brandId] = { found: 0, done: true, error: String(e) };
    }

    // Gentle pacing between brands
    await new Promise((r) => setTimeout(r, 500));
  }

  await sa
    .from("model_discovery_jobs")
    .update({
      status: "completed",
      current_brand: null,
      progress,
      total_found: totalFound,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  return NextResponse.json({ ok: true, total_found: totalFound });
}
