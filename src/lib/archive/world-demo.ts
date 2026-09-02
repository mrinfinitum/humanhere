import "server-only";

import { GLOBE_MOCK_ENTRIES } from "./globe-mocks";

/**
 * Temporary, server-controlled demonstration mode for /world.
 *
 * The demonstration is intentionally on during this product-preview phase.
 * Setting the flag to "false" restores the real-data-only path without a code
 * change. The fixtures remain code-only and are never written to Supabase.
 */
export function worldDemoEnabled() {
  return process.env.WORLD_DEMO_ENABLED !== "false";
}

export function getWorldDemoEntries() {
  return worldDemoEnabled() ? GLOBE_MOCK_ENTRIES : [];
}

export function getWorldDemoHumanBySlug(slug: string) {
  return worldDemoEnabled()
    ? GLOBE_MOCK_ENTRIES.find(entry => entry.slug === slug)
    : undefined;
}
