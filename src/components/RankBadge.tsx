import type { RankName } from "@/lib/account/levels";

// A scalloped seal, like a verified mark: twelve points alternating between
// an outer and inner radius, softened by the round stroke join.
const SEAL = Array.from({ length: 24 }, (_, index) => {
  const angle = (index * Math.PI) / 12 - Math.PI / 2;
  const radius = index % 2 ? 9.2 : 11;
  return `${(12 + radius * Math.cos(angle)).toFixed(2)},${(12 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(" ");

/** Each rank's own mark inside the seal, drawn on a 24-unit grid. */
const GLYPHS: Record<RankName, string> = {
  Listener: "M8 12.4 10.8 15.2 16.2 9.2",
  Neighbor: "M7.6 12 12 8.2 16.4 12M9.2 10.8V15.8H14.8V10.8",
  Friend: "M12 16.2 11.2 15.5C8.6 13.2 7.2 12 7.2 10.4 7.2 9.1 8.2 8.2 9.4 8.2 10.3 8.2 11.4 8.8 12 9.6 12.6 8.8 13.7 8.2 14.6 8.2 15.8 8.2 16.8 9.1 16.8 10.4 16.8 12 15.4 13.2 12.8 15.5L12 16.2Z",
  Kindred: "M9.4 9.2A2.6 2.6 0 1 0 9.4 14.8M14.6 9.2A2.6 2.6 0 1 1 14.6 14.8M9.4 12H14.6",
  Lighthouse: "M12 6.8 13.4 10.6 17.2 12 13.4 13.4 12 17.2 10.6 13.4 6.8 12 10.6 10.6Z",
};

type RankBadgeProps = { rank: RankName; className?: string };

/** The rank seal shown beside a member's name. */
export function RankBadge({ rank, className }: RankBadgeProps) {
  return (
    <svg className={`rank-badge rank-badge--${rank.toLowerCase()}${className ? ` ${className}` : ""}`} viewBox="0 0 24 24" role="img" aria-label={`${rank} rank`} focusable="false">
      <polygon points={SEAL} className="rank-badge-seal" strokeLinejoin="round" />
      <path d={GLYPHS[rank]} className="rank-badge-glyph" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
