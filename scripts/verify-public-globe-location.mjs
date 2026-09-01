import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { toGlobeHumans } from "../src/lib/archive/globe-dto.ts";
import { toHumanEntry } from "../src/lib/archive/public-dto.ts";

const migration = await readFile(
  new URL("../supabase/migrations/202608310006_public_globe_locations.sql", import.meta.url),
  "utf8",
);
const repository = await readFile(new URL("../src/lib/archive/repository.ts", import.meta.url), "utf8");
const globeDto = await readFile(new URL("../src/lib/archive/globe-dto.ts", import.meta.url), "utf8");

assert.match(migration, /create type public\.human_public_location_precision as enum \('city', 'region', 'country'\)/);
assert.match(migration, /human_entries_public_location_complete[\s\S]*num_nonnulls\([\s\S]*\) in \(0, 4\)/);
assert.match(migration, /human_entries_withheld_location_has_no_coordinates/);
assert.match(migration, /set_human_entry_public_location[\s\S]*security definer[\s\S]*set search_path = ''/);
assert.match(migration, /is_staff\(array\['editor', 'admin'\]/);
assert.match(migration, /revoke all on function public\.set_human_entry_public_location[\s\S]*from public, anon/);
assert.match(migration, /public_latitude, public_longitude, public_location_precision\s+from public\.human_entries/);
assert.doesNotMatch(
  migration.match(/create or replace view public\.human_entries_public[\s\S]*?grant select on public\.human_entries_public/)?.[0] ?? "",
  /public_location_approved_(?:at|by)/,
  "approval audit fields must never enter the public projection",
);
assert.match(repository, /from\("human_entries_public"\)[\s\S]*?\.select\("\*"\)/, "globe candidates should read the version-compatible public-safe view");
assert.doesNotMatch(globeDto, /PUBLIC_CITY_CENTROIDS|hashUnit/, "production coordinates must never be inferred from display text");

const row = {
  id: "10000000-0000-0000-0000-000000000001",
  slug: "coordinate-test",
  type: "story",
  source: "direct",
  first_name: "James",
  display_location: "Tulsa",
  anonymous: false,
  thumbnail: null,
  media: null,
  headline: "I could use someone to listen.",
  quote: "I'm here.",
  story: "I'm asking to be seen.",
  featured: false,
  layout: null,
  love_count: 0,
  allow_private_notes: true,
  social_image_allowed: false,
  created_at: "2026-08-31T00:00:00.000Z",
  published_at: "2026-08-31T00:00:00.000Z",
};

const approved = toHumanEntry({
  ...row,
  public_latitude: 36.15398,
  public_longitude: -95.99277,
  public_location_precision: "city",
});
assert.deepEqual(approved.person?.coordinates, {
  latitude: 36.15398,
  longitude: -95.99277,
  precision: "city",
});
assert.equal(toGlobeHumans([approved]).length, 1, "an approved approximate location should appear on the globe");

const withheld = toHumanEntry(row);
assert.equal(toGlobeHumans([withheld]).length, 0, "display location text alone must never create a globe coordinate");

console.log("Public globe locations verified: explicit, approximate, public-safe, and fail-closed.");
