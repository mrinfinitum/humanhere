/* eslint-disable react-hooks/immutability -- Three.js scenes are intentionally animated through mutable refs and uniforms. */
"use client";

import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import { HumanDiscoveryManager } from "./HumanDiscoveryManager";
import type { GlobeControls, GlobeHover, GlobeHuman } from "./types";

const WORLD_RADIUS = 1;
const WORLD_SCALE = 1.5;
const WORLD_POSITION = new THREE.Vector3(0.118, -0.25, 0);
const EARTH_ROTATION_SECONDS = 240;
const EASTWARD_ROTATION_SPEED = Math.PI * 2 / EARTH_ROTATION_SECONDS;
const PAPER = new THREE.Color("#F2EBDD");
const LAPIS = new THREE.Color("#3046A5");

function latLngVector(lat: number, lng: number, radius = WORLD_RADIUS) {
  const latitude = THREE.MathUtils.degToRad(lat);
  const longitude = THREE.MathUtils.degToRad(lng);
  const latitudeRadius = Math.cos(latitude) * radius;
  return new THREE.Vector3(
    latitudeRadius * Math.cos(longitude),
    Math.sin(latitude) * radius,
    -latitudeRadius * Math.sin(longitude),
  );
}

function nearestAngle(current: number, target: number) {
  return current + Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

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
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    dayTexture.anisotropy = 8;
    nightTexture.anisotropy = 8;
    dayTexture.needsUpdate = true;
    nightTexture.needsUpdate = true;
  }, [dayTexture, nightTexture]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uDay: { value: dayTexture },
      uNight: { value: nightTexture },
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
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      float hhLuminance(vec3 color) {
        return dot(color, vec3(0.2126, 0.7152, 0.0722));
      }

      void main() {
        vec3 day = texture2D(uDay, vUv).rgb;
        vec3 night = texture2D(uNight, vUv).rgb;
        float dayLuma = hhLuminance(day);
        float nightLuma = hhLuminance(night);

        float oceanSignal = smoothstep(0.04, 0.22, day.b - max(day.r, day.g) * 0.68);
        float landSignal = clamp(dayLuma * 1.35 - oceanSignal * 0.24, 0.0, 1.0);
        vec3 mutedDay = vec3(dayLuma) * vec3(0.11, 0.13, 0.18) + day * 0.025;
        vec3 ocean = vec3(0.006, 0.012, 0.025);
        vec3 land = vec3(0.026, 0.032, 0.046) + mutedDay;
        vec3 surface = mix(ocean, land, smoothstep(0.055, 0.28, landSignal));

        vec3 keyDirection = normalize(vec3(-0.42, 0.58, 0.70));
        float key = max(dot(vNormalWorld, keyDirection), 0.0);
        float grazing = pow(1.0 - max(dot(vNormalView, vViewDirection), 0.0), 2.7);
        surface *= 0.54 + key * 0.72;
        surface += mutedDay * key * 0.16;
        surface += night * 0.025;
        surface += vec3(0.018, 0.030, 0.062) * grazing * 0.68;

        // A high threshold deliberately keeps only the brightest NASA night-light
        // data so geography remains quiet and Human markers remain primary.
        float city = pow(clamp(nightLuma * 1.12, 0.0, 1.0), 4.45);
        vec3 cityWarmth = vec3(1.0, 0.80, 0.55) * city * 0.96;
        vec3 color = surface + cityWarmth;

        float limbShadow = smoothstep(-0.22, 0.42, dot(vNormalWorld, keyDirection));
        color *= mix(0.74, 1.0, limbShadow);
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

function Atmosphere() {
  const material = useMemo(() => new THREE.ShaderMaterial({
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
      varying vec3 vNormalView;
      varying vec3 vViewDirection;
      varying vec3 vNormalWorld;
      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormalView, vViewDirection)), 5.4);
        float directional = smoothstep(-0.25, 0.82, dot(vNormalWorld, normalize(vec3(0.42, 0.66, 0.62))));
        vec3 lapis = vec3(0.188, 0.275, 0.647);
        vec3 opticalBlue = vec3(0.32, 0.49, 0.92);
        vec3 color = mix(lapis, opticalBlue, directional * 0.55);
        gl_FragColor = vec4(color, fresnel * (0.03 + directional * 0.32));
      }
    `,
  }), []);

  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh scale={1.018}>
      <sphereGeometry args={[WORLD_RADIUS, 160, 112]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function HumanOrbs({
  humans,
  selectedIndex,
  controls,
  worldRef,
  reducedMotion,
  onHover,
  onSelect,
  onActiveChange,
}: {
  humans: GlobeHuman[];
  selectedIndex: number | null;
  controls: MutableRefObject<GlobeControls>;
  worldRef: RefObject<THREE.Group | null>;
  reducedMotion: boolean;
  onHover: (hover: GlobeHover) => void;
  onSelect: (index: number) => void;
  onActiveChange: (indices: number[]) => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const hoveredRef = useRef(-1);
  const hoveredPositionRef = useRef({ x: 0, y: 0 });
  const hoverTargetRef = useRef(false);
  const activeKeyRef = useRef("");
  const center = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const worldQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const surfaceDirection = useMemo(() => new THREE.Vector3(), []);
  const { camera, gl, size } = useThree();
  const mobile = size.width <= 760;
  const poolSize = mobile ? 10 : 18;
  const candidatePositions = useMemo(
    () => humans.map(human => latLngVector(human.lat, human.lng, 1.017)),
    [humans],
  );
  const discovery = useMemo(() => new HumanDiscoveryManager(candidatePositions, {
    poolSize,
    visibleBudget: mobile ? 6 : 10,
    initialBudget: mobile ? 3 : 4,
    recentlySeenLimit: Math.min(80, Math.max(30, Math.ceil(humans.length * 0.65))),
    timingScale: mobile ? 1.2 : 1,
    seed: humans.reduce((seed, human) => {
      for (let index = 0; index < human.id.length; index += 1) seed = Math.imul(seed ^ human.id.charCodeAt(index), 16777619);
      return seed >>> 0;
    }, 2166136261),
  }), [candidatePositions, humans, mobile, poolSize]);
  const geometry = useMemo(() => {
    const positions = new Float32Array(poolSize * 3).fill(100);
    const phases = new Float32Array(poolSize);
    const indices = new Float32Array(poolSize).fill(-1);
    const coreOpacity = new Float32Array(poolSize);
    const haloOpacity = new Float32Array(poolSize);
    const scales = new Float32Array(poolSize).fill(0.65);
    const intensities = new Float32Array(poolSize).fill(1);
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    result.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    result.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));
    result.setAttribute("aCoreOpacity", new THREE.BufferAttribute(coreOpacity, 1));
    result.setAttribute("aHaloOpacity", new THREE.BufferAttribute(haloOpacity, 1));
    result.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    result.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));
    return result;
  }, [poolSize]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSelected: { value: -1 },
    uHovered: { value: -1 },
    uHoverStrength: { value: 0 },
    uPixelRatio: { value: 1 },
    uMotion: { value: 1 },
  }), []);

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.8);
  }, [gl, uniforms]);
  useEffect(() => { uniforms.uSelected.value = selectedIndex ?? -1; }, [selectedIndex, uniforms]);
  useEffect(() => { uniforms.uMotion.value = reducedMotion ? 0 : 1; }, [reducedMotion, uniforms]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    activeKeyRef.current = "";
    onActiveChange([]);
  }, [discovery, onActiveChange]);

  useFrame(({ clock }, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    const strength = materialRef.current.uniforms.uHoverStrength;
    strength.value = THREE.MathUtils.damp(strength.value, hoverTargetRef.current ? 1 : 0, 4.5, delta);
    if (!hoverTargetRef.current && strength.value < 0.01) uniforms.uHovered.value = -1;

    const world = worldRef.current;
    if (!world) return;
    world.getWorldPosition(center);
    world.getWorldQuaternion(worldQuaternion);
    cameraDirection.copy(camera.position).sub(center).normalize();
    const membershipChanged = discovery.update({
      now: clock.elapsedTime,
      selectedIndex,
      hoveredIndex: hoveredRef.current >= 0 ? hoveredRef.current : null,
      activelyExploring: controls.current.dragging || performance.now() - controls.current.lastInteraction < 1700,
      reducedMotion,
      visibilityFor: candidateIndex => surfaceDirection
        .copy(candidatePositions[candidateIndex])
        .normalize()
        .applyQuaternion(worldQuaternion)
        .dot(cameraDirection),
    });

    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const phase = geometry.getAttribute("aPhase") as THREE.BufferAttribute;
    const index = geometry.getAttribute("aIndex") as THREE.BufferAttribute;
    const coreOpacity = geometry.getAttribute("aCoreOpacity") as THREE.BufferAttribute;
    const haloOpacity = geometry.getAttribute("aHaloOpacity") as THREE.BufferAttribute;
    const scale = geometry.getAttribute("aScale") as THREE.BufferAttribute;
    const intensity = geometry.getAttribute("aIntensity") as THREE.BufferAttribute;
    discovery.slots.forEach((slot, slotIndex) => {
      position.setXYZ(slotIndex, slot.position.x, slot.position.y, slot.position.z);
      phase.setX(slotIndex, slot.phase);
      index.setX(slotIndex, slot.candidateIndex);
      coreOpacity.setX(slotIndex, slot.coreOpacity);
      haloOpacity.setX(slotIndex, slot.haloOpacity);
      scale.setX(slotIndex, slot.scale);
      intensity.setX(slotIndex, slot.intensity);
    });
    position.needsUpdate = true;
    phase.needsUpdate = true;
    index.needsUpdate = true;
    coreOpacity.needsUpdate = true;
    haloOpacity.needsUpdate = true;
    scale.needsUpdate = true;
    intensity.needsUpdate = true;

    if (membershipChanged) {
      const active = discovery.activeCandidateIndices();
      const activeKey = active.slice().sort((first, second) => first - second).join(",");
      if (activeKey !== activeKeyRef.current) {
        activeKeyRef.current = activeKey;
        onActiveChange(active);
      }
    }
  });

  const hover = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const slotIndex = event.index ?? -1;
    const index = discovery.candidateForSlot(slotIndex) ?? -1;
    if (index < 0 || index === hoveredRef.current) return;
    if (
      hoveredRef.current >= 0
      && Math.hypot(event.nativeEvent.clientX - hoveredPositionRef.current.x, event.nativeEvent.clientY - hoveredPositionRef.current.y) < 18
    ) return;
    hoveredRef.current = index;
    hoveredPositionRef.current = { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY };
    hoverTargetRef.current = true;
    uniforms.uHovered.value = index;
    onHover({ index, x: event.nativeEvent.clientX, y: event.nativeEvent.clientY });
    document.body.style.cursor = "pointer";
  };

  const clearHover = () => {
    hoveredRef.current = -1;
    hoverTargetRef.current = false;
    onHover(null);
    document.body.style.cursor = "";
  };

  return (
    <points
      geometry={geometry}
      ref={pointsRef}
      frustumCulled={false}
      onPointerMove={hover}
      onPointerOut={clearHover}
      onClick={event => {
        event.stopPropagation();
        if (event.index === undefined) return;
        const candidateIndex = discovery.candidateForSlot(event.index);
        if (candidateIndex !== null) onSelect(candidateIndex);
      }}
    >
      <shaderMaterial
        ref={materialRef}
        transparent
        depthTest
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          attribute float aPhase;
          attribute float aIndex;
          attribute float aCoreOpacity;
          attribute float aHaloOpacity;
          attribute float aScale;
          attribute float aIntensity;
          uniform float uTime;
          uniform float uSelected;
          uniform float uHovered;
          uniform float uHoverStrength;
          uniform float uPixelRatio;
          uniform float uMotion;
          varying float vActive;
          varying float vCoreOpacity;
          varying float vHaloOpacity;
          varying float vIntensity;
          varying float vLimb;
          void main() {
            float selected = step(abs(aIndex - uSelected), 0.1);
            float hovered = step(abs(aIndex - uHovered), 0.1) * uHoverStrength;
            vActive = max(selected, hovered);
            float pulse = 1.0 + sin(uTime * 1.18 + aPhase) * 0.045 * uMotion;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            float baseSize = mix(10.4, 14.4, vActive);
            gl_PointSize = baseSize * aScale * pulse * uPixelRatio * (2.75 / max(1.0, -mvPosition.z));
            vec3 viewNormal = normalize(normalMatrix * normalize(position));
            vec3 viewDirection = normalize(-mvPosition.xyz);
            vLimb = smoothstep(-0.01, 0.20, dot(viewNormal, viewDirection));
            float selectionQuiet = mix(0.84, 1.0, max(selected, 1.0 - step(0.0, uSelected)));
            vCoreOpacity = aCoreOpacity * selectionQuiet;
            vHaloOpacity = aHaloOpacity * selectionQuiet;
            vIntensity = aIntensity;
          }
        `}
        fragmentShader={`
          varying float vActive;
          varying float vCoreOpacity;
          varying float vHaloOpacity;
          varying float vIntensity;
          varying float vLimb;
          void main() {
            float radius = length(gl_PointCoord - 0.5) * 2.0;
            float core = 1.0 - smoothstep(0.0, 0.16, radius);
            float inner = (1.0 - smoothstep(0.08, 0.40, radius)) * 0.86;
            float halo = pow(max(0.0, 1.0 - radius), 3.4) * 0.62;
            vec3 paper = vec3(0.949, 0.922, 0.867);
            vec3 lapis = vec3(0.188, 0.275, 0.647);
            vec3 idleColor = mix(paper, vec3(1.0), core * 0.82);
            vec3 selectedColor = mix(lapis, vec3(0.50, 0.60, 1.0), core * 0.34);
            vec3 coreColor = mix(idleColor, selectedColor, vActive);
            vec3 color = mix(coreColor, lapis, smoothstep(0.25, 0.92, radius) * mix(0.44, 0.12, vActive));
            float alpha = (core + inner) * vCoreOpacity + halo * vHaloOpacity * mix(0.58, 1.0, vActive);
            alpha *= vLimb * vIntensity;
            if (alpha < 0.012) discard;
            gl_FragColor = vec4(color, min(alpha, 1.0));
          }
        `}
      />
    </points>
  );
}

function SelectedTarget({ human }: { human: GlobeHuman }) {
  const transform = useMemo(() => {
    const position = latLngVector(human.lat, human.lng, 1.021);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      position.clone().normalize(),
    );
    return { position, quaternion };
  }, [human]);

  return (
    <group position={transform.position} quaternion={transform.quaternion}>
      <mesh>
        <ringGeometry args={[0.008, 0.009, 64]} />
        <meshBasicMaterial color={LAPIS} transparent opacity={0.66} depthWrite={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.0135, 0.0145, 64]} />
        <meshBasicMaterial color={PAPER} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.0032, 32]} />
        <meshBasicMaterial color={LAPIS} depthWrite={false} />
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
    const first = new THREE.Line(geometry, firstMaterial);
    const second = new THREE.Line(geometry, secondMaterial);
    first.rotation.set(0.48, 0.32, -0.18);
    second.rotation.set(-0.54, 0.18, 0.48);
    second.scale.setScalar(1.055);
    return { first, second, firstMaterial, secondMaterial };
  }, [geometry]);
  useEffect(() => () => {
    geometry.dispose();
    lines.firstMaterial.dispose();
    lines.secondMaterial.dispose();
  }, [geometry, lines]);

  return (
    <group position={WORLD_POSITION.toArray()} scale={WORLD_SCALE}>
      <primitive object={lines.first} />
      <primitive object={lines.second} />
    </group>
  );
}

export function GlobeScene({
  humans,
  selectedIndex,
  controls,
  reducedMotion,
  lineRef,
  previewRef,
  onHover,
  onSelect,
  onActiveChange,
  onReady,
}: {
  humans: GlobeHuman[];
  selectedIndex: number | null;
  controls: MutableRefObject<GlobeControls>;
  reducedMotion: boolean;
  lineRef: RefObject<SVGLineElement | null>;
  previewRef: RefObject<HTMLElement | null>;
  onHover: (hover: GlobeHover) => void;
  onSelect: (index: number) => void;
  onActiveChange: (indices: number[]) => void;
  onReady: () => void;
}) {
  const worldRef = useRef<THREE.Group>(null);
  const selectedPoint = useMemo(() => new THREE.Vector3(), []);
  const projectedPoint = useMemo(() => new THREE.Vector3(), []);
  const worldCenter = useMemo(() => new THREE.Vector3(), []);
  const surfaceDirection = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const { camera, gl, size } = useThree();

  useEffect(() => {
    gl.setClearColor("#05070B", 1);
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
    onReady();
  }, [gl, onReady]);

  useEffect(() => {
    if (selectedIndex === null || !humans[selectedIndex]) return;
    const human = humans[selectedIndex];
    const current = worldRef.current?.rotation.y ?? controls.current.targetY;
    const faceLongitude = -THREE.MathUtils.degToRad(human.lng + 90) - 0.03;
    controls.current.targetY = nearestAngle(current, faceLongitude);
    controls.current.targetX = THREE.MathUtils.clamp(0.425 - THREE.MathUtils.degToRad(human.lat) * 0.05, -0.52, 0.52);
    controls.current.lastInteraction = performance.now();
  }, [controls, humans, selectedIndex]);

  useFrame((_, delta) => {
    const world = worldRef.current;
    if (!world) return;

    if (!reducedMotion && selectedIndex === null && !controls.current.dragging && performance.now() - controls.current.lastInteraction > 2800) {
      // Positive Y advances longitude eastward: Earth's west-to-east rotation.
      controls.current.targetY += delta * EASTWARD_ROTATION_SPEED;
    }
    world.rotation.x = THREE.MathUtils.damp(world.rotation.x, controls.current.targetX, 4.1, delta);
    world.rotation.y = THREE.MathUtils.damp(world.rotation.y, controls.current.targetY, 4.1, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, controls.current.distance, 4.4, delta);
    camera.lookAt(0, 0, 0);

    if (selectedIndex !== null && humans[selectedIndex] && lineRef.current && previewRef.current) {
      selectedPoint.copy(latLngVector(humans[selectedIndex].lat, humans[selectedIndex].lng, 1.025));
      world.localToWorld(selectedPoint);
      projectedPoint.copy(selectedPoint).project(camera);
      const markerX = (projectedPoint.x * 0.5 + 0.5) * size.width;
      const markerY = (-projectedPoint.y * 0.5 + 0.5) * size.height;
      const previewBounds = previewRef.current.getBoundingClientRect();
      world.getWorldPosition(worldCenter);
      surfaceDirection.copy(selectedPoint).sub(worldCenter).normalize();
      cameraDirection.copy(camera.position).sub(worldCenter).normalize();
      const markerIsVisible = surfaceDirection.dot(cameraDirection) > 0.08
        && markerX > -20 && markerX < size.width + 20
        && markerY > -20 && markerY < size.height + 20;
      lineRef.current.setAttribute("opacity", markerIsVisible ? "1" : "0");
      lineRef.current.setAttribute("x1", markerX.toFixed(1));
      lineRef.current.setAttribute("y1", markerY.toFixed(1));
      lineRef.current.setAttribute("x2", previewBounds.left.toFixed(1));
      lineRef.current.setAttribute("y2", (previewBounds.top + 28).toFixed(1));
    }
  });

  const selected = selectedIndex === null ? null : humans[selectedIndex];

  return (
    <>
      <SpaceField />
      <OrbitLines />
      <group ref={worldRef} position={WORLD_POSITION.toArray()} scale={WORLD_SCALE} rotation={[0.47, -0.085, -0.025]}>
        <EarthSurface />
        <HumanOrbs
          humans={humans}
          selectedIndex={selectedIndex}
          controls={controls}
          worldRef={worldRef}
          reducedMotion={reducedMotion}
          onHover={onHover}
          onSelect={onSelect}
          onActiveChange={onActiveChange}
        />
        {selected && <SelectedTarget human={selected} />}
        <Atmosphere />
      </group>
    </>
  );
}
