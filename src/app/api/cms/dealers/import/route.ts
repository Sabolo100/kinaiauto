import { NextRequest, NextResponse } from "next/server";
import { db, jsonb } from "@/lib/db";

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

type ImportBody = { rows: ImportRow[]; clear_first?: boolean; dry_run?: boolean };

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

  const sql = db();

  // Load all brands: slug -> id map
  let brands: { id: string; slug: string }[];
  try {
    brands = await sql<{ id: string; slug: string }[]>`select id, slug from brands`;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  const slugToId = new Map(brands.map((b) => [b.slug, b.id]));

  // Build resolved rows (one per brand_slug per ImportRow)
  type ResolvedRow = {
    brand_id: string; brand_slug: string; name: string; city: string;
    zip_code: string | null; street: string | null; lat: number | null; lng: number | null;
    email: string | null; phone: string | null; website: string | null; notes: string | null;
    extra_emails: string[]; extra_phones: string[]; source_url: string | null;
    data_quality: string | null; data_source: string | null; last_checked_at: string | null;
    is_active: boolean; sort_order: number;
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
        brand_id, brand_slug: slug,
        name: row.name || "", city: row.city || "",
        zip_code: row.zip_code || null, street: row.street || null,
        lat: row.lat, lng: row.lng,
        email: row.email || null, phone: row.phone || null,
        website: row.website || null, notes: row.notes || null,
        extra_emails: row.extra_emails ?? [], extra_phones: row.extra_phones ?? [],
        source_url: row.source_url || null, data_quality: row.data_quality || null,
        data_source: row.data_source || null, last_checked_at: row.last_checked_at || null,
        is_active: true, sort_order: 0,
      });
    }
  }

  if (dry_run) {
    return NextResponse.json({ ok: true, dry_run: true, would_insert: resolvedRows.length, skipped, errors, rows: resolvedRows });
  }

  if (clear_first) {
    try {
      await sql`delete from dealers`;
    } catch (e) {
      return NextResponse.json({ error: `Delete failed: ${(e as Error).message}` }, { status: 500 });
    }
  }

  // Insert in batches of 50
  const BATCH = 50;
  let imported = 0;
  for (let i = 0; i < resolvedRows.length; i += BATCH) {
    // extra_emails / extra_phones are jsonb arrays → jsonb() (a raw JS array would be sent as text[]).
    const batch = resolvedRows.slice(i, i + BATCH).map(({ brand_slug: _slug, extra_emails, extra_phones, ...rest }) => ({
      ...rest, extra_emails: jsonb(extra_emails), extra_phones: jsonb(extra_phones),
    }));
    try {
      await sql`insert into dealers ${sql(batch)}`;
      imported += batch.length;
    } catch (e) {
      errors.push(`Insert batch ${Math.floor(i / BATCH) + 1} error: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ ok: true, imported, skipped, errors });
}
