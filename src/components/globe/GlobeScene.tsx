/* eslint-disable react-hooks/immutability -- Three.js scenes are intentionally animated through mutable refs and uniforms. */
"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import { HumanBeaconHitTargets } from "./HumanBeaconHitTargets";
import { HumanBeaconShafts } from "./HumanBeaconShafts";
import { HumanDiscoveryManager } from "./HumanDiscoveryManager";
import type { GlobeControls, GlobeHover, GlobeHuman } from "./types";

const WORLD_RADIUS = 1;
const WORLD_SCALE = 1.5;
const WORLD_POSITION = new THREE.Vector3(0.118, -0.25, 0);
const EARTH_ROTATION_SECONDS = 240;
const EASTWARD_ROTATION_SPEED = Math.PI * 2 / EARTH_ROTATION_SECONDS;
const PAPER = new THREE.Color("#F2EBDD");
const LAPIS = new THREE.Color("#3046A5");
const BEACON_BLUE = new THREE.Color("#315DFF");
const UNIT_Z = new THREE.Vector3(0, 0, 1);
const GLOBE_DEBUG = process.env.NEXT_PUBLIC_GLOBE_DEBUG === "true";

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

function HumanBeaconSystem({
  humans,
  selectedHumanId,
  hoveredHumanId,
  controls,
  worldRef,
  reducedMotion,
  onHover,
  onSelect,
  onActiveChange,
}: {
  humans: GlobeHuman[];
  selectedHumanId: string | null;
  hoveredHumanId: string | null;
  controls: MutableRefObject<GlobeControls>;
  worldRef: RefObject<THREE.Group | null>;
  reducedMotion: boolean;
  onHover: (hover: GlobeHover) => void;
  onSelect: (humanId: string) => void;
  onActiveChange: (humanIds: string[]) => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const contactRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const activeKeyRef = useRef("");
  const center = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const worldQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const surfaceDirection = useMemo(() => new THREE.Vector3(), []);
  const contactNormal = useMemo(() => new THREE.Vector3(), []);
  const contactPosition = useMemo(() => new THREE.Vector3(), []);
  const contactScale = useMemo(() => new THREE.Vector3(), []);
  const contactQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const contactMatrix = useMemo(() => new THREE.Matrix4(), []);
  const contactColor = useMemo(() => new THREE.Color(), []);
  const { camera, gl, size } = useThree();
  const mobile = size.width <= 760;
  const poolSize = mobile ? 10 : 18;
  const [activeHumanIds, setActiveHumanIds] = useState<string[]>([]);
  const indexByHumanId = useMemo(
    () => new Map(humans.map((human, index) => [human.id, index] as const)),
    [humans],
  );
  const selectedIndex = selectedHumanId === null ? null : indexByHumanId.get(selectedHumanId) ?? null;
  const hoveredIndex = hoveredHumanId === null ? null : indexByHumanId.get(hoveredHumanId) ?? null;
  const candidatePositions = useMemo(
    () => humans.map(human => latLngVector(human.lat, human.lng, 1.0085)),
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
    const innerOpacity = new Float32Array(poolSize);
    const haloOpacity = new Float32Array(poolSize);
    const scales = new Float32Array(poolSize).fill(0.65);
    const intensities = new Float32Array(poolSize).fill(1);
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    result.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    result.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));
    result.setAttribute("aCoreOpacity", new THREE.BufferAttribute(coreOpacity, 1));
    result.setAttribute("aInnerOpacity", new THREE.BufferAttribute(innerOpacity, 1));
    result.setAttribute("aHaloOpacity", new THREE.BufferAttribute(haloOpacity, 1));
    result.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    result.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));
    return result;
  }, [poolSize]);
  const contactGeometry = useMemo(() => new THREE.CircleGeometry(1, 40), []);
  const contactMaterial = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    toneMapped: false,
    vertexShader: `
      varying vec2 vContactUv;
      varying vec3 vContactColor;
      void main() {
        vContactUv = uv;
        #ifdef USE_INSTANCING_COLOR
          vContactColor = instanceColor;
        #else
          vContactColor = vec3(0.0);
        #endif
        vec4 instancePosition = instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * instancePosition;
      }
    `,
    fragmentShader: `
      varying vec2 vContactUv;
      varying vec3 vContactColor;
      void main() {
        float radius = length(vContactUv - 0.5) * 2.0;
        float contact = exp(-pow(radius / 0.58, 2.0))
          * (1.0 - smoothstep(0.56, 1.0, radius));
        float alpha = contact * 0.52;
        if (alpha < 0.006) discard;
        gl_FragColor = vec4(vContactColor, alpha);
      }
    `,
  }), []);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSelected: { value: -1 },
    uHovered: { value: -1 },
    uHoverStrength: { value: 0 },
    uPixelRatio: { value: 1 },
    uMotion: { value: 1 },
    uMobile: { value: mobile ? 1 : 0 },
  }), [mobile]);

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.8);
  }, [gl, uniforms]);
  useEffect(() => { uniforms.uSelected.value = selectedIndex ?? -1; }, [selectedIndex, uniforms]);
  useEffect(() => {
    uniforms.uHovered.value = hoveredIndex ?? -1;
    uniforms.uHoverStrength.value = hoveredIndex === null ? 0 : 1;
  }, [hoveredIndex, uniforms]);
  useEffect(() => { uniforms.uMotion.value = reducedMotion ? 0 : 1; }, [reducedMotion, uniforms]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => {
    contactGeometry.dispose();
    contactMaterial.dispose();
  }, [contactGeometry, contactMaterial]);
  useEffect(() => {
    if (contactRef.current) contactRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, []);
  useEffect(() => {
    activeKeyRef.current = "";
    onActiveChange([]);
  }, [discovery, onActiveChange]);
  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;

    const world = worldRef.current;
    if (!world) return;
    world.getWorldPosition(center);
    world.getWorldQuaternion(worldQuaternion);
    cameraDirection.copy(camera.position).sub(center).normalize();
    const membershipChanged = discovery.update({
      now: clock.elapsedTime,
      selectedIndex,
      hoveredIndex,
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
    const innerOpacity = geometry.getAttribute("aInnerOpacity") as THREE.BufferAttribute;
    const haloOpacity = geometry.getAttribute("aHaloOpacity") as THREE.BufferAttribute;
    const scale = geometry.getAttribute("aScale") as THREE.BufferAttribute;
    const intensity = geometry.getAttribute("aIntensity") as THREE.BufferAttribute;
    discovery.slots.forEach((slot, slotIndex) => {
      position.setXYZ(slotIndex, slot.position.x, slot.position.y, slot.position.z);
      phase.setX(slotIndex, slot.phase);
      index.setX(slotIndex, slot.candidateIndex);
      coreOpacity.setX(slotIndex, slot.coreOpacity);
      innerOpacity.setX(slotIndex, slot.innerOpacity);
      haloOpacity.setX(slotIndex, slot.haloOpacity);
      scale.setX(slotIndex, slot.scale);
      intensity.setX(slotIndex, slot.intensity);

      const contact = contactRef.current;
      if (contact) {
        if (slot.candidateIndex < 0 || slot.contactOpacity <= 0.001) {
          contactPosition.set(100, 100, 100);
          contactQuaternion.identity();
          contactScale.setScalar(0.0001);
          contactColor.setRGB(0, 0, 0);
        } else {
          contactNormal.copy(slot.position).normalize();
          contactPosition.copy(contactNormal).multiplyScalar(1.0012);
          contactQuaternion.setFromUnitVectors(UNIT_Z, contactNormal);
          const facing = surfaceDirection.copy(contactNormal).applyQuaternion(worldQuaternion).dot(cameraDirection);
          const limb = THREE.MathUtils.smoothstep(facing, 0.055, 0.3);
          const selectedContact = slot.candidateIndex === selectedIndex;
          contactScale.setScalar(0.0225 * slot.scale * (selectedContact ? 1.2 : 1));
          contactColor
            .copy(selectedContact ? BEACON_BLUE : LAPIS)
            .multiplyScalar(slot.contactOpacity * limb * (selectedContact ? 0.64 : 0.43));
        }
        contactMatrix.compose(contactPosition, contactQuaternion, contactScale);
        contact.setMatrixAt(slotIndex, contactMatrix);
        contact.setColorAt(slotIndex, contactColor);
      }
    });
    position.needsUpdate = true;
    phase.needsUpdate = true;
    index.needsUpdate = true;
    coreOpacity.needsUpdate = true;
    innerOpacity.needsUpdate = true;
    haloOpacity.needsUpdate = true;
    scale.needsUpdate = true;
    intensity.needsUpdate = true;
    if (contactRef.current) {
      contactRef.current.instanceMatrix.needsUpdate = true;
      if (contactRef.current.instanceColor) contactRef.current.instanceColor.needsUpdate = true;
    }
    const active = discovery.slots
      .filter(slot => slot.state !== "inactive" && slot.coreOpacity >= 0.34 && slot.candidateIndex >= 0)
      .map(slot => humans[slot.candidateIndex]?.id)
      .filter((humanId): humanId is string => Boolean(humanId));
    const activeKey = active.slice().sort().join(",");
    if (membershipChanged || activeKey !== activeKeyRef.current) {
      if (activeKey !== activeKeyRef.current) {
        activeKeyRef.current = activeKey;
        setActiveHumanIds(active);
        onActiveChange(active);
      }
    }
  });

  const activeHumans = activeHumanIds
    .map(humanId => humans[indexByHumanId.get(humanId) ?? -1])
    .filter((human): human is GlobeHuman => Boolean(human));

  return (
    <group>
      <instancedMesh
        ref={contactRef}
        args={[contactGeometry, contactMaterial, poolSize]}
        frustumCulled={false}
        renderOrder={1}
      />
      <points
        geometry={geometry}
        ref={pointsRef}
        frustumCulled={false}
        raycast={() => undefined}
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
          attribute float aInnerOpacity;
          attribute float aHaloOpacity;
          attribute float aScale;
          attribute float aIntensity;
          uniform float uTime;
          uniform float uSelected;
          uniform float uHovered;
          uniform float uHoverStrength;
          uniform float uPixelRatio;
          uniform float uMotion;
          uniform float uMobile;
          varying float vActive;
          varying float vCoreOpacity;
          varying float vInnerOpacity;
          varying float vHaloOpacity;
          varying float vIntensity;
          varying float vFacing;
          varying float vBreath;
          varying float vSelected;
          varying float vHovered;
          varying float vGlint;
          void main() {
            float selected = step(abs(aIndex - uSelected), 0.1);
            float hovered = step(abs(aIndex - uHovered), 0.1) * uHoverStrength;
            vActive = max(selected, hovered);
            float breatheWave = sin(uTime * 0.82 + aPhase);
            float breatheScale = 1.0 + breatheWave * 0.018 * uMotion;
            float naturalSize = 0.94 + fract(sin(aPhase * 12.9898) * 43758.5453) * 0.12;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            float baseSize = mix(50.0, 44.0, uMobile) * naturalSize;
            float interactionScale = 1.0 + selected * 0.20 + hovered * 0.065;
            float projectedSize = baseSize * interactionScale * aScale * breatheScale
              * uPixelRatio * (2.75 / max(1.0, -mvPosition.z));
            gl_PointSize = clamp(projectedSize, 18.0 * uPixelRatio, 66.0 * uPixelRatio);
            vec3 viewNormal = normalize(normalMatrix * normalize(position));
            vec3 viewDirection = normalize(-mvPosition.xyz);
            vFacing = dot(viewNormal, viewDirection);
            float selectionQuiet = mix(0.84, 1.0, max(selected, 1.0 - step(0.0, uSelected)));
            vCoreOpacity = aCoreOpacity * selectionQuiet;
            vInnerOpacity = aInnerOpacity * selectionQuiet;
            vHaloOpacity = aHaloOpacity * selectionQuiet;
            vIntensity = aIntensity;
            vBreath = mix(0.92, 1.0, 0.5 + breatheWave * 0.5 * uMotion);
            vSelected = selected;
            vHovered = hovered;
            float glintBreath = 0.82 + sin(uTime * 0.58 + aPhase * 2.7) * 0.08 * uMotion;
            vGlint = glintBreath * aInnerOpacity;
          }
        `}
        fragmentShader={`
          varying float vActive;
          varying float vCoreOpacity;
          varying float vInnerOpacity;
          varying float vHaloOpacity;
          varying float vIntensity;
          varying float vFacing;
          varying float vBreath;
          varying float vSelected;
          varying float vHovered;
          varying float vGlint;
          uniform float uMobile;
          void main() {
            vec2 point = (gl_PointCoord - 0.5) * 2.0;
            float radius = length(point);
            float pinpoint = 1.0 - smoothstep(0.105, 0.17, radius);
            float hotCenter = 1.0 - smoothstep(0.0, 0.072, radius);
            float innerBloom = exp(-pow(radius / 0.205, 2.0));
            float outerAura = exp(-pow(radius / 0.52, 2.0))
              * (1.0 - smoothstep(0.74, 1.0, radius))
              * mix(1.0, 0.78, uMobile);
            float horizontalGlint = exp(-pow(abs(gl_PointCoord.y - 0.5) / 0.010, 2.0))
              * exp(-pow(radius / 0.62, 2.0));
            float verticalGlint = exp(-pow(abs(gl_PointCoord.x - 0.5) / 0.012, 2.0))
              * exp(-pow(radius / 0.46, 2.0)) * 0.64;
            vec2 diagonalA = vec2(point.x + point.y, point.x - point.y);
            float diagonalGlint = (
              exp(-pow(abs(diagonalA.x) / 0.022, 2.0))
              + exp(-pow(abs(diagonalA.y) / 0.022, 2.0))
            ) * exp(-pow(radius / 0.36, 2.0)) * 0.16;

            float coreLimb = smoothstep(-0.045, 0.065, vFacing);
            float innerLimb = smoothstep(0.005, 0.145, vFacing);
            float auraLimb = smoothstep(0.075, 0.29, vFacing);
            float attention = 1.0 + vHovered * 0.13 + vSelected * 0.17;

            vec3 paper = vec3(0.949, 0.922, 0.867);
            vec3 lapis = vec3(0.188, 0.275, 0.647);
            vec3 beaconBlue = vec3(0.302, 0.451, 1.0);
            vec3 hotBlue = vec3(0.70, 0.79, 1.0);
            vec3 coreColor = mix(paper, hotBlue, clamp(vSelected * 0.12 + vHovered * 0.05, 0.0, 0.14));
            vec3 innerColor = mix(lapis, beaconBlue, clamp(0.62 + vSelected * 0.24 + vHovered * 0.08, 0.0, 1.0));
            vec3 auraColor = mix(lapis, beaconBlue, clamp(0.40 + vSelected * 0.43 + vHovered * 0.12, 0.0, 1.0));

            vec3 light = coreColor * pinpoint * vCoreOpacity * coreLimb * (1.78 + hotCenter * 0.92)
              + innerColor * innerBloom * vInnerOpacity * innerLimb * mix(0.82, 1.02, vSelected)
              + auraColor * outerAura * vHaloOpacity * auraLimb * vBreath * mix(0.28, 0.46, vSelected)
              + mix(paper, hotBlue, 0.78) * (horizontalGlint + verticalGlint + diagonalGlint) * vGlint * coreLimb * 0.72;
            light *= vIntensity * attention;
            float alpha = max(max(light.r, light.g), light.b);
            if (alpha < 0.008) discard;
            gl_FragColor = vec4(light / max(alpha, 0.001), min(alpha, 1.0));
          }
        `}
        toneMapped={false}
      />
      </points>
      <HumanBeaconShafts
        slots={discovery.slots}
        selectedIndex={selectedIndex}
        hoveredIndex={hoveredIndex}
        worldRef={worldRef}
        reducedMotion={reducedMotion}
      />
      <HumanBeaconHitTargets
        humans={activeHumans}
        positionFor={human => candidatePositions[indexByHumanId.get(human.id) ?? 0]}
        onHover={onHover}
        onHoverEnd={() => onHover(null)}
        onSelect={onSelect}
        debug={GLOBE_DEBUG}
      />
    </group>
  );
}

function SelectedTarget({ human }: { human: GlobeHuman }) {
  const transform = useMemo(() => {
    const position = latLngVector(human.lat, human.lng, 1.0105);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      position.clone().normalize(),
    );
    return { position, quaternion };
  }, [human]);
  const ticks = useMemo(() => {
    const radius = 0.0165;
    const length = 0.0033;
    const positions = new Float32Array([
      -radius - length, 0, 0, -radius, 0, 0,
      radius, 0, 0, radius + length, 0, 0,
      0, -radius - length, 0, 0, -radius, 0,
      0, radius, 0, 0, radius + length, 0,
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);
  useEffect(() => () => ticks.dispose(), [ticks]);

  return (
    <group position={transform.position} quaternion={transform.quaternion}>
      <mesh>
        <ringGeometry args={[0.0162, 0.01665, 96]} />
        <meshBasicMaterial color={BEACON_BLUE} transparent opacity={0.34} depthTest depthWrite={false} toneMapped={false} />
      </mesh>
      <lineSegments geometry={ticks}>
        <lineBasicMaterial color={PAPER} transparent opacity={0.28} depthTest depthWrite={false} toneMapped={false} />
      </lineSegments>
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
  lineRef,
  previewRef,
  calloutAnchorRef,
  onHover,
  onSelect,
  onActiveChange,
  onSelectedHidden,
  onReady,
}: {
  humans: GlobeHuman[];
  selectedHumanId: string | null;
  hoveredHumanId: string | null;
  controls: MutableRefObject<GlobeControls>;
  reducedMotion: boolean;
  lineRef: RefObject<SVGPathElement | null>;
  previewRef: RefObject<HTMLElement | null>;
  calloutAnchorRef: RefObject<HTMLDivElement | null>;
  onHover: (hover: GlobeHover) => void;
  onSelect: (humanId: string) => void;
  onActiveChange: (humanIds: string[]) => void;
  onSelectedHidden: (humanId: string) => void;
  onReady: () => void;
}) {
  const worldRef = useRef<THREE.Group>(null);
  const selectedPoint = useMemo(() => new THREE.Vector3(), []);
  const projectedPoint = useMemo(() => new THREE.Vector3(), []);
  const worldCenter = useMemo(() => new THREE.Vector3(), []);
  const surfaceDirection = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const hiddenSelectionRef = useRef<string | null>(null);
  const { camera, gl, size } = useThree();
  const selected = selectedHumanId === null
    ? null
    : humans.find(human => human.id === selectedHumanId) ?? null;

  useEffect(() => {
    gl.setClearColor("#05070B", 1);
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
    onReady();
  }, [gl, onReady]);

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

    if (selected && lineRef.current && previewRef.current && calloutAnchorRef.current) {
      selectedPoint.copy(latLngVector(selected.lat, selected.lng, 1.0085));
      world.localToWorld(selectedPoint);
      projectedPoint.copy(selectedPoint).project(camera);
      const markerX = (projectedPoint.x * 0.5 + 0.5) * size.width;
      const markerY = (-projectedPoint.y * 0.5 + 0.5) * size.height;
      world.getWorldPosition(worldCenter);
      surfaceDirection.copy(selectedPoint).sub(worldCenter).normalize();
      cameraDirection.copy(camera.position).sub(worldCenter).normalize();
      const markerIsVisible = surfaceDirection.dot(cameraDirection) > 0.08
        && markerX > -20 && markerX < size.width + 20
        && markerY > -20 && markerY < size.height + 20;
      const preview = previewRef.current;
      const anchor = calloutAnchorRef.current;
      const connector = lineRef.current;

      if (!markerIsVisible) {
        connector.setAttribute("opacity", "0");
        if (hiddenSelectionRef.current !== selected.id) {
          hiddenSelectionRef.current = selected.id;
          onSelectedHidden(selected.id);
        }
        return;
      }
      hiddenSelectionRef.current = null;

      if (size.width > 760) {
        const panelWidth = preview.offsetWidth || 310;
        const panelHeight = preview.offsetHeight || 244;
        const placeLeft = markerX > size.width * 0.58;
        const panelX = THREE.MathUtils.clamp(
          placeLeft ? markerX - panelWidth - 142 : markerX + 142,
          34,
          size.width - panelWidth - 34,
        );
        const panelY = THREE.MathUtils.clamp(
          markerY - panelHeight * 0.42,
          112,
          size.height - panelHeight - 34,
        );
        anchor.style.transform = `translate3d(${panelX.toFixed(1)}px, ${panelY.toFixed(1)}px, 0)`;
        preview.dataset.side = placeLeft ? "left" : "right";
      } else {
        anchor.style.removeProperty("transform");
        delete preview.dataset.side;
      }

      const previewBounds = preview.getBoundingClientRect();
      connector.setAttribute("opacity", "1");
      const endX = markerX <= previewBounds.left + previewBounds.width * 0.5
        ? previewBounds.left
        : previewBounds.right;
      const endY = previewBounds.top + Math.min(62, previewBounds.height * 0.34);
      const direction = endX >= markerX ? 1 : -1;
      const firstX = markerX + direction * 38;
      const secondX = endX - direction * 22;
      connector.setAttribute(
        "d",
        `M ${markerX.toFixed(1)} ${markerY.toFixed(1)} L ${firstX.toFixed(1)} ${markerY.toFixed(1)} L ${secondX.toFixed(1)} ${endY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`,
      );

      if (connector.dataset.drawnFor !== selected.id) {
        connector.dataset.drawnFor = selected.id;
        connector.getAnimations().forEach(animation => animation.cancel());
        connector.animate(
          reducedMotion
            ? [{ opacity: 1, strokeDashoffset: 0 }]
            : [
              { opacity: 0, strokeDashoffset: 1 },
              { opacity: 1, strokeDashoffset: 0 },
            ],
          {
            duration: reducedMotion ? 1 : 480,
            easing: "cubic-bezier(.18,.72,.16,1)",
            fill: "forwards",
          },
        );
      }
    }
  });

  return (
    <>
      <SpaceField />
      <OrbitLines />
      <group ref={worldRef} position={WORLD_POSITION.toArray()} scale={WORLD_SCALE} rotation={[0.47, -0.085, -0.025]}>
        <EarthSurface />
        <HumanBeaconSystem
          humans={humans}
          selectedHumanId={selectedHumanId}
          hoveredHumanId={hoveredHumanId}
          controls={controls}
          worldRef={worldRef}
          reducedMotion={reducedMotion}
          onHover={onHover}
          onSelect={onSelect}
          onActiveChange={onActiveChange}
        />
        {selected && <SelectedTarget key={selected.id} human={selected} />}
        <Atmosphere />
      </group>
    </>
  );
}
