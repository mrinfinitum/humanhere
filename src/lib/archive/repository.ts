import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { DEV_FIXTURE_HUMAN_ENTRIES } from "./fixtures";
import { decodeHumanCursor, encodeHumanCursor } from "./cursor";
import { HUMAN_CACHE_TAGS } from "./cache";
import { toHumanEntry, type PublicHumanRow } from "./public-dto";
import type { ArchiveBatch, ArchiveQuery, HumanArchiveRepository, HumanEntry } from "./types";
import { hasSupabasePublicEnvironment } from "@/lib/supabase/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const PUBLIC_COLUMNS = "id,slug,type,source,first_name,display_location,anonymous,thumbnail,media,headline,quote,story,featured,layout,love_count,allow_private_notes,social_image_allowed,created_at,published_at";

function boundedLimit(limit?: number) {
  return Math.min(Math.max(limit ?? 24, 1), 40);
}

function fixtureBatch(query: ArchiveQuery): ArchiveBatch {
  const limit = Math.min(Math.max(query.limit ?? 24, 1), 120);
  const offset = Number.parseInt(query.cursor ?? "0", 10) || 0;
  const filtered = query.types?.length ? DEV_FIXTURE_HUMAN_ENTRIES.filter(entry => query.types?.includes(entry.type)) : DEV_FIXTURE_HUMAN_ENTRIES;
  const entries = filtered.slice(offset, offset + limit);
  const next = offset + entries.length;
  return { entries, nextCursor: next < filtered.length ? String(next) : null, total: filtered.length };
}

function isPublicArchiveUnavailable(error: { code?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

export async function getPublishedHumanBatch(query: ArchiveQuery = {}): Promise<ArchiveBatch> {
  "use cache";
  cacheLife("hours");
  cacheTag(HUMAN_CACHE_TAGS.list);

  if (!hasSupabasePublicEnvironment()) return fixtureBatch(query);

  const limit = boundedLimit(query.limit);
  const cursor = decodeHumanCursor(query.cursor);
  let request = createSupabasePublicClient()
    .from("human_entries_public")
    .select(PUBLIC_COLUMNS)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (query.types?.length) request = request.in("type", query.types);
  if (cursor) {
    request = request.or(`published_at.lt.${cursor.publishedAt},and(published_at.eq.${cursor.publishedAt},id.lt.${cursor.id})`);
  }

  const { data, error } = await request;
  if (isPublicArchiveUnavailable(error)) return fixtureBatch(query);
  if (error) throw new Error(`Public archive query failed: ${error.code}`);
  const rows = (data ?? []) as unknown as PublicHumanRow[];
  const hasNext = rows.length > limit;
  const visibleRows = rows.slice(0, limit);
  const last = visibleRows.at(-1);

  return {
    entries: visibleRows.map(toHumanEntry),
    nextCursor: hasNext && last ? encodeHumanCursor({ publishedAt: last.published_at, id: last.id }) : null,
  };
}

export async function getPublishedHumanBySlug(slug: string): Promise<HumanEntry | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag(HUMAN_CACHE_TAGS.entry(slug));

  if (!hasSupabasePublicEnvironment()) return DEV_FIXTURE_HUMAN_ENTRIES.find(entry => entry.slug === slug);
  const { data, error } = await createSupabasePublicClient().from("human_entries_public").select(PUBLIC_COLUMNS).eq("slug", slug).maybeSingle();
  if (isPublicArchiveUnavailable(error)) return DEV_FIXTURE_HUMAN_ENTRIES.find(entry => entry.slug === slug);
  if (error) throw new Error(`Public story query failed: ${error.code}`);
  return data ? toHumanEntry(data as unknown as PublicHumanRow) : undefined;
}

export async function getFeaturedHumans(limit = 24): Promise<HumanEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(HUMAN_CACHE_TAGS.featured, HUMAN_CACHE_TAGS.homepage);
  if (!hasSupabasePublicEnvironment()) return DEV_FIXTURE_HUMAN_ENTRIES.filter(entry => entry.featured).slice(0, boundedLimit(limit));
  const { data, error } = await createSupabasePublicClient().from("human_entries_public").select(PUBLIC_COLUMNS).eq("featured", true).order("published_at", { ascending: false }).order("id", { ascending: false }).limit(boundedLimit(limit));
  if (isPublicArchiveUnavailable(error)) return DEV_FIXTURE_HUMAN_ENTRIES.filter(entry => entry.featured).slice(0, boundedLimit(limit));
  if (error) throw new Error(`Featured archive query failed: ${error.code}`);
  return ((data ?? []) as unknown as PublicHumanRow[]).map(toHumanEntry);
}

export async function getHomepageHumans(limit = 24): Promise<ArchiveBatch> {
  "use cache";
  cacheLife("hours");
  cacheTag(HUMAN_CACHE_TAGS.homepage);
  const bounded = boundedLimit(limit);
  const prototypeLimit = Math.min(Math.max(limit, 1), 96);
  if (!hasSupabasePublicEnvironment()) return fixtureBatch({ limit: prototypeLimit });
  const [featured, recent] = await Promise.all([getFeaturedHumans(bounded), getPublishedHumanBatch({ limit: bounded })]);
  const entries = [...featured, ...recent.entries].filter((entry, index, all) => all.findIndex(candidate => candidate.id === entry.id) === index).slice(0, bounded);
  // Keep the homepage visually useful before the first real story is published.
  // These records are explicitly marked as fixtures in the public UI and never
  // enter Supabase or masquerade as approved archive entries.
  if (!entries.length || entries.every(entry => entry.fixture)) return fixtureBatch({ limit: prototypeLimit });
  return { entries, nextCursor: recent.nextCursor };
}

/**
 * A bounded, cacheable candidate pool for the globe discovery session. The
 * browser cycles a much smaller fixed orb pool through these public-safe rows.
 */
export async function getGlobeDiscoveryCandidates(limit = 96): Promise<HumanEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(HUMAN_CACHE_TAGS.homepage, HUMAN_CACHE_TAGS.list);

  const bounded = Math.min(Math.max(limit, 24), 120);
  if (!hasSupabasePublicEnvironment()) return fixtureBatch({ limit: bounded }).entries;

  const { data, error } = await createSupabasePublicClient()
    .from("human_entries_public")
    .select(PUBLIC_COLUMNS)
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(bounded);

  if (isPublicArchiveUnavailable(error)) return fixtureBatch({ limit: bounded }).entries;
  if (error) throw new Error(`Globe discovery query failed: ${error.code}`);
  const entries = ((data ?? []) as unknown as PublicHumanRow[]).map(toHumanEntry);
  // Preserve the homepage's existing pre-launch behavior: fixture Humans keep
  // the globe explorable until the first consented public entry is published.
  // They remain code-only fixtures and are never written to Supabase.
  return entries.length ? entries : fixtureBatch({ limit: bounded }).entries;
}

async function getPublishedAdjacent(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(HUMAN_CACHE_TAGS.entry(slug), HUMAN_CACHE_TAGS.list);
  const current = await getPublishedHumanBySlug(slug);
  if (!current?.publishedAt) return {};
  if (!hasSupabasePublicEnvironment()) {
    const entries = DEV_FIXTURE_HUMAN_ENTRIES.filter(entry => entry.type === "story" || entry.type === "portrait");
    const index = entries.findIndex(entry => entry.slug === slug);
    return index < 0 ? {} : { previous: entries[index - 1], next: entries[index + 1] };
  }

  const client = createSupabasePublicClient();
  const newer = client.from("human_entries_public").select(PUBLIC_COLUMNS)
    .or(`published_at.gt.${current.publishedAt},and(published_at.eq.${current.publishedAt},id.gt.${current.id})`)
    .order("published_at", { ascending: true }).order("id", { ascending: true }).limit(1).maybeSingle();
  const older = client.from("human_entries_public").select(PUBLIC_COLUMNS)
    .or(`published_at.lt.${current.publishedAt},and(published_at.eq.${current.publishedAt},id.lt.${current.id})`)
    .order("published_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
  const [{ data: previous, error: previousError }, { data: next, error: nextError }] = await Promise.all([newer, older]);
  if (previousError || nextError) throw new Error(`Adjacent story query failed: ${previousError?.code ?? nextError?.code}`);
  return {
    previous: previous ? toHumanEntry(previous as unknown as PublicHumanRow) : undefined,
    next: next ? toHumanEntry(next as unknown as PublicHumanRow) : undefined,
  };
}

export const humanArchiveRepository: HumanArchiveRepository = {
  listPublished: getPublishedHumanBatch,
  getPublishedBySlug: getPublishedHumanBySlug,
  getPublishedAdjacent,
};
