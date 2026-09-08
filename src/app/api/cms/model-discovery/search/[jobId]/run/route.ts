// POST /api/cms/model-discovery/search/[jobId]/run
// Three modes (body decides):
//   { brandId }      → research ONE brand, insert candidates, return quickly.
//                      Driven in a loop by the client so each request stays short
//                      and is immune to Vercel function timeouts (any plan).
//   { finalize:true} → mark the job completed.
//   {}               → legacy: process every brand in one request (fallback).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discoverNewModelsForBrand, normalizeModelName } from "@/lib/model-discovery";

export const runtime = "nodejs";
export const maxDuration = 60; // each call handles a single brand — well under any limit

type Progress = Record<string, { found: number; done: boolean; error?: string }>;
type JobRow = { id: string; status: string; brand_ids: string[]; progress: Progress; total_found: number };

/** Research one brand, insert its new candidates, update the job row. */
async function processBrand(job: JobRow, brandId: string): Promise<{ found: number; brandName: string; error?: string }> {
  const sql = db();
  const [brand] = await sql<{ id: string; name: string; importer_site: string | null }[]>`
    select id, name, importer_site from brands where id = ${brandId}`;

  const brandName = brand?.name ?? "";
  const progress: Progress = { ...(job.progress ?? {}) };

  // Mark "running" + which brand we're on right now.
  await sql`update model_discovery_jobs
    set status = 'running', current_brand = ${brandName}, updated_at = now() where id = ${job.id}`;

  const saveProgress = async (extra?: { total_found: number }) =>
    sql`update model_discovery_jobs
      set progress = ${JSON.stringify(progress)}::jsonb,
          total_found = ${extra?.total_found ?? job.total_found},
          updated_at = now()
      where id = ${job.id}`;

  if (!brand) {
    progress[brandId] = { found: 0, done: true, error: "brand not found" };
    await saveProgress();
    return { found: 0, brandName, error: "brand not found" };
  }

  try {
    const liveModels = await sql<{ name: string }[]>`select name from models where brand_id = ${brandId}`;
    const existingNames = liveModels.map((m) => m.name);

    const pendingRows = await sql<{ name: string }[]>`
      select name from discovered_models where brand_id = ${brandId} and status = 'pending'`;
    const pendingSet = new Set(pendingRows.map((r) => normalizeModelName(r.name)));

    const result = await discoverNewModelsForBrand(
      { name: brandName, importer_site: brand.importer_site },
      existingNames,
    );

    let found = 0;
    if (!(result.error && result.candidates.length === 0)) {
      const toInsert = result.candidates.filter((c) => !pendingSet.has(normalizeModelName(c.name)));
      // `sources` is jsonb → per-row stringify + cast.
      for (const c of toInsert) {
        await sql`insert into discovered_models
          (brand_id, name, category_guess, drive_guess, reason, sources, confidence, status, found_by_job)
          values (${brandId}, ${c.name}, ${c.category_guess}, ${c.drive_guess}, ${c.reason},
                  ${JSON.stringify(c.sources)}::jsonb, ${c.confidence}, 'pending', ${job.id})`;
      }
      found = toInsert.length;
    }

    progress[brandId] = { found, done: true, ...(result.error ? { error: result.error } : {}) };
    const totalFound = Object.values(progress).reduce((s, p) => s + (p.found ?? 0), 0);
    await saveProgress({ total_found: totalFound });
    return { found, brandName, error: result.error };
  } catch (e) {
    progress[brandId] = { found: 0, done: true, error: String(e) };
    await saveProgress();
    return { found: 0, brandName, error: String(e) };
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  const sql = db();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  const [jobRow] = await sql<JobRow[]>`select * from model_discovery_jobs where id = ${jobId}`;
  if (!jobRow) return NextResponse.json({ error: "job not found" }, { status: 404 });

  // ── Finalize ──
  if (body.finalize) {
    await sql`update model_discovery_jobs
      set status = 'completed', current_brand = null, updated_at = now() where id = ${jobId}`;
    return NextResponse.json({ ok: true, finalized: true });
  }

  // ── Single brand (client-driven loop) ──
  if (typeof body.brandId === "string") {
    const res = await processBrand(jobRow, body.brandId);
    return NextResponse.json({ ok: true, ...res });
  }

  // ── Legacy: process all brands in one request ──
  if (jobRow.status === "completed" || jobRow.status === "running") {
    return NextResponse.json({ ok: true, skipped: true });
  }
  for (const brandId of jobRow.brand_ids ?? []) {
    await processBrand(jobRow, brandId);
    const [fresh] = await sql<{ progress: Progress; total_found: number }[]>`
      select progress, total_found from model_discovery_jobs where id = ${jobId}`;
    if (fresh) { jobRow.progress = fresh.progress; jobRow.total_found = fresh.total_found; }
    await new Promise((r) => setTimeout(r, 300));
  }
  await sql`update model_discovery_jobs
    set status = 'completed', current_brand = null, updated_at = now() where id = ${jobId}`;
  return NextResponse.json({ ok: true });
}
