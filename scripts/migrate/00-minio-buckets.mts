// Create the 3 buckets on MinIO (or any S3-compatible store) and make the two
// media buckets publicly readable — exactly the visibility they had before.
// Idempotent: existing buckets are kept, the policy is (re)applied.
//   npx tsx scripts/migrate/00-minio-buckets.ts
import { readFileSync } from "node:fs";
import { S3Client, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";

for (const line of readFileSync(".env.migrate", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") !== "false",
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
});

const PUBLIC = ["car-photos", "brand-logos"] as const;   // anonymous GET allowed
const PRIVATE = ["pdf-uploads"] as const;                // presigned access only
const publicReadPolicy = (bucket: string) => JSON.stringify({
  Version: "2012-10-17",
  Statement: [{ Effect: "Allow", Principal: { AWS: ["*"] }, Action: ["s3:GetObject"], Resource: [`arn:aws:s3:::${bucket}/*`] }],
});

let failed = 0;
for (const bucket of [...PUBLIC, ...PRIVATE]) {
  try {
    let existed = true;
    try { await s3.send(new HeadBucketCommand({ Bucket: bucket })); }
    catch { existed = false; await s3.send(new CreateBucketCommand({ Bucket: bucket })); }
    if ((PUBLIC as readonly string[]).includes(bucket)) {
      await s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: publicReadPolicy(bucket) }));
    }
    console.log(`✓ ${bucket.padEnd(12)} ${existed ? "exists" : "created"}${(PUBLIC as readonly string[]).includes(bucket) ? " · public-read policy applied" : " · private"}`);
  } catch (e) { failed++; console.error(`✗ ${bucket}: ${(e as Error).message}`); }
}
console.log(failed ? `\n✗ ${failed} bucket(s) failed` : "\n✓ buckets ready");
process.exit(failed ? 1 : 0);
