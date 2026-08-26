/* eslint-disable react-hooks/immutability -- Three.js uniforms are mutable GPU state. */
"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { HUMAN_SURFACE_RADIUS, latLngToVector3 } from "./coordinates";
import { HumanBeaconHitTargets } from "./HumanBeaconHitTargets";
import type { GlobeHover, GlobeHuman } from "./types";

const TEST_CITIES = ["los angeles", "dallas", "tulsa", "chicago", "new york", "miami"] as const;

function cityKey(value?: string) {
  return (value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function selectBillboardTestHumans(humans: GlobeHuman[]) {
  const selected: GlobeHuman[] = [];
  const used = new Set<string>();
  for (const city of TEST_CITIES) {
    const human = humans.find(candidate => !used.has(candidate.id) && cityKey(candidate.city).includes(city));
    if (!human) continue;
    selected.push(human);
    used.add(human.id);
  }
  return selected;
}

type Props = {
  humans: GlobeHuman[];
  selectedHumanId: string | null;
  hoveredHumanId: string | null;
  onHover: (hover: GlobeHover) => void;
  onSelect: (humanId: string) => void;
  onActiveChange: (humanIds: string[]) => void;
  debug: boolean;
};

/** One GPU points draw call: every point is a procedural camera-facing flare. */
export function HumanBillboardLayer({
  humans,
  selectedHumanId,
  hoveredHumanId,
  onHover,
  onSelect,
  onActiveChange,
  debug,
}: Props) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { gl, size } = useThree();
  const mobile = size.width <= 760;
  const activeHumans = useMemo(() => selectBillboardTestHumans(humans), [humans]);
  const indexById = useMemo(
    () => new Map(activeHumans.map((human, index) => [human.id, index] as const)),
    [activeHumans],
  );
  const positions = useMemo(() => activeHumans.map(human => (
    latLngToVector3(human.lat, human.lng, HUMAN_SURFACE_RADIUS)
  )), [activeHumans]);
  const geometry = useMemo(() => {
    const buffer = new THREE.BufferGeometry();
    const positionData = new Float32Array(activeHumans.length * 3);
    positions.forEach((position, index) => position.toArray(positionData, index * 3));
    buffer.setAttribute("position", new THREE.BufferAttribute(positionData, 3));
    buffer.setAttribute("aMarkerIndex", new THREE.BufferAttribute(
      Float32Array.from(activeHumans.map((_, index) => index)),
      1,
    ));
    return buffer;
  }, [activeHumans, positions]);
  const uniforms = useMemo(() => ({
    uSelected: { value: -1 },
    uHovered: { value: -1 },
    uPixelRatio: { value: 1 },
    uMobile: { value: mobile ? 1 : 0 },
  }), [mobile]);

  useEffect(() => {
    onActiveChange(activeHumans.map(human => human.id));
    return () => onActiveChange([]);
  }, [activeHumans, onActiveChange]);
  useEffect(() => {
    uniforms.uSelected.value = selectedHumanId === null ? -1 : indexById.get(selectedHumanId) ?? -1;
  }, [indexById, selectedHumanId, uniforms]);
  useEffect(() => {
    uniforms.uHovered.value = hoveredHumanId === null ? -1 : indexById.get(hoveredHumanId) ?? -1;
  }, [hoveredHumanId, indexById, uniforms]);
  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.8);
  }, [gl, uniforms]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group name="human-billboard-layer">
      <points geometry={geometry} frustumCulled={false} raycast={() => undefined} renderOrder={3}>
        <shaderMaterial
          ref={materialRef}
          transparent
          depthTest
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          uniforms={uniforms}
          vertexShader={`
            attribute float aMarkerIndex;
            uniform float uSelected;
            uniform float uHovered;
            uniform float uPixelRatio;
            uniform float uMobile;
            varying float vSelected;
            varying float vHovered;

            void main() {
              vSelected = step(abs(aMarkerIndex - uSelected), 0.1);
              vHovered = step(abs(aMarkerIndex - uHovered), 0.1);
              vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
              gl_Position = projectionMatrix * viewPosition;
              float baseSize = mix(34.0, 30.0, uMobile);
              float stateScale = 1.0 + vHovered * 0.10 + vSelected * 0.22;
              gl_PointSize = baseSize * stateScale * uPixelRatio;
            }
          `}
          fragmentShader={`
            varying float vSelected;
            varying float vHovered;

            void main() {
              vec2 point = (gl_PointCoord - 0.5) * 2.0;
              float radius = length(point);

              float whiteHot = exp(-pow(radius / 0.105, 2.0));
              float pinpoint = exp(-pow(radius / 0.042, 2.0));
              float innerGlow = exp(-pow(radius / 0.27, 2.0));
              float outerHalo = exp(-pow(radius / 0.68, 2.0)) * (1.0 - smoothstep(0.72, 1.0, radius));

              float horizontalRay = exp(-pow(abs(point.y) / 0.024, 1.35))
                * exp(-pow(abs(point.x) / 0.56, 1.45));
              float verticalRay = exp(-pow(abs(point.x) / 0.022, 1.35))
                * exp(-pow(abs(point.y) / 0.66, 1.4));
              vec2 diagonal = vec2(point.x + point.y, point.x - point.y);
              float diagonalRays = (
                exp(-pow(abs(diagonal.x) / 0.035, 1.4))
                + exp(-pow(abs(diagonal.y) / 0.035, 1.4))
              ) * exp(-pow(radius / 0.47, 1.45)) * 0.13;

              float attention = 1.0 + vHovered * 0.10 + vSelected * 0.24;
              vec3 paper = vec3(0.949, 0.922, 0.867);
              vec3 lapis = vec3(0.188, 0.275, 0.647);
              vec3 opticalBlue = vec3(0.31, 0.49, 1.0);
              vec3 color = paper * (whiteHot * 2.35 + pinpoint * 2.1)
                + mix(lapis, opticalBlue, 0.58 + vSelected * 0.22) * innerGlow * 1.18
                + lapis * outerHalo * (0.30 + vSelected * 0.14)
                + opticalBlue * (horizontalRay * 0.72 + verticalRay * 0.86 + diagonalRays) * 0.82;
              color *= attention;
              float alpha = max(max(color.r, color.g), color.b);
              if (alpha < 0.006 || radius > 1.0) discard;
              gl_FragColor = vec4(color / max(alpha, 0.001), min(alpha, 1.0));
            }
          `}
        />
      </points>
      <HumanBeaconHitTargets
        humans={activeHumans}
        positionFor={human => latLngToVector3(human.lat, human.lng, HUMAN_SURFACE_RADIUS)}
        onHover={onHover}
        onHoverEnd={() => onHover(null)}
        onSelect={onSelect}
        debug={debug}
      />
    </group>
  );
}
