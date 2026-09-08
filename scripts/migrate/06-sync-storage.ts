// Copy EVERY object from the 3 Supabase Storage buckets into the S3 buckets of
// the same name. Idempotent: skips objects already present with the same size.
// Verifies counts at the end.  READ-ONLY against Supabase.
//   npx tsx scripts/migrate/06-sync-storage.ts
import { readFileSync } from "node:fs";
import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

for (const line of readFileSync(".env.migrate", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SB_URL = process.env.SUPABASE_URL!, SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKETS = ["car-photos", "brand-logos", "pdf-uploads"] as const;
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") !== "false",
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
});
const hdr = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

type Obj = { name: string; id: string | null; metadata?: { size?: number; mimetype?: string } };
/** Recursively list a Supabase bucket (folders come back as id=null). */
async function listSb(bucket: string, prefix = ""): Promise<{ key: string; size: number; mime: string }[]> {
  const out: { key: string; size: number; mime: string }[] = [];
  let offset = 0;
  for (;;) {
    const res = await fetch(`${SB_URL}/storage/v1/object/list/${bucket}`, {
      method: "POST", headers: hdr,
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
    });
    if (!res.ok) throw new Error(`list ${bucket}/${prefix}: HTTP ${res.status} ${await res.text()}`);
    const items = (await res.json()) as Obj[];
    for (const it of items) {
      const key = prefix ? `${prefix}/${it.name}` : it.name;
      if (it.id === null) out.push(...(await listSb(bucket, key)));           // folder → recurse
      else out.push({ key, size: it.metadata?.size ?? 0, mime: it.metadata?.mimetype ?? "application/octet-stream" });
    }
    if (items.length < 1000) break;
    offset += 1000;
  }
  return out;
}
async function s3Size(bucket: string, key: string): Promise<number | null> {
  try { const h = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return h.ContentLength ?? 0; }
  catch { return null; }
}
async function s3Count(bucket: string): Promise<number> {
  let n = 0, tok: string | undefined;
  do { const r = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: tok }));
       n += r.KeyCount ?? 0; tok = r.IsTruncated ? r.NextContinuationToken : undefined; } while (tok);
  return n;
}

let failed = 0;
for (const bucket of BUCKETS) {
  const objs = await listSb(bucket);
  console.log(`\n▶ ${bucket}: ${objs.length} objects in Supabase`);
  let copied = 0, skipped = 0;
  for (const o of objs) {
    const existing = await s3Size(bucket, o.key);
    if (existing !== null && existing === o.size) { skipped++; continue; }
    const dl = await fetch(`${SB_URL}/storage/v1/object/${bucket}/${o.key}`, { headers: hdr });
    if (!dl.ok) { console.error(`  ✗ download ${o.key}: HTTP ${dl.status}`); failed++; continue; }
    const body = Buffer.from(await dl.arrayBuffer());
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: o.key, Body: body,
      ContentType: o.mime, CacheControl: "public, max-age=31536000, immutable" }));
    copied++; if (copied % 25 === 0) console.log(`  … ${copied} copied`);
  }
  const have = await s3Count(bucket);
  const ok = have >= objs.length && failed === 0;
  console.log(`  copied ${copied}, skipped ${skipped} (already present) → S3 has ${have}/${objs.length} ${ok ? "✓" : "✗"}`);
  if (!ok) failed++;
}
console.log(failed ? `\n✗ ${failed} problem(s) — re-run, it is idempotent.` : "\n✓ all buckets fully synced.");
process.exit(failed ? 1 : 0);
