import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf-text";
import { fetchUrlText } from "@/lib/url-text";
import {
  extractDealerWith, extractDealerWithVision,
  type LlmProvider, type VisionMediaType,
} from "@/lib/llm-extract";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const j = await req.json().catch(() => null);
    if (!j) return NextResponse.json({ error: "invalid body" }, { status: 400 });

    const payload = j as {
      provider: LlmProvider;
      source_kind: "url" | "pdf" | "image";
      url?: string;
      storage_path?: string;
      source_filename?: string;
      image_media_type?: string;
      brand_hint?: string;
    };

    const hint = payload.brand_hint ? `Brand: ${payload.brand_hint}` : "";
    let rawText = "";
    let visionBase64 = "";
    let visionMediaType: VisionMediaType = "image/jpeg";
    let useVision = false;

    const sa = supabaseAdmin();

    if (payload.source_kind === "url") {
      if (!payload.url) return NextResponse.json({ error: "URL kötelező" }, { status: 400 });
      const f = await fetchUrlText(payload.url);
      rawText = f.text;
    } else if (payload.source_kind === "pdf" || payload.source_kind === "image") {
      if (!payload.storage_path) return NextResponse.json({ error: "storage_path hiányzik" }, { status: 400 });
      const dl = await sa.storage.from("pdf-uploads").download(payload.storage_path);
      if (dl.error || !dl.data) return NextResponse.json({ error: "Letöltési hiba" }, { status: 400 });
      const buf = Buffer.from(await dl.data.arrayBuffer());

      if (payload.source_kind === "image") {
        visionBase64 = buf.toString("base64");
        visionMediaType = (payload.image_media_type ?? "image/jpeg") as VisionMediaType;
        useVision = true;
      } else {
        rawText = await extractPdfText(buf);
        if (rawText.length < 80) {
          visionBase64 = buf.toString("base64");
          visionMediaType = "application/pdf";
          useVision = true;
        }
      }
    }

    const out = useVision
      ? await extractDealerWithVision(visionBase64, visionMediaType, hint, payload.provider)
      : await extractDealerWith(payload.provider, rawText, hint);

    return NextResponse.json({ ok: true, data: out.json, model: out.model });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message ?? "Szerver hiba" }, { status: 500 });
  }
}
