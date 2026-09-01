import type { HumanEntry, MediaAsset } from "./types";
import { GLOBE_MOCK_STORIES, type GlobeMockPortrait } from "./globe-mock-content.ts";

const portraits: Record<GlobeMockPortrait, { path: string; width: number; height: number; position: string; alt?: string }> = {
  james: { path: "/images/portrait-james.jpg", width: 1024, height: 1536, position: "center 32%" },
  maya: { path: "/images/hero-maya.jpg", width: 1536, height: 1024, position: "center 42%" },
  lena: { path: "/images/portrait-lena.jpg", width: 1024, height: 1536, position: "center 34%" },
  miguel: { path: "/images/portrait-miguel.jpg", width: 1024, height: 1535, position: "center 30%" },
  table: { path: "/images/community-table.jpg", width: 1536, height: 1024, position: "center" },
  avery: { path: "/images/demo-avery.jpg", width: 1024, height: 1536, position: "center 36%" },
  elena: { path: "/images/demo-elena.jpg", width: 1024, height: 1536, position: "center 38%" },
  jonah: { path: "/images/demo-jonah.jpg", width: 1024, height: 1536, position: "center 36%" },
  ren: { path: "/images/demo-ren.jpg", width: 1024, height: 1536, position: "center 34%" },
  mara: { path: "/images/demo-mara.jpg", width: 1024, height: 1536, position: "center 32%" },
  "phone-selfie-home": { path: "/images/phone-selfie-home.jpg", width: 1200, height: 1600, position: "center 35%" },
  "phone-selfie-car": { path: "/images/phone-selfie-car.jpg", width: 1200, height: 1600, position: "center 32%" },
  "phone-mirror-home": { path: "/images/phone-mirror-home.jpg", width: 1200, height: 1600, position: "center 40%" },
  "phone-kitchen-table": { path: "/images/phone-kitchen-table.jpg", width: 1200, height: 1600, position: "center 38%" },
  "phone-study-bedroom": { path: "/images/phone-study-bedroom.jpg", width: 1200, height: 1600, position: "center 38%" },
  "phone-selfie-cafe": { path: "/images/phone-selfie-cafe.jpg", width: 1200, height: 1600, position: "center 32%" },
  "phone-breakfast-alone": { path: "/images/phone-breakfast-alone.jpg", width: 1200, height: 1600, position: "center", alt: "AI-generated fictional phone snapshot of breakfast and an empty chair" },
  "phone-rainy-window": { path: "/images/phone-rainy-window.jpg", width: 1200, height: 1600, position: "center", alt: "AI-generated fictional phone snapshot through a rainy apartment window" },
  "phone-waterfront-walk": { path: "/images/phone-waterfront-walk.jpg", width: 1200, height: 1600, position: "center", alt: "AI-generated fictional phone snapshot taken during a waterfront walk" },
};

function mockPortrait(index: number, name: string, portrait: GlobeMockPortrait): MediaAsset {
  const source = portraits[portrait];
  return {
    id: `globe-demo-${String(index + 1).padStart(2, "0")}-image`,
    provider: "local",
    path: source.path,
    alt: source.alt ?? `AI-generated fictional development portrait representing ${name}`,
    mimeType: "image/jpeg",
    width: source.width,
    height: source.height,
    kind: "image",
    objectPosition: source.position,
  };
}

/**
 * Code-only globe fixtures. They never enter Supabase and can be disabled with
 * NEXT_PUBLIC_SHOW_GLOBE_MOCKS=false before launch.
 */
export const GLOBE_MOCK_ENTRIES: HumanEntry[] = GLOBE_MOCK_STORIES.map((human, index) => ({
  id: `globe-demo-${String(index + 1).padStart(2, "0")}`,
  slug: `globe-demo-${String(index + 1).padStart(2, "0")}`,
  type: "story",
  source: "editorial",
  person: {
    displayName: human.name,
    firstName: human.name,
    location: human.location,
    coordinates: { latitude: human.lat, longitude: human.lng, precision: "city" },
  },
  thumbnail: mockPortrait(index, human.name, human.portrait),
  headline: human.headline,
  quote: human.quote,
  story: human.paragraphs.join("\n\n"),
  blocks: [
    { id: `globe-demo-${index + 1}-quote`, type: "quote", quote: human.quote },
    { id: `globe-demo-${index + 1}-body`, type: "text", heading: human.sectionHeading, body: human.paragraphs },
    { id: `globe-demo-${index + 1}-note`, type: "note", text: human.closingNote, attribution: "Fictional development story" },
  ],
  consentVerified: false,
  published: false,
  featured: false,
  loveCount: human.loveCount,
  allowPrivateNotes: true,
  socialImageAllowed: false,
  createdAt: "2026-08-26T00:00:00.000Z",
  publishedAt: "2026-08-26T00:00:00.000Z",
  fixture: true,
}));

export function shouldShowGlobeMocks(nodeEnv: string | undefined, flag: string | undefined) {
  return nodeEnv === "development" && flag !== "false";
}

export function globeMocksEnabled() {
  return shouldShowGlobeMocks(process.env.NODE_ENV, process.env.NEXT_PUBLIC_SHOW_GLOBE_MOCKS);
}

export function getGlobeMockBySlug(slug: string) {
  return globeMocksEnabled() ? GLOBE_MOCK_ENTRIES.find(entry => entry.slug === slug) : undefined;
}
