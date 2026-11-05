import "server-only";

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client, type _Object } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { matchesDeclaredType, stripImageMetadata } from "@/lib/media/metadata";

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

export class FileTypeMismatch extends Error {}

async function copyObject(source: string, destination: string, bucket: typeof PRIVATE_BUCKET | typeof PUBLIC_BUCKET) {
  const sourceObject = await storage().send(new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: source }));
  if (!sourceObject.Body || !sourceObject.ContentLength || sourceObject.ContentLength > 50 * 1024 * 1024) throw new Error("Invalid source object.");
  const contentType = sourceObject.ContentType ?? "";
  let body = await sourceObject.Body.transformToByteArray();
  // The browser uploads straight to storage, so the server sees the bytes
  // only here. Refuse files that are not what they claim to be.
  if (!matchesDeclaredType(body, contentType)) throw new FileTypeMismatch(`File does not match ${contentType}.`);
  // Public copies of photos lose EXIF and similar metadata, which can hold
  // the GPS position the photo was taken at.
  if (bucket === PUBLIC_BUCKET && contentType.startsWith("image/")) {
    const stripped = stripImageMetadata(body, contentType);
    if (!stripped) throw new FileTypeMismatch(`Image could not be read as ${contentType}.`);
    body = stripped;
  }
  // Neon documents GET/PUT support. Do not rely on an undocumented CopyObject API.
  await storage().send(new PutObjectCommand({
    Bucket: bucket, Key: destination, Body: body, ContentType: contentType, CacheControl: "no-store",
  }));
  return { contentType: sourceObject.ContentType, byteLength: body.length };
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

/**
 * Writes a small object the server produced itself, such as a profile photo, to
 * the public bucket. Cached briefly, so a removed photo stops showing soon.
 */
export async function putPublicObject(key: string, body: Uint8Array, contentType: string) {
  await storage().send(new PutObjectCommand({
    Bucket: PUBLIC_BUCKET, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=300",
  }));
}

export async function listObjects(bucket: typeof PRIVATE_BUCKET | typeof PUBLIC_BUCKET) {
  const objects: _Object[] = [];
  let ContinuationToken: string | undefined;
  do {
    const page = await storage().send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken }));
    objects.push(...(page.Contents ?? []));
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return objects;
}
