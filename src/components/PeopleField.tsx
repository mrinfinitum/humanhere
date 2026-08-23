"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

const WIDTH = 1800;
const HEIGHT = 1400;
const MIN_ZOOM = 0.42;
const MAX_ZOOM = 1.18;
const DEFAULT_ZOOM = 0.68;

const entries: Array<{ x: number; y: number; width: number; rotate: number; themes: [number, number, number]; links: number[] }> = [
  { x: 760, y: 245, width: 250, rotate: -1, themes: [9, 6, 8], links: [1, 3] },
  { x: 285, y: 640, width: 220, rotate: 1, themes: [8, 9, 7], links: [0, 2] },
  { x: 1240, y: 810, width: 230, rotate: -1, themes: [9, 7, 9], links: [1, 3] },
  { x: 1250, y: 290, width: 195, rotate: 1, themes: [7, 6, 9], links: [0, 2] },
];

const connections = [[0, 1], [1, 2], [2, 3], [3, 0]] as const;
const center = (index: number) => ({
  x: entries[index].x + entries[index].width / 2,
  y: entries[index].y + entries[index].width * .63,
});
const line = (from: number, to: number) => {
  const a = center(from);
  const b = center(to);
  const bend = Math.abs(a.x - b.x) * .08;
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + bend}, ${b.x} ${b.y - bend}, ${b.x} ${b.y}`;
};

export function PeopleField() {
  const fieldRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [visited, setVisited] = useState([0]);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [help, setHelp] = useState(false);
  const [viewport, setViewport] = useState({ width: 900, height: 700 });
  const clamp = useCallback((value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)), []);
  const current = hovered ?? active;
  const compact = zoom < .59;
  const detailed = zoom > .86;
  const themes = entries[current].themes;

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const resize = () => setViewport({ width: field.clientWidth, height: field.clientHeight });
    const observer = new ResizeObserver(resize);
    observer.observe(field);
    resize();
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom(value => clamp(value - event.deltaY * .0008));
    };
    field.addEventListener("wheel", onWheel, { passive: false });
    return () => { observer.disconnect(); field.removeEventListener("wheel", onWheel); };
  }, [clamp]);

  const select = (index: number) => {
    setActive(index);
    setVisited(value => value.at(-1) === index ? value : [...value.slice(-5), index]);
  };

  const focus = (index: number) => {
    const next = (index + DEV_FIXTURE_PEOPLE.length) % DEV_FIXTURE_PEOPLE.length;
    const point = center(next);
    select(next);
    setZoom(.78);
    setPan({ x: (WIDTH / 2 - point.x) * .72, y: (HEIGHT / 2 - point.y) * .72 });
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
  const reset = () => { setZoom(DEFAULT_ZOOM); setPan({ x: 0, y: 0 }); };
  const fullscreen = async () => { if (document.fullscreenElement) await document.exitFullscreen(); else await fieldRef.current?.requestFullscreen(); };

  const historyPath = useMemo(() => visited.map((index, position) => {
    const point = center(index);
    return `${position ? "L" : "M"} ${point.x} ${point.y}`;
  }).join(" "), [visited]);

  const miniWidth = Math.min(92, viewport.width / (WIDTH * zoom) * 100);
  const miniHeight = Math.min(92, viewport.height / (HEIGHT * zoom) * 100);
  const miniLeft = Math.max(0, Math.min(100 - miniWidth, 50 - miniWidth / 2 - pan.x / (WIDTH * zoom) * 100));
  const miniTop = Math.max(0, Math.min(100 - miniHeight, 50 - miniHeight / 2 - pan.y / (HEIGHT * zoom) * 100));

  return (
    <section
      ref={fieldRef}
      className={`people-field ${dragging ? "is-dragging" : ""} ${compact ? "is-compact" : ""} ${detailed ? "is-detailed" : ""}`}
      style={{ "--care-strength": themes[0], "--notice-strength": themes[1], "--belong-strength": themes[2] } as React.CSSProperties}
      aria-label="Interactive map of people and stories"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="people-field__intro"><p>People / Stories</p><span>Drag to explore · Scroll to zoom</span></div>
      <div className="people-field__ticker" aria-live="polite"><span>{DEV_FIXTURE_PEOPLE[current].firstName}</span><span>{DEV_FIXTURE_PEOPLE[current].descriptor}</span><span>Care {themes[0]} · Notice {themes[1]} · Belong {themes[2]}</span></div>

      <div className="people-field__stage" style={{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <div className="people-field__grid" aria-hidden="true" />
        <svg className="people-field__diagram" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
          <g className="people-field__circles">
            <circle className="theme-care" cx="900" cy="700" r="590" />
            <circle className="theme-notice" cx="650" cy="650" r="385" />
            <circle className="theme-belong" cx="1190" cy="655" r="355" />
          </g>
          <g className="people-field__lines">
            {connections.map(([from, to]) => <path key={`${from}-${to}`} className={(current === from && entries[current].links.includes(to)) || (current === to && entries[current].links.includes(from)) ? "is-related" : ""} d={line(from, to)} />)}
          </g>
          {historyPath && <path className="people-field__history" d={historyPath} />}
          <g className="people-field__nodes">
            {entries.map((_, index) => { const point = center(index); return <circle className={current === index ? "is-active" : ""} key={index} cx={point.x} cy={point.y} r="6" />; })}
          </g>
        </svg>

        <div className="orbit-letter orbit-letter--care"><b>C</b><span>Care</span></div>
        <div className="orbit-letter orbit-letter--notice"><b>N</b><span>Notice</span></div>
        <div className="orbit-letter orbit-letter--belong"><b>B</b><span>Belong</span></div>

        {DEV_FIXTURE_PEOPLE.map((person, index) => {
          const position = entries[index];
          const related = index === current || entries[current].links.includes(index);
          return <Link
            href={`/people/${person.slug}`}
            key={person.slug}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => { setHovered(index); select(index); }}
            onBlur={() => setHovered(null)}
            onClick={() => select(index)}
            className={`field-photo ${active === index ? "is-active" : ""} ${related ? "is-related" : "is-muted"}`}
            style={{ left: position.x, top: position.y, width: position.width, "--tilt": `${position.rotate}deg` } as React.CSSProperties}
          >
            <span className="field-photo__card">
              <figure><Image src={person.portrait} alt={person.portraitAlt} fill sizes="280px" style={{ objectPosition: person.portraitPosition }} /></figure>
              <span className="field-photo__copy"><small>Story · {person.location}</small><strong>{person.firstName}</strong><span>{person.descriptor}</span><em>{person.pullQuote}</em></span>
            </span>
            <i className="field-photo__node" aria-hidden="true"><span>{index + 1}</span></i>
          </Link>;
        })}

        <Link href="/about" className="field-note field-note--belief"><small>Belief</small><blockquote>Human connection cannot be automated.</blockquote><span>Read why →</span></Link>
        <Link href="/get-involved" className="field-note field-note--action"><small>Invitation</small><blockquote>Show up for someone.</blockquote><span>Get involved →</span></Link>
      </div>

      <div className="people-field__tooltip" aria-hidden="true"><small>Person / {DEV_FIXTURE_PEOPLE[current].location}</small><strong>{DEV_FIXTURE_PEOPLE[current].firstName}</strong><span>{DEV_FIXTURE_PEOPLE[current].descriptor}</span></div>

      <button className="people-minimap" type="button" onClick={reset} aria-label="Center map from minimap">
        <span className="people-minimap__inner">
          {entries.map((entry, index) => <i key={index} className={current === index ? "is-active" : ""} style={{ left: `${center(index).x / WIDTH * 100}%`, top: `${center(index).y / HEIGHT * 100}%` }} />)}
          <span className="people-minimap__viewport" style={{ width: `${miniWidth}%`, height: `${miniHeight}%`, left: `${miniLeft}%`, top: `${miniTop}%` }} />
        </span>
      </button>

      <div className="people-field__controls" aria-label="Map controls">
        <button type="button" onClick={() => setZoom(value => clamp(value + .12))} aria-label="Zoom in">+</button>
        <label className="people-field__zoom"><input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step=".01" value={zoom} onChange={event => setZoom(Number(event.target.value))} aria-label="Map zoom" /><span>{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</span></label>
        <button type="button" onClick={() => setZoom(value => clamp(value - .12))} aria-label="Zoom out">−</button>
        <button type="button" onClick={reset} aria-label="Center map">◎</button>
        <button type="button" onClick={fullscreen} aria-label="Toggle fullscreen">↗</button>
        <button type="button" onClick={() => setHelp(value => !value)} aria-label="Map guide" aria-expanded={help}>?</button>
      </div>
      <div className="people-field__navigator" aria-label="Browse stories"><button type="button" onClick={() => focus(active - 1)} aria-label="Previous story">←</button><span aria-live="polite">{DEV_FIXTURE_PEOPLE[active].firstName}</span><button type="button" onClick={() => focus(active + 1)} aria-label="Next story">→</button></div>
      {help && <aside className="people-field__help"><button type="button" onClick={() => setHelp(false)} aria-label="Close guide">×</button><p className="eyebrow">Guide</p><h2>Explore the human field.</h2><p>Drag to move and scroll to zoom. Portraits become nodes at the widest view. Focus a person to reveal their relationships; the rings respond to care, notice, and belonging. The minimap shows where you are.</p></aside>}
    </section>
  );
}
