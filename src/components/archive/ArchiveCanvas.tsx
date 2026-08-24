"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArchiveBatch, HumanEntry } from "@/lib/archive/types";
import { resolveMediaUrl } from "@/lib/media/resolver";
import { BrandMark } from "@/components/BrandMark";

const WORLD_WIDTH = 3900;
const WORLD_HEIGHT = 2600;
const widths = [92, 116, 138, 104, 172, 126, 154, 86, 194, 112, 146, 128];

function entryHref(entry: HumanEntry) {
  if (entry.slug === "people-need-people" || entry.slug === "why-we-show-up") return "/about";
  if (entry.slug === "show-up") return "/get-involved";
  if (entry.slug === "be-seen") return "/share";
  return `/humans/${entry.slug}`;
}

function placement(index: number, entry: HumanEntry) {
  const width = widths[index % widths.length] + (entry.layout?.size === "lg" ? 44 : entry.layout?.size === "xl" ? 72 : 0);
  const x = 40 + ((index * 347 + Math.floor(index / 8) * 163) % (WORLD_WIDTH - 280));
  const y = 45 + ((index * 229 + Math.floor(index / 7) * 191) % (WORLD_HEIGHT - 340));
  const rotate = ((index * 7) % 9) - 4;
  return { width, x, y, rotate };
}

function CanvasArtifact({ entry, index, onOpen }: { entry: HumanEntry; index: number; onOpen: () => void }) {
  const mediaUrl = resolveMediaUrl(entry.thumbnail, "thumbnail");
  const hasImage = entry.thumbnail.kind === "image" && Boolean(mediaUrl);
  const item = placement(index, entry);
  const ratio = entry.thumbnail.width && entry.thumbnail.height ? entry.thumbnail.width / entry.thumbnail.height : 1;
  const height = Math.max(76, Math.round(item.width / ratio));
  const style = {
    "--canvas-x": `${item.x}px`,
    "--canvas-y": `${item.y}px`,
    "--canvas-w": `${item.width}px`,
    "--canvas-h": `${height}px`,
    "--canvas-r": `${item.rotate * 0.24}deg`,
    "--canvas-delay": `${(index % 20) * 28}ms`,
  } as CSSProperties;
  const label = entry.person?.anonymous ? "Anonymous" : entry.person?.displayName ?? entry.headline ?? "Human artifact";

  return (
    <article className={`canvas-artifact canvas-artifact--${entry.type}`} style={style}>
      <button type="button" onClick={onOpen} aria-label={`Preview ${label}`}>
        <span className="canvas-artifact__index">{String(index + 1).padStart(3, "0")}</span>
        <span className={`canvas-artifact__visual artifact--${entry.layout?.tone ?? "paper"}`}>
          {hasImage ? (
            <Image
              src={mediaUrl}
              alt={entry.thumbnail.alt}
              fill
              sizes="(max-width: 800px) 32vw, 190px"
              style={{ objectPosition: entry.thumbnail.objectPosition }}
            />
          ) : (
            <span>{entry.headline ?? entry.quote ?? "A human story"}</span>
          )}
        </span>
        <span className="canvas-artifact__caption"><b>{label}</b><i>{entry.type}</i></span>
      </button>
    </article>
  );
}

export function ArchiveCanvas({ initialBatch }: { initialBatch: ArchiveBatch }) {
  const [entries, setEntries] = useState(initialBatch.entries);
  const [cursor, setCursor] = useState(initialBatch.nextCursor);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<HumanEntry | null>(null);
  const [scale, setScale] = useState(0.72);
  const [pan, setPan] = useState({ x: -120, y: -90 });
  const drag = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);

  const simulatedEntries = useMemo(() => {
    if (!entries.length) return [];
    const count = typeof initialBatch.total === "number" && initialBatch.total > 100 ? 144 : entries.length;
    return Array.from({ length: count }, (_, index) => entries[index % entries.length]);
  }, [entries, initialBatch.total]);

  const loadNext = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/humans?cursor=${encodeURIComponent(cursor)}&limit=40`);
      if (!response.ok) throw new Error("Archive batch unavailable");
      const batch = await response.json() as ArchiveBatch;
      setEntries(current => [...current, ...batch.entries].filter((entry, index, all) => all.findIndex(candidate => candidate.id === entry.id) === index));
      setCursor(batch.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  const center = useCallback(() => {
    setScale(0.72);
    setPan({ x: -120, y: -90 });
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const beginPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };

  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    setPan({ x: drag.current.panX + event.clientX - drag.current.x, y: drag.current.panY + event.clientY - drag.current.y });
  };

  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  const zoom = (amount: number) => setScale(current => Math.min(1.18, Math.max(0.36, Number((current + amount).toFixed(2)))));
  const wheelZoom = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    zoom(event.deltaY > 0 ? -0.06 : 0.06);
  };

  const activeUrl = active ? resolveMediaUrl(active.thumbnail, "display") : undefined;
  const activeHasImage = active?.thumbnail.kind === "image" && Boolean(activeUrl);

  return (
    <main className="archive-canvas-shell">
      <a className="archive-skip" href="#archive-introduction">Skip the visual archive</a>
      <section
        className="archive-canvas"
        aria-label="Spatial human archive. Drag to move through the field."
        onPointerDown={beginPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onWheel={wheelZoom}
      >
        <div className="archive-canvas__grid" aria-hidden="true" />
        <div
          className="archive-canvas__world"
          style={{ width: WORLD_WIDTH, height: WORLD_HEIGHT, transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})` }}
        >
          <div className="archive-orbit archive-orbit--one" aria-hidden="true" />
          <div className="archive-orbit archive-orbit--two" aria-hidden="true" />
          {simulatedEntries.map((entry, index) => (
            <CanvasArtifact key={`${entry.id}-${index}`} entry={entry} index={index} onOpen={() => setActive(entry)} />
          ))}
        </div>
        <p className="archive-canvas__instruction">Drag to explore · ⌘/ctrl + scroll to zoom</p>
        <div className="archive-canvas__controls" aria-label="Archive view controls">
          <button type="button" onClick={() => zoom(0.1)} aria-label="Zoom in">+</button>
          <span>{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoom(-0.1)} aria-label="Zoom out">−</button>
          <button type="button" onClick={center}>Center</button>
        </div>
      </section>

      <aside className="archive-intro" id="archive-introduction">
        <header>
          <BrandMark />
          <span>Living archive · {String(initialBatch.total ?? entries.length).padStart(3, "0")}</span>
        </header>
        <div className="archive-intro__copy">
          <p className="eyebrow">People need people.</p>
          <h1>Every person is more than the moment you meet them in.</h1>
          <p>HUMAN:HERE is a growing archive of faces, voices, notes, places, and stories—shared with consent and held with care.</p>
          <p>Move through the field. Choose a person. Stay long enough to see more.</p>
        </div>
        <nav aria-label="Primary navigation">
          <Link href="/share">+ Add your story</Link>
          <Link href="/humans">View the archive</Link>
          <Link href="/about">Why we show up</Link>
        </nav>
        <footer>
          <span>{entries.length} records loaded</span>
          {cursor ? <button type="button" onClick={() => void loadNext()} disabled={loading}>{loading ? "Loading…" : "Bring in more"}</button> : <span>Archive edge</span>}
        </footer>
      </aside>

      {active && (
        <section className="archive-pop" role="dialog" aria-modal="true" aria-label={`Preview ${active.person?.displayName ?? active.headline ?? "human story"}`}>
          <button className="archive-pop__close" type="button" onClick={() => setActive(null)} aria-label="Close preview">×</button>
          <div className={`archive-pop__media artifact--${active.layout?.tone ?? "paper"}`}>
            {activeHasImage && activeUrl ? (
              <Image src={activeUrl} alt={active.thumbnail.alt} fill loading="eager" sizes="(max-width: 800px) 78vw, 38vw" style={{ objectPosition: active.thumbnail.objectPosition }} />
            ) : (
              <blockquote>{active.headline ?? active.quote}</blockquote>
            )}
          </div>
          <div className="archive-pop__meta">
            <p className="eyebrow">{active.type} · HUMAN:HERE</p>
            <h2>{active.person?.anonymous ? "Anonymous" : active.person?.displayName ?? active.headline ?? "A human story"}</h2>
            {(active.quote || active.headline) && <p>{active.quote ?? active.headline}</p>}
            <Link href={entryHref(active)} prefetch={false}>Meet this human →</Link>
          </div>
        </section>
      )}
    </main>
  );
}
