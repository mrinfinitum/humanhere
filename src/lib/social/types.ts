import type { HumanArtifactType } from "@/lib/archive/types";

export type SocialDiscoveryPost = {
  id: string;
  platform: string;
  platformPostId?: string;
  sourceUrl: string;
  authorUsername?: string;
  authorDisplayName?: string;
  caption?: string;
  mediaType?: HumanArtifactType;
  thumbnailUrl?: string;
  discoveredAt: string;
  moderationStatus: "discovered" | "screened" | "needs_review" | "approved_for_contact" | "rejected";
  consentStatus: "not_requested" | "requested" | "received" | "declined" | "revoked";
  editorialStatus: "pending" | "approved" | "rejected" | "converted";
  linkedHumanEntryId?: string;
};

export type SocialDiscoveryResult = {
  posts: SocialDiscoveryPost[];
  nextCursor?: string;
};

export interface SocialDiscoveryProvider {
  platform: string;
  searchHashtag(hashtag: string, cursor?: string): Promise<SocialDiscoveryResult>;
}

export interface SocialDiscoveryRepository {
  ingestManualUrl(sourceUrl: string, createdBy: string): Promise<SocialDiscoveryPost>;
  listForModeration(cursor?: string): Promise<SocialDiscoveryResult>;
}
