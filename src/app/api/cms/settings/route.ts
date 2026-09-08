import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
  try {
    const rows = await db()<{ key: string; value: string | null }[]>`
      select key, value from site_settings where key = any(${Array.from(ALLOWED_KEYS)})`;
    const out: Record<string, string> = {};
    for (const row of rows) out[row.key] = row.value ?? "";
    return NextResponse.json({ data: out });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

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

  try {
    const sql = db();
    await sql`
      insert into site_settings ${sql(rows)}
      on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`;
    return NextResponse.json({ ok: true, saved: rows.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
