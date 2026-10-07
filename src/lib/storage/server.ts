import "server-only";

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const PRIVATE_BUCKET = "submission-private";
export const PUBLIC_BUCKET = "published-media";
let instance: S3Client | undefined;

function storage() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!endpoint || !region || !accessKeyId || !secretAccessKey) throw new Error("Neon Object Storage is not configured.");
  return instance ??= new S3Client({
    endpoint, region, credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, requestChecksumCalculation: "WHEN_REQUIRED",
  });
}

export function signPrivateUpload(key: string, contentType: string, size: number) {
  return getSignedUrl(storage(), new PutObjectCommand({
    Bucket: PRIVATE_BUCKET, Key: key, ContentType: contentType, ContentLength: size,
  }), { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) });
}

export function inspectPrivateObject(key: string) {
  return storage().send(new HeadObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }));
}

export function signPrivateRead(key: string) {
  return getSignedUrl(storage(), new GetObjectCommand({
    Bucket: PRIVATE_BUCKET, Key: key, ResponseContentDisposition: "attachment",
  }), { expiresIn: 60 });
}

async function copyObject(source: string, destination: string, bucket: typeof PRIVATE_BUCKET | typeof PUBLIC_BUCKET) {
  const sourceObject = await storage().send(new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: source }));
  if (!sourceObject.Body || !sourceObject.ContentLength || sourceObject.ContentLength > 50 * 1024 * 1024) throw new Error("Invalid source object.");
  // Neon documents GET/PUT support. Do not rely on an undocumented CopyObject API.
  await storage().send(new PutObjectCommand({
    Bucket: bucket, Key: destination,
    Body: await sourceObject.Body.transformToByteArray(),
    ContentType: sourceObject.ContentType, CacheControl: "no-store",
  }));
  return { contentType: sourceObject.ContentType };
}

export function finalizePrivateObject(source: string, destination: string) {
  return copyObject(source, destination, PRIVATE_BUCKET);
}

export function publishObject(source: string, destination: string) {
  return copyObject(source, destination, PUBLIC_BUCKET);
}

export async function removeObjects(bucket: typeof PRIVATE_BUCKET | typeof PUBLIC_BUCKET, paths: string[]) {
  await Promise.all(paths.map(Key => storage().send(new DeleteObjectCommand({ Bucket: bucket, Key }))));
}
