// Data access layer. All page-facing fetches go through these helpers so the
// pages don't care whether data comes from Supabase or the local seed fallback.
//
// • If env vars are set, queries hit the v_models / brands / etc. views.
// • Otherwise we serve the local seed dataset (handy for local preview).
//
// All return values strictly conform to the SQL column shapes (snake_case),
// so the components can be authored against one schema.

import { supabase } from "./supabase";
import { HAS_SUPABASE } from "./env";
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
  Drive,
  ModelPhoto,
  ModelRow,
  ModelTrim,
  PriceBand,
} from "./types";

// -----------------------------------------------------------------------------
// Lookups
// -----------------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (!error && data) return data as Category[];
  }
  return [...SEED_CATS].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getDrives(): Promise<Drive[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from("drives")
      .select("*")
      .order("sort_order");
    if (!error && data) return data as Drive[];
  }
  return [...SEED_DRIVES].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getPriceBands(): Promise<PriceBand[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from("price_bands")
      .select("*")
      .order("sort_order");
    if (!error && data) return data as PriceBand[];
  }
  return [...SEED_BANDS].sort((a, b) => a.sort_order - b.sort_order);
}

// -----------------------------------------------------------------------------
// Brands
// -----------------------------------------------------------------------------

async function fetchBrandLogoMap(): Promise<Record<string, string>> {
  if (!HAS_SUPABASE || !supabase) return {};
  const { data, error } = await supabase
    .from("brand_logos")
    .select("brand_id, storage_path")
    .eq("variant", "primary");
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const r of data as { brand_id: string; storage_path: string }[]) {
    if (!map[r.brand_id]) map[r.brand_id] = r.storage_path;
  }
  return map;
}

export async function getBrands(): Promise<Brand[]> {
  if (HAS_SUPABASE && supabase) {
    const [brandsRes, logoMap] = await Promise.all([
      supabase.from("brands").select("*").eq("is_active", true).order("sort_order"),
      fetchBrandLogoMap(),
    ]);
    if (!brandsRes.error && brandsRes.data) {
      return (brandsRes.data as Brand[]).map((b) => ({
        ...b,
        logo_path: logoMap[b.id] ?? null,
      }));
    }
  }
  return [...SEED_BRANDS].sort((a, b) => a.sort_order - b.sort_order);
}

export function brandLogoUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith("http")) return storagePath;
  if (!STORAGE_PUBLIC_BASE) return null;
  return `${STORAGE_PUBLIC_BASE}/brand-logos/${storagePath}`;
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const all = await getBrands();
  return all.find((b) => b.slug === slug) ?? null;
}

// -----------------------------------------------------------------------------
// Models
// -----------------------------------------------------------------------------

export async function getModels(): Promise<ModelRow[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from("v_models")
      .select("*");
    if (!error && data) return data as ModelRow[];
  }
  return SEED_MODELS;
}

export async function getModelByBrandAndSlug(
  brandSlug: string,
  modelSlug: string,
): Promise<ModelRow | null> {
  const all = await getModels();
  return (
    all.find(
      (m) => m.brand_slug === brandSlug && m.slug === modelSlug,
    ) ?? null
  );
}

// Match by display name (used when the UI passes "Brand·Model Name").
export async function getModelByBrandAndName(
  brandName: string,
  modelName: string,
): Promise<ModelRow | null> {
  const all = await getModels();
  return (
    all.find(
      (m) => m.brand_name === brandName && m.name === modelName,
    ) ?? null
  );
}

export async function getTrimsForModel(modelId: string): Promise<ModelTrim[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from("model_trims")
      .select("*")
      .eq("model_id", modelId)
      .order("sort_order");
    if (!error && data) {
      return (data as ModelTrim[]).map((t) => ({
        ...t,
        features: Array.isArray(t.features)
          ? (t.features as string[])
          : [],
      }));
    }
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
  if (HAS_SUPABASE && supabase) {
    const { data } = await supabase.from("v_data_freshness").select("*").single();
    if (data?.last_updated_at) return formatDate(data.last_updated_at);
  }
  // Newest data_updated_at in seed
  const newest = SEED_MODELS
    .map((m) => m.data_updated_at)
    .filter(Boolean)
    .sort()
    .at(-1);
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

export async function getPhotosForModel(modelId: string): Promise<ModelPhoto[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from("model_photos")
      .select("*")
      .eq("model_id", modelId)
      .order("sort_order");
    if (!error && data) return data as ModelPhoto[];
  }
  return [];
}

export async function getPhotoMapForModels(
  modelIds: string[],
): Promise<Record<string, ModelPhoto[]>> {
  if (modelIds.length === 0 || !HAS_SUPABASE || !supabase) return {};
  const { data, error } = await supabase
    .from("model_photos")
    .select("*")
    .in("model_id", modelIds)
    .order("sort_order");
  if (error || !data) return {};
  const map: Record<string, ModelPhoto[]> = {};
  for (const p of data as ModelPhoto[]) {
    (map[p.model_id] ??= []).push(p);
  }
  return map;
}

// -----------------------------------------------------------------------------
// Photo URL helper
// -----------------------------------------------------------------------------

import { STORAGE_PUBLIC_BASE } from "./env";

export function photoUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith("http")) return storagePath;
  // Special case: the seed Tiggo photo lives at /public/assets in dev.
  if (storagePath === "models/tiggo-8/hero.avif") {
    if (!HAS_SUPABASE) return "/assets/tiggo8-green.avif";
    return `${STORAGE_PUBLIC_BASE}/car-photos/${storagePath}`;
  }
  if (!HAS_SUPABASE) return null;
  return `${STORAGE_PUBLIC_BASE}/car-photos/${storagePath}`;
}
