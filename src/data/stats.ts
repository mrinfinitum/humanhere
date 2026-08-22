export type ImpactStat = {
  value: string;
  label: string;
  accent: "lapis" | "clay" | "meadow" | "butter";
};

export const impactStats: ImpactStat[] = [
  { value: "2,450+", label: "People reached", accent: "lapis" },
  { value: "18", label: "Active initiatives", accent: "clay" },
  { value: "12", label: "Community partners", accent: "meadow" },
  { value: "1", label: "Community", accent: "butter" },
];
