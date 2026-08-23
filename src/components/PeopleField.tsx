"use client";

import Image from "next/image";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  randomLcg,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

const ZOOM_LEVELS = [0.1, 0.25, 0.7, 1] as const;
const DEFAULT_LEVEL = 0;
const BUFFER = 1400;

type ThemeKey = "care" | "notice" | "belong";
type FragmentStyle = "image" | "title" | "snippet" | "extract";

type FragmentDefinition = {
  id: string;
  title: string;
  subtitle: string;
  category: "person" | "principle" | "invitation";
  style: FragmentStyle;
  themes: [number, number, number];
  links: string[];
  width: number;
  height: number;
  color: string;
  quote?: string;
  portrait?: string;
  portraitAlt?: string;
  portraitPosition?: string;
  personIndex?: number;
};

type LayoutNode = SimulationNodeDatum & {
  id: string;
  fixed?: boolean;
  fragment?: FragmentDefinition;
  themeIndex?: number;
  themeLinks: Array<{ id: ThemeKey; value: number }>;
};

type LayoutLink = SimulationLinkDatum<LayoutNode> & { value: number };
type PlacedFragment = FragmentDefinition & { x: number; y: number };
type Layout = {
  width: number;
  height: number;
  fragments: PlacedFragment[];
  themes: Array<{ id: ThemeKey; title: string; x: number; y: number }>;
};

type MapDraggable = {
  x: number;
  y: number;
  endX: number;
  endY: number;
  kill: () => void;
  update: (applyBounds?: boolean) => void;
  applyBounds: (bounds: { minX: number; minY: number; maxX: number; maxY: number }) => void;
};

type Runtime = {
  gsap: typeof import("gsap")["gsap"];
  draggable: MapDraggable | null;
  floatFrame: number | null;
  momentumFrame: number | null;
  waveFrame: number | null;
};

type PeopleFieldProps = {
  activeIndex: number | null;
  onSelect: (index: number) => void;
};

const supportingFragments: FragmentDefinition[] = [
  { id: "dignity", title: "Dignity", subtitle: "A way of seeing", category: "principle", style: "title", themes: [10, 5, 8], links: ["james", "lena", "name"], width: 250, height: 150, color: "hsl(42 48% 80%)", quote: "No person is a problem to be solved." },
  { id: "presence", title: "Presence", subtitle: "A practice", category: "principle", style: "snippet", themes: [8, 10, 6], links: ["maya", "witness"], width: 270, height: 195, color: "hsl(27 38% 79%)", quote: "Attention is one of the most human things we can offer." },
  { id: "reciprocity", title: "Reciprocity", subtitle: "A relationship", category: "principle", style: "extract", themes: [9, 6, 10], links: ["lena", "miguel", "neighbor"], width: 310, height: 225, color: "hsl(61 16% 78%)", quote: "Help moves in more than one direction." },
  { id: "witness", title: "To witness", subtitle: "Notice what is here", category: "principle", style: "snippet", themes: [8, 10, 7], links: ["maya", "presence"], width: 260, height: 185, color: "hsl(23 47% 82%)", quote: "A life changes when someone stays long enough to see it." },
  { id: "ordinary", title: "The ordinary", subtitle: "Daily human life", category: "principle", style: "title", themes: [7, 9, 8], links: ["james", "miguel"], width: 245, height: 145, color: "hsl(70 12% 79%)", quote: "Most belonging is built in small moments." },
  { id: "name", title: "A name", subtitle: "The beginning of recognition", category: "principle", style: "extract", themes: [9, 7, 8], links: ["james", "dignity"], width: 300, height: 215, color: "hsl(36 70% 82%)", quote: "Before a story, before a label, there is a person." },
  { id: "neighbor", title: "Neighbor", subtitle: "A form of belonging", category: "principle", style: "snippet", themes: [8, 5, 10], links: ["miguel", "lena", "reciprocity"], width: 255, height: 190, color: "hsl(24 43% 78%)", quote: "Showing up turns proximity into relationship." },
  { id: "invitation", title: "Show up", subtitle: "An invitation", category: "invitation", style: "title", themes: [9, 6, 9], links: ["james", "maya", "lena", "miguel"], width: 265, height: 155, color: "hsl(17 64% 61%)", quote: "Make room for one more human story." },
];

const archiveSeeds: Array<[string, string]> = [
  ["Listening", "Listen long enough for the rehearsed answer to end."],
  ["Recognition", "Every person deserves to be met as more than a category."],
  ["A shared table", "Belonging often begins with a chair pulled closer."],
  ["Small mercies", "The smallest kindness can still change the direction of a day."],
  ["Ask twice", "Sometimes the honest answer arrives after the first one."],
  ["Stay curious", "Curiosity makes room where certainty closes it."],
  ["Common ground", "We need not be identical to stand beside one another."],
  ["The long view", "A person is larger than the moment in which we meet them."],
  ["Make time", "Attention cannot always be made more efficient."],
  ["An open door", "Welcome is a practice, not a sign on the wall."],
  ["Repair", "Trust returns through many small, consistent acts."],
  ["Hold the story", "Receive what is shared without trying to own it."],
  ["Mutual aid", "Everyone has something to offer and something they need."],
  ["Look again", "The familiar becomes visible when we slow down."],
  ["A good question", "What would help you feel more at home here?"],
  ["Room to change", "No one should be trapped inside an old version of themselves."],
  ["Shared attention", "What we notice together begins to shape a world."],
  ["Gentleness", "Care can be precise without becoming hard."],
  ["The first hello", "Connection often begins before we know where it will lead."],
  ["Ordinary courage", "Showing up again is its own form of bravery."],
  ["Keep company", "Not every difficult moment asks to be fixed."],
  ["Remembering", "A community is partly made of the stories it refuses to lose."],
  ["Shared work", "Working alongside someone changes how we understand them."],
  ["Permission", "People open differently when they are not being hurried."],
  ["The front porch", "Some spaces quietly teach us how to be neighbors."],
  ["Carry together", "A burden changes when more than one person names it."],
  ["Notice joy", "Flourishing is also made of delight, play, and surprise."],
  ["A place to return", "Belonging means knowing your absence would be noticed."],
  ["Practice welcome", "Hospitality is built through repetition."],
  ["Speak plainly", "Clarity can be a form of respect."],
  ["Let silence work", "A pause can hold what language cannot yet carry."],
  ["Begin nearby", "The human scale starts with the person already in front of us."],
  ["Across difference", "Understanding does not require agreement."],
  ["The whole person", "Strength and need can occupy the same life."],
  ["Trust slowly", "Real trust grows at the speed of kept promises."],
  ["A familiar face", "Repeated encounters turn strangers into part of a place."],
  ["Shared rituals", "Small repeated acts give shape to life together."],
  ["Care in public", "A humane city makes concern visible in its design."],
  ["Be reachable", "Connection depends on leaving some room for interruption."],
  ["Many ways to help", "Support begins by asking rather than assuming."],
  ["Offer dignity", "Respect belongs at the beginning, not the end."],
  ["Pay attention", "What we attend to becomes part of what we value."],
  ["Build with", "Participation is different from consultation."],
  ["Make room", "A generous space can change who feels able to enter."],
  ["Tell the truth", "Honesty and tenderness can share the same sentence."],
  ["Be remembered", "To remember someone is to affirm that they mattered here."],
  ["Try again", "Repair remains possible after a missed connection."],
  ["Human scale", "Start with bodies, time, relationships, and actual lives."],
];

const archivePalette = [
  "hsl(42 48% 80%)",
  "hsl(27 38% 79%)",
  "hsl(61 16% 78%)",
  "hsl(23 47% 82%)",
  "hsl(70 12% 79%)",
  "hsl(36 70% 82%)",
  "hsl(24 43% 78%)",
  "hsl(48 34% 84%)",
];

const archiveFragments: FragmentDefinition[] = archiveSeeds.map(([title, quote], index) => {
  const id = `archive-${index + 1}`;
  const anchorIds = ["dignity", "presence", "reciprocity", "witness", "ordinary", "name", "neighbor", "invitation"];
  const personId = DEV_FIXTURE_PEOPLE[index % DEV_FIXTURE_PEOPLE.length].slug;
  const previousId = index === 0 ? "ordinary" : `archive-${index}`;
  const styles: FragmentStyle[] = ["title", "snippet", "extract", "snippet", "title"];
  const widths = [205, 235, 270, 220, 190, 250];
  const heights = [118, 155, 188, 142, 108, 165];

  return {
    id,
    title,
    subtitle: index % 7 === 0 ? "A field note" : "Human practice",
    category: index % 13 === 12 ? "invitation" : "principle",
    style: styles[index % styles.length],
    themes: [
      3 + (index * 7) % 8,
      2 + (index * 5 + 3) % 9,
      3 + (index * 3 + 1) % 8,
    ],
    links: [anchorIds[index % anchorIds.length], personId, previousId],
    width: widths[index % widths.length],
    height: heights[index % heights.length],
    color: archivePalette[index % archivePalette.length],
    quote,
  };
});

const personFragments: FragmentDefinition[] = DEV_FIXTURE_PEOPLE.map((person, index) => ({
  id: person.slug,
  title: person.firstName,
  subtitle: person.descriptor ?? "Human story",
  category: "person",
  style: "image",
  themes: ([[9, 6, 8], [8, 10, 7], [9, 7, 10], [7, 6, 10]] as Array<[number, number, number]>)[index],
  links: ([["dignity", "ordinary", "name", "invitation"], ["presence", "witness", "invitation"], ["dignity", "reciprocity", "neighbor", "invitation"], ["ordinary", "reciprocity", "neighbor", "invitation"]] as string[][])[index],
  width: [330, 290, 305, 275][index],
  height: [455, 405, 430, 390][index],
  color: ["hsl(37 65% 82%)", "hsl(23 50% 80%)", "hsl(64 15% 80%)", "hsl(31 55% 82%)"][index],
  quote: person.pullQuote,
  portrait: person.portrait,
  portraitAlt: person.portraitAlt,
  portraitPosition: person.portraitPosition,
  personIndex: index,
}));

const fragmentDefinitions = [...personFragments, ...supportingFragments, ...archiveFragments];
const themeDefinitions: Array<{ id: ThemeKey; title: string }> = [
  { id: "care", title: "Care" },
  { id: "notice", title: "Notice" },
  { id: "belong", title: "Belong" },
];

function buildLayout(): Layout {
  const simulationWidth = 1500;
  const simulationHeight = 1120;
  const radius = 430;
  const themeNodes: LayoutNode[] = themeDefinitions.map((theme, index) => {
    const angle = index / themeDefinitions.length * Math.PI * 2 - Math.PI / 2;
    const x = simulationWidth / 2 + Math.cos(angle) * radius;
    const y = simulationHeight / 2 + Math.sin(angle) * radius;
    return { id: theme.id, fixed: true, fx: x, fy: y, x, y, themeIndex: index, themeLinks: [] };
  });
  const nodes: LayoutNode[] = fragmentDefinitions.map((fragment, index) => ({
    id: fragment.id,
    fragment,
    x: simulationWidth / 2 + Math.cos(index * 2.39996) * (100 + index * 9),
    y: simulationHeight / 2 + Math.sin(index * 2.39996) * (90 + index * 7),
    themeLinks: fragment.themes.map((value, themeIndex) => ({ id: themeDefinitions[themeIndex].id, value })).filter(link => link.value > 0),
  }));
  const allNodes = [...nodes, ...themeNodes];
  const links: LayoutLink[] = nodes.flatMap(node => node.themeLinks.map(link => ({ source: node.id, target: link.id, value: link.value })));
  const simulation = forceSimulation(allNodes)
    .randomSource(randomLcg(0.426))
    .force("link", forceLink<LayoutNode, LayoutLink>(links).id(node => node.id).distance(link => 100 + (10 - link.value) * 12).strength(link => link.value * .052))
    .force("collision", forceCollide<LayoutNode>().radius(node => node.fragment?.style === "image" ? 58 : 43).strength(1).iterations(3))
    .force("charge", forceManyBody().strength(-1050).distanceMax(900))
    .force("theme-attraction", () => {
      nodes.forEach(node => {
        node.themeLinks.forEach(link => {
          const theme = themeNodes.find(candidate => candidate.id === link.id);
          if (!theme || node.x == null || node.y == null || theme.x == null || theme.y == null) return;
          node.vx = (node.vx ?? 0) + (theme.x - node.x) * link.value * .0025;
          node.vy = (node.vy ?? 0) + (theme.y - node.y) * link.value * .0025;
        });
      });
    })
    .alphaDecay(.01)
    .stop();

  for (let index = 0; index < 2000; index += 1) simulation.tick();

  const minX = Math.min(...allNodes.map(node => node.x ?? 0));
  const minY = Math.min(...allNodes.map(node => node.y ?? 0));
  const factor = 5.8;
  const place = (node: LayoutNode) => ({ x: ((node.x ?? 0) - minX) * factor + BUFFER, y: ((node.y ?? 0) - minY) * factor + BUFFER });
  const fragments = nodes.map(node => ({ ...node.fragment!, ...place(node) }));
  const themes = themeNodes.map((node, index) => ({ ...themeDefinitions[index], ...place(node) }));
  const width = Math.max(...fragments.map(fragment => fragment.x + fragment.width / 2), ...themes.map(theme => theme.x)) + BUFFER;
  const height = Math.max(...fragments.map(fragment => fragment.y + fragment.height / 2), ...themes.map(theme => theme.y)) + BUFFER;
  return { width, height, fragments, themes };
}

const positionAtScale = (fragment: PlacedFragment, scale: number) => ({ left: fragment.x * scale - fragment.width / 2, top: fragment.y * scale - fragment.height / 2 });

export function PeopleField({ activeIndex, onSelect }: PeopleFieldProps) {
  const fieldRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<SVGSVGElement>(null);
  const connectionGroupRef = useRef<SVGGElement>(null);
  const historyGroupRef = useRef<SVGGElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const levelRef = useRef(DEFAULT_LEVEL);
  const panRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [help, setHelp] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 900, height: 700 });
  const [history, setHistory] = useState<string[]>([]);
  const layout = useMemo(buildLayout, []);
  const baseConnections = useMemo(() => {
    const pairs = new Set<string>();
    const result: Array<{ source: PlacedFragment; target: PlacedFragment; key: string }> = [];
    layout.fragments.forEach(source => source.links.forEach(targetId => {
      const target = layout.fragments.find(fragment => fragment.id === targetId);
      if (!target) return;
      const key = [source.id, target.id].sort().join("|");
      if (pairs.has(key)) return;
      pairs.add(key);
      result.push({ source, target, key });
    }));
    return result;
  }, [layout.fragments]);
  const scale = ZOOM_LEVELS[level];
  const activePersonId = activeIndex == null ? null : DEV_FIXTURE_PEOPLE[activeIndex]?.slug;
  const tooltipFragment = layout.fragments.find(fragment => fragment.id === hovered);

  const boundsFor = useCallback((nextScale: number) => ({
    minX: Math.min(0, viewport.width - layout.width * nextScale),
    minY: Math.min(0, viewport.height - layout.height * nextScale),
    maxX: 0,
    maxY: 0,
  }), [layout.height, layout.width, viewport.height, viewport.width]);

  const updateAppearance = useCallback((x = panRef.current.x, y = panRef.current.y) => {
    const field = fieldRef.current;
    if (!field) return;
    const currentScale = ZOOM_LEVELS[levelRef.current];
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    const maxDistance = Math.hypot(centerX, centerY) || 1;
    field.querySelectorAll<HTMLElement>(".spatial-fragment").forEach(element => {
      const index = Number(element.dataset.fragmentIndex);
      const fragment = layout.fragments[index];
      const dx = fragment.x * currentScale + x - centerX;
      const dy = fragment.y * currentScale + y - centerY;
      const ratio = Math.min(1, Math.hypot(dx, dy) / maxDistance);
      const visibleThreshold = levelRef.current <= 1 ? .68 : .36;
      const opacity = ratio <= visibleThreshold ? 1 : Math.max(.32, 1 - (ratio - visibleThreshold) / (1 - visibleThreshold));
      const depth = 1 - .12 * Math.pow(ratio, 1.5);
      const card = element.querySelector<HTMLElement>(".spatial-fragment__card");
      if (card) { card.style.opacity = String(opacity); card.style.setProperty("--depth-scale", String(depth)); }
    });
  }, [layout.fragments, viewport.height, viewport.width]);

  const setStagePosition = useCallback((x: number, y: number) => {
    const bounds = boundsFor(ZOOM_LEVELS[levelRef.current]);
    const next = { x: Math.min(bounds.maxX, Math.max(bounds.minX, x)), y: Math.min(bounds.maxY, Math.max(bounds.minY, y)) };
    panRef.current = next;
    runtimeRef.current?.gsap.set(stageRef.current, next);
    setPan(next);
    updateAppearance(next.x, next.y);
  }, [boundsFor, updateAppearance]);

  const centerMap = useCallback((nextLevel = DEFAULT_LEVEL) => {
    const nextScale = ZOOM_LEVELS[nextLevel];
    return { x: viewport.width / 2 - layout.width * nextScale / 2, y: viewport.height / 2 - layout.height * nextScale / 2 };
  }, [layout.height, layout.width, viewport.height, viewport.width]);

  const goToLevel = useCallback((nextLevel: number, targetId?: string) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const safeLevel = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, nextLevel));
    const nextScale = ZOOM_LEVELS[safeLevel];
    const target = targetId ? layout.fragments.find(fragment => fragment.id === targetId) : null;
    const targetPan = target
      ? { x: viewport.width / 2 - target.x * nextScale, y: viewport.height / 2 - target.y * nextScale }
      : centerMap(safeLevel);
    levelRef.current = safeLevel;
    setLevel(safeLevel);
    runtime.draggable?.applyBounds(boundsFor(nextScale));
    const timeline = runtime.gsap.timeline({
      defaults: { duration: 1, ease: "power3.inOut" },
      onUpdate: () => updateAppearance(runtime.gsap.getProperty(stageRef.current, "x") as number, runtime.gsap.getProperty(stageRef.current, "y") as number),
      onComplete: () => {
        const x = runtime.gsap.getProperty(stageRef.current, "x") as number;
        const y = runtime.gsap.getProperty(stageRef.current, "y") as number;
        panRef.current = { x, y };
        setPan({ x, y });
        runtime.draggable?.update(true);
      },
    });
    layout.fragments.forEach((fragment, index) => {
      const element = fieldRef.current?.querySelector<HTMLElement>(`[data-fragment-index="${index}"]`);
      if (!element) return;
      timeline.to(element, { ...positionAtScale(fragment, nextScale), scale: nextScale }, 0);
    });
    layout.themes.forEach((theme, index) => {
      const element = fieldRef.current?.querySelector<HTMLElement>(`[data-theme-fragment="${index}"]`);
      const gradient = fieldRef.current?.querySelector<HTMLElement>(`[data-theme-gradient="${index}"]`);
      if (element) timeline.to(element, { left: theme.x * nextScale - 60, top: theme.y * nextScale - 60, scale: nextScale }, 0);
      if (gradient) timeline.to(gradient, { left: theme.x * nextScale, top: theme.y * nextScale }, 0);
    });
    timeline.to([connectionGroupRef.current, historyGroupRef.current], { scale: nextScale, transformOrigin: "0 0" }, 0);
    timeline.to(gridRef.current, { scale: nextScale, opacity: safeLevel < 2 ? 0 : 1, transformOrigin: "0 0" }, 0);
    timeline.to(stageRef.current, targetPan, 0);
  }, [boundsFor, centerMap, layout.fragments, layout.themes, updateAppearance, viewport.height, viewport.width]);

  const selectFragment = useCallback((fragment: PlacedFragment) => {
    selectedRef.current = fragment.id;
    setHistory(previous => previous.at(-1) === fragment.id ? previous : [...previous.slice(-7), fragment.id]);
    if (fragment.personIndex != null) onSelect(fragment.personIndex);
    goToLevel(3, fragment.id);
  }, [goToLevel, onSelect]);

  useEffect(() => {
    const field = fieldRef.current;
    const stage = stageRef.current;
    if (!field || !stage) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let removeWheel: (() => void) | null = null;

    void (async () => {
      const [{ gsap }, { Draggable }, { InertiaPlugin }] = await Promise.all([import("gsap"), import("gsap/Draggable"), import("gsap/InertiaPlugin")]);
      if (cancelled) return;
      gsap.registerPlugin(Draggable, InertiaPlugin);
      const runtime: Runtime = { gsap, draggable: null, floatFrame: null, momentumFrame: null, waveFrame: null };
      runtimeRef.current = runtime;
      const initial = centerMap(DEFAULT_LEVEL);
      panRef.current = initial;
      gsap.set(stage, initial);

      const syncPosition = function(this: MapDraggable) {
        panRef.current = { x: this.x, y: this.y };
        setPan({ x: this.x, y: this.y });
        updateAppearance(this.x, this.y);
      };
      runtime.draggable = Draggable.create(stage, {
        type: "x,y",
        bounds: boundsFor(ZOOM_LEVELS[DEFAULT_LEVEL]),
        edgeResistance: .85,
        dragResistance: .18,
        inertia: true,
        throwResistance: 52000,
        minDuration: 1,
        onDrag: syncPosition,
        onThrowUpdate: syncPosition,
      })[0] as MapDraggable;

      const onWheel = (event: WheelEvent) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        event.preventDefault();
        velocityRef.current.x += -event.deltaX * .12;
        velocityRef.current.y += -event.deltaY * .12;
        if (runtime.momentumFrame) return;
        const momentum = () => {
          velocityRef.current.x *= .9;
          velocityRef.current.y *= .9;
          setStagePosition(panRef.current.x + velocityRef.current.x, panRef.current.y + velocityRef.current.y);
          runtime.draggable?.update(true);
          if (Math.abs(velocityRef.current.x) > .1 || Math.abs(velocityRef.current.y) > .1) runtime.momentumFrame = requestAnimationFrame(momentum);
          else runtime.momentumFrame = null;
        };
        runtime.momentumFrame = requestAnimationFrame(momentum);
      };
      field.addEventListener("wheel", onWheel, { passive: false });
      removeWheel = () => field.removeEventListener("wheel", onWheel);

      const floatSettings = layout.fragments.map((_, index) => ({ phase: index * 1.71, speed: .00045 + index % 5 * .00008, x: 3 + index % 4, y: 4 + index % 3, tilt: 1 + index % 3 * .45 }));
      const start = performance.now();
      const float = (now: number) => {
        field.querySelectorAll<HTMLElement>(".spatial-fragment__float").forEach((element, index) => {
          const setting = floatSettings[index];
          const phase = (now - start) * setting.speed + setting.phase;
          gsap.set(element, { x: Math.cos(phase) * setting.x, y: Math.sin(phase) * setting.y, z: Math.sin(phase * .5) * 6, rotate: Math.sin(phase) * setting.tilt, transformPerspective: 800 });
        });
        runtime.floatFrame = requestAnimationFrame(float);
      };
      runtime.floatFrame = requestAnimationFrame(float);

      let wavePhase = 0;
      const wave = () => {
        wavePhase += .003;
        field.querySelectorAll<SVGPathElement>(".force-link").forEach((path, index) => {
          const connection = baseConnections[index];
          if (!connection) return;
          const { source, target } = connection;
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.hypot(dx, dy) || 1;
          const normalX = -dy / distance;
          const normalY = dx / distance;
          const wavelength = distance / 3;
          let value = `M ${source.x} ${source.y}`;
          for (let point = 1; point <= 150; point += 1) {
            const progress = point / 150;
            const envelope = Math.sin(Math.PI * progress) ** 2;
            const density = 1 + .4 * Math.sin(progress * Math.PI * 2 + wavePhase + index);
            const wavePosition = progress * distance / wavelength * density;
            const sine = Math.sin(wavePosition * Math.PI * 2 - wavePhase / (1 + .1 * density));
            const chaos = Math.sin(wavePosition * Math.PI * 2 + index) * Math.sin(wavePosition * 4 + wavePhase * .5);
            const offset = 20 * (.5 * sine + .5 * chaos) * envelope;
            value += ` L ${source.x + dx * progress + normalX * offset} ${source.y + dy * progress + normalY * offset}`;
          }
          path.setAttribute("d", value);
        });
        runtime.waveFrame = requestAnimationFrame(wave);
      };
      runtime.waveFrame = requestAnimationFrame(wave);

      resizeObserver = new ResizeObserver(() => setViewport({ width: field.clientWidth, height: field.clientHeight }));
      resizeObserver.observe(field);
      setViewport({ width: field.clientWidth, height: field.clientHeight });
      requestAnimationFrame(() => updateAppearance(initial.x, initial.y));
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      removeWheel?.();
      const runtime = runtimeRef.current;
      runtime?.draggable?.kill();
      if (runtime?.floatFrame) cancelAnimationFrame(runtime.floatFrame);
      if (runtime?.momentumFrame) cancelAnimationFrame(runtime.momentumFrame);
      if (runtime?.waveFrame) cancelAnimationFrame(runtime.waveFrame);
      runtimeRef.current = null;
    };
  }, [baseConnections, boundsFor, centerMap, layout.fragments, setStagePosition, updateAppearance]);

  useEffect(() => {
    if (activePersonId && activePersonId !== selectedRef.current) {
      selectedRef.current = activePersonId;
      setHistory(previous => previous.at(-1) === activePersonId ? previous : [...previous.slice(-7), activePersonId]);
      goToLevel(3, activePersonId);
    }
  }, [activePersonId, goToLevel]);

  const wavePath = (source: PlacedFragment, target: PlacedFragment, index: number) => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.hypot(dx, dy) || 1;
    const normalX = -dy / distance;
    const normalY = dx / distance;
    let path = `M ${source.x} ${source.y}`;
    for (let point = 1; point <= 42; point += 1) {
      const progress = point / 42;
      const envelope = Math.sin(Math.PI * progress) ** 2;
      const wave = Math.sin(progress * Math.PI * 6 + index * 1.7);
      path += ` L ${source.x + dx * progress + normalX * 17 * wave * envelope} ${source.y + dy * progress + normalY * 17 * wave * envelope}`;
    }
    return path;
  };

  const historyPairs = history.slice(1).map((targetId, index) => ({ source: layout.fragments.find(fragment => fragment.id === history[index]), target: layout.fragments.find(fragment => fragment.id === targetId), key: `${history[index]}-${targetId}-${index}` })).filter(pair => pair.source && pair.target);
  const miniWidth = Math.min(94, viewport.width / (layout.width * scale) * 100);
  const miniHeight = Math.min(94, viewport.height / (layout.height * scale) * 100);
  const miniLeft = Math.max(0, Math.min(100 - miniWidth, -pan.x / (layout.width * scale) * 100));
  const miniTop = Math.max(0, Math.min(100 - miniHeight, -pan.y / (layout.height * scale) * 100));
  const viewCenter = { x: (viewport.width / 2 - pan.x) / scale, y: (viewport.height / 2 - pan.y) / scale };

  return (
    <section ref={fieldRef} className="people-field people-field--constellation" aria-label="Interactive constellation of people and stories">
      <div className="people-field__intro"><p>People / Stories</p><span>Drag or scroll to explore</span></div>

      <div className="theme-direction" aria-hidden="true">
        <span className="theme-direction__circle" />
        {layout.themes.map(theme => {
          const angle = Math.atan2(theme.y - viewCenter.y, theme.x - viewCenter.x);
          const radius = Math.max(90, Math.min(viewport.width, viewport.height) / 2 - 48);
          const distance = Math.hypot(theme.x - viewCenter.x, theme.y - viewCenter.y);
          const size = 8 + Math.max(0, 18 * (1 - distance / Math.max(layout.width, layout.height)));
          return <span key={theme.id} className={`theme-direction__marker theme-direction__marker--${theme.id}`} style={{ left: viewport.width / 2 + Math.cos(angle) * radius, top: viewport.height / 2 + Math.sin(angle) * radius, width: size, height: size }}><i /><b>{theme.title}</b></span>;
        })}
      </div>

      <div ref={stageRef} className="people-field__stage people-field__stage--force" style={{ width: layout.width, height: layout.height }}>
        <svg ref={gridRef} className="people-field__force-grid" width={layout.width} height={layout.height} aria-hidden="true"><defs><pattern id="people-grid" width="130" height="130" patternUnits="userSpaceOnUse"><path d="M130 0H0V130" fill="none" stroke="rgba(245,243,235,.2)" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#people-grid)" /></svg>
        <div className={`people-field__gradients ${level === 0 ? "is-visible" : ""}`} aria-hidden="true">{layout.themes.map((theme, index) => <i key={theme.id} data-theme-gradient={index} style={{ left: theme.x * scale, top: theme.y * scale, "--gradient-index": index } as React.CSSProperties} />)}</div>

        <svg className="people-field__force-lines" width={layout.width} height={layout.height} aria-hidden="true">
          <g ref={connectionGroupRef} style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
            {baseConnections.map((connection, index) => {
              const highlighted = hoveredRef.current === connection.source.id || hoveredRef.current === connection.target.id;
              return <path key={connection.key} className={`force-link ${highlighted ? "is-highlighted" : ""}`} d={wavePath(connection.source, connection.target, index)} />;
            })}
          </g>
          <g ref={historyGroupRef} style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
            {historyPairs.map(pair => <path key={pair.key} className="force-history" d={`M ${pair.source!.x} ${pair.source!.y} Q ${(pair.source!.x + pair.target!.x) / 2} ${(pair.source!.y + pair.target!.y) / 2 - 120} ${pair.target!.x} ${pair.target!.y}`} />)}
          </g>
        </svg>

        {layout.themes.map((theme, index) => <div key={theme.id} data-theme-fragment={index} className={`theme-fragment theme-fragment--${theme.id}`} style={{ left: theme.x * scale - 60, top: theme.y * scale - 60, transform: `scale(${scale})` }} aria-hidden="true"><i /><span>{theme.title}</span></div>)}

        {layout.fragments.map((fragment, index) => {
          const initial = positionAtScale(fragment, ZOOM_LEVELS[DEFAULT_LEVEL]);
          const isSelected = fragment.id === activePersonId;
          return <button
            type="button"
            key={fragment.id}
            data-fragment-index={index}
            data-fragment-id={fragment.id}
            className={`spatial-fragment spatial-fragment--${fragment.style} spatial-fragment--${fragment.category} ${isSelected ? "is-selected" : ""}`}
            style={{ ...initial, width: fragment.width, height: fragment.height, scale: ZOOM_LEVELS[DEFAULT_LEVEL], "--fragment-color": fragment.color } as React.CSSProperties}
            onMouseEnter={() => { hoveredRef.current = fragment.id; setHovered(fragment.id); }}
            onMouseLeave={() => { hoveredRef.current = null; setHovered(null); }}
            onMouseMove={event => setPointer({ x: event.clientX, y: event.clientY })}
            onFocus={() => { hoveredRef.current = fragment.id; setHovered(fragment.id); }}
            onBlur={() => { hoveredRef.current = null; setHovered(null); }}
            onClick={() => selectFragment(fragment)}
          >
            <span className="spatial-fragment__card">
              <span className="spatial-fragment__float">
                {fragment.portrait && <figure><Image src={fragment.portrait} alt={fragment.portraitAlt ?? ""} fill sizes="340px" style={{ objectPosition: fragment.portraitPosition }} /></figure>}
                <span className="spatial-fragment__body">
                  {fragment.style === "title" && <strong className="spatial-fragment__title">{fragment.title}</strong>}
                  {fragment.style !== "title" && fragment.quote && <blockquote>{fragment.quote}</blockquote>}
                  <span className="spatial-fragment__caption"><i />{fragment.category === "person" ? "Story" : fragment.category}<b>{fragment.title}</b></span>
                </span>
              </span>
            </span>
          </button>;
        })}
      </div>

      {tooltipFragment && <div className="people-field__force-tooltip" style={{ left: pointer.x + 9, top: pointer.y + 12 }}><small>{tooltipFragment.category}</small><strong>{tooltipFragment.title}</strong><span>{tooltipFragment.subtitle}</span></div>}

      <div className="force-map-controls" aria-label="Map controls">
        <div className="force-map-controls__zoom"><button type="button" disabled={level === 3} onClick={() => goToLevel(level + 1)} aria-label="Zoom in">+</button><div className="force-zoom-track">{ZOOM_LEVELS.map((_, index) => <button key={index} type="button" className={level === index ? "is-active" : ""} onClick={() => goToLevel(index)} aria-label={`Zoom level ${index + 1}`} />)}</div><button type="button" disabled={level === 0} onClick={() => goToLevel(level - 1)} aria-label="Zoom out">−</button></div>
        <button type="button" onClick={() => goToLevel(DEFAULT_LEVEL)} aria-label="Center map">◎</button>
        <button type="button" onClick={() => document.fullscreenElement ? document.exitFullscreen() : fieldRef.current?.requestFullscreen()} aria-label="Toggle fullscreen">⛶</button>
        <button type="button" onClick={() => setHelp(value => !value)} aria-label="Map guide" aria-expanded={help}>?</button>
      </div>

      <div className="force-fragment-nav"><button type="button" onClick={() => onSelect(((activeIndex ?? 0) - 1 + DEV_FIXTURE_PEOPLE.length) % DEV_FIXTURE_PEOPLE.length)} aria-label="Previous person">←</button><button type="button" onClick={() => onSelect(((activeIndex ?? -1) + 1) % DEV_FIXTURE_PEOPLE.length)} aria-label="Next person">→</button></div>

      <div className="force-minimap" aria-hidden="true"><div>{layout.fragments.map(fragment => <i key={fragment.id} className={`is-${fragment.category}`} style={{ left: `${fragment.x / layout.width * 100}%`, top: `${fragment.y / layout.height * 100}%` }} />)}<span style={{ left: `${miniLeft}%`, top: `${miniTop}%`, width: `${miniWidth}%`, height: `${miniHeight}%` }} /></div></div>

      {help && <aside className="people-field__help people-field__help--force"><button type="button" onClick={() => setHelp(false)} aria-label="Close guide">×</button><p className="eyebrow">Guide</p><h2>Exploring the human field</h2><p>Stories gather around care, notice, and belonging. Drag the field or use a trackpad to move. Choose one of four zoom levels, then select a fragment to bring it into focus and open its story.</p></aside>}

      <svg className="people-filter-defs" aria-hidden="true"><filter id="people-duotone" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values=".82 0 0 0 .12 0 .82 0 0 .12 0 0 .82 0 .12 0 0 0 1 0" /><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="1" seed="6" result="noise" /><feComposite in2="noise" operator="arithmetic" k1="0" k2="1" k3=".16" k4="0" /></filter></svg>
    </section>
  );
}
