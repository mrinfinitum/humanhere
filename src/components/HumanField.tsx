"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

const STAGE_WIDTH = 1800;
const STAGE_HEIGHT = 1400;
const MIN_ZOOM = 0.42;
const MAX_ZOOM = 1.18;

const peoplePositions = [
  { x: 760, y: 250, width: 250, rotate: -1 },
  { x: 290, y: 625, width: 220, rotate: 1 },
  { x: 1250, y: 820, width: 230, rotate: -1 },
  { x: 1250, y: 300, width: 195, rotate: 1 },
];

const detailPositions = [
  { x: 505, y: 120 },
  { x: 1510, y: 620 },
  { x: 820, y: 1125 },
];

export function HumanField({ activeSlug }: { activeSlug?: string }) {
  const fieldRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const initialIndex = Math.max(0, DEV_FIXTURE_PEOPLE.findIndex((person) => person.slug === activeSlug));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(0.68);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const clampZoom = useCallback((value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)), []);

  const resetView = useCallback(() => {
    setZoom(0.68);
    setPan({ x: 0, y: 0 });
  }, []);

  const focusPerson = useCallback((index: number) => {
    const nextIndex = (index + DEV_FIXTURE_PEOPLE.length) % DEV_FIXTURE_PEOPLE.length;
    const point = peoplePositions[nextIndex];
    setActiveIndex(nextIndex);
    setPan({
      x: (STAGE_WIDTH / 2 - point.x - point.width / 2) * 0.72,
      y: (STAGE_HEIGHT / 2 - point.y - 170) * 0.72,
    });
    setZoom(0.78);
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => clampZoom(current - event.deltaY * 0.0008));
    };

    field.addEventListener("wheel", handleWheel, { passive: false });
    return () => field.removeEventListener("wheel", handleWheel);
  }, [clampZoom]);

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a, button, input")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.panX + event.clientX - dragRef.current.x,
      y: dragRef.current.panY + event.clientY - dragRef.current.y,
    });
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const toggleFullscreen = async () => {
    if (!fieldRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await fieldRef.current.requestFullscreen();
  };

  return (
    <aside
      ref={fieldRef}
      className={`human-field ${dragging ? "is-dragging" : ""}`}
      aria-label="Interactive map of people in the HUMAN:HERE archive"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="human-field__viewport">
        <div
          className="human-field__stage"
          style={{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div className="human-field__grid" aria-hidden="true" />

          <svg className="human-field__map" viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} aria-hidden="true">
            <g className="human-field__orbits">
              <circle cx="900" cy="700" r="590" />
              <circle cx="650" cy="650" r="385" />
              <circle cx="1190" cy="655" r="355" />
              <path d="M220 1045 C520 1190 1120 1200 1575 980" />
            </g>
            <g className="human-field__connections">
              <path d="M885 400 L400 770 L1365 950 L1348 440 Z" />
              <path d="M885 400 L925 1180 L400 770" />
              <path d="M400 770 L235 1065" />
              <path d="M1365 950 L1055 1090" />
            </g>
            <g className="human-field__nodes">
              <circle cx="885" cy="400" r="6" />
              <circle cx="400" cy="770" r="6" />
              <circle cx="1365" cy="950" r="6" />
              <circle cx="1348" cy="440" r="6" />
              <circle cx="925" cy="1180" r="5" />
              <circle cx="235" cy="1065" r="5" />
            </g>
          </svg>

          <div className="theme-label theme-label--care"><span />Care</div>
          <div className="theme-label theme-label--notice"><span />Notice</div>
          <div className="theme-label theme-label--belong"><span />Belong</div>

          {DEV_FIXTURE_PEOPLE.map((person, index) => {
            const position = peoplePositions[index];
            return (
              <Link
                href={`/people/${person.slug}`}
                className={`human-fragment ${activeIndex === index ? "is-active" : ""}`}
                style={{ left: position.x, top: position.y, width: position.width, "--rotate": `${position.rotate}deg` } as React.CSSProperties}
                key={person.slug}
                onFocus={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <figure>
                  <Image src={person.portrait} alt="" fill sizes="280px" style={{ objectPosition: person.portraitPosition }} />
                </figure>
                <span className="human-fragment__name">{person.firstName}</span>
                <span className="human-fragment__type">Person · {person.location}</span>
                <span className="fragment-node" aria-hidden="true" />
              </Link>
            );
          })}

          {DEV_FIXTURE_PEOPLE.slice(0, 3).map((person, index) => (
            <Link
              href={`/people/${person.slug}`}
              className="detail-fragment"
              style={{ left: detailPositions[index].x, top: detailPositions[index].y, "--rotate": `${index % 2 ? -1 : 1}deg` } as React.CSSProperties}
              key={`detail-${person.slug}`}
              aria-label={`A closer portrait of ${person.firstName}`}
            >
              <figure><Image src={person.portrait} alt="" fill sizes="165px" style={{ objectPosition: person.portraitPosition }} /></figure>
              <span>Portrait study · {person.firstName}</span>
            </Link>
          ))}

          <Link href="/about" className="text-fragment text-fragment--one">
            <small>Belief</small>
            <blockquote>Human connection cannot be automated.</blockquote>
            <span>HUMAN:HERE</span>
          </Link>
          <Link href="/get-involved" className="text-fragment text-fragment--two">
            <small>Invitation</small>
            <blockquote>Show up for someone.</blockquote>
            <span>Get involved</span>
          </Link>
        </div>
      </div>

      <div className="map-controls" aria-label="Map controls">
        <button type="button" onClick={() => setZoom((value) => clampZoom(value + 0.12))} aria-label="Zoom in">+</button>
        <input
          aria-label="Map zoom"
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step="0.01"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
        <button type="button" onClick={() => setZoom((value) => clampZoom(value - 0.12))} aria-label="Zoom out">−</button>
        <button type="button" className="map-controls__center" onClick={resetView} aria-label="Center map"><span className="center-icon" /></button>
        <button type="button" className="map-controls__fullscreen" onClick={toggleFullscreen} aria-label="Toggle fullscreen">↗</button>
        <button type="button" className="map-controls__help" onClick={() => setHelpOpen((open) => !open)} aria-expanded={helpOpen} aria-controls="map-help">?</button>
      </div>

      <div className="fragment-navigator" aria-label="Browse people">
        <button type="button" onClick={() => focusPerson(activeIndex - 1)} aria-label="Previous person">←</button>
        <span aria-live="polite">{DEV_FIXTURE_PEOPLE[activeIndex].firstName}</span>
        <button type="button" onClick={() => focusPerson(activeIndex + 1)} aria-label="Next person">→</button>
      </div>

      {helpOpen && (
        <aside className="map-help" id="map-help" aria-label="Map guide">
          <button type="button" onClick={() => setHelpOpen(false)} aria-label="Close map guide">×</button>
          <small>Guide</small>
          <h2>Explore the human field</h2>
          <p>Drag to move across the archive. Scroll or use the controls to zoom. The circles hold three overlapping ideas: care, attention, and belonging.</p>
        </aside>
      )}
    </aside>
  );
}
