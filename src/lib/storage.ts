// Server-only object storage (S3-compatible: Hetzner Object Storage or MinIO).
//
// Works with ANY S3-compatible backend — Hetzner Object Storage or MinIO on
// Coolify — purely via env vars. Bucket names are kept IDENTICAL to the old
// original bucket names so every `storage_path` in the database stays valid and the
// migration is a pure byte-for-byte copy.
//
//   S3_ENDPOINT          e.g. https://fsn1.your-objectstorage.com  (or MinIO URL)
//   S3_REGION            e.g. fsn1  (MinIO: us-east-1)
//   S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
//   S3_FORCE_PATH_STYLE  "true" (default) → https://endpoint/bucket/key
//   NEXT_PUBLIC_S3_PUBLIC_BASE  public URL prefix for the two PUBLIC buckets
//                        (path-style; normally == S3_ENDPOINT). Lives in
//                        media-urls.ts so client components can build URLs.
import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type Bucket = "car-photos" | "brand-logos" | "pdf-uploads";

const ENDPOINT = process.env.S3_ENDPOINT || "";
const REGION = process.env.S3_REGION || "us-east-1";
const ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || "";
const SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || "";
const FORCE_PATH_STYLE = (process.env.S3_FORCE_PATH_STYLE ?? "true") !== "false";

export const HAS_S3 = Boolean(ENDPOINT && ACCESS_KEY && SECRET_KEY);

let _client: S3Client | null = null;
export function s3(): S3Client {
  if (!HAS_S3) {
    throw new Error(
      "Object storage not configured. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.",
    );
  }
  if (!_client) {
    _client = new S3Client({
      endpoint: ENDPOINT,
      region: REGION,
      forcePathStyle: FORCE_PATH_STYLE,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    });
  }
  return _client;
}

/** Upload a buffer/blob. Mirrors the former Storage API `.upload(path, buf, { contentType })`. */
export async function uploadObject(
  bucket: Bucket,
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
  opts: { cacheControl?: string } = {},
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: opts.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );
}

/** Download an object into a Buffer. Mirrors the former Storage API `.download(path)`. */
export async function downloadObject(bucket: Bucket, key: string): Promise<Buffer> {
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await res.Body?.transformToByteArray();
  if (!bytes) throw new Error(`empty object: ${bucket}/${key}`);
  return Buffer.from(bytes);
}

/** Delete one or more objects. Mirrors the former Storage API `.remove([paths])`. */
export async function removeObjects(bucket: Bucket, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await s3().send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
}

/**
 * Presigned PUT URL for direct browser→storage uploads.
 * Drop-in for the former `createSignedUploadUrl`: the client already does
 * `fetch(signedUrl, { method: "PUT", headers: { "Content-Type" }, body })`.
 */
export async function presignUpload(
  bucket: Bucket,
  key: string,
  contentType?: string,
  expiresInSec = 600,
): Promise<string> {
  // Only bind Content-Type when known; otherwise any type the client sends is accepted.
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ...(contentType ? { ContentType: contentType } : {}) });
  return getSignedUrl(s3(), cmd, { expiresIn: expiresInSec });
}

/** Does an object exist? (used by the migration verifier) */
export async function objectExists(bucket: Bucket, key: string): Promise<boolean> {
  try {
    await s3().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** List all keys in a bucket (handles pagination). */
export async function listAllKeys(bucket: Bucket, prefix = ""): Promise<{ key: string; size: number }[]> {
  const out: { key: string; size: number }[] = [];
  let token: string | undefined;
  do {
    const res = await s3().send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    );
    for (const o of res.Contents ?? []) {
      if (o.Key) out.push({ key: o.Key, size: o.Size ?? 0 });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

// ─── Public URL helper — delegates to the client-safe module (single source) ──
export { objectUrl as publicObjectUrl, MEDIA_PUBLIC_BASE as S3_PUBLIC_BASE } from "./media-urls";
