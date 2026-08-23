import { DEV_FIXTURE_HUMAN_ENTRIES } from "./fixtures";
import type { ArchiveBatch, ArchiveQuery, HumanArchiveRepository, HumanEntry } from "./types";

const decodeCursor = (cursor?: string) => {
  if (!cursor) return 0;
  const parsed = Number.parseInt(cursor, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

/**
 * Development provider only. It intentionally returns visibly marked fixtures.
 * A production provider must enforce approved consent and published status in its
 * server-side query before implementing this interface.
 */
class FixtureHumanArchiveRepository implements HumanArchiveRepository {
  async list(query: ArchiveQuery = {}): Promise<ArchiveBatch> {
    const offset = decodeCursor(query.cursor);
    const limit = Math.min(Math.max(query.limit ?? 18, 1), 48);
    const filtered = query.types?.length
      ? DEV_FIXTURE_HUMAN_ENTRIES.filter(entry => query.types?.includes(entry.type))
      : DEV_FIXTURE_HUMAN_ENTRIES;
    const entries = filtered.slice(offset, offset + limit);
    const nextOffset = offset + entries.length;
    return { entries, nextCursor: nextOffset < filtered.length ? String(nextOffset) : null, total: filtered.length };
  }

  async getBySlug(slug: string) {
    return DEV_FIXTURE_HUMAN_ENTRIES.find(entry => entry.slug === slug);
  }

  async getAdjacent(slug: string) {
    const stories = DEV_FIXTURE_HUMAN_ENTRIES.filter(entry => entry.type === "story" || entry.type === "portrait");
    const index = stories.findIndex(entry => entry.slug === slug || entry.slug === DEV_FIXTURE_HUMAN_ENTRIES.find(candidate => candidate.slug === slug)?.relatedStorySlug);
    if (index < 0) return {};
    return {
      previous: stories[(index - 1 + stories.length) % stories.length],
      next: stories[(index + 1) % stories.length],
    } satisfies { previous?: HumanEntry; next?: HumanEntry };
  }
}

export const humanArchiveRepository: HumanArchiveRepository = new FixtureHumanArchiveRepository();
