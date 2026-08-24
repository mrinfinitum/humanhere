"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArchiveBatch, HumanEntry } from "@/lib/archive/types";
import { resolveMediaUrl } from "@/lib/media/resolver";
import { BrandMark } from "@/components/BrandMark";

const WORLD_WIDTH = 5600;
const WORLD_HEIGHT = 4300;
const DEFAULT_SCALE = 0.62;
const widths = [136, 172, 118, 152, 190, 126, 174, 112, 184, 146, 164, 122];

type ArtifactGeometry = {
  width: number;
  height: number;
  x: number;
  y: number;
  rotate: number;
};

type ViewportSize = { width: number; height: number };
type PointerPoint = { x: number; y: number };
type PinchGesture = { distance: number; scale: number; worldX: number; worldY: number };

const MIN_SCALE = 0.28;
const MAX_SCALE = 1.08;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function entryHref(entry: HumanEntry) {
  if (entry.slug === "people-need-people" || entry.slug === "why-we-show-up") return "/about";
  if (entry.slug === "show-up") return "/get-involved";
  if (entry.slug === "be-seen") return "/share";
  return `/humans/${entry.slug}`;
}

function hashUnit(value: number) {
  let hash = value | 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295;
}

function artifactSize(index: number, entry: HumanEntry) {
  const width = widths[index % widths.length] + (entry.layout?.size === "lg" ? 20 : entry.layout?.size === "xl" ? 36 : 0);
  const ratio = entry.thumbnail?.width && entry.thumbnail.height ? entry.thumbnail.width / entry.thumbnail.height : 1;
  return { width, height: Math.max(76, Math.round(width / ratio)) };
}

function buildOrganicLayout(entries: HumanEntry[]): ArtifactGeometry[] {
  const centerX = WORLD_WIDTH / 2;
  const centerY = WORLD_HEIGHT / 2;
  const nodes = entries.map((entry, index) => {
    const { width, height } = artifactSize(index, entry);
    const progress = Math.sqrt((index + 0.5) / Math.max(entries.length, 1));
    const angle = index * 2.399963 + (hashUnit(index * 17 + 11) - 0.5) * 1.15;
    const radius = 150 + progress * (1700 + hashUnit(index * 29 + 7) * 430);
    const anchorX = centerX + Math.cos(angle) * radius;
    const anchorY = centerY + Math.sin(angle) * radius * 0.78;
    return {
      width,
      height,
      x: anchorX - width / 2,
      y: anchorY - height / 2,
      anchorX,
      anchorY,
      collisionRadius: Math.hypot(width, height) / 2 + 58,
      rotate: ((index * 7) % 9) - 4,
    };
  });

  // A small deterministic force pass mirrors the reference's center + collision
  // simulation while keeping server and client rendering identical.
  for (let iteration = 0; iteration < 72; iteration += 1) {
    for (let a = 0; a < nodes.length; a += 1) {
      const first = nodes[a];
      for (let b = a + 1; b < nodes.length; b += 1) {
        const second = nodes[b];
        const firstX = first.x + first.width / 2;
        const firstY = first.y + first.height / 2;
        const secondX = second.x + second.width / 2;
        const secondY = second.y + second.height / 2;
        let deltaX = secondX - firstX;
        let deltaY = secondY - firstY;
        let distance = Math.hypot(deltaX, deltaY);
        const minimum = first.collisionRadius + second.collisionRadius;
        if (distance >= minimum) continue;
        if (distance < 0.001) {
          deltaX = hashUnit(a * 101 + b * 17) - 0.5;
          deltaY = hashUnit(a * 67 + b * 31) - 0.5;
          distance = Math.hypot(deltaX, deltaY) || 1;
        }
        const push = (minimum - distance) * 0.48;
        const moveX = (deltaX / distance) * push;
        const moveY = (deltaY / distance) * push;
        first.x -= moveX;
        first.y -= moveY;
        second.x += moveX;
        second.y += moveY;
      }
    }

    for (const node of nodes) {
      node.x += (node.anchorX - (node.x + node.width / 2)) * 0.012;
      node.y += (node.anchorY - (node.y + node.height / 2)) * 0.012;
      node.x = Math.min(WORLD_WIDTH - node.width - 80, Math.max(80, node.x));
      node.y = Math.min(WORLD_HEIGHT - node.height - 80, Math.max(80, node.y));
    }
  }

  return nodes.map(({ width, height, x, y, rotate }) => ({ width, height, x, y, rotate }));
}

function viewportAppearance(geometry: ArtifactGeometry, scale: number, pan: { x: number; y: number }, viewport: ViewportSize) {
  const screenX = (geometry.x + geometry.width / 2) * scale + pan.x;
  const screenY = (geometry.y + geometry.height / 2) * scale + pan.y;
  const distance = Math.hypot(screenX - viewport.width / 2, screenY - viewport.height / 2);
  const extent = Math.max(1, Math.hypot(viewport.width / 2, viewport.height / 2));
  const edge = Math.pow(Math.min(distance / extent, 1), 1.5);
  return {
    focusScale: 1.055 - 0.235 * edge,
    focusOpacity: 1 - 0.52 * edge,
  };
}

function CanvasArtifact({ entry, index, geometry, focusScale, focusOpacity, selected, linked, onOpen }: {
  entry: HumanEntry;
  index: number;
  geometry: ArtifactGeometry;
  focusScale: number;
  focusOpacity: number;
  selected: boolean;
  linked: boolean;
  onOpen: () => void;
}) {
  const mediaUrl = entry.thumbnail ? resolveMediaUrl(entry.thumbnail, "thumbnail") : undefined;
  const hasImage = entry.thumbnail?.kind === "image" && Boolean(mediaUrl);
  const item = geometry;
  const style = {
    "--canvas-x": `${item.x}px`,
    "--canvas-y": `${item.y}px`,
    "--canvas-w": `${item.width}px`,
    "--canvas-h": `${item.height}px`,
    "--canvas-r": `${item.rotate * 0.24}deg`,
    "--canvas-delay": `${(index % 20) * 28}ms`,
    "--canvas-float-x": `${(hashUnit(index * 47 + 3) - 0.5) * 8}px`,
    "--canvas-float-y": `${3 + hashUnit(index * 53 + 5) * 5}px`,
    "--canvas-float-duration": `${18 + hashUnit(index * 61 + 9) * 16}s`,
    "--canvas-float-delay": `${-hashUnit(index * 71 + 13) * 24}s`,
    "--canvas-float-tilt": `${(hashUnit(index * 79 + 17) - 0.5) * 1.2}deg`,
    "--canvas-focus-scale": focusScale.toFixed(4),
    "--canvas-focus-opacity": focusOpacity.toFixed(4),
  } as CSSProperties;
  const label = entry.person?.anonymous ? "Anonymous" : entry.person?.displayName ?? entry.headline ?? "Human artifact";

  return (
    <article
      className={`canvas-artifact canvas-artifact--${entry.type}${selected ? " is-selected" : ""}${linked ? " is-linked" : ""}`}
      style={style}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Preview ${label}`}
      >
        <span className="canvas-artifact__float">
          <span className="canvas-artifact__index">{String(index + 1).padStart(3, "0")}</span>
          <span className={`canvas-artifact__visual artifact--${entry.layout?.tone ?? "paper"}`}>
            {hasImage ? (
              <Image
                src={mediaUrl!}
                alt={entry.thumbnail?.alt ?? label}
                fill
                sizes="(max-width: 800px) 32vw, 190px"
                style={{ objectPosition: entry.thumbnail?.objectPosition }}
              />
            ) : (
              <span>{entry.headline ?? entry.quote ?? "A human story"}</span>
            )}
          </span>
          <span className="canvas-artifact__caption"><b>{label}</b><i>{entry.type}</i></span>
        </span>
      </button>
    </article>
  );
}

export function ArchiveCanvas({ initialBatch }: { initialBatch: ArchiveBatch }) {
  const [entries, setEntries] = useState(initialBatch.entries);
  const [cursor, setCursor] = useState(initialBatch.nextCursor);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<HumanEntry | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [connectionSeed, setConnectionSeed] = useState(0);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [pan, setPan] = useState({ x: -1326, y: -883 });
  const [viewport, setViewport] = useState<ViewportSize>({ width: 820, height: 900 });
  const canvasRef = useRef<HTMLElement | null>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const touchPointers = useRef(new Map<number, PointerPoint>());
  const pinch = useRef<PinchGesture | null>(null);

  const simulatedEntries = useMemo(() => {
    return entries;
  }, [entries]);

  const organicLayout = useMemo(() => buildOrganicLayout(simulatedEntries), [simulatedEntries]);
  const prototypeMode = entries.length > 0 && entries.every(entry => entry.fixture);

  const connection = useMemo(() => {
    if (activeIndex === null || !organicLayout[activeIndex] || organicLayout.length < 2) return null;
    const source = organicLayout[activeIndex];
    const start = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
    const nearby = organicLayout
      .map((geometry, index) => ({
        index,
        geometry,
        distance: Math.hypot(geometry.x + geometry.width / 2 - start.x, geometry.y + geometry.height / 2 - start.y),
      }))
      .filter(candidate => candidate.index !== activeIndex && candidate.distance < 760)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8);
    const candidates = nearby.length ? nearby : organicLayout
      .map((geometry, index) => ({ index, geometry, distance: index === activeIndex ? Number.POSITIVE_INFINITY : Math.hypot(geometry.x - source.x, geometry.y - source.y) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);
    const target = candidates[Math.floor(hashUnit(activeIndex * 131 + connectionSeed) * candidates.length) % candidates.length];
    if (!target) return null;
    const end = { x: target.geometry.x + target.geometry.width / 2, y: target.geometry.y + target.geometry.height / 2 };
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.max(1, Math.hypot(deltaX, deltaY));
    const direction = hashUnit(activeIndex * 193 + connectionSeed * 7) > 0.5 ? 1 : -1;
    const bend = Math.min(distance * 0.22, 170) * direction;
    const normal = { x: -deltaY / distance, y: deltaX / distance };
    const controlOne = { x: start.x + deltaX * 0.32 + normal.x * bend, y: start.y + deltaY * 0.32 + normal.y * bend };
    const controlTwo = { x: start.x + deltaX * 0.68 + normal.x * bend, y: start.y + deltaY * 0.68 + normal.y * bend };
    return { targetIndex: target.index, start, end, path: `M ${start.x} ${start.y} C ${controlOne.x} ${controlOne.y} ${controlTwo.x} ${controlTwo.y} ${end.x} ${end.y}` };
  }, [activeIndex, connectionSeed, organicLayout]);

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
    const desktop = window.innerWidth > 900;
    const viewportWidth = desktop ? window.innerWidth - 620 : window.innerWidth;
    const viewportHeight = desktop ? window.innerHeight : window.innerWidth * 1.25;
    setScale(DEFAULT_SCALE);
    setPan({
      x: viewportWidth / 2 - WORLD_WIDTH * DEFAULT_SCALE / 2,
      y: viewportHeight / 2 - WORLD_HEIGHT * DEFAULT_SCALE / 2,
    });
  }, []);

  const syncViewport = useCallback(() => {
    const desktop = window.innerWidth > 900;
    setViewport({
      width: desktop ? window.innerWidth - 620 : window.innerWidth,
      height: desktop ? window.innerHeight : window.innerWidth * 1.25,
    });
  }, []);

  const closeActive = useCallback(() => {
    setActive(null);
    setActiveIndex(null);
  }, []);

  useEffect(() => {
    const centerFrame = window.requestAnimationFrame(() => {
      syncViewport();
      center();
    });
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeActive();
    };
    window.addEventListener("keydown", close);
    window.addEventListener("resize", syncViewport);
    return () => {
      window.cancelAnimationFrame(centerFrame);
      window.removeEventListener("keydown", close);
      window.removeEventListener("resize", syncViewport);
    };
  }, [center, closeActive, syncViewport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventTouchZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    const preventSafariGesture = (event: Event) => event.preventDefault();
    canvas.addEventListener("touchstart", preventTouchZoom, { passive: false });
    canvas.addEventListener("touchmove", preventTouchZoom, { passive: false });
    canvas.addEventListener("gesturestart", preventSafariGesture, { passive: false });
    canvas.addEventListener("gesturechange", preventSafariGesture, { passive: false });
    canvas.addEventListener("gestureend", preventSafariGesture, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", preventTouchZoom);
      canvas.removeEventListener("touchmove", preventTouchZoom);
      canvas.removeEventListener("gesturestart", preventSafariGesture);
      canvas.removeEventListener("gesturechange", preventSafariGesture);
      canvas.removeEventListener("gestureend", preventSafariGesture);
    };
  }, []);

  const beginPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      touchPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      event.currentTarget.setPointerCapture(event.pointerId);

      if (touchPointers.current.size >= 2) {
        const [first, second] = Array.from(touchPointers.current.values());
        const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
        pinch.current = {
          distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
          scale,
          worldX: (midpoint.x - pan.x) / scale,
          worldY: (midpoint.y - pan.y) / scale,
        };
        drag.current = null;
        return;
      }
    }

    if ((event.target as HTMLElement).closest("button, a")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };

  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" && touchPointers.current.has(event.pointerId)) {
      touchPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinch.current && touchPointers.current.size >= 2) {
        const [first, second] = Array.from(touchPointers.current.values());
        const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
        const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
        const nextScale = clampScale(pinch.current.scale * distance / pinch.current.distance);
        setScale(nextScale);
        setPan({
          x: midpoint.x - pinch.current.worldX * nextScale,
          y: midpoint.y - pinch.current.worldY * nextScale,
        });
        event.preventDefault();
        return;
      }
    }

    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    setPan({ x: drag.current.panX + event.clientX - drag.current.x, y: drag.current.panY + event.clientY - drag.current.y });
  };

  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      touchPointers.current.delete(event.pointerId);
      if (touchPointers.current.size < 2) pinch.current = null;
    }
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  const zoom = (amount: number) => setScale(current => clampScale(Number((current + amount).toFixed(2))));
  const wheelZoom = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    zoom(event.deltaY > 0 ? -0.06 : 0.06);
  };

  const activeUrl = active?.thumbnail ? resolveMediaUrl(active.thumbnail, "display") : undefined;
  const activeHasImage = active?.thumbnail?.kind === "image" && Boolean(activeUrl);

  return (
    <main className="archive-canvas-shell">
      <a className="archive-skip" href="#archive-introduction">Skip the visual archive</a>
      <section
        ref={canvasRef}
        className="archive-canvas"
        aria-label="Spatial human archive. Drag to move through the field. Pinch with two fingers to zoom."
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
          {connection && (
            <svg className="archive-connection" width={WORLD_WIDTH} height={WORLD_HEIGHT} aria-hidden="true">
              <path className="archive-connection__rail" d={connection.path} />
              <path className="archive-connection__signal" d={connection.path} />
              <path className="archive-connection__pulse" pathLength="100" d={connection.path} />
              <circle className="archive-connection__node" cx={connection.start.x} cy={connection.start.y} r="5" />
              <circle className="archive-connection__node archive-connection__node--target" cx={connection.end.x} cy={connection.end.y} r="5" />
              <circle className="archive-connection__core" cx={connection.start.x} cy={connection.start.y} r="1.6" />
              <circle className="archive-connection__core" cx={connection.end.x} cy={connection.end.y} r="1.6" />
            </svg>
          )}
          {simulatedEntries.map((entry, index) => {
            const appearance = viewportAppearance(organicLayout[index], scale, pan, viewport);
            return (
              <CanvasArtifact
                key={`${entry.id}-${index}`}
                entry={entry}
                index={index}
                geometry={organicLayout[index]}
                focusScale={appearance.focusScale}
                focusOpacity={appearance.focusOpacity}
                selected={activeIndex === index}
                linked={connection?.targetIndex === index}
                onOpen={() => {
                  setActive(entry);
                  setActiveIndex(index);
                  setConnectionSeed(Math.floor(Math.random() * 1_000_000));
                }}
              />
            );
          })}
        </div>
        <p className="archive-canvas__instruction">Drag to explore · pinch or ⌘/ctrl + scroll to zoom</p>
        <div className="archive-canvas__controls" aria-label="Archive view controls">
          <button type="button" onClick={() => zoom(-0.1)} aria-label="Zoom out">−</button>
          <span>{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoom(0.1)} aria-label="Zoom in">+</button>
          <button type="button" onClick={center}>Center</button>
        </div>
      </section>

      <aside className="archive-intro" id="archive-introduction">
        <header>
          <BrandMark />
          <span>{prototypeMode ? "Prototype field" : "Living archive"} · {String(entries.length).padStart(3, "0")}</span>
        </header>
        {active ? (
          <article className="archive-intro__story">
            <button type="button" onClick={closeActive}>← Back to introduction</button>
            {activeHasImage && activeUrl && (
              <figure>
                <Image src={activeUrl} alt={active.thumbnail?.alt ?? "HUMAN:HERE story"} fill loading="eager" sizes="(max-width: 768px) 100vw, 480px" style={{ objectPosition: active.thumbnail?.objectPosition }} />
              </figure>
            )}
            <p className="eyebrow">{active.type} · HUMAN:HERE</p>
            <h1>{active.person?.anonymous ? "Anonymous" : active.person?.displayName ?? active.headline ?? "A human story"}</h1>
            {(active.quote || active.headline) && <blockquote>{active.quote ?? active.headline}</blockquote>}
            {active.story && <p>{active.story}</p>}
            <Link href={entryHref(active)} prefetch={false}>Meet this human →</Link>
          </article>
        ) : (
          <div className="archive-intro__copy">
            <p className="eyebrow">Welcome to HUMAN:HERE</p>
            <h1>People need people.</h1>
            <p>{prototypeMode ? "Explore a fictional editorial prototype of the living archive while the first consented stories are prepared." : "We are a living archive of real people and real stories, built to help us see one another more clearly."}</p>
            <p>Move through the field. Choose a person. Stay long enough to see more.</p>
          </div>
        )}
        <nav aria-label="Primary navigation">
          <Link href="/share">+ Add your story</Link>
          <Link href="/humans">View the archive</Link>
          <Link href="/mission">Our mission</Link>
          <Link href="/support">Support the work</Link>
        </nav>
        <footer>
          <span>{entries.length} records loaded</span>
          {cursor ? <button type="button" onClick={() => void loadNext()} disabled={loading}>{loading ? "Loading…" : "Bring in more"}</button> : <span>Archive edge</span>}
        </footer>
      </aside>
    </main>
  );
}
