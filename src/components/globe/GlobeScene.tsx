/* eslint-disable react-hooks/immutability -- Three.js scenes are intentionally animated through mutable refs and uniforms. */
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import landPointData from "./land-points.json";
import type { GlobeControls, GlobeHover, GlobeHuman } from "./types";

const INK = new THREE.Color("#171716");
const PAPER = new THREE.Color("#F2EBDD");
const WORLD_RADIUS = 1;

function latLngVector(lat: number, lng: number, radius = WORLD_RADIUS) {
  const latitude = THREE.MathUtils.degToRad(lat);
  const longitude = THREE.MathUtils.degToRad(lng);
  return new THREE.Vector3(
    Math.cos(latitude) * Math.sin(longitude) * radius,
    Math.sin(latitude) * radius,
    Math.cos(latitude) * Math.cos(longitude) * radius,
  );
}

function nearestAngle(current: number, target: number) {
  return current + Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

function LandPointCloud() {
  const geometry = useMemo(() => {
    const positions = new Float32Array(landPointData.length * 3);
    const variation = new Float32Array(landPointData.length);
    landPointData.forEach(([latValue, lngValue, seed], index) => {
      const point = latLngVector(latValue / 100, lngValue / 100, 1.006);
      positions.set(point.toArray(), index * 3);
      variation[index] = seed / 17;
    });
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    result.setAttribute("aVariation", new THREE.BufferAttribute(variation, 1));
    return result;
  }, []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true,
    uniforms: { uPixelRatio: { value: 1 } },
    vertexShader: `
      attribute float aVariation;
      varying float vLight;
      uniform float uPixelRatio;
      void main() {
        vec3 normalDirection = normalize(position);
        vLight = .06 + max(dot(normalDirection, normalize(vec3(-.35, .42, 1.0))), 0.0) * .43 + aVariation * .065;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = (.92 + aVariation * .64) * uPixelRatio * (3.0 / max(1.0, -mvPosition.z));
      }
    `,
    fragmentShader: `
      varying float vLight;
      void main() {
        float distanceToCenter = length(gl_PointCoord - .5);
        float alpha = 1.0 - smoothstep(.28, .5, distanceToCenter);
        vec3 paper = vec3(.949, .922, .867);
        vec3 graphite = vec3(.18, .20, .23);
        gl_FragColor = vec4(mix(graphite, paper, vLight * .82), alpha * (.2 + vLight * .7));
      }
    `,
  }), []);
  const { gl } = useThree();
  useEffect(() => { material.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2); }, [gl, material]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

function HumanOrbs({ humans, selectedIndex, onHover, onSelect }: { humans: GlobeHuman[]; selectedIndex: number | null; onHover: (hover: GlobeHover) => void; onSelect: (index: number) => void }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(humans.length * 3);
    const phases = new Float32Array(humans.length);
    const indices = new Float32Array(humans.length);
    humans.forEach((human, index) => {
      positions.set(latLngVector(human.lat, human.lng, 1.024).toArray(), index * 3);
      phases[index] = (index * 2.399963) % (Math.PI * 2);
      indices[index] = index;
    });
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    result.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    result.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));
    return result;
  }, [humans]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSelected: { value: -1 }, uHovered: { value: -1 }, uPixelRatio: { value: 1 } }), []);
  const hoveredRef = useRef(-1);
  const { gl } = useThree();
  useEffect(() => { uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2); }, [gl, uniforms]);
  useEffect(() => { uniforms.uSelected.value = selectedIndex ?? -1; }, [selectedIndex, uniforms]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => { if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.elapsedTime; });
  const hover = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const index = event.index ?? -1;
    if (index < 0 || index === hoveredRef.current) return;
    hoveredRef.current = index;
    uniforms.uHovered.value = index;
    onHover({ index, x: event.nativeEvent.clientX, y: event.nativeEvent.clientY });
  };
  const clearHover = () => { hoveredRef.current = -1; uniforms.uHovered.value = -1; onHover(null); };
  return (
    <points geometry={geometry} onPointerMove={hover} onPointerOut={clearHover} onClick={(event) => { event.stopPropagation(); if (event.index !== undefined) onSelect(event.index); }}>
      <shaderMaterial ref={materialRef} transparent depthTest depthWrite={false} blending={THREE.NormalBlending} uniforms={uniforms}
        vertexShader={`
          attribute float aPhase; attribute float aIndex;
          uniform float uTime; uniform float uSelected; uniform float uHovered; uniform float uPixelRatio;
          varying float vSelected; varying float vHovered;
          void main() {
            vSelected = step(abs(aIndex - uSelected), .1);
            vHovered = step(abs(aIndex - uHovered), .1);
            float pulse = 1.0 + sin(uTime * 1.25 + aPhase) * .035;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            float baseSize = mix(10.5, 18.0, max(vSelected, vHovered));
            gl_PointSize = baseSize * pulse * uPixelRatio * (2.7 / max(1.0, -mvPosition.z));
          }
        `}
        fragmentShader={`
          varying float vSelected; varying float vHovered;
          void main() {
            float radius = length(gl_PointCoord - .5) * 2.0;
            float core = 1.0 - smoothstep(.0, .19, radius);
            float halo = pow(max(0.0, 1.0 - radius), 2.75);
            vec3 paper = vec3(.949, .922, .867);
            vec3 lapis = vec3(.188, .275, .647);
            vec3 color = mix(paper, lapis, max(vSelected, vHovered));
            float alpha = core + halo * .84;
            if (alpha < .015) discard;
            gl_FragColor = vec4(mix(color * .82, vec3(1.0), core), alpha);
          }
        `}
      />
    </points>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.035}>
      <sphereGeometry args={[1, 96, 96]} />
      <shaderMaterial transparent depthWrite={false} side={THREE.BackSide} blending={THREE.NormalBlending}
        vertexShader={`varying vec3 vNormal; varying vec3 vView; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vNormal = normalize(normalMatrix * normal); vView = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`}
        fragmentShader={`varying vec3 vNormal; varying vec3 vView; void main(){ float rim = pow(1.0 - abs(dot(vNormal,vView)), 4.7); vec3 lapis = vec3(.188,.275,.647); gl_FragColor = vec4(lapis, rim * .38); }`}
      />
    </mesh>
  );
}

function Topology() {
  const geometry = useMemo(() => {
    const values: number[] = [];
    const addSegment = (from: THREE.Vector3, to: THREE.Vector3) => values.push(...from.toArray(), ...to.toArray());
    for (let lat = -60; lat <= 60; lat += 30) for (let lng = -180; lng < 180; lng += 4) addSegment(latLngVector(lat, lng, 1.012), latLngVector(lat, lng + 4, 1.012));
    for (let lng = -150; lng < 180; lng += 30) for (let lat = -88; lat < 88; lat += 4) addSegment(latLngVector(lat, lng, 1.012), latLngVector(lat + 4, lng, 1.012));
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(values, 3));
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <lineSegments geometry={geometry}><lineBasicMaterial color={PAPER} transparent opacity={0.035} depthWrite={false} /></lineSegments>;
}

function SpaceField() {
  const positions = useMemo(() => {
    const data = new Float32Array(900 * 3);
    for (let index = 0; index < 900; index += 1) {
      const theta = index * 2.399963;
      const z = 1 - (index / 899) * 2;
      const radius = 7 + (index % 13) * .28;
      const ring = Math.sqrt(1 - z * z);
      data.set([Math.cos(theta) * ring * radius, z * radius, Math.sin(theta) * ring * radius], index * 3);
    }
    return data;
  }, []);
  return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color={PAPER} size={0.012} transparent opacity={0.16} depthWrite={false} /></points>;
}

export function GlobeScene({ humans, selectedIndex, controls, reducedMotion, onHover, onSelect, onReady }: { humans: GlobeHuman[]; selectedIndex: number | null; controls: MutableRefObject<GlobeControls>; reducedMotion: boolean; onHover: (hover: GlobeHover) => void; onSelect: (index: number) => void; onReady: () => void }) {
  const worldRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  useEffect(() => { gl.setClearColor(INK, 1); gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08; onReady(); }, [gl, onReady]);
  useEffect(() => {
    if (selectedIndex === null) { controls.current.distance = 3.18; return; }
    const human = humans[selectedIndex];
    const current = worldRef.current?.rotation.y ?? controls.current.targetY;
    controls.current.targetY = nearestAngle(current, -THREE.MathUtils.degToRad(human.lng));
    controls.current.targetX = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(human.lat) * .78, -.62, .62);
    controls.current.distance = 2.88;
    controls.current.lastInteraction = performance.now();
  }, [controls, humans, selectedIndex]);
  useFrame((_, delta) => {
    const world = worldRef.current;
    if (!world) return;
    if (!reducedMotion && !controls.current.dragging && selectedIndex === null && performance.now() - controls.current.lastInteraction > 2400) controls.current.targetY += delta * Math.PI * 2 / 135;
    world.rotation.x = THREE.MathUtils.damp(world.rotation.x, controls.current.targetX, 5.2, delta);
    world.rotation.y = THREE.MathUtils.damp(world.rotation.y, controls.current.targetY, 5.2, delta);
    world.position.x = THREE.MathUtils.damp(world.position.x, selectedIndex === null ? 0 : -.27, 4.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, controls.current.distance, 4.5, delta);
    camera.lookAt(0, 0, 0);
  });
  return (
    <>
      <SpaceField />
      <ambientLight intensity={0.12} />
      <directionalLight position={[-3, 3, 5]} intensity={1.3} color="#F2EBDD" />
      <group ref={worldRef} rotation={[.12, .35, 0]}>
        <mesh><sphereGeometry args={[1, 128, 128]} /><meshPhysicalMaterial color="#090a0f" emissive="#03040a" emissiveIntensity={.72} roughness={.62} metalness={.4} clearcoat={.26} clearcoatRoughness={.58} /></mesh>
        <LandPointCloud />
        <Topology />
        <HumanOrbs humans={humans} selectedIndex={selectedIndex} onHover={onHover} onSelect={onSelect} />
        <Atmosphere />
      </group>
    </>
  );
}
