import "server-only";

import { assertShowUpEnabled } from "./config";
import { requireHelpStaff, requireHelpUser } from "./permissions";
import type { FulfillmentProfileInput } from "./types";

const PROFILE_COLUMNS = "user_id,legal_delivery_name,phone,address_line_1,address_line_2,city,state,postal_code,country,delivery_notes,preferred_delivery_method,preferred_delivery_mode,allow_tangible_help,allow_partner_referral,verified_at,updated_at";

export async function getOwnedFulfillmentProfile() {
  const { client, user } = await requireHelpUser();
  const { data, error } = await client.from("fulfillment_profiles").select(PROFILE_COLUMNS).eq("user_id", user.id).maybeSingle();
  if (error) throw new Error(`Fulfillment profile query failed: ${error.code}`);
  return data;
}

export async function saveOwnedFulfillmentProfile(input: FulfillmentProfileInput) {
  assertShowUpEnabled();
  const { client, user } = await requireHelpUser();
  const values = {
    user_id: user.id,
    legal_delivery_name: input.legalDeliveryName?.trim() || null,
    phone: input.phone?.trim() || null,
    address_line_1: input.addressLine1?.trim() || null,
    address_line_2: input.addressLine2?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    postal_code: input.postalCode?.trim() || null,
    country: input.country?.trim() || null,
    delivery_notes: input.deliveryNotes?.trim() || null,
    preferred_delivery_method: input.preferredDeliveryMethod?.trim() || null,
    preferred_delivery_mode: input.preferredDeliveryMode ?? "address_withheld",
    allow_tangible_help: input.allowTangibleHelp ?? false,
    allow_partner_referral: input.allowPartnerReferral ?? false,
  };
  const { data, error } = await client.from("fulfillment_profiles").upsert(values, { onConflict: "user_id" }).select(PROFILE_COLUMNS).single();
  if (error) throw new Error(`Fulfillment profile update failed: ${error.code}`);
  return data;
}

/** Data minimization remains available even while SHOW UP is disabled. */
export async function deleteOwnedFulfillmentProfile() {
  const { client, user } = await requireHelpUser();
  const { error } = await client.from("fulfillment_profiles").delete().eq("user_id", user.id);
  if (error) throw new Error(`Fulfillment profile removal failed: ${error.code}`);
}

/** The database function writes a sensitive_access_events row transactionally. */
export async function getFulfillmentProfileForHelpStaff(userId: string) {
  assertShowUpEnabled();
  const { client } = await requireHelpStaff();
  const { data, error } = await client.rpc("get_fulfillment_profile_for_help", { p_user_id: userId });
  if (error) throw new Error(`Authorized fulfillment profile query failed: ${error.code}`);
  return data?.[0] ?? null;
}
