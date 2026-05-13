export const dynamic = "force-dynamic";

import { Fragment } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PrintBtn } from "@/components/cms/print-btn";
import { CmsShell } from "@/components/cms/cms-shell";

// ─── types ───────────────────────────────────────────────────────────────────

type RawRow = {
  id: string;
  name: string;
  slug: string;
  is_available: boolean;
  price_min_m_ft: number | null;
  price_max_m_ft: number | null;
  power_hp: number | null;
  range_km: number | null;
  length_mm: number | null;
  battery_kwh: number | null;
  trunk_l: number | null;
  brand: { name: string; slug: string } | null;
  category: { label_hu: string } | null;
  drive: { label_hu: string } | null;
  photos: { id: string }[];
  trims: { id: string }[];
};

type ModelExport = {
  id: string;
  name: string;
  slug: string;
  brand_name: string;
  brand_slug: string;
  category: string;
  drive: string;
  price_min_m_ft: number | null;
  price_max_m_ft: number | null;
  is_available: boolean;
  photo_count: number;
  has_price: boolean;
  has_specs: boolean;
  has_trims: boolean;
};

type BrandGroup = {
  brand_name: string;
  brand_slug: string;
  models: ModelExport[];
};

// ─── data ────────────────────────────────────────────────────────────────────

async function fetchExportData(): Promise<BrandGroup[]> {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("models")
    .select(
      [
        "id, name, slug, is_available",
        "price_min_m_ft, price_max_m_ft",
        "power_hp, range_km, length_mm, battery_kwh, trunk_l",
        "brand:brands!inner(name, slug)",
        "category:categories(label_hu)",
        "drive:drives(label_hu)",
        "photos:model_photos(id)",
        "trims:model_trims(id)",
      ].join(", "),
    )
    .is("archived_at", null);

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawRow[];

  // Map to clean shape
  const mapped: ModelExport[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    brand_name: r.brand?.name ?? "—",
    brand_slug: r.brand?.slug ?? "",
    category: r.category?.label_hu ?? "—",
    drive: r.drive?.label_hu ?? "—",
    price_min_m_ft: r.price_min_m_ft,
    price_max_m_ft: r.price_max_m_ft,
    is_available: r.is_available,
    photo_count: r.photos?.length ?? 0,
    has_price: r.price_min_m_ft != null,
    has_specs:
      r.power_hp != null ||
      r.range_km != null ||
      r.length_mm != null ||
      r.battery_kwh != null,
    has_trims: (r.trims?.length ?? 0) > 0,
  }));

  // Sort: brand A–Z, then model A–Z within each brand
  mapped.sort(
    (a, b) =>
      a.brand_name.localeCompare(b.brand_name, "hu") ||
      a.name.localeCompare(b.name, "hu"),
  );

  // Group by brand
  const brandMap = new Map<string, BrandGroup>();
  for (const m of mapped) {
    if (!brandMap.has(m.brand_slug)) {
      brandMap.set(m.brand_slug, {
        brand_name: m.brand_name,
        brand_slug: m.brand_slug,
        models: [],
      });
    }
    brandMap.get(m.brand_slug)!.models.push(m);
  }

  return Array.from(brandMap.values());
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function Check({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span
      className={`export-check ${ok ? "ok" : "missing"}`}
      title={label}
    >
      {ok ? "✓" : "✗"}
    </span>
  );
}

function fmtPrice(v: number | null): string {
  if (v == null) return "—";
  return `${v.toFixed(1).replace(".", ",")} M`;
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function ExportPage() {
  const groups = await fetchExportData();

  const totalModels = groups.reduce((s, g) => s + g.models.length, 0);
  const withPhotos = groups.reduce(
    (s, g) => s + g.models.filter((m) => m.photo_count > 0).length,
    0,
  );
  const withSpecs = groups.reduce(
    (s, g) => s + g.models.filter((m) => m.has_specs).length,
    0,
  );
  const withTrims = groups.reduce(
    (s, g) => s + g.models.filter((m) => m.has_trims).length,
    0,
  );

  const today = new Date().toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <CmsShell>
      {/* ── toolbar (hidden when printing) ── */}
      <div className="cms-toolbar no-print">
        <h1 style={{ margin: 0 }}>Export / Nyomtatás</h1>
        <div style={{ flex: 1 }} />
        <PrintBtn />
      </div>

      {/* ── print-only header ── */}
      <div className="print-only export-print-header">
        <strong>kinaiauto.com — Modell-áttekintő</strong>
        <span>{today}</span>
      </div>

      {/* ── summary bar ── */}
      <div className="export-summary no-print">
        <span>{groups.length} márka · {totalModels} modell</span>
        <span>Fotó: {withPhotos}/{totalModels}</span>
        <span>Adatok: {withSpecs}/{totalModels}</span>
        <span>Felszereltségek: {withTrims}/{totalModels}</span>
      </div>

      {/* ── the printable table ── */}
      <div className="export-wrap">
        <table className="export-table">
          <thead>
            <tr>
              <th className="col-brand">Márka</th>
              <th className="col-model">Modell</th>
              <th className="col-cat">Kategória</th>
              <th className="col-drive">Hajtás</th>
              <th className="col-price">Ár (min–max)</th>
              <th className="col-check" title="Fotók feltöltve">Fotó</th>
              <th className="col-check" title="Műszaki adatok kitöltve">Adatok</th>
              <th className="col-check" title="Felszereltségi szintek rögzítve">Trimek</th>
              <th className="col-avail">Státusz</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g.brand_slug}>
                {/* Brand header row */}
                <tr className="export-brand-row">
                  <td colSpan={9}>
                    <strong>{g.brand_name}</strong>
                    <span className="export-brand-count">
                      {g.models.length} modell
                    </span>
                  </td>
                </tr>

                {/* Model rows */}
                {g.models.map((m) => (
                  <tr
                    key={m.id}
                    className={`export-model-row${!m.is_available ? " unavailable" : ""}`}
                  >
                    <td className="col-brand" />
                    <td className="col-model">{m.name}</td>
                    <td className="col-cat">{m.category}</td>
                    <td className="col-drive">{m.drive}</td>
                    <td className="col-price">
                      {m.has_price
                        ? `${fmtPrice(m.price_min_m_ft)} – ${fmtPrice(m.price_max_m_ft)} M Ft`
                        : <span className="export-missing">—</span>}
                    </td>
                    <td className="col-check">
                      <Check ok={m.photo_count > 0} label={`${m.photo_count} fotó`} />
                    </td>
                    <td className="col-check">
                      <Check ok={m.has_specs} label="Műszaki adatok" />
                    </td>
                    <td className="col-check">
                      <Check ok={m.has_trims} label="Felszereltségi szintek" />
                    </td>
                    <td className="col-avail">
                      {m.is_available ? "Aktív" : "Rejtett"}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── print footer ── */}
      <div className="print-only export-print-footer">
        kinaiauto.com · {today} · {totalModels} modell / {groups.length} márka ·
        Fotó: {withPhotos} · Adatok: {withSpecs} · Trimek: {withTrims}
      </div>
    </CmsShell>
  );
}
