import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

for (const key of ["AWS_ENDPOINT_URL_S3", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "NEXT_PUBLIC_SITE_URL"]) {
  if (!process.env[key]) throw new Error(`Set ${key} before configuring storage.`);
}
const storage = new S3Client({
  region: process.env.AWS_REGION, endpoint: process.env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true, requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
});
// Access levels are set in Neon Console/API; S3 cannot set Neon bucket ACLs.
const { Buckets = [] } = await storage.send(new ListBucketsCommand({}));
for (const name of ["submission-private", "social-review-private", "published-media"]) {
  if (!Buckets.some(bucket => bucket.Name === name)) throw new Error(`Missing bucket: ${name}`);
}
// Neon handles OPTIONS automatically, including inherited branch buckets.
// Bucket CORS mutation currently returns NoSuchBucket for inherited buckets;
// verify the effective policy instead of assuming a configuration write worked.
const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
const preflight = await fetch(`${process.env.AWS_ENDPOINT_URL_S3}/submission-private/setup-check`, {
  method: "OPTIONS",
  headers: {
    Origin: origin,
    "Access-Control-Request-Method": "PUT",
    "Access-Control-Request-Headers": "content-type",
  },
});
const allowedOrigin = preflight.headers.get("access-control-allow-origin");
const methods = preflight.headers.get("access-control-allow-methods")?.split(/\s*,\s*/) ?? [];
const headers = preflight.headers.get("access-control-allow-headers")?.toLowerCase().split(/\s*,\s*/) ?? [];
if (!preflight.ok || ![origin, "*"].includes(allowedOrigin) || !methods.includes("PUT") ||
    (!headers.includes("content-type") && !headers.includes("*"))) {
  throw new Error("Storage does not allow the app's browser upload preflight.");
}
console.log("Verified all three buckets and browser upload CORS. Uploads require signed URLs.");
