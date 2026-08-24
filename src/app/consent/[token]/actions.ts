"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function recordCreatorConsent(token: string, formData: FormData) {
  if (!/^[0-9a-f]{64}$/.test(token)) return;
  const admin = createSupabaseAdminClient();
  const creatorEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(creatorEmail)) return;
  const { error } = await admin.rpc("accept_social_creator_consent", {
    p_token: token,
    p_creator_name: String(formData.get("name") ?? "").trim().slice(0, 160),
    p_creator_email: creatorEmail,
    p_publish_story: formData.get("publishStory") === "on",
    p_publish_media: formData.get("publishMedia") === "on",
    p_social_reuse: formData.get("socialReuse") === "on",
  });
  if (error) throw new Error(`Creator consent failed: ${error.code}`);
  redirect("/consent/thank-you");
}
