import type { HumanEntry, MediaAsset } from "./types";

/** Exact row shape exposed by public.human_entries_public. */
export type PublicHumanRow = {
  id: string;
  slug: string;
  type: HumanEntry["type"];
  source: HumanEntry["source"];
  first_name: string | null;
  display_location: string | null;
  anonymous: boolean;
  thumbnail: MediaAsset | null;
  media: MediaAsset[] | null;
  headline: string | null;
  quote: string | null;
  story: string | null;
  featured: boolean;
  layout: HumanEntry["layout"] | null;
  love_count: number;
  allow_private_notes: boolean;
  social_image_allowed: boolean;
  created_at: string;
  published_at: string;
  public_latitude?: number | null;
  public_longitude?: number | null;
  public_location_precision?: "city" | "region" | "country" | null;
};

export function toHumanEntry(row: PublicHumanRow): HumanEntry {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    source: row.source,
    person: row.anonymous || row.first_name ? {
      displayName: row.anonymous ? "ANONYMOUS" : row.first_name ?? "ANONYMOUS",
      firstName: row.first_name ?? undefined,
      location: row.display_location ?? undefined,
      coordinates: row.public_latitude != null && row.public_longitude != null && row.public_location_precision
        ? {
            latitude: Number(row.public_latitude),
            longitude: Number(row.public_longitude),
            precision: row.public_location_precision,
          }
        : undefined,
      anonymous: row.anonymous,
    } : undefined,
    thumbnail: row.thumbnail ?? undefined,
    media: row.media ?? undefined,
    headline: row.headline ?? undefined,
    quote: row.quote ?? undefined,
    story: row.story ?? undefined,
    consentVerified: true,
    published: true,
    featured: row.featured,
    loveCount: row.love_count,
    allowPrivateNotes: row.allow_private_notes,
    socialImageAllowed: row.social_image_allowed,
    layout: row.layout ?? undefined,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  };
}
