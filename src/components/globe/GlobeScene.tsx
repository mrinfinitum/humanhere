/* eslint-disable react-hooks/immutability -- Three.js scenes are intentionally animated through mutable refs and uniforms. */
"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import { EARTH_RADIUS, HUMAN_SURFACE_RADIUS, latLngToVector3 } from "./coordinates";
import { HumanBillboardLayer } from "./HumanBillboardLayer";
import { HumanDiscoveryManager } from "./HumanDiscoveryManager";
import type { GlobeControls, GlobeHover, GlobeHuman } from "./types";

const WORLD_RADIUS = EARTH_RADIUS;
const WORLD_SCALE = 1.5;
const WORLD_POSITION = new THREE.Vector3(0.118, -0.25, 0);
const EARTH_ROTATION_SECONDS = 240;
const EASTWARD_ROTATION_SPEED = Math.PI * 2 / EARTH_ROTATION_SECONDS;
const PAPER = new THREE.Color("#F2EBDD");
const LAPIS = new THREE.Color("#3046A5");
const GLOBE_DEBUG = process.env.NEXT_PUBLIC_GLOBE_DEBUG === "true";

function createSeededRandom(seed = 31051986) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function EarthSurface() {
  const [dayTexture, nightTexture] = useLoader(THREE.TextureLoader, [
    "/textures/earth/blue-marble-5400.jpg",
    "/textures/earth/black-marble-2016.jpg",
  ]);

  useEffect(() => {
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    // This texture is sampled as emissive/geographic data. Keeping its source
    // values linear preserves the low-energy population texture that sRGB
    // decoding would otherwise crush into black.
    nightTexture.colorSpace = THREE.NoColorSpace;
    dayTexture.anisotropy = 8;
    nightTexture.anisotropy = 8;
    dayTexture.needsUpdate = true;
    nightTexture.needsUpdate = true;
  }, [dayTexture, nightTexture]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uDay: { value: dayTexture },
      uNight: { value: nightTexture },
      uNightTexel: { value: new THREE.Vector2(1 / 3600, 1 / 1800) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * worldPosition;
        vNormalView = normalize(normalMatrix * normal);
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vViewDirection = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uDay;
      uniform sampler2D uNight;
      uniform vec2 uNightTexel;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      float hhLuminance(vec3 color) {
        return dot(color, vec3(0.2126, 0.7152, 0.0722));
      }

      float hhWarmLight(vec3 color) {
        return max(color.r + color.g * 0.55 - color.b * 1.05, 0.0);
      }

      void main() {
        vec3 day = texture2D(uDay, vUv).rgb;
        vec3 night = texture2D(uNight, vUv).rgb;
        float dayLuma = hhLuminance(day);

        float oceanSignal = smoothstep(0.04, 0.22, day.b - max(day.r, day.g) * 0.68);
        float landSignal = clamp(dayLuma * 1.35 - oceanSignal * 0.24, 0.0, 1.0);
        float colorRange = max(day.r, max(day.g, day.b)) - min(day.r, min(day.g, day.b));
        float cloudSignal = smoothstep(0.44, 0.88, dayLuma) * (1.0 - smoothstep(0.15, 0.42, colorRange));
        vec3 mutedDay = vec3(dayLuma) * vec3(0.13, 0.15, 0.21) + day * 0.032;
        vec3 ocean = vec3(0.006, 0.011, 0.024) + night * vec3(0.025, 0.032, 0.055);
        vec3 land = vec3(0.034, 0.042, 0.061) + mutedDay + night * vec3(0.115, 0.12, 0.16);
        vec3 surface = mix(ocean, land, smoothstep(0.055, 0.28, landSignal));

        vec3 keyDirection = normalize(vec3(-0.42, 0.58, 0.70));
        float keyFacing = dot(vNormalWorld, keyDirection);
        float key = smoothstep(-0.34, 0.88, keyFacing);
        float grazing = pow(1.0 - max(dot(vNormalView, vViewDirection), 0.0), 2.7);
        surface *= 0.62 + key * 0.70;
        surface += mutedDay * key * 0.22;
        surface += vec3(0.06, 0.072, 0.095) * cloudSignal * (0.16 + key * 0.21);
        surface += vec3(0.019, 0.034, 0.078) * grazing * (0.54 + key * 0.35);

        // Extract the warm population signal from the geographically accurate
        // Black Marble source. Four neighboring taps create optical energy only
        // around the strongest metros while the vast majority stay pin-sharp.
        float citySource = hhWarmLight(night);
        float neighborSource = (
          hhWarmLight(texture2D(uNight, vUv + vec2(uNightTexel.x * 2.6, 0.0)).rgb)
          + hhWarmLight(texture2D(uNight, vUv - vec2(uNightTexel.x * 2.6, 0.0)).rgb)
          + hhWarmLight(texture2D(uNight, vUv + vec2(0.0, uNightTexel.y * 2.6)).rgb)
          + hhWarmLight(texture2D(uNight, vUv - vec2(0.0, uNightTexel.y * 2.6)).rgb)
        ) * 0.25;
        float cityCore = pow(smoothstep(0.018, 0.68, citySource), 1.12);
        float metroGlow = pow(smoothstep(0.24, 0.78, max(citySource, neighborSource)), 2.35);
        vec3 champagne = vec3(1.0, 0.82, 0.59);
        vec3 ivory = vec3(1.0, 0.93, 0.79);
        vec3 cityWarmth = champagne * cityCore * 1.08 + ivory * metroGlow * 0.42;
        vec3 color = surface + cityWarmth;

        float limbShadow = smoothstep(-0.38, 0.46, keyFacing);
        color *= mix(0.80, 1.0, limbShadow);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }), [dayTexture, nightTexture]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh>
      <sphereGeometry args={[WORLD_RADIUS, 192, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function createAtmosphereMaterial(outer: boolean) {
  return new THREE.ShaderMaterial({
    uniforms: { uOuter: { value: outer ? 1 : 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewDirection;
      varying vec3 vNormalWorld;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDirection = normalize(-viewPosition.xyz);
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform float uOuter;
      varying vec3 vNormalView;
      varying vec3 vViewDirection;
      varying vec3 vNormalWorld;
      void main() {
        float edge = 1.0 - abs(dot(vNormalView, vViewDirection));
        float directional = smoothstep(-0.42, 0.84, dot(vNormalWorld, normalize(vec3(0.42, 0.66, 0.62))));
        vec3 lapis = vec3(0.188, 0.275, 0.647);
        vec3 opticalBlue = vec3(0.35, 0.52, 1.25);
        vec3 hotEdge = vec3(0.78, 0.88, 1.45);
        vec3 color = mix(lapis, mix(opticalBlue, hotEdge, directional * 0.54), directional * 0.88);
        float tight = pow(edge, 9.6) * (0.08 + directional * 0.78);
        float soft = pow(edge, 3.65) * (0.018 + directional * 0.17);
        float alpha = mix(tight, soft, uOuter);
        gl_FragColor = vec4(color * mix(1.12, 0.72, uOuter), alpha);
      }
    `,
  });
}

function Atmosphere() {
  const materials = useMemo(() => ({
    tight: createAtmosphereMaterial(false),
    outer: createAtmosphereMaterial(true),
  }), []);

  useEffect(() => () => {
    materials.tight.dispose();
    materials.outer.dispose();
  }, [materials]);
  return (
    <group>
      <mesh scale={1.013}>
        <sphereGeometry args={[WORLD_RADIUS, 160, 112]} />
        <primitive object={materials.tight} attach="material" />
      </mesh>
      <mesh scale={1.034}>
        <sphereGeometry args={[WORLD_RADIUS, 160, 112]} />
        <primitive object={materials.outer} attach="material" />
      </mesh>
    </group>
  );
}

function SpaceField() {
  const positions = useMemo(() => {
    const random = createSeededRandom();
    const result = new Float32Array(320 * 3);
    for (let index = 0; index < 320; index += 1) {
      const radius = 8 + random() * 8;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      result.set([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      ], index * 3);
    }
    return result;
  }, []);

  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color={PAPER} size={0.014} transparent opacity={0.18} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function OrbitLines() {
  const geometry = useMemo(() => {
    const points = Array.from({ length: 257 }, (_, index) => {
      const angle = index / 256 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * 1.19, Math.sin(angle) * 1.19, 0);
    });
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);
  const lines = useMemo(() => {
    const firstMaterial = new THREE.LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0.035, depthWrite: false });
    const secondMaterial = new THREE.LineBasicMaterial({ color: LAPIS, transparent: true, opacity: 0.045, depthWrite: false });
    const thirdMaterial = new THREE.LineBasicMaterial({ color: "#E8C791", transparent: true, opacity: 0.024, depthWrite: false });
    const first = new THREE.Line(geometry, firstMaterial);
    const second = new THREE.Line(geometry, secondMaterial);
    const third = new THREE.Line(geometry, thirdMaterial);
    first.rotation.set(0.48, 0.32, -0.18);
    second.rotation.set(-0.54, 0.18, 0.48);
    third.rotation.set(0.13, -0.62, 0.31);
    second.scale.setScalar(1.055);
    third.scale.setScalar(1.11);
    return { first, second, third, firstMaterial, secondMaterial, thirdMaterial };
  }, [geometry]);
  useEffect(() => () => {
    geometry.dispose();
    lines.firstMaterial.dispose();
    lines.secondMaterial.dispose();
    lines.thirdMaterial.dispose();
  }, [geometry, lines]);

  return (
    <group position={WORLD_POSITION.toArray()} scale={WORLD_SCALE}>
      <primitive object={lines.first} />
      <primitive object={lines.second} />
      <primitive object={lines.third} />
    </group>
  );
}

export function GlobeScene({
  humans,
  selectedHumanId,
  hoveredHumanId,
  controls,
  reducedMotion,
  debugProjectionRef,
  debugWorldRef,
  onHover,
  onSelect,
  onActiveChange,
  onReady,
}: {
  humans: GlobeHuman[];
  selectedHumanId: string | null;
  hoveredHumanId: string | null;
  controls: MutableRefObject<GlobeControls>;
  reducedMotion: boolean;
  debugProjectionRef: RefObject<HTMLElement | null>;
  debugWorldRef: RefObject<HTMLElement | null>;
  onHover: (hover: GlobeHover) => void;
  onSelect: (humanId: string) => void;
  onActiveChange: (humanIds: string[]) => void;
  onReady: () => void;
}) {
  const worldRef = useRef<THREE.Group>(null);
  const worldCenter = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const debugWorldPoint = useMemo(() => new THREE.Vector3(), []);
  const debugProjectedPoint = useMemo(() => new THREE.Vector3(), []);
  const worldQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const candidateDirection = useMemo(() => new THREE.Vector3(), []);
  const { camera, gl, size } = useThree();
  const candidatePositions = useMemo(
    () => humans.map(human => latLngToVector3(human.lat, human.lng, HUMAN_SURFACE_RADIUS)),
    [humans],
  );
  const showAllTestBeacons = process.env.NEXT_PUBLIC_SHOW_ALL_GLOBE_BEACONS !== "false"
    && humans.length > 0
    && humans.every(human => human.fixture);
  const discoveryManager = useMemo(() => new HumanDiscoveryManager(candidatePositions, {
    poolSize: showAllTestBeacons ? humans.length : Math.min(size.width <= 760 ? 10 : 16, humans.length),
    visibleBudget: showAllTestBeacons ? humans.length : size.width <= 760 ? 6 : 10,
    initialBudget: showAllTestBeacons ? humans.length : size.width <= 760 ? 2 : 4,
    recentlySeenLimit: Math.min(80, Math.max(12, humans.length)),
    showAll: showAllTestBeacons,
    timingScale: size.width <= 760 ? 1.18 : 1,
  }), [candidatePositions, humans.length, showAllTestBeacons, size.width]);
  const selectedCandidateIndex = selectedHumanId === null
    ? null
    : humans.findIndex(human => human.id === selectedHumanId);
  const hoveredCandidateIndex = hoveredHumanId === null
    ? null
    : humans.findIndex(human => human.id === hoveredHumanId);

  useEffect(() => {
    gl.setClearColor("#05070B", 1);
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
    onReady();
  }, [gl, onReady]);

  useEffect(() => {
    const seed = new Uint32Array(1);
    globalThis.crypto?.getRandomValues(seed);
    discoveryManager.reseed(seed[0] || Date.now());
    return () => onActiveChange([]);
  }, [discoveryManager, onActiveChange]);

  useFrame((_, delta) => {
    const world = worldRef.current;
    if (!world) return;

    if (!reducedMotion && selectedHumanId === null && !controls.current.dragging && performance.now() - controls.current.lastInteraction > 2800) {
      // Positive Y advances longitude eastward: Earth's west-to-east rotation.
      controls.current.targetY += delta * EASTWARD_ROTATION_SPEED;
    }
    world.rotation.x = THREE.MathUtils.damp(world.rotation.x, controls.current.targetX, 4.1, delta);
    world.rotation.y = THREE.MathUtils.damp(world.rotation.y, controls.current.targetY, 4.1, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, controls.current.distance, 4.4, delta);
    camera.lookAt(0, 0, 0);

    world.getWorldQuaternion(worldQuaternion);
    world.getWorldPosition(worldCenter);
    cameraDirection.copy(camera.position).sub(worldCenter).normalize();
    const membershipChanged = discoveryManager.update({
      now: performance.now() / 1000,
      selectedIndex: selectedCandidateIndex !== null && selectedCandidateIndex >= 0 ? selectedCandidateIndex : null,
      hoveredIndex: hoveredCandidateIndex !== null && hoveredCandidateIndex >= 0 ? hoveredCandidateIndex : null,
      activelyExploring: controls.current.dragging || performance.now() - controls.current.lastInteraction < 1800,
      reducedMotion,
      visibilityFor: candidateIndex => candidateDirection
        .copy(candidatePositions[candidateIndex])
        .normalize()
        .applyQuaternion(worldQuaternion)
        .dot(cameraDirection),
    });
    if (membershipChanged) {
      onActiveChange(discoveryManager.activeCandidateIndices().map(candidateIndex => humans[candidateIndex].id));
    }

    if (GLOBE_DEBUG && debugProjectionRef.current && humans[0]) {
      debugWorldPoint.copy(latLngToVector3(humans[0].lat, humans[0].lng, HUMAN_SURFACE_RADIUS));
      world.localToWorld(debugWorldPoint);
      debugProjectedPoint.copy(debugWorldPoint).project(camera);
      const debugX = (debugProjectedPoint.x * 0.5 + 0.5) * size.width;
      const debugY = (-debugProjectedPoint.y * 0.5 + 0.5) * size.height;
      debugProjectionRef.current.style.transform = `translate3d(${(debugX - 7).toFixed(1)}px, ${(debugY - 7).toFixed(1)}px, 0)`;
      if (debugWorldRef.current) {
        debugWorldRef.current.textContent = `WORLD ${debugWorldPoint.x.toFixed(3)}, ${debugWorldPoint.y.toFixed(3)}, ${debugWorldPoint.z.toFixed(3)}`;
      }
    }

  });

  return (
    <>
      <SpaceField />
      <OrbitLines />
      <group ref={worldRef} position={WORLD_POSITION.toArray()} scale={WORLD_SCALE} rotation={[0.47, -0.085, -0.025]}>
        <EarthSurface />
        <HumanBillboardLayer
          humans={humans}
          selectedHumanId={selectedHumanId}
          hoveredHumanId={hoveredHumanId}
          discoveryManager={discoveryManager}
          onHover={onHover}
          onSelect={onSelect}
          debug={GLOBE_DEBUG}
        />
        <Atmosphere />
      </group>
    </>
  );
}
