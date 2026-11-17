import "server-only";

import { adminSql } from "@/lib/neon/admin";
import { listObjects, PRIVATE_BUCKET, PUBLIC_BUCKET, removeObjects } from "./server";

// Neon stores bucket lifecycle rules without enforcing them, so abandoned
// uploads and unreferenced copies are removed here. Keep the reference
// queries in step with scripts/clean-orphaned-media.mjs.
const PENDING_AGE_MS = 60 * 60 * 1000; // Upload URLs expire after five minutes.
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000; // Leaves in-flight uploads and publications alone.
const MAX_REMOVALS = 500; // A run that finds more registered orphans than this stops and reports instead.
const BATCH = 100;

export type CleanupResult = { privateRemoved: number; publicRemoved: number; skipped: boolean };

export async function cleanOrphanedMedia(): Promise<CleanupResult> {
  // List before reading references: an object registered in between is kept.
  const [privateObjects, publicObjects] = await Promise.all([listObjects(PRIVATE_BUCKET), listObjects(PUBLIC_BUCKET)]);
  const sql = adminSql();
  const [privateRows, entryRows, avatarRows] = await Promise.all([
    sql`select storage_path from public.submission_media`,
    sql`select asset ->> 'path' as path
      from public.human_entries, jsonb_array_elements(coalesce(media, '[]'::jsonb) || coalesce(jsonb_build_array(thumbnail), '[]'::jsonb)) asset
      where asset ->> 'provider' = 'neon'`,
    sql`select avatar_path as path from public.profiles where avatar_path is not null`,
  ]);
  const privateReferences = new Set(privateRows.map(row => row.storage_path as string));
  const publicReferences = new Set([...entryRows, ...avatarRows].map(row => row.path as string));
  const now = Date.now();
  const age = (modified?: Date) => now - (modified?.getTime() ?? now);

  const privateKeys = privateObjects
    .filter(object => object.Key && (object.Key.includes("/pending/") ? age(object.LastModified) > PENDING_AGE_MS : age(object.LastModified) > ORPHAN_AGE_MS && !privateReferences.has(object.Key)))
    .map(object => object.Key as string);
  const publicKeys = publicObjects
    .filter(object => object.Key && age(object.LastModified) > ORPHAN_AGE_MS && !publicReferences.has(object.Key))
    .map(object => object.Key as string);

  // Abandoned uploads were never registered, so they are always safe to remove,
  // however many there are. Removing them in batches keeps one member's pile of
  // unfinished uploads from stopping cleanup for everyone.
  const pendingKeys = privateKeys.filter(key => key.includes("/pending/"));
  const orphanKeys = privateKeys.filter(key => !key.includes("/pending/"));
  for (let start = 0; start < pendingKeys.length; start += BATCH) {
    await removeObjects(PRIVATE_BUCKET, pendingKeys.slice(start, start + BATCH));
  }
  // A sudden flood of registered-file "orphans" more likely means a broken reference query.
  if (orphanKeys.length + publicKeys.length > MAX_REMOVALS) {
    console.warn(`Media cleanup skipped orphans: ${orphanKeys.length + publicKeys.length} candidates exceeds ${MAX_REMOVALS}.`);
    return { privateRemoved: pendingKeys.length, publicRemoved: 0, skipped: true };
  }
  if (orphanKeys.length) await removeObjects(PRIVATE_BUCKET, orphanKeys);
  if (publicKeys.length) await removeObjects(PUBLIC_BUCKET, publicKeys);
  return { privateRemoved: privateKeys.length, publicRemoved: publicKeys.length, skipped: false };
}
