import "server-only";

import { assertShowUpEnabled } from "./config";
import { requireHelpUser } from "./permissions";
import type { HelpConsentInput } from "./types";

/** Story publication consent never substitutes for this separate help consent. */
export async function recordOwnedHelpConsent(input: HelpConsentInput) {
  assertShowUpEnabled();
  if (!input.allowHelpRequests && !input.allowPartnerContact && !input.allowDelivery && !input.allowFulfillmentProvider) {
    throw new Error("Help consent must explicitly allow at least one capability.");
  }
  const { client, user } = await requireHelpUser();
  const { data, error } = await client.from("help_consent_records").insert({
    user_id: user.id,
    allow_help_requests: input.allowHelpRequests,
    allow_partner_contact: input.allowPartnerContact ?? false,
    allow_delivery: input.allowDelivery ?? false,
    allow_fulfillment_provider: input.allowFulfillmentProvider ?? false,
  }).select("id,consented_at").single();
  if (error) throw new Error(`Help consent creation failed: ${error.code}`);
  return data;
}

/** Revocation remains available when the feature is off. */
export async function revokeOwnedHelpConsent(consentId: string) {
  const { client } = await requireHelpUser();
  const { data, error } = await client.rpc("revoke_my_help_consent", { p_consent_id: consentId });
  if (error) throw new Error(`Help consent revocation failed: ${error.code}`);
  return data;
}
