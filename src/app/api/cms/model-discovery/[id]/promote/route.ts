// POST /api/cms/model-discovery/[id]/promote
// Creates a real row in `models` from a discovered candidate, then marks the
// candidate as promoted. The new model is created hidden (is_available=false)
// so the admin can fill it in via the normal model editor before it goes live.
// Returns { model_id } so the client can redirect to the editor.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Hungarian-safe slugify: strip accents, lowercase, hyphenate. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "modell";
}

type Lookup = { id: number; slug: string; label_hu: string };
type Candidate = {
  id: string; brand_id: string; name: string; category_guess: string | null; drive_guess: string | null;
  sources: { url: string; kind: string }[] | null; status: string; promoted_model_id: string | null;
};

function matchLookup(list: Lookup[], guess: string | null, fallbackSlug: string): number {
  const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  if (guess) {
    const g = norm(guess);
    const hit =
      list.find((r) => norm(r.slug) === g || norm(r.label_hu) === g) ??
      list.find((r) => norm(r.label_hu).includes(g) || g.includes(norm(r.label_hu)));
    if (hit) return hit.id;
  }
  return list.find((r) => r.slug === fallbackSlug)?.id ?? list[0]?.id ?? 0;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const sql = db();

  // 1. Load the candidate
  const [cand] = await sql<Candidate[]>`select * from discovered_models where id = ${id}`;
  if (!cand) return NextResponse.json({ error: "candidate not found" }, { status: 404 });
  if (cand.status === "promoted" && cand.promoted_model_id) {
    return NextResponse.json({ model_id: cand.promoted_model_id, already: true });
  }

  // 2. Resolve category_id and drive_id (body override → AI guess → default)
  const [categories, drives] = await Promise.all([
    sql<Lookup[]>`select id, slug, label_hu from categories`,
    sql<Lookup[]>`select id, slug, label_hu from drives`,
  ]);
  const categoryId = typeof body.category_id === "number" ? body.category_id : matchLookup(categories, cand.category_guess, "kompakt-suv");
  const driveId    = typeof body.drive_id    === "number" ? body.drive_id    : matchLookup(drives, cand.drive_guess, "elektromos");
  if (!categoryId || !driveId) {
    return NextResponse.json(
      { error: "Nem sikerült kategóriát/hajtást feloldani. Hozd létre kézzel az Új modell oldalon." },
      { status: 500 },
    );
  }

  // 3. Unique slug within the brand
  const baseSlug = slugify(cand.name);
  const brandModels = await sql<{ slug: string }[]>`select slug from models where brand_id = ${cand.brand_id}`;
  const used = new Set(brandModels.map((m) => m.slug));
  let slug = baseSlug;
  let n = 2;
  while (used.has(slug)) slug = `${baseSlug}-${n++}`;

  // 4. Source URL: prefer official, else first source
  const sources = Array.isArray(cand.sources) ? cand.sources : [];
  const sourceUrl = sources.find((s) => s.kind === "official")?.url ?? sources[0]?.url ?? null;

  // 5. Create the model (hidden until the admin fills it in) + 6. mark promoted — atomically
  try {
    const modelId = await sql.begin(async (tx) => {
      const [model] = await tx<{ id: string }[]>`
        insert into models (brand_id, category_id, drive_id, slug, name, is_available, source_url)
        values (${cand.brand_id}, ${categoryId}, ${driveId}, ${slug}, ${cand.name}, false, ${sourceUrl})
        returning id`;
      await tx`update discovered_models
        set status = 'promoted', promoted_model_id = ${model.id}, updated_at = now() where id = ${id}`;
      return model.id;
    });
    return NextResponse.json({ model_id: modelId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message ?? "modell létrehozása sikertelen" }, { status: 500 });
  }
}
