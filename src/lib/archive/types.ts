export type HumanArtifactType =
  | "portrait"
  | "story"
  | "note"
  | "video"
  | "audio"
  | "object"
  | "place"
  | "quote";

export type MediaAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  kind: "image" | "video" | "audio";
  objectPosition?: string;
  duration?: string;
  poster?: string;
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

export type HumanEntry = {
  id: string;
  slug: string;
  type: HumanArtifactType;
  person?: HumanIdentity;
  thumbnail?: MediaAsset;
  media?: MediaAsset[];
  headline?: string;
  quote?: string;
  story?: string;
  blocks?: HumanStoryBlock[];
  consentStatus: "pending" | "approved";
  published: boolean;
  featured?: boolean;
  source: "DEV_FIXTURE" | "PRODUCTION";
  relatedStorySlug?: string;
  layout?: {
    size: "xs" | "sm" | "md" | "lg" | "xl";
    emphasis?: number;
    crop?: "portrait" | "square" | "landscape" | "eyes";
    tone?: "paper" | "ink" | "lapis" | "clay" | "meadow" | "butter" | "powder" | "oxblood";
  };
};

export type ArchiveQuery = {
  cursor?: string;
  limit?: number;
  types?: HumanArtifactType[];
};

export type ArchiveBatch = {
  entries: HumanEntry[];
  nextCursor: string | null;
  total: number;
};

export interface HumanArchiveRepository {
  list(query?: ArchiveQuery): Promise<ArchiveBatch>;
  getBySlug(slug: string): Promise<HumanEntry | undefined>;
  getAdjacent(slug: string): Promise<{ previous?: HumanEntry; next?: HumanEntry }>;
}
