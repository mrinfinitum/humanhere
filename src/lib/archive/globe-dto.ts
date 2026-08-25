import type { HumanEntry } from "./types";
import type { GlobeHuman } from "@/components/globe/types";
import { resolveMediaUrl } from "@/lib/media/resolver";

type Coordinate = [number, number];

const PUBLIC_CITY_CENTROIDS: Record<string, Coordinate> = {
  tulsa: [36.154, -95.993], dallas: [32.777, -96.797], atlanta: [33.749, -84.388], chicago: [41.878, -87.63],
  "los angeles": [34.052, -118.244], "new york": [40.713, -74.006], "mexico city": [19.433, -99.133],
  "sao paulo": [-23.555, -46.633], london: [51.507, -0.128], nairobi: [-1.286, 36.818], "cape town": [-33.925, 18.424],
  lagos: [6.524, 3.379], mumbai: [19.076, 72.878], tokyo: [35.677, 139.65], sydney: [-33.869, 151.209], manila: [14.6, 120.984],
};

function normalized(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hashUnit(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function publicCoordinate(entry: HumanEntry): Coordinate | null {
  const explicit = entry.person?.coordinates;
  if (explicit && ["city", "region", "country"].includes(explicit.precision)) return [explicit.latitude, explicit.longitude];
  const publicLocation = normalized(entry.person?.location ?? "");
  const match = Object.entries(PUBLIC_CITY_CENTROIDS).find(([city]) => publicLocation.includes(city));
  if (!match) return null;
  const jitter = (hashUnit(entry.id) - 0.5) * 0.8;
  return [match[1][0] + jitter * 0.42, match[1][1] + jitter];
}

export function toGlobeHumans(entries: HumanEntry[]): GlobeHuman[] {
  return entries.flatMap(entry => {
    if (!entry.fixture && (!entry.published || !entry.consentVerified)) return [];
    const coordinate = publicCoordinate(entry);
    if (!coordinate || !entry.person?.location) return [];
    const thumbnail = entry.thumbnail?.kind === "image" ? entry.thumbnail : undefined;
    return [{
      id: entry.id,
      slug: entry.relatedStorySlug ?? entry.slug,
      firstName: entry.person.anonymous ? "Anonymous" : entry.person.firstName ?? entry.person.displayName ?? "A human",
      city: entry.person.location,
      lat: coordinate[0], lng: coordinate[1], loveCount: entry.loveCount,
      thumbnailUrl: thumbnail ? resolveMediaUrl(thumbnail, "thumbnail") : undefined,
      thumbnailAlt: thumbnail?.alt,
      thumbnailObjectPosition: thumbnail?.objectPosition,
      quote: entry.quote ?? entry.headline,
      featured: Boolean(entry.featured), fixture: Boolean(entry.fixture),
    }];
  });
}
