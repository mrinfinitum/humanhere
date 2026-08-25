"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Arc, Globe, Marker } from "cobe";
import type { ArchiveBatch, HumanEntry } from "@/lib/archive/types";
import { resolveMediaUrl } from "@/lib/media/resolver";
import { BrandMark } from "@/components/BrandMark";

type Coordinate = [number, number];
type GlobeStory = { entry: HumanEntry; location: Coordinate; locationLabel: string; markerId: string };

const CITY_COORDINATES: Record<string, Coordinate> = {
  tulsa: [36.154, -95.993],
  dallas: [32.777, -96.797],
  atlanta: [33.749, -84.388],
  chicago: [41.878, -87.63],
  "los angeles": [34.052, -118.244],
  "new york": [40.713, -74.006],
  "mexico city": [19.433, -99.133],
  "são paulo": [-23.555, -46.633],
  london: [51.507, -0.128],
  nairobi: [-1.286, 36.818],
  "cape town": [-33.925, 18.424],
  lagos: [6.524, 3.379],
  mumbai: [19.076, 72.878],
  tokyo: [35.677, 139.65],
  sydney: [-33.869, 151.209],
  manila: [14.6, 120.984],
};

const LAPIS: [number, number, number] = [48 / 255, 70 / 255, 165 / 255];
const PAPER: [number, number, number] = [242 / 255, 235 / 255, 221 / 255];
const MIN_GLOBE_SCALE = 0.72;
const MAX_GLOBE_SCALE = 1.5;

function hashUnit(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function normalizeLocation(location: string) {
  return location.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function locationForEntry(entry: HumanEntry): { location: Coordinate; label: string } | null {
  const explicit = entry.person?.coordinates;
  if (explicit) return { location: [explicit.latitude, explicit.longitude], label: entry.person?.location ?? "Location withheld" };

  const source = `${entry.person?.location ?? ""} ${entry.headline ?? ""}`;
  const normalized = normalizeLocation(source);
  const match = Object.entries(CITY_COORDINATES).find(([city]) => normalized.includes(normalizeLocation(city)));
  if (!match) return null;
  const [city, coordinate] = match;
  const jitter = entry.fixture ? (hashUnit(entry.id) - 0.5) * 2.2 : 0;
  return {
    location: [coordinate[0] + jitter * 0.55, coordinate[1] + jitter],
    label: entry.person?.location ?? city.replace(/\b\w/g, letter => letter.toUpperCase()),
  };
}

function entryHref(entry: HumanEntry) {
  if (entry.slug === "people-need-people" || entry.slug === "why-we-show-up") return "/mission";
  if (entry.slug === "show-up") return "/support";
  if (entry.slug === "be-seen") return "/share";
  return `/humans/${entry.relatedStorySlug ?? entry.slug}`;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function HumanGlobe({ initialBatch }: { initialBatch: ArchiveBatch }) {
  const stories = useMemo<GlobeStory[]>(() => initialBatch.entries.flatMap((entry, index) => {
    const resolved = locationForEntry(entry);
    if (!resolved) return [];
    return [{ entry, location: resolved.location, locationLabel: resolved.label, markerId: `hh-${index}-${entry.id.replace(/[^a-z0-9-]/gi, "-")}` }];
  }), [initialBatch.entries]);
  const prototypeMode = initialBatch.entries.length > 0 && initialBatch.entries.every(entry => entry.fixture);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [globeScale, setGlobeScale] = useState(1.05);
  const [ready, setReady] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const globeRef = useRef<Globe | null>(null);
  const frameRef = useRef<number | null>(null);
  const phiRef = useRef(0.35);
  const thetaRef = useRef(0.12);
  const scaleRef = useRef(1.05);
  const activeRef = useRef<number | null>(null);
  const pointerRef = useRef<{ id: number; x: number; y: number; phi: number; theta: number; moved: boolean } | null>(null);
  const touchPoints = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const lastInteractionRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const active = activeIndex === null ? null : stories[activeIndex];
  const activeMediaUrl = active?.entry.thumbnail ? resolveMediaUrl(active.entry.thumbnail, "display") : undefined;
  const activeHasImage = Boolean(activeMediaUrl && active?.entry.thumbnail?.kind === "image");

  const markerData = useCallback((): Marker[] => stories.map((story, index) => ({
    location: story.location,
    size: index === activeRef.current ? 0.075 : 0.035,
    color: index === activeRef.current ? PAPER : LAPIS,
    id: story.markerId,
  })), [stories]);

  const arcData = useCallback((): Arc[] => {
    const selectedIndex = activeRef.current;
    if (selectedIndex === null || stories.length < 2) return [];
    const selected = stories[selectedIndex];
    const nearest = stories
      .map((story, index) => ({ story, index, distance: Math.hypot(story.location[0] - selected.location[0], story.location[1] - selected.location[1]) }))
      .filter(item => item.index !== selectedIndex)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
    return nearest.map((item, index) => ({ from: selected.location, to: item.story.location, color: index === 0 ? PAPER : LAPIS, id: `relation-${index}` }));
  }, [stories]);

  useEffect(() => {
    activeRef.current = activeIndex;
    globeRef.current?.update({ markers: markerData(), arcs: arcData() });
  }, [activeIndex, arcData, markerData]);

  useEffect(() => {
    if (activeIndex === null) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [activeIndex]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    let cancelled = false;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mediaQuery.matches;
    const syncMotion = (event: MediaQueryListEvent) => { reducedMotionRef.current = event.matches; };
    mediaQuery.addEventListener("change", syncMotion);

    const resize = () => {
      const bounds = stage.getBoundingClientRect();
      const width = Math.max(320, Math.round(bounds.width));
      const height = Math.max(420, Math.round(bounds.height));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      globeRef.current?.update({ width, height });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);

    void import("cobe").then(({ default: createGlobe }) => {
      if (cancelled) return;
      const bounds = stage.getBoundingClientRect();
      const width = Math.max(320, Math.round(bounds.width));
      const height = Math.max(420, Math.round(bounds.height));
      globeRef.current = createGlobe(canvas, {
        width,
        height,
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        phi: phiRef.current,
        theta: thetaRef.current,
        dark: 1,
        diffuse: 1.08,
        scale: scaleRef.current,
        mapSamples: 38000,
        mapBrightness: 5.6,
        mapBaseBrightness: 0.075,
        baseColor: [0.075, 0.095, 0.24],
        markerColor: LAPIS,
        glowColor: [0.07, 0.1, 0.32],
        arcColor: LAPIS,
        arcWidth: 0.75,
        arcHeight: 0.16,
        markerElevation: 0.035,
        markers: markerData(),
        arcs: arcData(),
        opacity: 0.98,
      });
      setReady(true);

      const render = () => {
        if (!reducedMotionRef.current && !pointerRef.current && performance.now() - lastInteractionRef.current > 1800) {
          phiRef.current += 0.00125;
        }
        globeRef.current?.update({
          phi: phiRef.current,
          theta: thetaRef.current,
          scale: scaleRef.current,
        });
        frameRef.current = window.requestAnimationFrame(render);
      };
      frameRef.current = window.requestAnimationFrame(render);
    });

    resize();
    return () => {
      cancelled = true;
      observer.disconnect();
      mediaQuery.removeEventListener("change", syncMotion);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      globeRef.current?.destroy();
      globeRef.current = null;
    };
  }, [arcData, markerData]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      lastInteractionRef.current = performance.now();
      const nextScale = clamp(scaleRef.current * Math.exp(-event.deltaY * 0.004), MIN_GLOBE_SCALE, MAX_GLOBE_SCALE);
      scaleRef.current = nextScale;
      setGlobeScale(nextScale);
    };
    const gesture = (event: Event) => event.preventDefault();
    stage.addEventListener("wheel", wheel, { passive: false });
    stage.addEventListener("gesturestart", gesture, { passive: false });
    stage.addEventListener("gesturechange", gesture, { passive: false });
    stage.addEventListener("gestureend", gesture, { passive: false });
    return () => {
      stage.removeEventListener("wheel", wheel);
      stage.removeEventListener("gesturestart", gesture);
      stage.removeEventListener("gesturechange", gesture);
      stage.removeEventListener("gestureend", gesture);
    };
  }, []);

  const beginInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a")) return;
    lastInteractionRef.current = performance.now();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (event.pointerType === "touch") {
      touchPoints.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchPoints.current.size >= 2) {
        const [first, second] = Array.from(touchPoints.current.values());
        pinchRef.current = { distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)), scale: scaleRef.current };
        pointerRef.current = null;
        return;
      }
    }
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, phi: phiRef.current, theta: thetaRef.current, moved: false };
  };

  const moveInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" && touchPoints.current.has(event.pointerId)) {
      touchPoints.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinchRef.current && touchPoints.current.size >= 2) {
        const [first, second] = Array.from(touchPoints.current.values());
        const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
        const nextScale = clamp(pinchRef.current.scale * distance / pinchRef.current.distance, MIN_GLOBE_SCALE, MAX_GLOBE_SCALE);
        scaleRef.current = nextScale;
        setGlobeScale(nextScale);
        event.preventDefault();
        return;
      }
    }
    if (!pointerRef.current || pointerRef.current.id !== event.pointerId) return;
    const delta = event.clientX - pointerRef.current.x;
    pointerRef.current.moved ||= Math.abs(delta) > 3;
    phiRef.current = pointerRef.current.phi + delta * 0.006;
    thetaRef.current = clamp(pointerRef.current.theta + (event.clientY - pointerRef.current.y) * 0.004, -0.45, 0.45);
  };

  const endInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    touchPoints.current.delete(event.pointerId);
    if (touchPoints.current.size < 2) pinchRef.current = null;
    if (pointerRef.current?.id === event.pointerId) pointerRef.current = null;
    lastInteractionRef.current = performance.now();
  };

  const adjustScale = (amount: number) => {
    const nextScale = clamp(scaleRef.current + amount, MIN_GLOBE_SCALE, MAX_GLOBE_SCALE);
    scaleRef.current = nextScale;
    setGlobeScale(nextScale);
    lastInteractionRef.current = performance.now();
  };

  return (
    <main className="human-globe-shell">
      <section
        ref={stageRef}
        className={`human-globe-stage${ready ? " is-ready" : ""}`}
        aria-label="Interactive HUMAN:HERE globe. Drag to rotate and pinch to zoom."
        onPointerDown={beginInteraction}
        onPointerMove={moveInteraction}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
      >
        <canvas ref={canvasRef} className="human-globe-canvas" aria-hidden="true" />
        <div className="human-globe-scan" aria-hidden="true" />
        {stories.map((story, index) => {
          const anchorStyle = {
            positionAnchor: `--cobe-${story.markerId}`,
            "--beacon-visible": `var(--cobe-visible-${story.markerId}, 0)`,
          } as CSSProperties;
          const label = story.entry.person?.anonymous ? "Anonymous" : story.entry.person?.firstName ?? story.entry.person?.displayName ?? story.entry.headline ?? "Human story";
          return (
            <button
              key={story.markerId}
              type="button"
              className={`human-beacon${activeIndex === index ? " is-active" : ""}`}
              style={anchorStyle}
              onClick={() => { setActiveIndex(index); lastInteractionRef.current = performance.now(); }}
              aria-label={`Open ${label}'s story from ${story.locationLabel}`}
            >
              <span className="human-beacon__hit" aria-hidden="true" />
              <span className="human-beacon__signal" aria-hidden="true"><i /><i /></span>
              <span className="human-beacon__label"><b>{label}</b><small>{story.locationLabel}</small></span>
            </button>
          );
        })}
        <div className="human-globe-controls" aria-label="Globe controls">
          <button type="button" onClick={() => adjustScale(-0.1)} aria-label="Zoom out">−</button>
          <span>{Math.round(globeScale * 100)}%</span>
          <button type="button" onClick={() => adjustScale(0.1)} aria-label="Zoom in">+</button>
        </div>
        <p className="human-globe-instruction">Drag to rotate · pinch to zoom · select a signal</p>
      </section>

      <header className="human-globe-chrome">
        <BrandMark />
        <span>{prototypeMode ? "Prototype world" : "Living archive"} · {String(stories.length).padStart(3, "0")}</span>
        <nav aria-label="Primary navigation"><Link href="/humans">Humans</Link><Link href="/mission">Mission</Link><Link href="/share">Be seen</Link><Link href="/support">Support</Link></nav>
      </header>

      <section className="human-globe-manifesto">
        <p>HUMAN:HERE / Earth</p>
        <h1>Every light<br />is a human.</h1>
        <span>{prototypeMode ? "A fictional map of the future living archive." : "Real people. Real stories."}</span>
      </section>

      {active && (
        <div className="human-globe-modal" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveIndex(null); }}>
          <article className={`human-globe-card${activeHasImage ? " has-media" : ""}`} id="globe-story-panel" role="dialog" aria-modal="true" aria-labelledby="globe-story-title">
            <header>
              <span>Human story / {String((activeIndex ?? 0) + 1).padStart(3, "0")}</span>
              <button ref={closeButtonRef} type="button" onClick={() => setActiveIndex(null)} aria-label="Close story">Close ×</button>
            </header>
            {activeMediaUrl && active.entry.thumbnail?.kind === "image" && (
              <figure><Image src={activeMediaUrl} alt={active.entry.thumbnail.alt} fill sizes="(max-width: 760px) 92vw, 430px" style={{ objectPosition: active.entry.thumbnail.objectPosition }} /></figure>
            )}
            <div>
              <p className="human-globe-card__kind"><span aria-hidden="true"><i /><i /></span>A HUMAN:HERE story</p>
              <h2 id="globe-story-title">{active.entry.person?.anonymous ? "Anonymous" : active.entry.person?.firstName ?? active.entry.person?.displayName ?? active.entry.headline ?? "A human story"}</h2>
              <p className="human-globe-card__location">{active.locationLabel}</p>
              {(active.entry.quote || active.entry.headline) && <blockquote>{active.entry.quote ?? active.entry.headline}</blockquote>}
              <Link href={entryHref(active.entry)} prefetch={false}>Enter this story <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        </div>
      )}

      <footer className="human-globe-footer"><span>People need people.</span><Link href="/share">Add your light ↗</Link></footer>
    </main>
  );
}
