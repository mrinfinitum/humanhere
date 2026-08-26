export type HelpNeedType =
  | "groceries"
  | "clothing"
  | "household"
  | "transportation"
  | "utilities"
  | "school"
  | "baby"
  | "employment"
  | "medical_nonclinical"
  | "housing"
  | "other";

export type HelpDeliveryMode = "direct_private" | "partner_delivery" | "pickup_location" | "address_withheld";
export type PublicNeedStatus = "needed" | "in_progress" | "fulfilled";
export type HelpFulfillmentType = "goods" | "grocery" | "voucher" | "partner_service" | "other";

export type PublicHumanNeedRow = {
  id: string;
  human_entry_id: string;
  need_type: HelpNeedType;
  public_title: string;
  public_description: string | null;
  quantity_needed: number;
  quantity_fulfilled: number;
  public_status: PublicNeedStatus;
  created_at: string;
  updated_at: string;
  fulfilled_at: string | null;
};

export type PublicHumanNeed = {
  id: string;
  humanEntryId: string;
  type: HelpNeedType;
  title: string;
  description?: string;
  quantityNeeded: number;
  quantityFulfilled: number;
  status: PublicNeedStatus;
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string;
};

export type HumanNeedDraftInput = {
  humanEntryId: string;
  type: HelpNeedType;
  publicTitle: string;
  publicDescription?: string;
  privateNotes?: string;
  quantityNeeded?: number;
  deliveryMode?: HelpDeliveryMode;
};

export type FulfillmentProfileInput = {
  legalDeliveryName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  deliveryNotes?: string;
  preferredDeliveryMethod?: string;
  preferredDeliveryMode?: HelpDeliveryMode;
  allowTangibleHelp?: boolean;
  allowPartnerReferral?: boolean;
};

export type PartnerAssignmentInput = {
  humanNeedId: string;
  partnerId: string;
  internalNotes?: string;
};

export type HelpConsentInput = {
  allowHelpRequests: boolean;
  allowPartnerContact?: boolean;
  allowDelivery?: boolean;
  allowFulfillmentProvider?: boolean;
};

export type HelpNeedReviewInput = {
  humanNeedId: string;
  status: "verifying" | "approved" | "rejected";
  verificationStatus: "unverified" | "partner_verified" | "staff_verified";
  publiclyVisible?: boolean;
};

export type FulfillmentOrderInput = {
  humanNeedId: string;
  partnerId?: string;
  provider: "internal" | "partner" | "walmart" | "amazon" | "instacart" | "doordash" | "other";
  fulfillmentType: HelpFulfillmentType;
  amountCents?: number;
  currency?: string;
};
