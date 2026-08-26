"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { HumanOrbSlot } from "./HumanDiscoveryManager";

const LAPIS = new THREE.Color("#3046A5");
const OPTICAL_BLUE = new THREE.Color("#5074FF");
const UNIT_Y = new THREE.Vector3(0, 1, 0);

type Props = {
  slots: readonly HumanOrbSlot[];
  selectedIndex: number | null;
  hoveredIndex: number | null;
  worldRef: RefObject<THREE.Group | null>;
  reducedMotion: boolean;
};

function createShaftMaterial(opacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: opacity } },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
    vertexShader: `
      varying vec2 vShaftUv;
      varying vec3 vShaftColor;
      varying float vStrength;

      void main() {
        vShaftUv = uv;
        vStrength = max(max(instanceColor.r, instanceColor.g), instanceColor.b);
        vShaftColor = instanceColor / max(vStrength, 0.001);
        vec4 instancePosition = instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * instancePosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec2 vShaftUv;
      varying vec3 vShaftColor;
      varying float vStrength;

      void main() {
        float along = pow(max(0.0, 1.0 - vShaftUv.y), 1.55);
        float dissolve = 1.0 - smoothstep(0.74, 1.0, vShaftUv.y);
        float alpha = along * dissolve * uOpacity * vStrength;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(vShaftColor * (1.0 + vStrength * 0.46), alpha);
      }
    `,
  });
}

/** Visual-only outward energy, aligned to each Human's true surface normal. */
export function HumanBeaconShafts({ slots, selectedIndex, hoveredIndex, worldRef, reducedMotion }: Props) {
  const auraRef = useRef<THREE.InstancedMesh>(null);
  const filamentRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const auraGeometry = useMemo(() => new THREE.CylinderGeometry(0.00025, 0.0042, 1, 10, 1, true), []);
  const filamentGeometry = useMemo(() => new THREE.CylinderGeometry(0.00022, 0.00072, 1, 8, 1, true), []);
  const auraMaterial = useMemo(() => createShaftMaterial(0.16), []);
  const filamentMaterial = useMemo(() => createShaftMaterial(0.48), []);
  const center = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const worldNormal = useMemo(() => new THREE.Vector3(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const worldQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useEffect(() => () => {
    auraGeometry.dispose();
    filamentGeometry.dispose();
    auraMaterial.dispose();
    filamentMaterial.dispose();
  }, [auraGeometry, auraMaterial, filamentGeometry, filamentMaterial]);

  useEffect(() => {
    if (auraRef.current) auraRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (filamentRef.current) filamentRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, []);

  useFrame(({ clock }) => {
    const world = worldRef.current;
    const aura = auraRef.current;
    const filament = filamentRef.current;
    if (!world || !aura || !filament) return;
    world.getWorldPosition(center);
    world.getWorldQuaternion(worldQuaternion);
    cameraDirection.copy(camera.position).sub(center).normalize();

    slots.forEach((slot, slotIndex) => {
      const active = slot.candidateIndex >= 0 && slot.coreOpacity > 0.015;
      if (!active) {
        position.set(100, 100, 100);
        quaternion.identity();
        scale.setScalar(0.0001);
        color.setRGB(0, 0, 0);
      } else {
        normal.copy(slot.position).normalize();
        worldNormal.copy(normal).applyQuaternion(worldQuaternion);
        const facing = worldNormal.dot(cameraDirection);
        const horizon = THREE.MathUtils.smoothstep(facing, -0.005, 0.22);
        const selected = slot.candidateIndex === selectedIndex;
        const hovered = slot.candidateIndex === hoveredIndex;
        const breath = reducedMotion ? 1 : 0.96 + Math.sin(clock.elapsedTime * 0.72 + slot.phase) * 0.04;
        const variation = 0.92 + (Math.sin(slot.phase * 3.17) * 0.5 + 0.5) * 0.16;
        const length = 0.128 * variation * (selected ? 1.2 : hovered ? 1.09 : 1);
        const strength = slot.innerOpacity * horizon * breath * (selected ? 1.34 : hovered ? 1.16 : 1);
        position.copy(normal).multiplyScalar(1.006 + length * 0.5);
        quaternion.setFromUnitVectors(UNIT_Y, normal);
        scale.set(1, length, 1);
        color.copy(selected || hovered ? OPTICAL_BLUE : LAPIS).multiplyScalar(strength);
      }
      matrix.compose(position, quaternion, scale);
      aura.setMatrixAt(slotIndex, matrix);
      filament.setMatrixAt(slotIndex, matrix);
      aura.setColorAt(slotIndex, color);
      filament.setColorAt(slotIndex, color);
    });
    aura.instanceMatrix.needsUpdate = true;
    filament.instanceMatrix.needsUpdate = true;
    if (aura.instanceColor) aura.instanceColor.needsUpdate = true;
    if (filament.instanceColor) filament.instanceColor.needsUpdate = true;
  });

  return (
    <group name="human-beacon-shafts">
      <instancedMesh ref={auraRef} args={[auraGeometry, auraMaterial, slots.length]} frustumCulled={false} renderOrder={2} />
      <instancedMesh ref={filamentRef} args={[filamentGeometry, filamentMaterial, slots.length]} frustumCulled={false} renderOrder={3} />
    </group>
  );
}
