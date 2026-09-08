// Data access layer. All page-facing fetches go through these helpers so the
// pages don't care whether data comes from Postgres or the local seed fallback.
//
// • If DATABASE_URL is set, queries hit the tables / v_models view over the
//   read-only connection (dbRo).
// • Otherwise we serve the local seed dataset (handy for local preview).
//
// All return values strictly conform to the SQL column shapes (snake_case),
// so the components can be authored against one schema.

import { cache } from "react";
import { dbRo, HAS_DB } from "./db";
import {
  BRANDS as SEED_BRANDS,
  CATEGORIES as SEED_CATS,
  DRIVES as SEED_DRIVES,
  MODELS as SEED_MODELS,
  PRICE_BANDS as SEED_BANDS,
  ARTICLE_INDEX,
  trimsForModel as seedTrimsForModel,
} from "@/data/seed";
import type {
  Brand,
  Category,
  Dealer,
  DealerContact,
  Drive,
  ModelEngineOption,
  ModelPhoto,
  ModelRow,
  ModelTrim,
  PriceBand,
} from "./types";

// Client-safe URL helpers live in media-urls.ts; re-exported here so existing
// SERVER imports keep working. Client components import media-urls directly.
export { photoUrl, brandLogoUrl } from "./media-urls";

// -----------------------------------------------------------------------------
// Lookups
// -----------------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  if (HAS_DB) {
    try {
      return await dbRo()<Category[]>`
        select id, slug, label_hu, sort_order from categories order by sort_order`;
    } catch {}
  }
  return [...SEED_CATS].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getDrives(): Promise<Drive[]> {
  if (HAS_DB) {
    try {
      return await dbRo()<Drive[]>`
        select id, slug, label_hu, short_code, sort_order from drives order by sort_order`;
    } catch {}
  }
  return [...SEED_DRIVES].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getPriceBands(): Promise<PriceBand[]> {
  if (HAS_DB) {
    try {
      return await dbRo()<PriceBand[]>`
        select id, min_m_ft, max_m_ft, label_hu, sort_order from price_bands order by sort_order`;
    } catch {}
  }
  return [...SEED_BANDS].sort((a, b) => a.sort_order - b.sort_order);
}

// -----------------------------------------------------------------------------
// Brands
// -----------------------------------------------------------------------------

async function fetchBrandLogoMap(): Promise<Record<string, string>> {
  if (!HAS_DB) return {};
  try {
    const rows = await dbRo()<{ brand_id: string; storage_path: string }[]>`
      select brand_id, storage_path from brand_logos where variant = 'primary'`;
    const map: Record<string, string> = {};
    for (const r of rows) if (!map[r.brand_id]) map[r.brand_id] = r.storage_path;
    return map;
  } catch {
    return {};
  }
}

export async function getBrands(): Promise<Brand[]> {
  if (HAS_DB) {
    try {
      const [brands, logoMap] = await Promise.all([
        dbRo()<Brand[]>`select * from brands where is_active order by sort_order`,
        fetchBrandLogoMap(),
      ]);
      return brands.map((b) => ({ ...b, logo_path: logoMap[b.id] ?? null }));
    } catch {}
  }
  return [...SEED_BRANDS].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const all = await getBrands();
  return all.find((b) => b.slug === slug) ?? null;
}

// -----------------------------------------------------------------------------
// Models
// -----------------------------------------------------------------------------

export async function getModels(): Promise<ModelRow[]> {
  if (HAS_DB) {
    try {
      // Archived models are filtered by the v_models view (archived_at is null).
      const [rows, options] = await Promise.all([
        dbRo()<ModelRow[]>`select * from v_models`,
        getAllEngineOptions(),
      ]);
      return attachEngineOptions(rows, options);
    } catch {}
  }
  return SEED_MODELS;
}

export async function getModelByBrandAndSlug(
  brandSlug: string,
  modelSlug: string,
): Promise<ModelRow | null> {
  const all = await getModels();
  return all.find((m) => m.brand_slug === brandSlug && m.slug === modelSlug) ?? null;
}

// Match by display name (used when the UI passes "Brand·Model Name").
export async function getModelByBrandAndName(
  brandName: string,
  modelName: string,
): Promise<ModelRow | null> {
  const all = await getModels();
  return all.find((m) => m.brand_name === brandName && m.name === modelName) ?? null;
}

// -----------------------------------------------------------------------------
// Engine options (model variants)
// -----------------------------------------------------------------------------

export async function getEngineOptionsForModel(modelId: string): Promise<ModelEngineOption[]> {
  if (HAS_DB) {
    try {
      return await dbRo()<ModelEngineOption[]>`
        select * from model_engine_options where model_id = ${modelId} order by sort_order`;
    } catch {}
  }
  return [];
}

export async function getAllEngineOptions(): Promise<ModelEngineOption[]> {
  if (HAS_DB) {
    try {
      return await dbRo()<ModelEngineOption[]>`
        select * from model_engine_options order by model_id, sort_order`;
    } catch {}
  }
  return [];
}

// Group engine options by model_id and attach them to each ModelRow.
// Models without options get an empty array.
export function attachEngineOptions(models: ModelRow[], options: ModelEngineOption[]): ModelRow[] {
  const byModel = new Map<string, ModelEngineOption[]>();
  for (const o of options) {
    const arr = byModel.get(o.model_id) ?? [];
    arr.push(o);
    byModel.set(o.model_id, arr);
  }
  return models.map((m) => ({ ...m, engine_options: byModel.get(m.id) ?? [] }));
}

export async function getTrimsForModel(modelId: string): Promise<ModelTrim[]> {
  if (HAS_DB) {
    try {
      const rows = await dbRo()<ModelTrim[]>`
        select * from model_trims where model_id = ${modelId} order by sort_order`;
      return rows.map((t) => ({
        ...t,
        features: Array.isArray(t.features) ? (t.features as string[]) : [],
      }));
    } catch {}
  }
  // Seed fallback
  const all = await getModels();
  const m = all.find((x) => x.id === modelId);
  if (!m) return [];
  return seedTrimsForModel(m);
}

// -----------------------------------------------------------------------------
// Site / page settings
// -----------------------------------------------------------------------------

export async function getDataLastUpdated(): Promise<string> {
  if (HAS_DB) {
    try {
      const [row] = await dbRo()<{ last_updated_at: string | null }[]>`
        select last_updated_at from v_data_freshness limit 1`;
      if (row?.last_updated_at) return formatDate(String(row.last_updated_at));
    } catch {}
  }
  // Newest data_updated_at in seed
  const newest = SEED_MODELS.map((m) => m.data_updated_at).filter(Boolean).sort().at(-1);
  return formatDate(newest ?? "2026-05-04");
}

function formatDate(iso: string): string {
  // "2026-05-04" → "2026.05.04"
  return iso.slice(0, 10).replace(/-/g, ".");
}

// -----------------------------------------------------------------------------
// Articles index (Tudástár)
// -----------------------------------------------------------------------------

export async function getArticleIndex() {
  // For now, articles index is identical regardless of source — bodies live in DB only.
  return ARTICLE_INDEX;
}

// -----------------------------------------------------------------------------
// Photos
// -----------------------------------------------------------------------------

const PHOTO_COLS = "id, model_id, storage_path, is_primary, kind, sort_order";

export async function getPhotosForModel(modelId: string): Promise<ModelPhoto[]> {
  if (HAS_DB) {
    try {
      return await dbRo()<ModelPhoto[]>`
        select ${dbRo().unsafe(PHOTO_COLS)} from model_photos
        where model_id = ${modelId} order by sort_order`;
    } catch {}
  }
  return [];
}

export async function getPhotoMapForModels(modelIds: string[]): Promise<Record<string, ModelPhoto[]>> {
  if (modelIds.length === 0 || !HAS_DB) return {};
  try {
    const rows = await dbRo()<ModelPhoto[]>`
      select ${dbRo().unsafe(PHOTO_COLS)} from model_photos
      where model_id = any(${modelIds}) order by sort_order`;
    const map: Record<string, ModelPhoto[]> = {};
    for (const p of rows) (map[p.model_id] ??= []).push(p);
    return map;
  } catch {
    return {};
  }
}

// -----------------------------------------------------------------------------
// Dealers
// -----------------------------------------------------------------------------

// dealer_contacts embedded as a JSON array, sorted, '[]' when none —
// same shape the PostgREST `contacts:dealer_contacts(*)` embed produced.
const DEALER_SELECT = `
  d.*,
  coalesce(
    (select json_agg(c order by c.sort_order)
       from dealer_contacts c where c.dealer_id = d.id),
    '[]'::json) as contacts`;

export async function getDealersForBrand(brandId: string): Promise<Dealer[]> {
  if (HAS_DB) {
    try {
      const rows = await dbRo()<Dealer[]>`
        select ${dbRo().unsafe(DEALER_SELECT)}
        from dealers d
        where d.brand_id = ${brandId} and d.is_active
        order by d.sort_order`;
      return rows.map((d) => ({
        ...d,
        contacts: (d.contacts ?? []).sort((a: DealerContact, b: DealerContact) => a.sort_order - b.sort_order),
      }));
    } catch {}
  }
  return [];
}

export async function getAllDealers(): Promise<(Dealer & { brand_name: string; brand_slug: string })[]> {
  if (HAS_DB) {
    try {
      // Also expose the nested `brand` object the old embed returned, plus flat
      // brand_name/brand_slug to match the declared return type.
      return await dbRo()<(Dealer & { brand_name: string; brand_slug: string })[]>`
        select ${dbRo().unsafe(DEALER_SELECT)},
          b.name as brand_name, b.slug as brand_slug,
          json_build_object('name', b.name, 'slug', b.slug) as brand
        from dealers d
        join brands b on b.id = d.brand_id
        where d.is_active
        order by d.sort_order`;
    } catch {}
  }
  return [];
}

// -----------------------------------------------------------------------------
// Per-request cached wrappers (React.cache — dedupes identical calls within one
// server render pass, e.g. generateMetadata + page component both calling getBrands)
// -----------------------------------------------------------------------------
export const getCachedBrands = cache(getBrands);
export const getCachedModels = cache(getModels);
