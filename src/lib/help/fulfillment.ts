import "server-only";

import { assertShowUpEnabled } from "./config";
import { requireHelpStaff } from "./permissions";
import type { FulfillmentOrderInput } from "./types";

export async function createFulfillmentOrder(input: FulfillmentOrderInput) {
  assertShowUpEnabled();
  const { client } = await requireHelpStaff();
  const { data, error } = await client.rpc("create_help_fulfillment_order", {
    p_human_need_id: input.humanNeedId,
    p_partner_id: input.partnerId ?? null,
    p_provider: input.provider,
    p_fulfillment_type: input.fulfillmentType,
    p_amount_cents: input.amountCents ?? null,
    p_currency: input.currency?.toUpperCase() ?? null,
  });
  if (error) throw new Error(`Fulfillment order creation failed: ${error.code}`);
  return { id: data };
}
