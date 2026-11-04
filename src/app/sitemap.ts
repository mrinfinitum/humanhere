import type { MetadataRoute } from "next";
import { getPublishedHumanBatch } from "@/lib/archive/repository";
import { getSiteUrl } from "@/lib/neon/env";

const PAGES = ["", "/humans", "/members", "/mission", "/give", "/get-involved", "/contact", "/about", "/terms", "/privacy", "/remove-my-story"];
const MAX_STORIES = 2000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const entries: MetadataRoute.Sitemap = PAGES.map(path => ({ url: `${site}${path}`, changeFrequency: path === "" || path === "/humans" ? "daily" : "monthly", priority: path === "" ? 1 : 0.6 }));
  let cursor: string | undefined;
  let count = 0;
  do {
    const batch = await getPublishedHumanBatch({ limit: 40, cursor });
    for (const human of batch.entries) {
      entries.push({ url: `${site}/humans/${human.slug}`, lastModified: human.publishedAt ?? undefined, changeFrequency: "weekly", priority: 0.7 });
    }
    count += batch.entries.length;
    cursor = batch.nextCursor ?? undefined;
  } while (cursor && count < MAX_STORIES);
  return entries;
}
