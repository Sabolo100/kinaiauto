import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/** Whitelisted keys that can be updated via this endpoint */
const ALLOWED_KEYS = new Set<string>([
  "resend_api_key",
  "resend_from_email",
  "resend_from_name",
  "quote_max_dealers_per_brand",
  "quote_email_subject_template",
  "quote_email_body_template",
]);

export async function GET() {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("site_settings")
    .select("key, value")
    .in("key", Array.from(ALLOWED_KEYS));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const out: Record<string, string> = {};
  for (const row of data ?? []) {
    out[(row as { key: string }).key] = (row as { value: string | null }).value ?? "";
  }
  return NextResponse.json({ data: out });
}

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const sa = supabaseAdmin();
  const rows: { key: string; value: string; updated_at: string }[] = [];
  const now = new Date().toISOString();

  for (const [k, v] of Object.entries(body)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    if (typeof v !== "string") continue;
    rows.push({ key: k, value: v, updated_at: now });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Nincs menthető mező." }, { status: 400 });
  }

  const { error } = await sa
    .from("site_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, saved: rows.length });
}
