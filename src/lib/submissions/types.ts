import type { HumanArtifactType } from "@/lib/archive/types";

export const SUBMISSION_STATUSES = [
  "draft",
  "submitted",
  "in_review",
  "contacted",
  "approved",
  "rejected",
  "published",
  "archived",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
export type ShareIntent = "share_story" | "need_help" | "help_someone" | "explore";
export type PublicIdentityMode = "full_name" | "first_name" | "anonymous";
export type NeedCategory =
  | "housing" | "food" | "safety" | "family" | "grief" | "recovery"
  | "employment" | "financial" | "loneliness" | "parenting" | "faith"
  | "health" | "transportation" | "other";

export type WhatWouldHelp =
  | "share_only" | "prayer" | "practical_help" | "resources" | "contact_me" | "help_someone";

export type SubmissionDraft = {
  id: string;
  userId: string;
  intent?: ShareIntent;
  artifactType?: HumanArtifactType;
  identityMode?: PublicIdentityMode;
  publicName?: string;
  anonymous: boolean;
  location?: string;
  headline?: string;
  story?: string;
  whatWouldHelp?: WhatWouldHelp;
  needCategory?: NeedCategory;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
};

export type SubmissionMedia = {
  id: string;
  submissionId: string;
  mediaType: "image" | "video" | "audio" | "note" | "document";
  storagePath: string;
  caption?: string;
  sortOrder: number;
  createdAt: string;
};

export type ConsentRecord = {
  id: string;
  submissionId: string;
  userId: string;
  publishStory: boolean;
  publishMedia: boolean;
  socialReuse: boolean;
  mayContact: boolean;
  partnerReferral: boolean;
  consentedAt: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export interface SubmissionRepository {
  createDraft(userId: string, intent?: ShareIntent): Promise<SubmissionDraft>;
  listOwned(userId: string): Promise<SubmissionDraft[]>;
  getOwned(userId: string, id: string): Promise<SubmissionDraft | undefined>;
  updateOwnedDraft(userId: string, id: string, patch: Partial<SubmissionDraft>): Promise<SubmissionDraft>;
  submitOwnedDraft(userId: string, id: string): Promise<SubmissionDraft>;
}
