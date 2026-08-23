"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function ingestSocialUrl(formData: FormData) {
  const { user } = await requireStaff();
  const value = String(formData.get("url") ?? "").trim();
  let url: URL;
  try { url = new URL(value); } catch { return; }
  if (url.protocol !== "https:") return;
  const host = url.hostname.replace(/^www\./, "");
  const platform = host.includes("instagram") ? "instagram" : host.includes("tiktok") ? "tiktok" : host.includes("facebook") ? "facebook" : host === "x.com" || host.includes("twitter") ? "x" : host;
  const supabase = await createSupabaseServerClient();
  await supabase.from("social_discovery_posts").insert({ platform, source_url: url.toString(), created_by: user.id, moderation_status: "discovered", consent_status: "not_requested", editorial_status: "pending" });
  revalidatePath("/admin/social");
}
