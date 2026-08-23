"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashCreatorConsentToken } from "@/lib/social/consent";
import { redirect } from "next/navigation";

export async function recordCreatorConsent(token: string, formData: FormData) {
  if (token.length < 40 || token.length > 100) return;
  const admin = createSupabaseAdminClient();
  const hash = hashCreatorConsentToken(token);
  const { data: record } = await admin.from("social_creator_consent_tokens").select("id,social_discovery_post_id,expires_at,used_at").eq("token_hash", hash).maybeSingle() as unknown as { data: { id: string; social_discovery_post_id: string; expires_at: string; used_at: string | null } | null };
  if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) return;
  const creatorEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(creatorEmail)) return;
  const now = new Date().toISOString();
  const { error } = await admin.from("social_creator_consent_records").insert({
    social_discovery_post_id: record.social_discovery_post_id,
    creator_name: String(formData.get("name") ?? "").trim().slice(0, 160) || null,
    creator_email: creatorEmail,
    publish_story: formData.get("publishStory") === "on",
    publish_media: formData.get("publishMedia") === "on",
    social_reuse: formData.get("socialReuse") === "on",
    consented_at: now,
  });
  if (error) throw new Error(`Creator consent failed: ${error.code}`);
  await Promise.all([
    admin.from("social_creator_consent_tokens").update({ used_at: now }).eq("id", record.id),
    admin.from("social_discovery_posts").update({ consent_status: "received" }).eq("id", record.social_discovery_post_id),
  ]);
  redirect("/consent/thank-you");
}
