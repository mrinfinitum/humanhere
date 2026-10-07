import { DeleteObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import pg from "pg";

// Neon stores bucket lifecycle rules without enforcing them, so abandoned
// uploads and unreferenced copies are removed here. Dry run unless --delete.
const remove = process.argv.includes("--delete");
const PENDING_AGE_MS = 60 * 60 * 1000; // Upload URLs expire after five minutes.
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000; // Leaves in-flight uploads and publications alone.

for (const name of ["DATABASE_URL", "AWS_ENDPOINT_URL_S3", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]) {
  if (!process.env[name]) throw new Error(`Set ${name} in .env.local for the target branch.`);
}
const storage = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3, region: process.env.AWS_REGION,
  forcePathStyle: true, requestChecksumCalculation: "WHEN_REQUIRED",
});

async function listObjects(Bucket) {
  const objects = [];
  let ContinuationToken;
  do {
    const page = await storage.send(new ListObjectsV2Command({ Bucket, ContinuationToken }));
    objects.push(...(page.Contents ?? []));
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return objects;
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  // List before reading references: an object registered in between is kept.
  const [privateObjects, publicObjects] = await Promise.all([listObjects("submission-private"), listObjects("published-media")]);
  await client.connect();
  const { rows: privateRows } = await client.query("select storage_path from public.submission_media");
  const { rows: publicRows } = await client.query(`select asset ->> 'path' as path
    from public.human_entries, jsonb_array_elements(coalesce(media, '[]'::jsonb) || coalesce(jsonb_build_array(thumbnail), '[]'::jsonb)) asset
    where asset ->> 'provider' = 'neon'`);
  const privateReferences = new Set(privateRows.map(row => row.storage_path));
  const publicReferences = new Set(publicRows.map(row => row.path));
  const now = Date.now();
  const age = object => now - (object.LastModified?.getTime() ?? now);

  const candidates = [
    ...privateObjects
      .filter(object => object.Key.includes("/pending/") ? age(object) > PENDING_AGE_MS : age(object) > ORPHAN_AGE_MS && !privateReferences.has(object.Key))
      .map(object => ({ Bucket: "submission-private", Key: object.Key })),
    ...publicObjects
      .filter(object => age(object) > ORPHAN_AGE_MS && !publicReferences.has(object.Key))
      .map(object => ({ Bucket: "published-media", Key: object.Key })),
  ];

  for (const object of candidates) {
    if (remove) await storage.send(new DeleteObjectCommand(object));
    console.log(`${remove ? "Removed" : "Would remove"} ${object.Bucket}/${object.Key}`);
  }
  console.log(`${candidates.length} orphaned object(s) ${remove ? "removed" : "found; re-run with --delete to remove"}.`);
} catch (error) {
  console.error(`Media cleanup failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
