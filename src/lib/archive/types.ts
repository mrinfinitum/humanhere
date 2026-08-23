export const HUMAN_ARTIFACT_TYPES = [
  "portrait",
  "story",
  "note",
  "video",
  "audio",
  "object",
  "place",
  "quote",
] as const;

export type HumanArtifactType = (typeof HUMAN_ARTIFACT_TYPES)[number];

export type MediaAsset = {
  id: string;
  provider: "local" | "supabase" | "mux" | "cloudflare" | "other";
  path: string;
  alt: string;
  mimeType: string;
  width?: number;
  height?: number;
  kind: "image" | "video" | "audio" | "text";
  objectPosition?: string;
  duration?: string;
  blurDataUrl?: string;
  poster?: string;
  caption?: string;
  transcript?: string;
};

export type HumanIdentity = {
  displayName: string;
  firstName?: string;
  age?: number;
  location?: string;
  anonymous?: boolean;
};

export type HumanStoryBlock =
  | { id: string; type: "text"; heading?: string; body: string[] }
  | { id: string; type: "quote"; quote: string }
  | { id: string; type: "media"; media: MediaAsset; caption?: string }
  | { id: string; type: "audio"; media?: MediaAsset; label: string; duration?: string }
  | { id: string; type: "note"; text: string; attribution?: string };

/**
 * Public-only archive record. Authentication identity, email, contact details,
 * private needs, moderation notes, and consent evidence never belong here.
 */
export type HumanEntry = {
  id: string;
  slug: string;
  type: HumanArtifactType;
  source: "direct" | "editorial" | "social";
  person?: HumanIdentity;
  thumbnail: MediaAsset;
  media?: MediaAsset[];
  headline?: string;
  quote?: string;
  story?: string;
  consentVerified: boolean;
  published: boolean;
  featured?: boolean;
  layout?: {
    size: "xs" | "sm" | "md" | "lg" | "xl";
    emphasis?: number;
    crop?: "portrait" | "square" | "landscape" | "eyes";
    tone?: "paper" | "ink" | "lapis" | "clay" | "meadow" | "butter" | "powder" | "oxblood";
  };
  sourcePlatform?: string;
  sourceUrl?: string;
  createdAt: string;
  publishedAt?: string;

  /** Editorial extensions used by the immersive viewer. */
  blocks?: HumanStoryBlock[];
  relatedStorySlug?: string;
  fixture?: boolean;
};

export type ArchiveQuery = {
  cursor?: string;
  limit?: number;
  types?: HumanArtifactType[];
};

export type ArchiveBatch = {
  entries: HumanEntry[];
  nextCursor: string | null;
  total?: number;
};

export interface HumanArchiveRepository {
  listPublished(query?: ArchiveQuery): Promise<ArchiveBatch>;
  getPublishedBySlug(slug: string): Promise<HumanEntry | undefined>;
  getPublishedAdjacent(slug: string): Promise<{ previous?: HumanEntry; next?: HumanEntry }>;
}
