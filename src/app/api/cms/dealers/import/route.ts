import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

export type ImportRow = {
  brand_slugs: string[];
  name: string;
  zip_code: string;
  city: string;
  street: string;
  email: string;
  extra_emails: string[];
  phone: string;
  extra_phones: string[];
  website: string;
  lat: number | null;
  lng: number | null;
  source_url: string;
  data_quality: string;
  data_source: string;
  notes: string;
  last_checked_at: string | null;
};

type ImportBody = {
  rows: ImportRow[];
  clear_first?: boolean;
  dry_run?: boolean;
};

export async function POST(req: NextRequest) {
  let body: ImportBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { rows, clear_first = false, dry_run = false } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows array required" }, { status: 400 });
  }

  const sa = supabaseAdmin();

  // Load all brands: slug -> id map
  const { data: brands, error: brandsErr } = await sa
    .from("brands")
    .select("id, slug");
  if (brandsErr) {
    return NextResponse.json({ error: brandsErr.message }, { status: 500 });
  }

  const slugToId = new Map<string, string>(
    (brands ?? []).map((b: { id: string; slug: string }) => [b.slug, b.id])
  );

  // Build resolved rows (one per brand_slug per ImportRow)
  type ResolvedRow = {
    brand_id: string;
    brand_slug: string;
    name: string;
    city: string;
    zip_code: string | null;
    street: string | null;
    lat: number | null;
    lng: number | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    notes: string | null;
    extra_emails: string[];
    extra_phones: string[];
    source_url: string | null;
    data_quality: string | null;
    data_source: string | null;
    last_checked_at: string | null;
    is_active: boolean;
    sort_order: number;
  };

  const resolvedRows: ResolvedRow[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (const row of rows) {
    for (const slug of row.brand_slugs) {
      const brand_id = slugToId.get(slug);
      if (!brand_id) {
        errors.push(`Brand slug not found: "${slug}" (dealer: "${row.name}")`);
        skipped++;
        continue;
      }
      resolvedRows.push({
        brand_id,
        brand_slug: slug,
        name: row.name || "",
        city: row.city || "",
        zip_code: row.zip_code || null,
        street: row.street || null,
        lat: row.lat,
        lng: row.lng,
        email: row.email || null,
        phone: row.phone || null,
        website: row.website || null,
        notes: row.notes || null,
        extra_emails: row.extra_emails ?? [],
        extra_phones: row.extra_phones ?? [],
        source_url: row.source_url || null,
        data_quality: row.data_quality || null,
        data_source: row.data_source || null,
        last_checked_at: row.last_checked_at || null,
        is_active: true,
        sort_order: 0,
      });
    }
  }

  if (dry_run) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      would_insert: resolvedRows.length,
      skipped,
      errors,
      rows: resolvedRows,
    });
  }

  if (clear_first) {
    const { error: delErr } = await sa.from("dealers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (delErr) {
      return NextResponse.json({ error: `Delete failed: ${delErr.message}` }, { status: 500 });
    }
  }

  // Insert in batches of 50
  const BATCH = 50;
  let imported = 0;
  for (let i = 0; i < resolvedRows.length; i += BATCH) {
    const batch = resolvedRows.slice(i, i + BATCH).map(({ brand_slug: _slug, ...rest }) => rest);
    const { error: insErr } = await sa.from("dealers").insert(batch);
    if (insErr) {
      errors.push(`Insert batch ${Math.floor(i / BATCH) + 1} error: ${insErr.message}`);
    } else {
      imported += batch.length;
    }
  }

  return NextResponse.json({
    ok: true,
    imported,
    skipped,
    errors,
  });
}
