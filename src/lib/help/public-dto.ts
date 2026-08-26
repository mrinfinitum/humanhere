import type { PublicHumanNeed, PublicHumanNeedRow } from "./types";

/** Explicit whitelist: extra/private database fields are ignored by design. */
export function toPublicHumanNeed(row: PublicHumanNeedRow): PublicHumanNeed {
  return {
    id: row.id,
    humanEntryId: row.human_entry_id,
    type: row.need_type,
    title: row.public_title,
    description: row.public_description ?? undefined,
    quantityNeeded: row.quantity_needed,
    quantityFulfilled: row.quantity_fulfilled,
    status: row.public_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fulfilledAt: row.fulfilled_at ?? undefined,
  };
}
