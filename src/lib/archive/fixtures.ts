import type { HumanEntry } from "./types";
import { GLOBE_MOCK_ENTRIES } from "./globe-mocks.ts";

/**
 * The removable pre-launch archive is intentionally the same complete set used
 * by the globe. Keeping one fixture source prevents a visible Human from
 * resolving to an unrelated fragment, empty card, or missing story.
 *
 * Every record remains marked `fixture`, unpublished, and unconsented. None of
 * these fictional profiles are written to Supabase or represented as real
 * production stories.
 */
export const DEV_FIXTURE_HUMAN_ENTRIES: HumanEntry[] = GLOBE_MOCK_ENTRIES;
