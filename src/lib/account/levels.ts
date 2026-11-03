export type ExperienceCounts = { loves: number; notes: number; gifts: number };

export type MemberLevel = {
  experience: number;
  level: number;
  rank: RankName;
  /** Experience earned within the current level, and needed to reach the next. */
  progress: number;
  needed: number;
  nextRank: { name: string; level: number } | null;
};

// Every gift earns the same, so rank reflects showing up, not how much was given.
export const EXPERIENCE_PER = { loves: 10, notes: 25, gifts: 50 } as const satisfies ExperienceCounts;

export const RANKS = [
  { level: 1, name: "Listener" },
  { level: 3, name: "Neighbor" },
  { level: 6, name: "Friend" },
  { level: 10, name: "Kindred" },
  { level: 15, name: "Lighthouse" },
] as const;

export type RankName = (typeof RANKS)[number]["name"];

// Each level asks 50 more experience than the one before: 50, 100, 150…
const experienceForLevel = (level: number) => 25 * level * (level - 1);

export function memberLevel(counts: ExperienceCounts): MemberLevel {
  const experience = counts.loves * EXPERIENCE_PER.loves + counts.notes * EXPERIENCE_PER.notes + counts.gifts * EXPERIENCE_PER.gifts;
  const level = Math.floor((1 + Math.sqrt(1 + (4 * experience) / 25)) / 2);
  const floor = experienceForLevel(level);
  const rank = RANKS.findLast(item => item.level <= level) ?? RANKS[0];
  const next = RANKS.find(item => item.level > level);
  return {
    experience, level, rank: rank.name,
    progress: experience - floor, needed: experienceForLevel(level + 1) - floor,
    nextRank: next ? { name: next.name, level: next.level } : null,
  };
}
