// POST /api/cms/model-discovery/[id]/promote
// Creates a real row in `models` from a discovered candidate, then marks the
// candidate as promoted. The new model is created hidden (is_available=false)
// so the admin can fill it in via the normal model editor before it goes live.
// Returns { model_id } so the client can redirect to the editor.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const sa = supabaseAdmin();

  // 1. Load the candidate
  const { data: cand, error: candErr } = await sa
    .from("discovered_models")
    .select("*")
    .eq("id", id)
    .single();
  if (candErr || !cand) {
    return NextResponse.json({ error: "candidate not found" }, { status: 404 });
  }
  if (cand.status === "promoted" && cand.promoted_model_id) {
    return NextResponse.json({ model_id: cand.promoted_model_id, already: true });
  }

  // 2. Resolve category_id and drive_id (body override → AI guess → default)
  const [{ data: categories }, { data: drives }] = await Promise.all([
    sa.from("categories").select("id,slug,label_hu"),
    sa.from("drives").select("id,slug,label_hu"),
  ]);

  function matchLookup(
    rows: { id: number; slug: string; label_hu: string }[] | null,
    guess: string | null,
    fallbackSlug: string,
  ): number {
    const list = rows ?? [];
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

  const categoryId =
    typeof body.category_id === "number"
      ? body.category_id
      : matchLookup(categories, cand.category_guess as string | null, "kompakt-suv");
  const driveId =
    typeof body.drive_id === "number"
      ? body.drive_id
      : matchLookup(drives, cand.drive_guess as string | null, "elektromos");

  if (!categoryId || !driveId) {
    return NextResponse.json(
      { error: "Nem sikerült kategóriát/hajtást feloldani. Hozd létre kézzel az Új modell oldalon." },
      { status: 500 },
    );
  }

  // 3. Unique slug within the brand
  const baseSlug = slugify(cand.name as string);
  const { data: brandModels } = await sa
    .from("models")
    .select("slug")
    .eq("brand_id", cand.brand_id);
  const used = new Set((brandModels ?? []).map((m) => m.slug as string));
  let slug = baseSlug;
  let n = 2;
  while (used.has(slug)) slug = `${baseSlug}-${n++}`;

  // 4. Source URL: prefer official, else first source
  const sources = Array.isArray(cand.sources) ? (cand.sources as { url: string; kind: string }[]) : [];
  const sourceUrl =
    sources.find((s) => s.kind === "official")?.url ?? sources[0]?.url ?? null;

  // 5. Create the model (hidden until the admin fills it in)
  const { data: model, error: modelErr } = await sa
    .from("models")
    .insert({
      brand_id: cand.brand_id,
      category_id: categoryId,
      drive_id: driveId,
      slug,
      name: cand.name,
      is_available: false,
      source_url: sourceUrl,
    })
    .select("id")
    .single();

  if (modelErr || !model) {
    return NextResponse.json(
      { error: modelErr?.message ?? "modell létrehozása sikertelen" },
      { status: 500 },
    );
  }

  // 6. Mark candidate promoted
  await sa
    .from("discovered_models")
    .update({
      status: "promoted",
      promoted_model_id: model.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({ model_id: model.id });
}
