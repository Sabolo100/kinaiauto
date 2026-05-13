import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { extractPdfText } from "@/lib/pdf-text";
import { fetchUrlText } from "@/lib/url-text";
import { extractWith, extractWithVision, type LlmProvider } from "@/lib/llm-extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    return await handlePost(req);
  } catch (fatal) {
    console.error("[cms/extract] Unhandled exception:", fatal);
    return NextResponse.json(
      { error: `Szerver hiba: ${(fatal as Error)?.message ?? String(fatal)}` },
      { status: 500 },
    );
  }
}

async function handlePost(req: NextRequest) {
  const j = await req.json().catch(() => null);
  if (!j) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const payload = j as {
    model_id: string;
    provider: LlmProvider;
    source_kind: "pdf" | "url" | "image";
    // PDF / image: storage_path + source_filename from presigned upload
    storage_path?: string;
    source_filename?: string;
    // image only: MIME type
    image_media_type?: string;
    // URL
    url?: string;
  };

  if (!payload.model_id) {
    return NextResponse.json({ error: "model_id kötelező" }, { status: 400 });
  }
  if (payload.provider !== "claude" && payload.provider !== "openai") {
    return NextResponse.json({ error: "ismeretlen provider" }, { status: 400 });
  }

  const sa = supabaseAdmin();
  const m = await sa
    .from("models")
    .select("*, brand:brands(name,slug)")
    .eq("id", payload.model_id)
    .single();
  if (m.error || !m.data) {
    return NextResponse.json({ error: "modell nem található" }, { status: 404 });
  }

  const r = m.data as Record<string, unknown> & { brand: { name: string; slug: string } | null };
  const hint = [
    `Brand: ${r.brand?.name ?? "-"}`,
    `Model: ${r.name}`,
    `Slug: ${r.brand?.slug ?? "-"}/${r.slug}`,
    `Current power_hp: ${r.power_hp ?? "-"}`,
    `Current battery_kwh: ${r.battery_kwh ?? "-"}`,
    `Current range_km: ${r.range_km ?? "-"}`,
  ].join("\n");

  let rawText = "";
  let imageBase64 = "";
  let imageMediaType = "";
  let storage_path: string | null = null;
  let source_filename: string | null = null;
  let source_url: string | null = null;

  try {
    if (payload.source_kind === "pdf") {
      if (!payload.storage_path) {
        return NextResponse.json(
          { error: "storage_path hiányzik — a PDF feltöltés nem fejeződött be" },
          { status: 400 },
        );
      }

      // Download from Supabase Storage (private bucket, no Vercel body limit)
      const dl = await sa.storage.from("pdf-uploads").download(payload.storage_path);
      if (dl.error || !dl.data) {
        return NextResponse.json(
          { error: `PDF letöltési hiba a Storage-ból: ${dl.error?.message ?? "ismeretlen"}` },
          { status: 400 },
        );
      }

      const buf = Buffer.from(await dl.data.arrayBuffer());
      rawText = await extractPdfText(buf);
      storage_path = payload.storage_path;
      source_filename = payload.source_filename ?? storage_path.split("/").pop() ?? "upload.pdf";
    } else if (payload.source_kind === "image") {
      if (!payload.storage_path) {
        return NextResponse.json(
          { error: "storage_path hiányzik — a kép feltöltése nem fejeződött be" },
          { status: 400 },
        );
      }

      const dl = await sa.storage.from("pdf-uploads").download(payload.storage_path);
      if (dl.error || !dl.data) {
        return NextResponse.json(
          { error: `Kép letöltési hiba a Storage-ból: ${dl.error?.message ?? "ismeretlen"}` },
          { status: 400 },
        );
      }

      const buf = Buffer.from(await dl.data.arrayBuffer());
      imageBase64 = buf.toString("base64");
      imageMediaType = payload.image_media_type ?? "image/jpeg";
      storage_path = payload.storage_path;
      source_filename = payload.source_filename ?? storage_path.split("/").pop() ?? "upload.jpg";
      rawText = `[image: ${source_filename}]`; // placeholder stored in DB
    } else {
      if (!payload.url) {
        return NextResponse.json({ error: "URL kötelező" }, { status: 400 });
      }
      const fetched = await fetchUrlText(payload.url);
      rawText = fetched.text;
      source_url = fetched.url;
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Forrás-feldolgozás hibája: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  // Text-based sources need minimum content; images skip this check
  if (payload.source_kind !== "image" && (!rawText || rawText.length < 80)) {
    return NextResponse.json(
      {
        error: `A forrásból nem sikerült értelmes szöveget kinyerni. (${rawText.length} karakter — lehet, hogy beolvasott/képalapú PDF?)`,
      },
      { status: 422 },
    );
  }

  const llmProviderLabel = payload.provider === "claude" ? "claude-sonnet-4-6" : "gpt-4.5";
  let parsed: Record<string, unknown> = {};
  let llmModel = "";
  let status: "pending" | "failed" = "pending";
  let errorMessage: string | null = null;

  try {
    const out =
      payload.source_kind === "image"
        ? await extractWithVision(payload.provider, imageBase64, imageMediaType, hint)
        : await extractWith(payload.provider, rawText, hint);
    parsed = out.json as Record<string, unknown>;
    llmModel = out.model;
  } catch (e) {
    status = "failed";
    errorMessage = `[${payload.provider} / ${llmProviderLabel}] ${(e as Error).message ?? String(e)}`;
    console.error("[cms/extract] LLM error:", errorMessage);
  }

  const ins = await sa
    .from("model_extractions")
    .insert({
      model_id: payload.model_id,
      source_kind: payload.source_kind,
      source_url,
      source_filename,
      storage_path,
      llm_provider: payload.provider,
      llm_model: llmModel || llmProviderLabel,
      raw_text: rawText.slice(0, 200_000),
      parsed_json: parsed,
      status,
      error_message: errorMessage,
    })
    .select("*")
    .single();

  if (ins.error) {
    console.error("[cms/extract] Supabase insert error:", ins.error);
    return NextResponse.json(
      { error: `DB hiba: ${ins.error.message} (code: ${ins.error.code})` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: ins.data.id,
    status,
    error_message: errorMessage,
  });
}
