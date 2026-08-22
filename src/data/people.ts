export type StorySection = {
  heading: string;
  body: string[];
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
};

export type Person = {
  slug: string;
  firstName: string;
  lastName?: string;
  location?: string;
  portrait: string;
  portraitAlt: string;
  portraitPosition?: string;
  shortStatement?: string;
  pullQuote?: string;
  story?: string;
  storySections?: StorySection[];
  photographer?: string;
  publishedAt?: string;
  featured?: boolean;
  descriptor?: string;
  isFixture: true;
};

const fixtureSection = (firstName: string): StorySection[] => [
  {
    heading: "A story in progress",
    body: [
      `${firstName} is development fixture content. A real, consented first-person interview will replace this text before publication.`,
      "The final story will be edited with the person featured and will describe a whole life—not reduce someone to a circumstance.",
    ],
  },
];

/**
 * DEV_FIXTURE / PLACEHOLDER DATA ONLY.
 * Replace every record with a real, consented story and commissioned photography
 * before launch. Keeping the content behind this model allows a CMS or Supabase
 * source to replace these fixtures without changing the presentation layer.
 */
export const DEV_FIXTURE_PEOPLE: Person[] = [
  {
    slug: "james",
    firstName: "James",
    location: "Tulsa, Oklahoma",
    portrait: "/images/portrait-james.jpg",
    portraitAlt: "Development portrait fixture of James looking directly at the camera",
    portraitPosition: "center 32%",
    shortStatement: "Father. Veteran. Neighbor.",
    pullQuote: "People stopped asking my name.",
    story: "A real, consented first-person story will appear here before launch.",
    storySections: fixtureSection("James"),
    photographer: "Development image fixture",
    publishedAt: "2026",
    featured: true,
    descriptor: "Father. Veteran. Neighbor.",
    isFixture: true,
  },
  {
    slug: "maya",
    firstName: "Maya",
    location: "Tulsa, Oklahoma",
    portrait: "/images/hero-maya.jpg",
    portraitAlt: "Development portrait fixture of Maya looking directly at the camera",
    portraitPosition: "center 42%",
    shortStatement: "Student. Sister. Neighbor.",
    pullQuote: "You cannot always tell what someone is carrying.",
    story: "A real, consented first-person story will appear here before launch.",
    storySections: fixtureSection("Maya"),
    photographer: "Development image fixture",
    publishedAt: "2026",
    descriptor: "Student. Sister. Neighbor.",
    isFixture: true,
  },
  {
    slug: "lena",
    firstName: "Lena",
    location: "Tulsa, Oklahoma",
    portrait: "/images/portrait-lena.jpg",
    portraitAlt: "Development portrait fixture of Lena looking directly at the camera",
    portraitPosition: "center 34%",
    shortStatement: "Grandmother. Mentor. Friend.",
    pullQuote: "Being seen can change the shape of a day.",
    story: "A real, consented first-person story will appear here before launch.",
    storySections: fixtureSection("Lena"),
    photographer: "Development image fixture",
    publishedAt: "2026",
    descriptor: "Grandmother. Mentor. Friend.",
    isFixture: true,
  },
  {
    slug: "miguel",
    firstName: "Miguel",
    location: "Tulsa, Oklahoma",
    portrait: "/images/portrait-miguel.jpg",
    portraitAlt: "Development portrait fixture of Miguel looking directly at the camera",
    portraitPosition: "center 30%",
    shortStatement: "Builder. Coach. Neighbor.",
    pullQuote: "Showing up is a small act until you need someone.",
    story: "A real, consented first-person story will appear here before launch.",
    storySections: fixtureSection("Miguel"),
    photographer: "Development image fixture",
    publishedAt: "2026",
    descriptor: "Builder. Coach. Neighbor.",
    isFixture: true,
  },
];

export function getPerson(slug: string) {
  return DEV_FIXTURE_PEOPLE.find((person) => person.slug === slug);
}

export function getAdjacentPeople(slug: string) {
  const index = DEV_FIXTURE_PEOPLE.findIndex((person) => person.slug === slug);

  if (index < 0) return { previous: undefined, next: undefined };

  return {
    previous: DEV_FIXTURE_PEOPLE[(index - 1 + DEV_FIXTURE_PEOPLE.length) % DEV_FIXTURE_PEOPLE.length],
    next: DEV_FIXTURE_PEOPLE[(index + 1) % DEV_FIXTURE_PEOPLE.length],
  };
}
