"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

const WIDTH = 1800;
const HEIGHT = 1400;
const MIN_ZOOM = 0.42;
const MAX_ZOOM = 1.18;
const positions = [
  { x: 760, y: 245, width: 250, rotate: -1 },
  { x: 285, y: 640, width: 220, rotate: 1 },
  { x: 1240, y: 810, width: 230, rotate: -1 },
  { x: 1250, y: 290, width: 195, rotate: 1 },
];

export function PeopleField() {
  const fieldRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(0.68);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [help, setHelp] = useState(false);
  const clamp = useCallback((value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)), []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const onWheel = (event: WheelEvent) => { event.preventDefault(); setZoom(value => clamp(value - event.deltaY * .0008)); };
    field.addEventListener("wheel", onWheel, { passive: false });
    return () => field.removeEventListener("wheel", onWheel);
  }, [clamp]);

  const focus = (index: number) => {
    const next = (index + DEV_FIXTURE_PEOPLE.length) % DEV_FIXTURE_PEOPLE.length;
    const point = positions[next];
    setActive(next);
    setZoom(.78);
    setPan({ x: (WIDTH / 2 - point.x - point.width / 2) * .72, y: (HEIGHT / 2 - point.y - 170) * .72 });
  };

  const pointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a,button,input")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  };
  const pointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.panX + event.clientX - dragRef.current.x, y: dragRef.current.panY + event.clientY - dragRef.current.y });
  };
  const endDrag = () => { dragRef.current = null; setDragging(false); };
  const reset = () => { setZoom(.68); setPan({ x: 0, y: 0 }); };
  const fullscreen = async () => { if (document.fullscreenElement) await document.exitFullscreen(); else await fieldRef.current?.requestFullscreen(); };

  return (
    <section ref={fieldRef} className={`people-field ${dragging ? "is-dragging" : ""}`} aria-label="Interactive map of people and stories" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <div className="people-field__intro"><p>People / Stories</p><span>Drag to explore · Scroll to zoom</span></div>
      <div className="people-field__stage" style={{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <div className="people-field__grid" aria-hidden="true" />
        <svg className="people-field__diagram" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
          <g className="people-field__circles"><circle cx="900" cy="700" r="590" /><circle cx="650" cy="650" r="385" /><circle cx="1190" cy="655" r="355" /></g>
          <g className="people-field__lines"><path d="M885 395 L395 770 L1355 945 L1340 430 Z" /><path d="M885 395 L910 1160 L395 770" /><path d="M395 770 L225 1060" /></g>
          <g className="people-field__nodes"><circle cx="885" cy="395" r="6" /><circle cx="395" cy="770" r="6" /><circle cx="1355" cy="945" r="6" /><circle cx="1340" cy="430" r="6" /><circle cx="910" cy="1160" r="5" /></g>
        </svg>

        <div className="orbit-letter orbit-letter--care"><b>C</b><span>Care</span></div>
        <div className="orbit-letter orbit-letter--notice"><b>N</b><span>Notice</span></div>
        <div className="orbit-letter orbit-letter--belong"><b>B</b><span>Belong</span></div>

        {DEV_FIXTURE_PEOPLE.map((person, index) => {
          const position = positions[index];
          return <Link href={`/people/${person.slug}`} key={person.slug} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} className={`field-photo ${active === index ? "is-active" : ""}`} style={{ left: position.x, top: position.y, width: position.width, "--tilt": `${position.rotate}deg` } as React.CSSProperties}>
            <figure><Image src={person.portrait} alt={person.portraitAlt} fill sizes="280px" style={{ objectPosition: person.portraitPosition }} /></figure>
            <div><small>Story · {person.location}</small><strong>{person.firstName}</strong><span>{person.descriptor}</span></div><i aria-hidden="true" />
          </Link>;
        })}

        <Link href="/about" className="field-note field-note--belief"><small>Belief</small><blockquote>Human connection cannot be automated.</blockquote><span>Read why →</span></Link>
        <Link href="/get-involved" className="field-note field-note--action"><small>Invitation</small><blockquote>Show up for someone.</blockquote><span>Get involved →</span></Link>
      </div>

      <div className="people-field__controls" aria-label="Map controls">
        <button type="button" onClick={() => setZoom(value => clamp(value + .12))} aria-label="Zoom in">+</button>
        <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step=".01" value={zoom} onChange={event => setZoom(Number(event.target.value))} aria-label="Map zoom" />
        <button type="button" onClick={() => setZoom(value => clamp(value - .12))} aria-label="Zoom out">−</button>
        <button type="button" onClick={reset} aria-label="Center map">◎</button>
        <button type="button" onClick={fullscreen} aria-label="Toggle fullscreen">↗</button>
        <button type="button" onClick={() => setHelp(value => !value)} aria-label="Map guide" aria-expanded={help}>?</button>
      </div>
      <div className="people-field__navigator" aria-label="Browse stories"><button type="button" onClick={() => focus(active - 1)} aria-label="Previous story">←</button><span aria-live="polite">{DEV_FIXTURE_PEOPLE[active].firstName}</span><button type="button" onClick={() => focus(active + 1)} aria-label="Next story">→</button></div>
      {help && <aside className="people-field__help"><button type="button" onClick={() => setHelp(false)} aria-label="Close guide">×</button><p className="eyebrow">Guide</p><h2>Explore the human field.</h2><p>Drag the map, scroll to zoom, or use the arrows to move between portraits. The lettered circles connect stories through care, notice, and belonging.</p></aside>}
    </section>
  );
}
