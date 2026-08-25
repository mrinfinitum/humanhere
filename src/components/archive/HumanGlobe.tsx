"use client";

import { Canvas } from "@react-three/fiber";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { BrandMark } from "@/components/BrandMark";
import { GlobeScene } from "@/components/globe/GlobeScene";
import type { GlobeControls, GlobeHover, GlobeHuman } from "@/components/globe/types";

const MIN_DISTANCE = 2.56;
const MAX_DISTANCE = 3.72;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function HumanGlobe({ humans, fixtureMode = false }: { humans: GlobeHuman[]; fixtureMode?: boolean }) {
  const stageRef = useRef<HTMLElement | null>(null);
  const controls = useRef<GlobeControls>({ targetX: .12, targetY: .35, distance: 3.18, engaged: false, dragging: false, lastInteraction: 0 });
  const pointer = useRef<{ id: number; x: number; y: number; targetX: number; targetY: number; moved: boolean } | null>(null);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; cameraDistance: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hovered, setHovered] = useState<GlobeHover>(null);
  const [ready, setReady] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const selected = selectedIndex === null ? null : humans[selectedIndex];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    const motionFrame = window.requestAnimationFrame(sync);
    media.addEventListener("change", sync);
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
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const wheel = (event: WheelEvent) => {
      if (!controls.current.engaged) return;
      event.preventDefault();
      controls.current.lastInteraction = performance.now();
      controls.current.distance = clamp(controls.current.distance + event.deltaY * .0016, MIN_DISTANCE, MAX_DISTANCE);
    };
    stage.addEventListener("wheel", wheel, { passive: false });
    return () => stage.removeEventListener("wheel", wheel);
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedIndex(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const beginInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a, button, .human-globe-preview")) return;
    controls.current.engaged = true;
    controls.current.dragging = true;
    controls.current.lastInteraction = performance.now();
    if (event.pointerType === "touch") {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.current.size === 2) {
        const [first, second] = [...touches.current.values()];
        pinch.current = { distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)), cameraDistance: controls.current.distance };
        pointer.current = null;
        return;
      }
    }
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, targetX: controls.current.targetX, targetY: controls.current.targetY, moved: false };
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
    active.moved ||= Math.abs(deltaX) + Math.abs(deltaY) > 4;
    controls.current.targetY = active.targetY + deltaX * .0042;
    controls.current.targetX = clamp(active.targetX + deltaY * .0032, -.68, .68);
  };

  const endInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    touches.current.delete(event.pointerId);
    if (touches.current.size < 2) pinch.current = null;
    if (pointer.current?.id === event.pointerId) pointer.current = null;
    controls.current.dragging = touches.current.size > 0;
    controls.current.lastInteraction = performance.now();
  };

  const selectHuman = useCallback((index: number) => {
    if (pointer.current?.moved) return;
    controls.current.engaged = true;
    setSelectedIndex(index);
    setHovered(null);
  }, []);
  const sceneReady = useCallback(() => setReady(true), []);
  const navigateGlobe = (event: React.KeyboardEvent<HTMLElement>) => {
    const step = event.shiftKey ? .24 : .12;
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
      controls.current.targetX = clamp(controls.current.targetX + (event.key === "ArrowUp" ? -step : step), -.68, .68);
    }
    if (event.key === "Enter" && humans.length) {
      event.preventDefault();
      selectHuman(selectedIndex === null ? 0 : (selectedIndex + 1) % humans.length);
    }
  };

  return (
    <main className={`human-globe-shell${selected ? " has-selection" : ""}`}>
      <section ref={stageRef} className="human-globe-stage" aria-label="Living globe of published HUMAN:HERE stories. Drag or use arrow keys to rotate. Press Enter to meet a human." tabIndex={0}
        onKeyDown={navigateGlobe}
        onPointerDown={beginInteraction} onPointerMove={moveInteraction} onPointerUp={endInteraction} onPointerCancel={endInteraction}>
        {webglAvailable ? (
          <Canvas className={`human-globe-canvas${ready ? " is-ready" : ""}`} camera={{ position: [0, 0, 3.18], fov: 42, near: .1, far: 30 }} dpr={[1, 2]}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} raycaster={{ params: { Mesh: {}, Line: { threshold: 1 }, LOD: {}, Points: { threshold: .045 }, Sprite: {} } }} fallback={<GlobeFallback />}>
            <GlobeScene humans={humans} selectedIndex={selectedIndex} controls={controls} reducedMotion={reducedMotion} onHover={setHovered} onSelect={selectHuman} onReady={sceneReady} />
          </Canvas>
        ) : <GlobeFallback />}
        {!ready && webglAvailable && <div className="human-globe-resolving" aria-live="polite"><BrandMark /><span><i /><i /></span></div>}
      </section>

      <header className="human-globe-chrome">
        <BrandMark />
        <nav aria-label="Primary navigation"><Link href="/humans">Humans</Link><Link href="/mission">Mission</Link><Link href="/share">Share</Link><Link href="/support">Support</Link></nav>
      </header>

      <div className="human-globe-legend"><span aria-hidden="true" />Each light is a human.</div>

      {hovered && !selected && humans[hovered.index] && (
        <div className="human-orb-label" style={{ left: hovered.x, top: hovered.y }}>
          <span>{humans[hovered.index].firstName}</span>
          <small>{humans[hovered.index].city}</small>
          {humans[hovered.index].loveCount > 0 && <small>♥ {humans[hovered.index].loveCount.toLocaleString()}</small>}
          <b>View human →</b>
        </div>
      )}

      {selected && (
        <aside className="human-globe-preview" aria-live="polite">
          <button type="button" onClick={() => setSelectedIndex(null)} aria-label="Close human preview">Close</button>
          <div className="human-globe-preview__signal"><span>Human / {String((selectedIndex ?? 0) + 1).padStart(3, "0")}</span><i /></div>
          {selected.thumbnailUrl && <figure><Image src={selected.thumbnailUrl} alt={selected.thumbnailAlt ?? `Portrait of ${selected.firstName}`} fill sizes="(max-width: 760px) 42vw, 300px" style={{ objectPosition: selected.thumbnailObjectPosition }} /></figure>}
          <p>A HUMAN:HERE story</p>
          <h1>{selected.firstName}</h1>
          <span>{selected.city}</span>
          {selected.quote && <blockquote>“{selected.quote.replace(/^“|”$/g, "")}”</blockquote>}
          <div className="human-globe-preview__actions">
            {selected.loveCount > 0 && <span>♥ {selected.loveCount.toLocaleString()}</span>}
            <Link href={`/humans/${selected.slug}`} prefetch={false}>View story <span aria-hidden="true">→</span></Link>
          </div>
          {selected.fixture && <small>Development fixture</small>}
        </aside>
      )}

      <footer className="human-globe-footer"><span>People need people.</span>{fixtureMode && <small>Prototype archive · no production metrics</small>}</footer>
      <p className="human-globe-instruction">Drag to explore · click globe before scrolling to zoom</p>
    </main>
  );
}

function GlobeFallback() {
  return (
    <div className="human-globe-fallback">
      <div role="img" aria-label="Static digital globe representing HUMAN:HERE stories around the world">{Array.from({ length: 48 }, (_, index) => <i key={index} style={{ "--fallback-index": index } as CSSProperties} />)}</div>
      <p>Explore the human archive without WebGL.</p>
      <Link href="/humans">Meet the humans →</Link>
    </div>
  );
}
