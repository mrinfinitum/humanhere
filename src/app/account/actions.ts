"use server";

import { requireUser } from "@/lib/auth/server";
import { expirePublishedHumanImmediately } from "@/lib/archive/cache";
import type { MediaAsset } from "@/lib/archive/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function revokeConsent(formData: FormData) {
  await requireUser("/account");
  const submissionId = String(formData.get("submissionId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(submissionId)) return;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("revoke_owned_submission_consent", { p_submission_id: submissionId });
  if (error) throw new Error(`Consent revocation failed: ${error.code}`);
  for (const slug of data ?? []) expirePublishedHumanImmediately(slug);

  // Revocation closes the public record first. Approved derivatives are then
  // removed from the public bucket so previously copied URLs stop resolving.
  const admin = createSupabaseAdminClient();
  const { data: entries } = await admin.from("human_entries").select("thumbnail,media").eq("submission_id", submissionId);
  const paths = (entries ?? []).flatMap(entry => {
    const record = entry as { thumbnail?: MediaAsset | null; media?: MediaAsset[] | null };
    return [record.thumbnail, ...(record.media ?? [])]
      .filter((asset): asset is MediaAsset => asset?.provider === "supabase" && Boolean(asset.path))
      .map(asset => asset.path);
  });
  if (paths.length) {
    const { error: removalError } = await admin.storage.from("published-media").remove([...new Set(paths)]);
    if (removalError) throw new Error(`Consent was revoked, but published media cleanup needs attention: ${removalError.message}`);
  }
}
