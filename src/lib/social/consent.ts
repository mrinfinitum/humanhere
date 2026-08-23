import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { requireStaff } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";

export function hashCreatorConsentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createCreatorConsentLink(socialDiscoveryPostId: string) {
  const { user } = await requireStaff();
  const token = randomBytes(32).toString("base64url");
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("social_creator_consent_tokens").insert({
    social_discovery_post_id: socialDiscoveryPostId,
    token_hash: hashCreatorConsentToken(token),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: user.id,
  });
  if (error) throw new Error(`Consent token creation failed: ${error.code}`);
  return `${getSiteUrl()}/consent/${token}`;
}
