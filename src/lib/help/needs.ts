import "server-only";

import { assertShowUpEnabled, isShowUpEnabled } from "./config";
import { requireHelpStaff, requireHelpUser } from "./permissions";
import { toPublicHumanNeed } from "./public-dto";
import type { HelpNeedReviewInput, HumanNeedDraftInput, PublicHumanNeedRow } from "./types";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const PUBLIC_NEED_COLUMNS = "id,human_entry_id,need_type,public_title,public_description,quantity_needed,quantity_fulfilled,public_status,created_at,updated_at,fulfilled_at";

export async function listPublicNeedsForHuman(humanEntryId: string) {
  if (!isShowUpEnabled()) return [];
  const { data, error } = await createSupabasePublicClient()
    .from("human_needs_public")
    .select(PUBLIC_NEED_COLUMNS)
    .eq("human_entry_id", humanEntryId)
    .order("created_at", { ascending: true })
    .limit(20);
  if (error) throw new Error(`Public help needs query failed: ${error.code}`);
  return ((data ?? []) as unknown as PublicHumanNeedRow[]).map(toPublicHumanNeed);
}

export async function createOwnedNeedDraft(input: HumanNeedDraftInput) {
  assertShowUpEnabled();
  const { client, user } = await requireHelpUser();
  const title = input.publicTitle.trim();
  if (!title || title.length > 160) throw new Error("A concise public need title is required.");
  const { data, error } = await client.from("human_needs").insert({
    human_entry_id: input.humanEntryId,
    recipient_user_id: user.id,
    need_type: input.type,
    public_title: title,
    public_description: input.publicDescription?.trim() || null,
    private_notes: input.privateNotes?.trim() || null,
    quantity_needed: input.quantityNeeded ?? 1,
    delivery_mode: input.deliveryMode ?? "address_withheld",
  }).select("id").single();
  if (error) throw new Error(`Help need creation failed: ${error.code}`);
  return { id: String(data.id) };
}

export async function listOwnedNeeds() {
  const { client } = await requireHelpUser();
  const { data, error } = await client.rpc("my_human_needs");
  if (error) throw new Error(`Private help needs query failed: ${error.code}`);
  return data ?? [];
}

/** Staff-only read; the database function records the access event transactionally. */
export async function getPrivateNeedForHelpStaff(humanNeedId: string) {
  assertShowUpEnabled();
  const { client } = await requireHelpStaff();
  const { data, error } = await client.rpc("get_private_human_need_for_help", {
    p_human_need_id: humanNeedId,
  });
  if (error) throw new Error(`Authorized private need query failed: ${error.code}`);
  return data?.[0] ?? null;
}

/** Review is performed by a fail-closed SECURITY DEFINER workflow and audited in SQL. */
export async function reviewNeedForHelpStaff(input: HelpNeedReviewInput) {
  assertShowUpEnabled();
  const { client } = await requireHelpStaff();
  const { data, error } = await client.rpc("review_help_need", {
    p_human_need_id: input.humanNeedId,
    p_status: input.status,
    p_verification_status: input.verificationStatus,
    p_publicly_visible: input.publiclyVisible ?? false,
  });
  if (error) throw new Error(`Help need review failed: ${error.code}`);
  return data;
}
