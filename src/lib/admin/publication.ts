import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import type { MediaAsset } from "@/lib/archive/types";
import { requireStaff } from "@/lib/auth/server";
import { revalidatePublishedHuman } from "@/lib/archive/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PrivateMediaRow = { id: string; storage_path: string; mime_type: string; width: number | null; height: number | null; duration_seconds: number | null; blur_data_url: string | null; caption: string | null; media_type: string };

export async function publishApprovedSubmission(submissionId: string, slug: string) {
  await requireStaff(["editor", "admin"]);
  const admin = createSupabaseAdminClient();
  const { data: mediaRows, error: mediaError } = await admin.from("submission_media").select("id,storage_path,mime_type,width,height,duration_seconds,blur_data_url,caption,media_type").eq("submission_id", submissionId).order("sort_order");
  if (mediaError) throw new Error(`Publication media query failed: ${mediaError.code}`);

  const copied: string[] = [];
  const assets: MediaAsset[] = [];
  try {
    for (const row of (mediaRows ?? []) as unknown as PrivateMediaRow[]) {
      const filename = row.storage_path.split("/").at(-1) ?? row.id;
      const destination = `${submissionId}/${row.id}-${filename}`;
      const { error } = await admin.storage.from("submission-private").copy(row.storage_path, destination, { destinationBucket: "published-media" });
      if (error) throw error;
      copied.push(destination);
      assets.push({
        id: row.id, provider: "supabase", path: destination, alt: row.caption ?? "HUMAN:HERE story media",
        mimeType: row.mime_type, width: row.width ?? undefined, height: row.height ?? undefined,
        duration: row.duration_seconds ? String(row.duration_seconds) : undefined,
        kind: row.media_type === "image" ? "image" : row.media_type === "video" ? "video" : row.media_type === "audio" ? "audio" : "text",
        caption: row.caption ?? undefined, blurDataUrl: row.blur_data_url ?? undefined,
      });
    }

    const thumbnail = assets.find(asset => asset.kind === "image") ?? { id: `text-${submissionId}`, provider: "local" as const, path: "", alt: "Text-only HUMAN:HERE story", mimeType: "text/plain", kind: "text" as const };
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("publish_submission", {
      p_submission_id: submissionId, p_slug: slug, p_thumbnail: thumbnail as unknown as Json,
      p_media: assets as unknown as Json, p_type: "story", p_layout: { size: "md" },
    });
    if (error) throw new Error(`Publication transaction failed: ${error.code}`);
    revalidatePublishedHuman(slug);
  } catch (error) {
    if (copied.length) await admin.storage.from("published-media").remove(copied);
    throw error;
  }
}
