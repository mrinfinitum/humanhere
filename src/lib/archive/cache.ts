import { revalidateTag } from "next/cache";

export const HUMAN_CACHE_TAGS = {
  list: "human-list",
  featured: "featured-humans",
  homepage: "human-homepage",
  entry: (slug: string) => `human-entry:${slug}`,
} as const;

export function revalidatePublishedHuman(slug: string) {
  revalidateTag(HUMAN_CACHE_TAGS.entry(slug), "max");
  revalidateTag(HUMAN_CACHE_TAGS.list, "max");
  revalidateTag(HUMAN_CACHE_TAGS.featured, "max");
  revalidateTag(HUMAN_CACHE_TAGS.homepage, "max");
}

/** Consent revocation, removal, and unpublish must stop serving stale content. */
export function expirePublishedHumanImmediately(slug: string) {
  revalidateTag(HUMAN_CACHE_TAGS.entry(slug), { expire: 0 });
  revalidateTag(HUMAN_CACHE_TAGS.list, { expire: 0 });
  revalidateTag(HUMAN_CACHE_TAGS.featured, { expire: 0 });
  revalidateTag(HUMAN_CACHE_TAGS.homepage, { expire: 0 });
}
