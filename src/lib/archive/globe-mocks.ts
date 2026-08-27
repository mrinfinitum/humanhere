import type { HumanEntry, MediaAsset } from "./types";

type MockHumanDefinition = {
  name: string;
  location: string;
  lat: number;
  lng: number;
  quote: string;
  loveCount: number;
};

const portraits = [
  { path: "/images/portrait-james.jpg", width: 1200, height: 1600, position: "center 32%" },
  { path: "/images/hero-maya.jpg", width: 1536, height: 1024, position: "center 42%" },
  { path: "/images/portrait-lena.jpg", width: 1200, height: 1600, position: "center 34%" },
  { path: "/images/portrait-miguel.jpg", width: 1200, height: 1600, position: "center 30%" },
  { path: "/images/community-table.jpg", width: 1600, height: 1067, position: "center" },
] as const;

const mockHumans: MockHumanDefinition[] = [
  { name: "James", location: "Tulsa, Oklahoma", lat: 36.154, lng: -95.993, quote: "People stopped asking my name.", loveCount: 327 },
  { name: "Avery", location: "Los Angeles, California", lat: 34.052, lng: -118.244, quote: "Someone stayed long enough to listen.", loveCount: 84 },
  { name: "Noah", location: "New York, New York", lat: 40.713, lng: -74.006, quote: "The smallest kindness changed the direction of my day.", loveCount: 146 },
  { name: "Elena", location: "Mexico City, Mexico", lat: 19.433, lng: -99.133, quote: "We made room at the table.", loveCount: 59 },
  { name: "Micah", location: "São Paulo, Brazil", lat: -23.555, lng: -46.633, quote: "Hope looked ordinary that morning.", loveCount: 211 },
  { name: "Nadia", location: "Buenos Aires, Argentina", lat: -34.604, lng: -58.382, quote: "A name can be the beginning of being seen.", loveCount: 43 },
  { name: "Theo", location: "London, United Kingdom", lat: 51.507, lng: -0.128, quote: "The door was open, so I walked through it.", loveCount: 132 },
  { name: "June", location: "Paris, France", lat: 48.857, lng: 2.352, quote: "Care begins when attention becomes action.", loveCount: 91 },
  { name: "Amara", location: "Berlin, Germany", lat: 52.52, lng: 13.405, quote: "There is more to every person than the hardest day.", loveCount: 118 },
  { name: "Jonah", location: "Lagos, Nigeria", lat: 6.524, lng: 3.379, quote: "I remembered I did not have to carry it alone.", loveCount: 76 },
  { name: "Mae", location: "Nairobi, Kenya", lat: -1.286, lng: 36.818, quote: "Being seen can change the shape of a day.", loveCount: 64 },
  { name: "Elias", location: "Cape Town, South Africa", lat: -33.925, lng: 18.424, quote: "Showing up is a small act until you need someone.", loveCount: 153 },
  { name: "Iris", location: "Cairo, Egypt", lat: 30.044, lng: 31.236, quote: "I found courage in an ordinary conversation.", loveCount: 37 },
  { name: "Caleb", location: "Mumbai, India", lat: 19.076, lng: 72.878, quote: "Someone remembered what I said.", loveCount: 184 },
  { name: "Sofia", location: "Delhi, India", lat: 28.614, lng: 77.209, quote: "We were strangers until someone said hello.", loveCount: 102 },
  { name: "Rowan", location: "Bangkok, Thailand", lat: 13.756, lng: 100.502, quote: "I learned that asking for help is also an act of hope.", loveCount: 69 },
  { name: "Mina", location: "Manila, Philippines", lat: 14.6, lng: 120.984, quote: "The light stayed on for me.", loveCount: 125 },
  { name: "Ren", location: "Tokyo, Japan", lat: 35.677, lng: 139.65, quote: "Quiet attention can still be love.", loveCount: 198 },
  { name: "Hana", location: "Seoul, South Korea", lat: 37.566, lng: 126.978, quote: "I was met as a person, not a problem.", loveCount: 87 },
  { name: "Sam", location: "Singapore", lat: 1.352, lng: 103.82, quote: "Belonging began with one empty chair.", loveCount: 51 },
  { name: "Lina", location: "Jakarta, Indonesia", lat: -6.208, lng: 106.846, quote: "We kept choosing one another.", loveCount: 113 },
  { name: "Mara", location: "Sydney, Australia", lat: -33.869, lng: 151.209, quote: "The distance felt smaller after we spoke.", loveCount: 94 },
  { name: "Finn", location: "Auckland, New Zealand", lat: -36.85, lng: 174.764, quote: "Someone showed up before I knew how to ask.", loveCount: 46 },
  { name: "Ari", location: "Toronto, Canada", lat: 43.653, lng: -79.383, quote: "There was room for the honest answer.", loveCount: 139 },
  { name: "Leah", location: "Vancouver, Canada", lat: 49.283, lng: -123.121, quote: "For a moment, I knew I was not alone.", loveCount: 72 },
];

function mockPortrait(index: number, name: string): MediaAsset {
  const source = portraits[index % portraits.length];
  return {
    id: `globe-demo-${String(index + 1).padStart(2, "0")}-image`,
    provider: "local",
    path: source.path,
    alt: `Fictional development portrait representing ${name}`,
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
export const GLOBE_MOCK_ENTRIES: HumanEntry[] = mockHumans.map((human, index) => ({
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
  thumbnail: mockPortrait(index, human.name),
  headline: "A development story for the living globe.",
  quote: human.quote,
  story: "This is fictional demonstration content used only to test HUMAN:HERE globe discovery, selection, and story presentation. It will be removed before launch.",
  blocks: [
    { id: `globe-demo-${index + 1}-quote`, type: "quote", quote: human.quote },
    { id: `globe-demo-${index + 1}-body`, type: "text", heading: "Demonstration story", body: ["This Human is a clearly marked code-only fixture. Real stories will appear only after editorial review and explicit consent."] },
  ],
  consentVerified: false,
  published: false,
  featured: false,
  loveCount: human.loveCount,
  allowPrivateNotes: false,
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
  return GLOBE_MOCK_ENTRIES.find(entry => entry.slug === slug);
}
