export const MODERATION_FLAGS = [
  "nudity", "sexual_content", "graphic_violence", "hate_or_harassment", "self_harm",
  "threats", "doxxing", "visible_private_information", "minor", "domestic_violence",
  "medical_content", "substance_use", "illegal_activity", "accusation_against_person",
  "spam", "commercial_promotion", "copyright_concern", "consent_unclear", "other",
] as const;

export type ModerationFlag = (typeof MODERATION_FLAGS)[number];
export type EditorialTier = "GREEN" | "YELLOW" | "RED";
export type StaffRole = "moderator" | "editor" | "admin";
export type AccountRole = "user" | StaffRole;

export type ModerationAssessment = {
  id: string;
  submissionId?: string;
  socialDiscoveryPostId?: string;
  flag: ModerationFlag;
  tier: EditorialTier;
  notes?: string;
  createdBy: string;
  createdAt: string;
};
