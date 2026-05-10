import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const OK_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
]);
const KINDS = new Set([
  "exterior","interior","dashboard","rear","trunk","gallery","hero",
]);

function extFromType(t: string): string {
  if (t === "image/jpeg") return "jpg";
  return t.split("/")[1] || "bin";
}

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  const modelId = fd.get("model_id");
  const kindRaw = (fd.get("kind") as string) || "exterior";
  const isPrimary = (fd.get("is_primary") as string) === "true";

  if (!file || typeof modelId !== "string" || !modelId) {
    return NextResponse.json({ error: "missing file or model_id" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "max 10 MB" }, { status: 400 });
  }
  if (!OK_TYPES.has(file.type)) {
    return NextResponse.json({ error: "csak PNG/JPEG/WEBP/AVIF" }, { status: 400 });
  }
  if (!KINDS.has(kindRaw)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  const sa = supabaseAdmin();
  const m = await sa
    .from("models")
    .select("slug, brand:brands(slug)")
    .eq("id", modelId)
    .single();
  if (m.error || !m.data) {
    return NextResponse.json({ error: "modell nem található" }, { status: 404 });
  }

  const brand = (m.data as unknown as { brand: { slug: string } | null }).brand;
  const brandSlug = brand?.slug ?? "unknown";
  const ext = extFromType(file.type);
  const path = `${brandSlug}/${m.data.slug}/${kindRaw}-${Date.now()}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const up = await sa.storage
    .from("car-photos")
    .upload(path, buf, { contentType: file.type, upsert: false });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

  // If marking as primary, unset previous primary on this model.
  if (isPrimary) {
    await sa
      .from("model_photos")
      .update({ is_primary: false })
      .eq("model_id", modelId)
      .eq("is_primary", true);
  }

  const ins = await sa
    .from("model_photos")
    .insert({
      model_id: modelId,
      kind: kindRaw,
      storage_path: path,
      is_primary: isPrimary,
    })
    .select("*")
    .single();
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, storage_path: path, row: ins.data });
}
