// CLIENT-SAFE public media URL helpers (no server-only imports).
// Imported by client components (model cards, brand strip) AND server code.
// Bucket names are unchanged from the original setup, so stored `storage_path`
// values are unchanged after the migration.
//
//   NEXT_PUBLIC_S3_PUBLIC_BASE  e.g. https://fsn1.your-objectstorage.com
//   → object URL = ${base}/${bucket}/${storage_path}   (path-style)

export const MEDIA_PUBLIC_BASE = (process.env.NEXT_PUBLIC_S3_PUBLIC_BASE ?? "").replace(/\/$/, "");
export const HAS_MEDIA = Boolean(MEDIA_PUBLIC_BASE);

export type MediaBucket = "car-photos" | "brand-logos";

export function objectUrl(bucket: MediaBucket, key: string): string | null {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  if (!MEDIA_PUBLIC_BASE) return null;
  return `${MEDIA_PUBLIC_BASE}/${bucket}/${key}`;
}

export function brandLogoUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  return objectUrl("brand-logos", storagePath);
}

export function photoUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (storagePath.startsWith("http")) return storagePath;
  // The seed Tiggo photo ships in /public/assets for local preview without storage.
  if (storagePath === "models/tiggo-8/hero.avif" && !HAS_MEDIA) {
    return "/assets/tiggo8-green.avif";
  }
  return objectUrl("car-photos", storagePath);
}
