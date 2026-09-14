// POST /api/cms/test-links/search/[jobId]/run
// Runs the actual search job. Called fire-and-forget from the client.
import { NextRequest, NextResponse } from "next/server";
import { db, jsonb } from "@/lib/db";
import { searchTestLinksVerified } from "@/lib/test-link-search";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max on Vercel Pro; 60s on Hobby

type Progress = Record<string, { found: number; done: boolean; error?: string }>;

export async function POST(_req: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  const sql = db();

  const [jobRow] = await sql<{ status: string; model_ids: string[] }[]>`
    select status, model_ids from test_link_search_jobs where id = ${jobId}`;
  if (!jobRow || jobRow.status === "completed" || jobRow.status === "running") {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const modelIds = jobRow.model_ids ?? [];

  // Model info with brand name (embed shape: brand{name})
  const models = await sql<{ id: string; name: string; brand: { name: string } | null }[]>`
    select m.id, m.name, case when b.id is null then null else json_build_object('name', b.name) end as brand
    from models m left join brands b on b.id = m.brand_id
    where m.id = any(${modelIds})`;

  if (models.length === 0) {
    await sql`update test_link_search_jobs set status = 'completed', updated_at = now() where id = ${jobId}`;
    return NextResponse.json({ ok: true });
  }

  await sql`update test_link_search_jobs set status = 'running', updated_at = now() where id = ${jobId}`;

  const progress: Progress = {};
  let totalFound = 0;

  for (const model of models) {
    const brandName = model.brand?.name ?? "";
    const label = `${brandName} ${model.name}`.trim();

    await sql`update test_link_search_jobs
      set current_model = ${label}, progress = ${jsonb(progress)},
          total_found = ${totalFound}, updated_at = now()
      where id = ${jobId}`;

    progress[model.id] = { found: 0, done: false };

    try {
      // Search + AI-verify: only confirmed-relevant links come back
      const verifiedLinks = await searchTestLinksVerified(brandName, model.name);

      // Deduplicate against already-existing links for this model
      const existing = await sql<{ url: string }[]>`select url from model_test_links where model_id = ${model.id}`;
      const existingUrls = new Set(existing.map((e) => e.url));
      const toInsert = verifiedLinks.filter((l) => !existingUrls.has(l.url));

      if (toInsert.length > 0) {
        await sql`insert into model_test_links ${sql(
          toInsert.map((l) => ({
            model_id: model.id, url: l.url, title: l.title || null, source_name: l.source_name,
            kind: l.kind, is_approved: false, found_by: "auto", ai_ok: true, ai_summary: l.ai_summary || null,
          })),
        )}`;
      }
      progress[model.id] = { found: toInsert.length, done: true };
      totalFound += toInsert.length;
    } catch (e) {
      progress[model.id] = { found: 0, done: true, error: String(e) };
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  await sql`update test_link_search_jobs
    set status = 'completed', current_model = null, progress = ${jsonb(progress)},
        total_found = ${totalFound}, updated_at = now()
    where id = ${jobId}`;
  return NextResponse.json({ ok: true, total_found: totalFound });
}
