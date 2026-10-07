import "server-only";

import type { Json } from "@/lib/neon/database.types";
import type { MediaAsset } from "@/lib/archive/types";
import { requireStaff } from "@/lib/auth/server";
import { revalidatePublishedHuman } from "@/lib/archive/cache";
import { adminSql } from "@/lib/neon/admin";
import { publishObject, removeObjects, PUBLIC_BUCKET } from "@/lib/storage/server";
import { createDatabaseClient } from "@/lib/neon/server";

type PrivateMediaRow = { id: string; storage_path: string; mime_type: string; width: number | null; height: number | null; duration_seconds: number | null; blur_data_url: string | null; caption: string | null; media_type: string };

export type ApprovedPublicLocation = {
  latitude: number;
  longitude: number;
  precision: "city" | "region" | "country";
};

export async function publishApprovedSubmission(
  submissionId: string,
  slug: string,
  publicLocation?: ApprovedPublicLocation,
) {
  await requireStaff(["editor", "admin"]);
  const sql = adminSql();
  const [submissions, consents] = await Promise.all([
    sql`select status, media_withheld from public.submissions where id = ${submissionId}::uuid`,
    sql`select publish_story, publish_media, verified_at, verified_by, revoked_at from public.consent_records where submission_id = ${submissionId}::uuid order by created_at desc, id desc limit 1`,
  ]);
  const publishableSubmission = submissions[0];
  const latestConsent = consents[0];
  if (publishableSubmission?.status !== "approved" || !latestConsent?.publish_story || !latestConsent.verified_at || !latestConsent.verified_by || latestConsent.revoked_at) {
    throw new Error("Publication preflight failed: verified current consent is required");
  }
  const mediaRows = await sql`select id, storage_path, mime_type, width, height, duration_seconds, blur_data_url, caption, media_type from public.submission_media where submission_id = ${submissionId}::uuid order by sort_order`;
  if ((mediaRows?.length ?? 0) > 0 && (!latestConsent.publish_media || publishableSubmission.media_withheld)) {
    throw new Error("Publication preflight failed: media cannot be published");
  }

  const copied: string[] = [];
  const assets: MediaAsset[] = [];
  try {
    for (const row of (mediaRows ?? []) as unknown as PrivateMediaRow[]) {
      // A fresh key per attempt keeps a failed or duplicate publication from
      // deleting objects that another, successful attempt already made live.
      const extension = row.storage_path.split(".").at(-1);
      const destination = `${submissionId}/${crypto.randomUUID()}.${extension}`;
      const { contentType } = await publishObject(row.storage_path, destination);
      copied.push(destination);
      assets.push({
        id: row.id, provider: "neon", path: destination, alt: row.caption ?? "HUMAN:HERE story media",
        mimeType: contentType ?? row.mime_type, width: row.width ?? undefined, height: row.height ?? undefined,
        duration: row.duration_seconds ? String(row.duration_seconds) : undefined,
        kind: row.media_type === "image" ? "image" : row.media_type === "video" ? "video" : row.media_type === "audio" ? "audio" : "text",
        caption: row.caption ?? undefined, blurDataUrl: row.blur_data_url ?? undefined,
      });
    }

    const thumbnail = assets.find(asset => asset.kind === "image") ?? null;
    const database = await createDatabaseClient();
    const publicationArgs = {
      p_submission_id: submissionId,
      p_slug: slug,
      p_thumbnail: thumbnail as unknown as Json,
      p_media: assets.length ? assets as unknown as Json : null,
      p_type: "story" as const,
      p_layout: { size: "md" },
      p_sensitive_story: false,
    };
    const { error } = publicLocation
      ? await database.rpc("publish_submission_with_location", {
          ...publicationArgs,
          p_public_latitude: publicLocation.latitude,
          p_public_longitude: publicLocation.longitude,
          p_public_location_precision: publicLocation.precision,
        })
      : await database.rpc("publish_submission", publicationArgs);
    if (error) throw new Error(`Publication transaction failed: ${error.code}`);
  } catch (error) {
    if (copied.length) await removeUnreferencedPublicCopies(submissionId, copied);
    throw error;
  }
  revalidatePublishedHuman(slug);
}

// The transaction may have committed even when its response was lost, so only
// remove copies that the submission's public entry does not reference.
async function removeUnreferencedPublicCopies(submissionId: string, copied: string[]) {
  const entries = await adminSql()`select thumbnail, media from public.human_entries where submission_id = ${submissionId}::uuid`;
  const referenced = new Set(entries.flatMap(entry => {
    const record = entry as { thumbnail?: MediaAsset | null; media?: MediaAsset[] | null };
    return [record.thumbnail, ...(record.media ?? [])].map(asset => asset?.path);
  }));
  const orphaned = copied.filter(path => !referenced.has(path));
  if (orphaned.length) await removeObjects(PUBLIC_BUCKET, orphaned);
}
