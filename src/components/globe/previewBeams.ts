import type { GlobeHuman } from "./types";

// Conceptual presence lights for the cinematic homepage preview. These are
// deliberately anonymous and non-interactive; /world is the only experience
// that maps selectable beacons to published HumanEntry records.
const PREVIEW_COORDINATES = [
  [47.61, -122.33], [34.05, -118.24], [39.74, -104.99], [32.78, -96.8],
  [36.15, -95.99], [41.88, -87.63], [25.76, -80.19], [40.71, -74.01],
  [19.43, -99.13], [9.93, -84.08], [4.71, -74.07], [-12.05, -77.04],
  [-23.55, -46.63], [-34.6, -58.38], [51.51, -0.13], [6.52, 3.38],
  [-1.29, 36.82], [25.2, 55.27], [19.08, 72.88], [1.35, 103.82],
  [35.68, 139.69], [-6.21, 106.85], [-33.87, 151.21], [-37.81, 144.96],
] as const;

export const GLOBE_PREVIEW_BEAMS: GlobeHuman[] = PREVIEW_COORDINATES.map(([lat, lng], index) => ({
  id: `preview-beam-${String(index + 1).padStart(2, "0")}`,
  slug: "",
  firstName: "",
  lat,
  lng,
  loveCount: 0,
  featured: false,
  fixture: true,
}));
