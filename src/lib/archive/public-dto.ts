import type { HumanEntry, MediaAsset } from "./types";

/** Exact row shape exposed by public.human_entries_public. */
export type PublicHumanRow = {
  id: string;
  slug: string;
  type: HumanEntry["type"];
  source: HumanEntry["source"];
  public_name: string | null;
  first_name: string | null;
  age: number | null;
  display_location: string | null;
  anonymous: boolean;
  thumbnail: MediaAsset;
  media: MediaAsset[] | null;
  headline: string | null;
  quote: string | null;
  story: string | null;
  featured: boolean;
  layout: HumanEntry["layout"] | null;
  source_platform: string | null;
  source_url: string | null;
  created_at: string;
  published_at: string;
};

export function toHumanEntry(row: PublicHumanRow): HumanEntry {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    source: row.source,
    person: row.public_name ? {
      displayName: row.public_name,
      firstName: row.first_name ?? undefined,
      age: row.age ?? undefined,
      location: row.display_location ?? undefined,
      anonymous: row.anonymous,
    } : undefined,
    thumbnail: row.thumbnail,
    media: row.media ?? undefined,
    headline: row.headline ?? undefined,
    quote: row.quote ?? undefined,
    story: row.story ?? undefined,
    consentVerified: true,
    published: true,
    featured: row.featured,
    layout: row.layout ?? undefined,
    sourcePlatform: row.source_platform ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  };
}
