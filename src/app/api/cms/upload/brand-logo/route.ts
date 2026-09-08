import { NextRequest, NextResponse } from "next/server";
import { db, insertOne } from "@/lib/db";
import { uploadObject } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const OK_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/avif"]);

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
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "max 5 MB" }, { status: 400 });
  if (!OK_TYPES.has(file.type)) return NextResponse.json({ error: "csak PNG/JPEG/WEBP/SVG/AVIF" }, { status: 400 });

  const [brand] = await db()<{ slug: string }[]>`select slug from brands where id = ${brandId}`;
  if (!brand) return NextResponse.json({ error: "brand nem található" }, { status: 404 });

  const ext = extFromType(file.type);
  const path = `${brand.slug}/${variant}-${Date.now()}.${ext}`;

  try {
    await uploadObject("brand-logos", path, Buffer.from(await file.arrayBuffer()), file.type);
    const row = await insertOne("brand_logos", { brand_id: brandId, variant, storage_path: path });
    return NextResponse.json({ ok: true, storage_path: path, row });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
