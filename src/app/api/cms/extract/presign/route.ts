import { NextRequest, NextResponse } from "next/server";
import { presignUpload } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model_id = searchParams.get("model_id");
  const filename = searchParams.get("filename") ?? "upload.pdf";
  if (!model_id) return NextResponse.json({ error: "model_id kötelező" }, { status: 400 });

  const safeName = filename.replace(/[^a-z0-9.\-_]/gi, "_");
  const path = `${model_id}/${Date.now()}-${safeName}`;

  try {
    // Presigned PUT — the client does fetch(signedUrl, { method: "PUT", body }).
    const signedUrl = await presignUpload("pdf-uploads", path);
    return NextResponse.json({ path, signedUrl });
  } catch (e) {
    console.error("[cms/presign] storage error:", e);
    return NextResponse.json(
      { error: `Presigned URL hiba: ${(e as Error).message ?? "ismeretlen"}` },
      { status: 500 },
    );
  }
}
