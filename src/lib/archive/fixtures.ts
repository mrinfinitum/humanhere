import type { HumanArtifactType, HumanEntry, MediaAsset } from "./types";

const media = {
  james: { id: "dev-james-image", provider: "local", path: "/images/portrait-james.jpg", alt: "Development portrait fixture of James", mimeType: "image/jpeg", width: 1200, height: 1600, kind: "image", objectPosition: "center 32%" },
  maya: { id: "dev-maya-image", provider: "local", path: "/images/hero-maya.jpg", alt: "Development portrait fixture of Maya", mimeType: "image/jpeg", width: 1536, height: 1024, kind: "image", objectPosition: "center 42%" },
  lena: { id: "dev-lena-image", provider: "local", path: "/images/portrait-lena.jpg", alt: "Development portrait fixture of Lena", mimeType: "image/jpeg", width: 1200, height: 1600, kind: "image", objectPosition: "center 34%" },
  miguel: { id: "dev-miguel-image", provider: "local", path: "/images/portrait-miguel.jpg", alt: "Development portrait fixture of Miguel", mimeType: "image/jpeg", width: 1200, height: 1600, kind: "image", objectPosition: "center 30%" },
  table: { id: "dev-table-image", provider: "local", path: "/images/community-table.jpg", alt: "Development documentary fixture of neighbors at a shared table", mimeType: "image/jpeg", width: 1600, height: 1067, kind: "image", objectPosition: "center" },
} satisfies Record<string, MediaAsset>;

const base = {
  consentVerified: false,
  published: false,
  source: "editorial" as const,
  createdAt: "2026-08-23T00:00:00.000Z",
  publishedAt: "2026-08-23T00:00:00.000Z",
  loveCount: 0,
  allowPrivateNotes: false,
  socialImageAllowed: false,
  fixture: true,
};

const textThumbnail = (alt: string): MediaAsset => ({ id: `dev-text-${alt.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`, provider: "local", path: "", alt, mimeType: "text/plain", width: 800, height: 800, kind: "text" });

const people: HumanEntry[] = [
  {
    ...base,
    id: "dev-james",
    slug: "james",
    type: "story",
    person: { displayName: "James", firstName: "James", location: "Tulsa, Oklahoma" },
    thumbnail: media.james,
    media: [media.james],
    headline: "Father. Veteran. Neighbor.",
    quote: "People stopped asking my name.",
    story: "A real, consented first-person story will replace this development fixture before publication.",
    featured: true,
    layout: { size: "lg", emphasis: 10, crop: "portrait" },
    blocks: [
      { id: "james-quote", type: "quote", quote: "People stopped asking my name." },
      { id: "james-text", type: "text", heading: "A story in progress", body: ["James is development fixture content. The final story will be edited with the person featured.", "HUMAN:HERE will describe a whole life—not reduce someone to a circumstance."] },
      { id: "james-note", type: "note", text: "Please remember the person before the problem.", attribution: "Development fixture" },
    ],
  },
  {
    ...base,
    id: "dev-maya",
    slug: "maya",
    type: "portrait",
    person: { displayName: "Maya", firstName: "Maya", age: 19, location: "Tulsa, Oklahoma" },
    thumbnail: media.maya,
    media: [media.maya],
    headline: "Student. Sister. Neighbor.",
    quote: "You cannot always tell what someone is carrying.",
    story: "A real, consented first-person story will replace this development fixture before publication.",
    featured: true,
    layout: { size: "xl", emphasis: 10, crop: "eyes" },
    blocks: [
      { id: "maya-media", type: "media", media: media.maya },
      { id: "maya-quote", type: "quote", quote: "You cannot always tell what someone is carrying." },
      { id: "maya-text", type: "text", body: ["This is development fixture copy. Publication requires conversation, consent, and collaborative review."] },
    ],
  },
  {
    ...base,
    id: "dev-lena",
    slug: "lena",
    type: "story",
    person: { displayName: "Lena", firstName: "Lena", location: "Tulsa, Oklahoma" },
    thumbnail: media.lena,
    media: [media.lena],
    headline: "Grandmother. Mentor. Friend.",
    quote: "Being seen can change the shape of a day.",
    story: "A real, consented first-person story will replace this development fixture before publication.",
    layout: { size: "md", emphasis: 8, crop: "portrait" },
    blocks: [{ id: "lena-quote", type: "quote", quote: "Being seen can change the shape of a day." }, { id: "lena-text", type: "text", body: ["This development fixture reserves space for a consented story, more photographs, a voice recording, or a handwritten note."] }],
  },
  {
    ...base,
    id: "dev-miguel",
    slug: "miguel",
    type: "portrait",
    person: { displayName: "Miguel", firstName: "Miguel", location: "Tulsa, Oklahoma" },
    thumbnail: media.miguel,
    media: [media.miguel],
    headline: "Builder. Coach. Neighbor.",
    quote: "Showing up is a small act until you need someone.",
    story: "A real, consented first-person story will replace this development fixture before publication.",
    layout: { size: "sm", emphasis: 7, crop: "square" },
    blocks: [{ id: "miguel-quote", type: "quote", quote: "Showing up is a small act until you need someone." }, { id: "miguel-text", type: "text", body: ["This is development fixture copy and not a public submission."] }],
  },
];

const fragments: Array<{
  slug: string;
  type: HumanArtifactType;
  headline?: string;
  quote?: string;
  person?: HumanEntry["person"];
  thumbnail?: MediaAsset;
  size: NonNullable<HumanEntry["layout"]>["size"];
  crop?: NonNullable<HumanEntry["layout"]>["crop"];
  tone?: NonNullable<HumanEntry["layout"]>["tone"];
  related?: string;
}> = [
  { slug: "james-eyes", type: "portrait", person: people[0].person, thumbnail: media.james, size: "xs", crop: "eyes", related: "james" },
  { slug: "what-are-you-carrying", type: "note", headline: "WHAT ARE YOU CARRYING?", quote: "There is room for the honest answer.", size: "sm", tone: "butter" },
  { slug: "anonymous-tuesday", type: "quote", person: { displayName: "Anonymous", age: 34, anonymous: true }, quote: "I’m leaving Tuesday. He doesn’t know yet.", size: "md", tone: "ink" },
  { slug: "maya-voice", type: "audio", person: people[1].person, quote: "What I wish people understood", thumbnail: media.maya, size: "xs", crop: "square", related: "maya" },
  { slug: "table-at-six", type: "place", headline: "A table at six", quote: "Nobody ate alone that night.", thumbnail: media.table, size: "lg", crop: "landscape" },
  { slug: "people-need-people", type: "quote", headline: "PEOPLE\nNEED\nPEOPLE.", size: "md", tone: "lapis" },
  { slug: "lena-note", type: "note", person: people[2].person, quote: "Call when you get home.", size: "xs", tone: "paper", related: "lena" },
  { slug: "miguel-hands", type: "object", person: people[3].person, thumbnail: media.miguel, headline: "The hands that built it", size: "sm", crop: "square", related: "miguel" },
  { slug: "why-we-show-up", type: "quote", headline: "WHY WE SHOW UP", quote: "Faith should move toward people.", size: "sm", tone: "paper" },
  { slug: "maya-still", type: "video", person: people[1].person, thumbnail: media.maya, quote: "A human moment / 00:18", size: "md", crop: "landscape", related: "maya" },
  { slug: "james-note", type: "note", person: people[0].person, quote: "Please ask my name first.", size: "sm", tone: "clay", related: "james" },
  { slug: "show-up", type: "quote", headline: "SHOW UP.", quote: "Give. Volunteer. Partner. Pray.", size: "lg", tone: "ink" },
  { slug: "lena-eyes", type: "portrait", person: people[2].person, thumbnail: media.lena, size: "xs", crop: "eyes", related: "lena" },
  { slug: "small-kindness", type: "quote", quote: "The smallest kindness can still change the direction of a day.", size: "sm", tone: "powder" },
  { slug: "porch-light", type: "place", thumbnail: media.table, headline: "The porch light stayed on", size: "md", crop: "landscape" },
  { slug: "miguel-voice", type: "audio", person: people[3].person, thumbnail: media.miguel, quote: "On being someone’s neighbor", size: "xs", crop: "square", related: "miguel" },
  { slug: "room-for-one-more", type: "note", quote: "There is room for one more.", size: "sm", tone: "meadow" },
  { slug: "maya-eyes", type: "portrait", person: people[1].person, thumbnail: media.maya, size: "sm", crop: "eyes", related: "maya" },
  { slug: "shared-bread", type: "object", thumbnail: media.table, headline: "What was left on the table", size: "xs", crop: "square" },
  { slug: "anonymous-hope", type: "audio", person: { displayName: "Anonymous", anonymous: true, location: "Tulsa, Oklahoma" }, quote: "I still have hope. / 01:06", size: "md", tone: "oxblood" },
  { slug: "james-walk", type: "video", person: people[0].person, thumbnail: media.james, quote: "The way home / 00:24", size: "sm", crop: "portrait", related: "james" },
  { slug: "listen-first", type: "quote", headline: "LISTEN FIRST.", size: "xs", tone: "paper" },
  { slug: "lena-letter", type: "note", person: people[2].person, quote: "You were never a burden.", size: "md", tone: "butter", related: "lena" },
  { slug: "human-scale", type: "quote", quote: "Start with bodies, time, relationships, and actual lives.", size: "sm", tone: "lapis" },
  { slug: "community-table", type: "place", thumbnail: media.table, headline: "Tulsa, Oklahoma", size: "xl", crop: "landscape" },
  { slug: "be-seen", type: "note", headline: "+ ADD YOUR STORY", quote: "No filters. No perfection required. Just you.", size: "md", tone: "paper" },
  { slug: "four-voices", type: "audio", quote: "Four voices, one table / 03:42", thumbnail: media.table, size: "sm", crop: "square" },
  { slug: "before-the-label", type: "quote", quote: "Before a story, before a label, there is a person.", size: "lg", tone: "paper" },
];

const fragmentEntries: HumanEntry[] = fragments.map((fragment, index) => ({
  ...base,
  id: `dev-fragment-${String(index + 1).padStart(2, "0")}`,
  slug: fragment.slug,
  type: fragment.type,
  person: fragment.person,
  thumbnail: fragment.thumbnail ?? textThumbnail(`Development ${fragment.type} fixture: ${fragment.headline ?? fragment.quote ?? fragment.slug}`),
  headline: fragment.headline,
  quote: fragment.quote,
  story: "This archive object is development fixture content. Real media and words require editorial review and explicit consent before publication.",
  relatedStorySlug: fragment.related,
  layout: { size: fragment.size, emphasis: index % 5 + 1, crop: fragment.crop, tone: fragment.tone },
  blocks: fragment.quote ? [{ id: `${fragment.slug}-quote`, type: "quote", quote: fragment.quote }] : undefined,
}));

const portraitMedia = [media.james, media.maya, media.lena, media.miguel, media.table];
const densityCrops = ["portrait", "eyes", "square", "landscape"] as const;
const densitySizes = ["xs", "sm", "xs", "md", "sm", "xs", "sm", "md"] as const;

/**
 * A scale fixture for art direction and pagination—not production content.
 * It deliberately reuses the five local development images so the repository
 * can simulate hundreds of records without introducing unlicensed imagery.
 */
const densityEntries: HumanEntry[] = Array.from({ length: 224 }, (_, index) => {
  const sequence = index + 1;
  const source = portraitMedia[index % portraitMedia.length];
  const isPlace = index % 13 === 0;
  const isVideo = index % 19 === 0;
  const emphasized = index % 23 === 0;
  const type: HumanArtifactType = isPlace ? "place" : isVideo ? "video" : "portrait";

  return {
    ...base,
    id: `dev-density-${String(sequence).padStart(3, "0")}`,
    slug: `human-field-study-${String(sequence).padStart(3, "0")}`,
    type,
    person: isPlace ? undefined : { displayName: `Human study ${String(sequence).padStart(3, "0")}` },
    thumbnail: {
      ...source,
      id: `${source.id}-study-${String(sequence).padStart(3, "0")}`,
      alt: `DEV_FIXTURE archive image study ${sequence}`,
    },
    headline: isPlace ? `Human place study ${String(sequence).padStart(3, "0")}` : undefined,
    quote: isVideo ? `A human moment / 00:${String(12 + index % 40).padStart(2, "0")}` : undefined,
    story: "Development scale fixture. Replace with a real, consented human artifact before publication.",
    layout: {
      size: emphasized ? (index % 46 === 0 ? "lg" : "md") : densitySizes[index % densitySizes.length],
      emphasis: emphasized ? 10 : 2 + index % 7,
      crop: densityCrops[index % densityCrops.length],
    },
  };
});

export const DEV_FIXTURE_HUMAN_ENTRIES: HumanEntry[] = [...people, ...fragmentEntries, ...densityEntries];
