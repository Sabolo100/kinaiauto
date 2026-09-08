import { NextRequest, NextResponse } from "next/server";
import { db, insertOne } from "@/lib/db";
import { uploadObject } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const OK_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
const KINDS = new Set(["exterior","interior","dashboard","rear","trunk","gallery","hero"]);

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
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "max 10 MB" }, { status: 400 });
  if (!OK_TYPES.has(file.type)) return NextResponse.json({ error: "csak PNG/JPEG/WEBP/AVIF" }, { status: 400 });
  if (!KINDS.has(kindRaw)) return NextResponse.json({ error: "invalid kind" }, { status: 400 });

  const sql = db();
  const [m] = await sql<{ slug: string; brand_slug: string | null }[]>`
    select m.slug, b.slug as brand_slug from models m
    left join brands b on b.id = m.brand_id where m.id = ${modelId}`;
  if (!m) return NextResponse.json({ error: "modell nem található" }, { status: 404 });

  const brandSlug = m.brand_slug ?? "unknown";
  const ext = extFromType(file.type);
  const path = `${brandSlug}/${m.slug}/${kindRaw}-${Date.now()}.${ext}`;

  try {
    await uploadObject("car-photos", path, Buffer.from(await file.arrayBuffer()), file.type);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  try {
    // If marking as primary, unset previous primary on this model.
    if (isPrimary) {
      await sql`update model_photos set is_primary = false where model_id = ${modelId} and is_primary = true`;
    }
    const row = await insertOne("model_photos", {
      model_id: modelId, kind: kindRaw, storage_path: path, is_primary: isPrimary,
    });
    return NextResponse.json({ ok: true, storage_path: path, row });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
