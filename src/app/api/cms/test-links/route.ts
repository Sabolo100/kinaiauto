// GET  /api/cms/test-links          → all models with link counts + pending links
// POST /api/cms/test-links          → manually add a new test link
import { NextRequest, NextResponse } from "next/server";
import { db, insertOne } from "@/lib/db";

export const runtime = "nodejs";

type ModelLite = { id: string; name: string; slug: string; brand: { id: string; name: string; slug: string } | null };
type LinkLite = {
  id: string; model_id: string; url: string; title: string | null; source_name: string | null;
  kind: string; is_approved: boolean; found_by: string; created_at: string;
};

// ── GET: models list with counts + pending links ──────────────────────────────
export async function GET() {
  try {
    const sql = db();
    const [models, links] = await Promise.all([
      // All models with brand info (embed shape: { id, name, slug })
      sql<ModelLite[]>`
        select m.id, m.name, m.slug,
          json_build_object('id', b.id, 'name', b.name, 'slug', b.slug) as brand
        from models m left join brands b on b.id = m.brand_id
        order by m.name`,
      // All test links (approved + pending)
      sql<LinkLite[]>`
        select id, model_id, url, title, source_name, kind, is_approved, found_by, created_at
        from model_test_links order by created_at desc`,
    ]);

    // Build per-model counts
    const counts: Record<string, { approved: number; pending: number }> = {};
    for (const l of links) {
      if (!counts[l.model_id]) counts[l.model_id] = { approved: 0, pending: 0 };
      if (l.is_approved) counts[l.model_id].approved++;
      else counts[l.model_id].pending++;
    }

    const modelRows = models.map((m) => ({
      id: m.id, name: m.name, slug: m.slug, brand: m.brand,
      approved: counts[m.id]?.approved ?? 0,
      pending: counts[m.id]?.pending ?? 0,
    }));
    const pending = links.filter((l) => !l.is_approved);
    return NextResponse.json({ models: modelRows, pending });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ── POST: manually add a test link ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.model_id || !body?.url) {
    return NextResponse.json({ error: "model_id and url required" }, { status: 400 });
  }
  try {
    const link = await insertOne("model_test_links", {
      model_id: body.model_id,
      url: String(body.url).trim(),
      title: body.title?.trim() || null,
      source_name: extractSourceName(body.url),
      kind: body.kind === "video" ? "video" : "article",
      is_approved: true, // manual additions are auto-approved
      found_by: "manual",
    });
    return NextResponse.json({ link });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

function extractSourceName(url: string): string {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    if (host.includes("youtube")) return "youtube.com";
    return host.replace("www.", "");
  } catch {
    return "";
  }
}
