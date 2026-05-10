import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model_id = searchParams.get("model_id");
  const filename = searchParams.get("filename") ?? "upload.pdf";

  if (!model_id) {
    return NextResponse.json({ error: "model_id kötelező" }, { status: 400 });
  }

  const sa = supabaseAdmin();
  const safeName = filename.replace(/[^a-z0-9.\-_]/gi, "_");
  const path = `${model_id}/${Date.now()}-${safeName}`;

  const { data, error } = await sa.storage
    .from("pdf-uploads")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[cms/presign] Supabase error:", error);
    return NextResponse.json(
      { error: `Presigned URL hiba: ${error?.message ?? "ismeretlen"}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ path, signedUrl: data.signedUrl });
}
