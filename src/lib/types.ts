// Shared types — match the Supabase v_models / brands / etc. shapes 1:1.
// All field names match the SQL columns; lookups join in the brand/category/drive
// labels for convenience.

export type Brand = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  founded: string | null;
  hq: string | null;
  factories: string | null;
  parent_company: string | null;
  importer_name: string | null;
  importer_addr: string | null;
  importer_site: string | null;
  dealers_text: string | null;
  hero_color: string | null;
  brand_tone: string | null;
  sort_order: number;
  is_active: boolean;
  logo_path?: string | null;
};

export type Category = {
  id: number;
  slug: string;
  label_hu: string;
  sort_order: number;
};

export type Drive = {
  id: number;
  slug: string;
  label_hu: string;
  short_code: string;
  sort_order: number;
};

export type PriceBand = {
  id: string;
  label_hu: string;
  min_m_ft: number;
  max_m_ft: number;
  sort_order: number;
};

// Joined model row from v_models view
export type ModelRow = {
  id: string;
  slug: string;
  name: string;
  is_deal: boolean;
  is_available: boolean;
  is_featured: boolean;
  price_min_m_ft: number | null;
  price_max_m_ft: number | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  wheelbase_mm: number | null;
  trunk_l: number | null;
  seats: number | null;
  power_hp: number | null;
  battery_kwh: number | null;
  range_km: number | null;
  acceleration_s: number | null;
  consumption_text: string | null;
  charging_ac_kw: number | null;
  charging_dc_kw: number | null;
  charging_text: string | null;
  warranty_years: number | null;
  warranty_km: number | null;
  battery_warranty_years: number | null;
  battery_warranty_km: number | null;
  source_url: string | null;
  data_updated_at: string | null;
  updated_at: string | null;
  brand_id: string;
  brand_slug: string;
  brand_name: string;
  brand_tone: string | null;
  brand_hero_color: string | null;
  brand_importer_name: string | null;
  brand_importer_addr: string | null;
  brand_importer_site: string | null;
  brand_dealers_text: string | null;
  category_id: number;
  category_slug: string;
  category: string;
  drive_id: number;
  drive_slug: string;
  drive: string;
  drive_code: string;
  primary_photo_path: string | null;
  segment: string | null;
  // engine option aggregates (from v_models view)
  range_km_max: number | null;
  power_hp_max: number | null;
  battery_kwh_max: number | null;
  trunk_l_max: number | null;
  seats_max: number | null;
  has_engine_options: boolean;
  // attached client-side via attachEngineOptions() — empty array if none
  engine_options: ModelEngineOption[];
};

export type ModelEngineOption = {
  id: string;
  model_id: string;
  name: string;
  range_km: number | null;
  power_hp: number | null;
  battery_kwh: number | null;
  trunk_l: number | null;
  seats: number | null;
  consumption_text: string | null;
  charging_ac_kw: number | null;
  charging_dc_kw: number | null;
  charging_text: string | null;
  acceleration_s: number | null;
  sort_order: number;
};

export type ModelTrim = {
  id: string;
  model_id: string;
  slug: string;
  name: string;
  level_label: string | null;
  is_featured: boolean;
  price_m_ft: number | null;
  deal_price_m_ft: number | null;
  features: string[];
  sort_order: number;
};

export type ModelPhoto = {
  id: string;
  model_id: string;
  kind:
    | "exterior"
    | "interior"
    | "dashboard"
    | "rear"
    | "trunk"
    | "gallery"
    | "hero";
  storage_path: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  is_primary: boolean;
  sort_order: number;
};

export type Article = {
  id: string;
  slug: string;
  category_id: number | null;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  body_blocks: ArticleBlock[];
  reading_minutes: number | null;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  og_image_path: string | null;
  sources: { label: string; url: string }[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleBlock =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | {
      type: "callout";
      tone?: "default" | "warn";
      icon?: string;
      strong?: string;
      text: string;
      linkLabel?: string;
      linkUrl?: string;
    }
  | { type: "checklist"; items: string[] }
  | {
      type: "table";
      headers: string[];
      rows: { cells: string[]; flag?: "ok" | "warn" | "bad" }[];
    };

export type SiteSettings = Record<string, string>;

export type Dealer = {
  id: string;
  brand_id: string;
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
  is_active: boolean;
  sort_order: number;
  created_at: string;
  contacts: DealerContact[];
  // Import columns
  extra_emails: string[];
  extra_phones: string[];
  source_url: string | null;
  data_quality: string | null;
  data_source: string | null;
  last_checked_at: string | null;
};

export type DealerContact = {
  id: string;
  dealer_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  sort_order: number;
};
