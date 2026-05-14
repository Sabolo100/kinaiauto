import "server-only";
import { supabaseAdmin } from "./supabase-admin";

export async function getLookups() {
  const sa = supabaseAdmin();
  const [brands, categories, drives] = await Promise.all([
    sa.from("brands").select("id, name").order("sort_order", { ascending: true }),
    sa.from("categories").select("id, slug, label_hu").order("sort_order", { ascending: true }),
    sa.from("drives").select("id, label_hu").order("sort_order", { ascending: true }),
  ]);
  return {
    brands: (brands.data ?? []) as { id: string; name: string }[],
    categories: (categories.data ?? []) as { id: number; slug: string; label_hu: string }[],
    drives: (drives.data ?? []) as { id: number; label_hu: string }[],
  };
}
