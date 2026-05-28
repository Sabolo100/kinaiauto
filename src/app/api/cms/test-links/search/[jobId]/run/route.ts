// POST /api/cms/test-links/search/[jobId]/run
// Runs the actual search job. Called fire-and-forget from the /search route.
// Has a long maxDuration so it can process many models.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { searchTestLinksVerified } from "@/lib/test-link-search";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max on Vercel Pro; 60s on Hobby

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  const sa = supabaseAdmin();

  // Fetch the job
  const { data: jobRow } = await sa
    .from("test_link_search_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!jobRow || jobRow.status === "completed" || jobRow.status === "running") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const modelIds = jobRow.model_ids as string[];

  // Fetch model info
  const { data: models } = await sa
    .from("models")
    .select("id, name, brand:brands(name)")
    .in("id", modelIds);

  if (!models?.length) {
    await sa.from("test_link_search_jobs")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", jobId);
    return NextResponse.json({ ok: true });
  }

  // Mark running
  await sa.from("test_link_search_jobs")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  const progress: Record<string, { found: number; done: boolean; error?: string }> = {};
  let totalFound = 0;

  for (const model of models) {
    const brandName = (model.brand as unknown as { name: string } | null)?.name ?? "";
    const modelName = model.name as string;
    const modelId = model.id as string;
    const label = `${brandName} ${modelName}`.trim();

    // Update progress: which model we're on now
    await sa.from("test_link_search_jobs")
      .update({
        current_model: label,
        progress,
        total_found: totalFound,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    progress[modelId] = { found: 0, done: false };

    try {
      // Search + AI-verify: only confirmed-relevant links come back
      const verifiedLinks = await searchTestLinksVerified(brandName, modelName);

      // Deduplicate against already-existing links for this model
      const { data: existing } = await sa
        .from("model_test_links")
        .select("url")
        .eq("model_id", modelId);
      const existingUrls = new Set((existing ?? []).map((e) => e.url as string));
      const toInsert = verifiedLinks.filter((l) => !existingUrls.has(l.url));

      if (toInsert.length > 0) {
        await sa.from("model_test_links").insert(
          toInsert.map((l) => ({
            model_id: modelId,
            url: l.url,
            title: l.title || null,
            source_name: l.source_name,
            kind: l.kind,
            is_approved: false,
            found_by: "auto",
            ai_ok: true,
            ai_summary: l.ai_summary || null,
          })),
        );
      }

      progress[modelId] = { found: toInsert.length, done: true };
      totalFound += toInsert.length;

    } catch (e) {
      progress[modelId] = { found: 0, done: true, error: String(e) };
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  // Done
  await sa.from("test_link_search_jobs")
    .update({
      status: "completed",
      current_model: null,
      progress,
      total_found: totalFound,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  return NextResponse.json({ ok: true, total_found: totalFound });
}
