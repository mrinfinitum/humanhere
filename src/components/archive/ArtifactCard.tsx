import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { HumanEntry } from "@/lib/archive/types";
import { resolveMediaUrl } from "@/lib/media/resolver";

const columnStarts = [2, 9, 5, 1, 8, 4, 10, 3, 7, 1, 6, 9, 2, 8, 4, 10];
const spanBySize = { xs: 2, sm: 3, md: 4, lg: 5, xl: 8 } as const;

function entryHref(entry: HumanEntry) {
  if (entry.slug === "people-need-people" || entry.slug === "why-we-show-up") return "/about";
  if (entry.slug === "show-up") return "/get-involved";
  if (entry.slug === "be-seen") return "/share";
  return `/humans/${entry.slug}`;
}

function AudioMark({ duration }: { duration?: string }) {
  return <span className="artifact-audio" aria-hidden="true">{[2, 5, 8, 4, 11, 7, 3, 9, 5, 2, 7, 4].map((height, index) => <i key={index} style={{ height }} />)}<b>{duration ?? "Listen"}</b></span>;
}

export function ArtifactCard({ entry, index, priority = false }: { entry: HumanEntry; index: number; priority?: boolean }) {
  const size = entry.layout?.size ?? "sm";
  const span = spanBySize[size];
  const maxStart = 13 - span;
  const column = Math.min(columnStarts[index % columnStarts.length], maxStart);
  const style = { "--artifact-column": column, "--artifact-span": span, "--artifact-delay": `${(index % 12) * 55}ms` } as CSSProperties;
  const label = entry.person?.anonymous ? "Anonymous" : entry.person?.displayName ?? entry.headline ?? entry.type;
  const meta = [entry.person?.age, entry.person?.location].filter(Boolean).join(" / ");
  const mediaUrl = entry.thumbnail ? resolveMediaUrl(entry.thumbnail, "thumbnail") : undefined;
  const hasImage = entry.thumbnail?.kind === "image" && Boolean(mediaUrl);
  const visualText = entry.headline ?? entry.quote;

  return (
    <article className={`archive-artifact ${Number(entry.layout?.emphasis ?? 0) >= 9 ? "artifact--surface" : ""} artifact--${entry.type} artifact--${size} artifact--${entry.layout?.crop ?? "auto"} artifact--${entry.layout?.tone ?? "paper"}`} style={style} data-sequence={index}>
      <Link href={entryHref(entry)} prefetch={false} scroll={false} aria-label={`View ${label}`}>
        <div className="artifact-visual">
          {hasImage ? (
            <Image
              src={mediaUrl!}
              alt={entry.thumbnail?.alt ?? label}
              fill
              priority={priority}
              sizes={size === "xl" ? "(max-width: 720px) 100vw, 70vw" : size === "lg" ? "(max-width: 720px) 100vw, 44vw" : "(max-width: 720px) 82vw, 30vw"}
              style={{ objectPosition: entry.thumbnail?.objectPosition }}
            />
          ) : (
            <span className="artifact-text">{visualText?.split("\n").map(line => <span key={line}>{line}</span>)}</span>
          )}
          {entry.type === "video" && <span className="artifact-play" aria-hidden="true">Play <i>▶</i></span>}
          {entry.type === "audio" && <AudioMark duration={entry.thumbnail?.duration} />}
          {entry.type === "note" && <span className="artifact-note-rule" aria-hidden="true" />}
          {entry.fixture && <span className="fixture-stamp">Prototype</span>}
        </div>
        <div className="artifact-meta">
          <span><b>{label}</b>{meta && <i>{meta}</i>}</span>
          <span>{entry.type}<b>View →</b></span>
        </div>
      </Link>
    </article>
  );
}
