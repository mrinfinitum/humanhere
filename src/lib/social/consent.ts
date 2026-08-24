import "server-only";

import { createHash } from "node:crypto";
import { requireStaff } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";

export function hashCreatorConsentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createCreatorConsentLink(socialDiscoveryPostId: string) {
  await requireStaff(["editor", "admin"]);
  const supabase = await createSupabaseServerClient();
  const { data: token, error } = await supabase.rpc("issue_social_creator_consent_token", {
    p_social_discovery_post_id: socialDiscoveryPostId,
    p_expires_in: "14 days",
  });
  if (error || !token) throw new Error(`Consent token creation failed: ${error?.code ?? "missing_token"}`);
  return `${getSiteUrl()}/consent/${token}`;
}
