import type { GlobeHuman } from "./types";

const TULSA_LAT = 36.154;
const TULSA_LNG = -95.993;

/** Temporary single-Human proof record. It never writes to Supabase. */
export function createTulsaTestHuman(humans: GlobeHuman[]): GlobeHuman {
  const source = humans.find(human => human.city?.toLowerCase().includes("tulsa"));
  const routeSource = source ?? humans[0];
  return {
    id: "tulsa-test",
    slug: routeSource?.slug ?? "james",
    firstName: source?.firstName ?? "James",
    city: "Tulsa, OK",
    lat: TULSA_LAT,
    lng: TULSA_LNG,
    loveCount: source?.loveCount || 327,
    quote: source?.quote ?? "People stopped asking my name.",
    featured: false,
    fixture: true,
  };
}
