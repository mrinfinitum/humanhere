"use client";

import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { HumanCalloutOverlay } from "@/components/globe/HumanCalloutOverlay";
import { HumanStoryDrawer } from "@/components/globe/HumanStoryDrawer";
import { GlobeScene } from "@/components/globe/GlobeScene";
import type { GlobeControls, GlobeHover, GlobeHuman } from "@/components/globe/types";
import type { HumanEntry } from "@/lib/archive/types";

const MIN_DISTANCE = 2.82;
const MAX_DISTANCE = 4.15;
const GLOBE_DEBUG = process.env.NEXT_PUBLIC_GLOBE_DEBUG === "true";

type StoryDrawerState = {
  slug: string;
  entry: HumanEntry | null;
  loading: boolean;
  error: string | null;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function HumanGlobe({ humans }: { humans: GlobeHuman[] }) {
  const globeHumans = useMemo(() => humans, [humans]);
  const stageRef = useRef<HTMLElement | null>(null);
  const calloutAnchorRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLElement | null>(null);
  const connectorRef = useRef<SVGPathElement | null>(null);
  const debugProjectionRef = useRef<HTMLElement | null>(null);
  const debugWorldRef = useRef<HTMLElement | null>(null);
  const controls = useRef<GlobeControls>({ targetX: 0.47, targetY: -0.085, distance: 3.42, engaged: false, dragging: false, lastInteraction: 0 });
  const pointer = useRef<{ id: number; x: number; y: number; targetX: number; targetY: number; moved: boolean } | null>(null);
  const lastInteractionWasDrag = useRef(false);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; cameraDistance: number } | null>(null);
  const storyRequest = useRef<AbortController | null>(null);
  const storyCache = useRef(new Map<string, HumanEntry>());
  const deepLinkOpened = useRef(false);
  const [selectedHumanId, setSelectedHumanId] = useState<string | null>(null);
  const [storyDrawer, setStoryDrawer] = useState<StoryDrawerState | null>(null);
  const [activeHumanIds, setActiveHumanIds] = useState<string[]>([]);
  const [hovered, setHovered] = useState<GlobeHover>(null);
  const [ready, setReady] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const selected = selectedHumanId === null
    ? null
    : globeHumans.find(human => human.id === selectedHumanId) ?? null;

  const closeStory = useCallback(() => {
    storyRequest.current?.abort();
    storyRequest.current = null;
    setStoryDrawer(null);
  }, []);

  const openStory = useCallback(async (human: GlobeHuman) => {
    storyRequest.current?.abort();
    const cached = storyCache.current.get(human.slug);
    if (cached) {
      setStoryDrawer({ slug: human.slug, entry: cached, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    storyRequest.current = controller;
    setStoryDrawer({ slug: human.slug, entry: null, loading: true, error: null });

    try {
      const response = await fetch(`/api/humans/${encodeURIComponent(human.slug)}`, { signal: controller.signal });
      const payload = await response.json() as { entry?: HumanEntry; error?: string };
      if (!response.ok || !payload.entry) throw new Error(payload.error ?? "This story could not be opened.");
      if (storyRequest.current !== controller) return;
      storyCache.current.set(human.slug, payload.entry);
      setStoryDrawer({ slug: human.slug, entry: payload.entry, loading: false, error: null });
    } catch (error) {
      if (controller.signal.aborted || storyRequest.current !== controller) return;
      setStoryDrawer({
        slug: human.slug,
        entry: null,
        loading: false,
        error: error instanceof Error ? error.message : "This story could not be opened.",
      });
    }
  }, []);

  useEffect(() => {
    if (deepLinkOpened.current || !globeHumans.length) return;
    deepLinkOpened.current = true;
    const url = new URL(window.location.href);
    const slug = url.searchParams.get("human");
    if (!slug) return;
    const human = globeHumans.find(candidate => candidate.slug === slug);
    if (!human) return;
    const frame = window.requestAnimationFrame(() => {
      setSelectedHumanId(human.id);
      void openStory(human);
      url.searchParams.delete("human");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [globeHumans, openStory]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    const motionFrame = window.requestAnimationFrame(syncMotion);
    media.addEventListener("change", syncMotion);

    let webglFrame = 0;
    try {
      const canvas = document.createElement("canvas");
      const available = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      webglFrame = window.requestAnimationFrame(() => setWebglAvailable(available));
    } catch {
      webglFrame = window.requestAnimationFrame(() => setWebglAvailable(false));
    }

    return () => {
      window.cancelAnimationFrame(motionFrame);
      window.cancelAnimationFrame(webglFrame);
      media.removeEventListener("change", syncMotion);
    };
  }, []);

  useEffect(() => () => {
    storyRequest.current?.abort();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const wheel = (event: WheelEvent) => {
      const browserPinch = event.ctrlKey || event.metaKey;
      if (!browserPinch && !controls.current.engaged) return;
      event.preventDefault();
      controls.current.engaged = true;
      controls.current.lastInteraction = performance.now();
      controls.current.distance = clamp(controls.current.distance + event.deltaY * (browserPinch ? 0.012 : 0.0017), MIN_DISTANCE, MAX_DISTANCE);
    };
    const blockGesture = (event: Event) => event.preventDefault();
    stage.addEventListener("wheel", wheel, { passive: false });
    stage.addEventListener("gesturestart", blockGesture, { passive: false });
    stage.addEventListener("gesturechange", blockGesture, { passive: false });
    stage.addEventListener("gestureend", blockGesture, { passive: false });
    return () => {
      stage.removeEventListener("wheel", wheel);
      stage.removeEventListener("gesturestart", blockGesture);
      stage.removeEventListener("gesturechange", blockGesture);
      stage.removeEventListener("gestureend", blockGesture);
    };
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (storyDrawer) closeStory();
      else setSelectedHumanId(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [closeStory, storyDrawer]);

  const beginInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a, button, .human-globe-preview")) return;
    controls.current.engaged = true;
    controls.current.dragging = true;
    controls.current.lastInteraction = performance.now();
    lastInteractionWasDrag.current = false;

    if (event.pointerType === "touch") {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.current.size === 2) {
        const [first, second] = [...touches.current.values()];
        pinch.current = {
          distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
          cameraDistance: controls.current.distance,
        };
        pointer.current = null;
        return;
      }
    }

    pointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      targetX: controls.current.targetX,
      targetY: controls.current.targetY,
      moved: false,
    };
  };

  const moveInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch" && touches.current.has(event.pointerId)) {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinch.current && touches.current.size === 2) {
        const [first, second] = [...touches.current.values()];
        const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
        controls.current.distance = clamp(pinch.current.cameraDistance * pinch.current.distance / distance, MIN_DISTANCE, MAX_DISTANCE);
        event.preventDefault();
        return;
      }
    }

    const active = pointer.current;
    if (!active || active.id !== event.pointerId) return;
    const deltaX = event.clientX - active.x;
    const deltaY = event.clientY - active.y;
    const wasMoved = active.moved;
    active.moved ||= Math.abs(deltaX) + Math.abs(deltaY) > 4;
    if (!wasMoved && active.moved) event.currentTarget.setPointerCapture(event.pointerId);
    controls.current.targetY = active.targetY + deltaX * 0.00315;
    controls.current.targetX = clamp(active.targetX + deltaY * 0.00225, -0.52, 0.52);
  };

  const endInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    const active = pointer.current;
    lastInteractionWasDrag.current = active?.id === event.pointerId && active.moved;
    touches.current.delete(event.pointerId);
    if (touches.current.size < 2) pinch.current = null;
    if (pointer.current?.id === event.pointerId) pointer.current = null;
    controls.current.dragging = touches.current.size > 0;
    controls.current.lastInteraction = performance.now();
  };

  const updateHover = useCallback((next: GlobeHover) => {
    setHovered(next);
  }, []);

  const selectHuman = useCallback((humanId: string) => {
    controls.current.engaged = true;
    controls.current.lastInteraction = performance.now();
    setSelectedHumanId(humanId);
    setHovered(null);
  }, []);

  const sceneReady = useCallback(() => setReady(true), []);
  const updateActiveHumanIds = useCallback((next: string[]) => {
    setActiveHumanIds(current => (
      current.length === next.length && current.every((value, index) => value === next[index]) ? current : next
    ));
  }, []);
  const navigateGlobe = (event: React.KeyboardEvent<HTMLElement>) => {
    const step = event.shiftKey ? 0.2 : 0.1;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      controls.current.engaged = true;
      controls.current.lastInteraction = performance.now();
      controls.current.targetY += event.key === "ArrowLeft" ? -step : step;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      controls.current.engaged = true;
      controls.current.lastInteraction = performance.now();
      controls.current.targetX = clamp(controls.current.targetX + (event.key === "ArrowUp" ? -step : step), -0.52, 0.52);
    }
    if (event.key === "Enter" && activeHumanIds.length) {
      event.preventDefault();
      const activePosition = selectedHumanId === null ? -1 : activeHumanIds.indexOf(selectedHumanId);
      selectHuman(activeHumanIds[(activePosition + 1) % activeHumanIds.length]);
    }
  };

  return (
    <main className={`human-globe-shell${selected ? " has-selection" : ""}${hovered ? " has-hover" : ""}`}>
      <section
        ref={stageRef}
        className="human-globe-stage"
        aria-label="Living globe of published HUMAN:HERE stories. Drag or use arrow keys to rotate. Press Enter to meet a human."
        tabIndex={0}
        onKeyDown={navigateGlobe}
        onPointerDown={beginInteraction}
        onPointerMove={moveInteraction}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
      >
        {webglAvailable ? (
          <Canvas
            className={`human-globe-canvas${ready ? " is-ready" : ""}`}
            camera={{ position: [0, 0, 3.42], fov: 38, near: 0.1, far: 40 }}
            dpr={[1, 1.8]}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            raycaster={{ params: { Mesh: {}, Line: { threshold: 1 }, LOD: {}, Points: { threshold: 0.032 }, Sprite: {} } }}
            onPointerMissed={() => {
              if (lastInteractionWasDrag.current) {
                lastInteractionWasDrag.current = false;
                return;
              }
              setSelectedHumanId(null);
            }}
            fallback={<GlobeFallback />}
          >
            <Suspense fallback={null}>
              <GlobeScene
                humans={globeHumans}
                selectedHumanId={selectedHumanId}
                hoveredHumanId={hovered?.humanId ?? null}
                controls={controls}
                reducedMotion={reducedMotion}
                lineRef={connectorRef}
                previewRef={previewRef}
                calloutAnchorRef={calloutAnchorRef}
                debugProjectionRef={debugProjectionRef}
                debugWorldRef={debugWorldRef}
                onHover={updateHover}
                onSelect={selectHuman}
                onActiveChange={updateActiveHumanIds}
                onSelectedHidden={humanId => {
                  setSelectedHumanId(current => current === humanId ? null : current);
                }}
                onReady={sceneReady}
              />
            </Suspense>
          </Canvas>
        ) : <GlobeFallback />}
      </section>

      {!ready && webglAvailable && (
        <div className="human-globe-resolving" aria-live="polite">
          <Wordmark />
          <span aria-hidden="true"><i /><i /></span>
        </div>
      )}

      <header className="human-globe-chrome">
        <Wordmark />
        <nav aria-label="Primary navigation">
          <Link className="is-active" href="/humans">Humans</Link>
          <Link href="/mission">Mission</Link>
          <Link href="/share">Share</Link>
          <Link href="/support">Support</Link>
        </nav>
      </header>

      <section className="human-globe-copy" aria-labelledby="globe-headline">
        <p><span aria-hidden="true" />Each light is a human</p>
        <h1 id="globe-headline">People<br />need<br />people</h1>
      </section>

      <div className="human-globe-scale" aria-hidden="true">
        <b>0</b><i /><i /><span /><i /><i /><b>5</b>
      </div>

      {selected && !storyDrawer && (
        <HumanCalloutOverlay
          key={selected.id}
          human={selected}
          anchorRef={calloutAnchorRef}
          panelRef={previewRef}
          connectorRef={connectorRef}
          onClose={() => setSelectedHumanId(null)}
          onViewHuman={() => void openStory(selected)}
        />
      )}

      {storyDrawer && (
        <HumanStoryDrawer
          key={storyDrawer.entry?.id ?? `${storyDrawer.slug}-loading`}
          entry={storyDrawer.entry}
          loading={storyDrawer.loading}
          error={storyDrawer.error}
          onClose={closeStory}
          onRetry={() => {
            if (selected) void openStory(selected);
          }}
        />
      )}

      <footer className="human-globe-footer">
        <span><i aria-hidden="true" />People need people.</span>
        <Link href="/humans">Explore the archive →</Link>
      </footer>

      <div className="human-globe-orbit" aria-hidden="true"><i /><i /><span /></div>

      {GLOBE_DEBUG && (
        <>
          <i ref={debugProjectionRef} className="human-globe-debug-point" aria-hidden="true" />
          <output className="human-globe-debug" aria-live="polite">
            <b>GLOBE DEBUG</b>
            <span>SELECTED {selectedHumanId ?? "—"}</span>
            <span>HOVERED {hovered?.humanId ?? "—"}</span>
            <span>ACTIVE {activeHumanIds.join(", ") || "—"}</span>
            <span ref={debugWorldRef}>WORLD —</span>
            <span>GEO 36.1540, -95.9930 / R 1.0065</span>
          </output>
        </>
      )}
    </main>
  );
}

function Wordmark() {
  return <Link className="human-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>;
}

function GlobeFallback() {
  return (
    <div className="human-globe-fallback">
      <div role="img" aria-label="Static globe representing HUMAN:HERE stories around the world">
        {Array.from({ length: 42 }, (_, index) => (
          <i
            key={index}
            style={{
              left: `${10 + ((index * 37) % 78)}%`,
              top: `${12 + ((index * 53) % 74)}%`,
            }}
          />
        ))}
      </div>
      <p>Every light is a human.</p>
      <Link href="/humans">Meet the humans →</Link>
    </div>
  );
}
