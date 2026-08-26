import "server-only";

import { assertShowUpEnabled, isShowUpEnabled } from "./config";
import { requireHelpStaff } from "./permissions";
import type { PartnerAssignmentInput } from "./types";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const PUBLIC_PARTNER_COLUMNS = "id,name,slug,partner_type,city,state,country,public_contact_name,public_website,can_verify_needs,can_receive_deliveries,can_fulfill_needs";

export async function listPublicHelpPartners() {
  if (!isShowUpEnabled()) return [];
  const { data, error } = await createSupabasePublicClient().from("help_partners_public").select(PUBLIC_PARTNER_COLUMNS).order("name").limit(100);
  if (error) throw new Error(`Public help partner query failed: ${error.code}`);
  return data ?? [];
}

export async function assignPartnerToNeed(input: PartnerAssignmentInput) {
  assertShowUpEnabled();
  const { client } = await requireHelpStaff();
  const { data, error } = await client.rpc("assign_help_partner", {
    p_human_need_id: input.humanNeedId,
    p_partner_id: input.partnerId,
    p_internal_notes: input.internalNotes ?? "",
  });
  if (error) throw new Error(`Help partner assignment failed: ${error.code}`);
  return { id: data };
}
