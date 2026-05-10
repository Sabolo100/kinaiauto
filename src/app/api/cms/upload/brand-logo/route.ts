import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const OK_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/avif",
]);

function extFromType(t: string): string {
  if (t === "image/svg+xml") return "svg";
  if (t === "image/jpeg") return "jpg";
  return t.split("/")[1] || "bin";
}

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  const brandId = fd.get("brand_id");
  const variant = (fd.get("variant") as string) || "primary";

  if (!file || typeof brandId !== "string" || !brandId) {
    return NextResponse.json({ error: "missing file or brand_id" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "max 5 MB" }, { status: 400 });
  }
  if (!OK_TYPES.has(file.type)) {
    return NextResponse.json({ error: "csak PNG/JPEG/WEBP/SVG/AVIF" }, { status: 400 });
  }

  const sa = supabaseAdmin();
  const brand = await sa.from("brands").select("slug").eq("id", brandId).single();
  if (brand.error || !brand.data) {
    return NextResponse.json({ error: "brand nem található" }, { status: 404 });
  }

  const ext = extFromType(file.type);
  const path = `${brand.data.slug}/${variant}-${Date.now()}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const up = await sa.storage
    .from("brand-logos")
    .upload(path, buf, { contentType: file.type, upsert: false });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

  const ins = await sa
    .from("brand_logos")
    .insert({ brand_id: brandId, variant, storage_path: path })
    .select("*")
    .single();
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, storage_path: path, row: ins.data });
}
