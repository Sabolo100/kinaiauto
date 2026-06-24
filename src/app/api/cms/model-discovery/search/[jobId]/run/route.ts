// POST /api/cms/model-discovery/search/[jobId]/run
// Three modes (body decides):
//   { brandId }      → research ONE brand, insert candidates, return quickly.
//                      Driven in a loop by the client so each request stays short
//                      and is immune to Vercel function timeouts (any plan).
//   { finalize:true} → mark the job completed.
//   {}               → legacy: process every brand in one request (fallback).
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  discoverNewModelsForBrand,
  normalizeModelName,
} from "@/lib/model-discovery";

export const runtime = "nodejs";
export const maxDuration = 60; // each call handles a single brand — well under any limit

type JobRow = {
  id: string;
  status: string;
  brand_ids: string[];
  progress: Record<string, { found: number; done: boolean; error?: string }>;
  total_found: number;
};

/** Research one brand, insert its new candidates, update the job row. */
async function processBrand(
  sa: SupabaseClient,
  job: JobRow,
  brandId: string,
): Promise<{ found: number; brandName: string; error?: string }> {
  const { data: brand } = await sa
    .from("brands")
    .select("id,name,importer_site")
    .eq("id", brandId)
    .single();

  const brandName = (brand?.name as string) ?? "";
  const progress = { ...(job.progress ?? {}) };

  // Mark "running" + which brand we're on right now.
  await sa
    .from("model_discovery_jobs")
    .update({ status: "running", current_brand: brandName, updated_at: new Date().toISOString() })
    .eq("id", job.id);

  if (!brand) {
    progress[brandId] = { found: 0, done: true, error: "brand not found" };
    await sa.from("model_discovery_jobs").update({ progress }).eq("id", job.id);
    return { found: 0, brandName, error: "brand not found" };
  }

  try {
    const { data: liveModels } = await sa
      .from("models")
      .select("name")
      .eq("brand_id", brandId);
    const existingNames = (liveModels ?? []).map((m) => m.name as string);

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

    let found = 0;
    if (!(result.error && result.candidates.length === 0)) {
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
            found_by_job: job.id,
          })),
        );
      }
      found = toInsert.length;
    }

    progress[brandId] = {
      found,
      done: true,
      ...(result.error ? { error: result.error } : {}),
    };
    const totalFound = Object.values(progress).reduce((s, p) => s + (p.found ?? 0), 0);
    await sa
      .from("model_discovery_jobs")
      .update({ progress, total_found: totalFound, updated_at: new Date().toISOString() })
      .eq("id", job.id);

    return { found, brandName, error: result.error };
  } catch (e) {
    progress[brandId] = { found: 0, done: true, error: String(e) };
    await sa.from("model_discovery_jobs").update({ progress }).eq("id", job.id);
    return { found: 0, brandName, error: String(e) };
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  const sa = supabaseAdmin();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  const { data: jobRow } = await sa
    .from("model_discovery_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!jobRow) return NextResponse.json({ error: "job not found" }, { status: 404 });

  // ── Finalize ──
  if (body.finalize) {
    await sa
      .from("model_discovery_jobs")
      .update({ status: "completed", current_brand: null, updated_at: new Date().toISOString() })
      .eq("id", jobId);
    return NextResponse.json({ ok: true, finalized: true });
  }

  // ── Single brand (client-driven loop) ──
  if (typeof body.brandId === "string") {
    const res = await processBrand(sa, jobRow as JobRow, body.brandId);
    return NextResponse.json({ ok: true, ...res });
  }

  // ── Legacy: process all brands in one request ──
  if (jobRow.status === "completed" || jobRow.status === "running") {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const brandIds = (jobRow.brand_ids as string[]) ?? [];
  for (const brandId of brandIds) {
    await processBrand(sa, jobRow as JobRow, brandId);
    // refresh progress snapshot for the next iteration
    const { data: fresh } = await sa
      .from("model_discovery_jobs")
      .select("progress,total_found")
      .eq("id", jobId)
      .single();
    if (fresh) {
      (jobRow as JobRow).progress = fresh.progress;
      (jobRow as JobRow).total_found = fresh.total_found;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  await sa
    .from("model_discovery_jobs")
    .update({ status: "completed", current_brand: null, updated_at: new Date().toISOString() })
    .eq("id", jobId);
  return NextResponse.json({ ok: true });
}
