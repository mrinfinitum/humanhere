"use server";

import { requireUser } from "@/lib/auth/server";
import { expirePublishedHumanImmediately } from "@/lib/archive/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function revokeConsent(formData: FormData) {
  await requireUser("/account");
  const submissionId = String(formData.get("submissionId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(submissionId)) return;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("revoke_owned_submission_consent", { p_submission_id: submissionId });
  if (error) throw new Error(`Consent revocation failed: ${error.code}`);
  for (const slug of data ?? []) expirePublishedHumanImmediately(slug);
}
