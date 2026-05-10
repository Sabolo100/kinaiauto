import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { extractPdfText } from "@/lib/pdf-text";
import { fetchUrlText } from "@/lib/url-text";
import {
  extractWith,
  type LlmProvider,
} from "@/lib/llm-extract";

export const runtime = "nodejs";
export const maxDuration = 60;

const PDF_MAX = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  let payload: {
    model_id: string;
    provider: LlmProvider;
    source_kind: "pdf" | "url";
    url?: string;
    file?: File | null;
  };

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    payload = {
      model_id: String(fd.get("model_id") || ""),
      provider: (String(fd.get("provider") || "claude") as LlmProvider),
      source_kind: (String(fd.get("source_kind") || "pdf") as "pdf" | "url"),
      url: fd.get("url") ? String(fd.get("url")) : undefined,
      file: fd.get("file") as File | null,
    };
  } else {
    const j = await req.json().catch(() => null);
    if (!j) return NextResponse.json({ error: "invalid body" }, { status: 400 });
    payload = j;
  }

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

  // Build hint string from current model state for the LLM context.
  const r = m.data as Record<string, unknown> & { brand: { name: string; slug: string } | null };
  const hint = [
    `Brand: ${r.brand?.name ?? "-"}`,
    `Model: ${r.name}`,
    `Slug: ${r.brand?.slug ?? "-"}/${r.slug}`,
    `Current power_hp: ${r.power_hp ?? "-"}`,
    `Current battery_kwh: ${r.battery_kwh ?? "-"}`,
    `Current range_km: ${r.range_km ?? "-"}`,
  ].join("\n");

  // 1) Get raw text + (for PDFs) optionally store the file.
  let rawText = "";
  let storage_path: string | null = null;
  let source_filename: string | null = null;
  let source_url: string | null = null;

  try {
    if (payload.source_kind === "pdf") {
      if (!payload.file) {
        return NextResponse.json({ error: "nincs PDF csatolva" }, { status: 400 });
      }
      if (payload.file.size > PDF_MAX) {
        return NextResponse.json({ error: "PDF max 25 MB" }, { status: 400 });
      }
      if (payload.file.type && payload.file.type !== "application/pdf") {
        return NextResponse.json({ error: "csak PDF" }, { status: 400 });
      }
      const buf = Buffer.from(await payload.file.arrayBuffer());
      rawText = await extractPdfText(buf);
      source_filename = payload.file.name || "upload.pdf";
      storage_path = `${payload.model_id}/${Date.now()}-${source_filename.replace(/[^a-z0-9.\-_]/gi, "_")}`;
      const up = await sa.storage
        .from("pdf-uploads")
        .upload(storage_path, buf, { contentType: "application/pdf", upsert: false });
      if (up.error) {
        // non-fatal — keep extraction even if archive upload fails
        storage_path = null;
      }
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

  if (!rawText || rawText.length < 80) {
    return NextResponse.json(
      { error: "A forrásból nem sikerült értelmes szöveget kinyerni." },
      { status: 422 },
    );
  }

  // 2) Run LLM extraction.
  let parsed: Record<string, unknown> = {};
  let llmModel = "";
  let status: "pending" | "failed" = "pending";
  let errorMessage: string | null = null;
  try {
    const out = await extractWith(payload.provider, rawText, hint);
    parsed = out.json as Record<string, unknown>;
    llmModel = out.model;
  } catch (e) {
    status = "failed";
    errorMessage = (e as Error).message;
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
      llm_model: llmModel || null,
      raw_text: rawText.slice(0, 200_000),
      parsed_json: parsed,
      status,
      error_message: errorMessage,
    })
    .select("*")
    .single();
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: ins.data.id, status });
}
