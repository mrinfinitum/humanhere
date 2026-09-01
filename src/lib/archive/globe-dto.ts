import type { GlobeHuman } from "@/components/globe/types";
import type { HumanEntry } from "./types";

type Coordinate = [number, number];

function normalized(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function publicCoordinate(entry: HumanEntry): Coordinate | null {
  const explicit = entry.person?.coordinates;
  if (explicit && ["city", "region", "country"].includes(explicit.precision)) {
    return [explicit.latitude, explicit.longitude];
  }
  return null;
}

export function toGlobeHumans(entries: HumanEntry[], limit = 24): GlobeHuman[] {
  const candidates = entries.flatMap((entry): GlobeHuman[] => {
    if (!entry.fixture && (!entry.published || !entry.consentVerified)) return [];
    const coordinate = publicCoordinate(entry);
    if (!coordinate || !entry.person?.location) return [];

    return [{
      id: entry.id,
      slug: entry.relatedStorySlug ?? entry.slug,
      firstName: entry.person.anonymous ? "Anonymous" : entry.person.firstName ?? entry.person.displayName ?? "A human",
      city: entry.person.location,
      lat: coordinate[0],
      lng: coordinate[1],
      loveCount: entry.loveCount,
      quote: entry.quote ?? entry.headline,
      featured: Boolean(entry.featured),
      fixture: Boolean(entry.fixture),
    }];
  });

  const fixtureMode = candidates.length > 0 && candidates.every(entry => entry.fixture);
  if (!fixtureMode) return candidates.slice(0, limit);

  // The development archive contains many fragments from the same four people.
  // Prefer distinct person/place pairs so the globe reads as humans, not content units.
  const seen = new Set<string>();
  const cityCounts = new Map<string, number>();
  return candidates.filter(entry => {
    const key = `${entry.firstName.toLowerCase()}|${normalized(entry.city ?? "")}`;
    if (seen.has(key)) return false;
    const cityKey = normalized(entry.city ?? "location withheld");
    const cityCount = cityCounts.get(cityKey) ?? 0;
    if (cityCount >= 2) return false;
    seen.add(key);
    cityCounts.set(cityKey, cityCount + 1);
    return true;
  }).slice(0, Math.min(limit, 40));
}
