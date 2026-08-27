/* eslint-disable react-hooks/immutability -- Three.js materials, refs and typed buffers are intentionally updated in the render loop. */
"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { HUMAN_SURFACE_RADIUS, latLngToVector3 } from "./coordinates";
import { HumanBeaconHitTargets } from "./HumanBeaconHitTargets";
import type { HumanDiscoveryManager } from "./HumanDiscoveryManager";
import type { GlobeHover, GlobeHuman } from "./types";

function createFlareTexture() {
  // A local high-resolution RGBA texture with no browser/DOM dependency.
  // This keeps the marker available during Next.js prerendering as well as in
  // the browser while still using one ordinary SpriteMaterial at runtime.
  const resolution = 512;
  const pixels = new Uint8Array(resolution * resolution * 4);
  for (let y = 0; y < resolution; y += 1) {
    const vertical = (y + 0.5) / resolution * 2 - 1;
    for (let x = 0; x < resolution; x += 1) {
      const horizontal = (x + 0.5) / resolution * 2 - 1;
      const radiusSquared = horizontal * horizontal + vertical * vertical;
      const radius = Math.sqrt(radiusSquared);
      const core = Math.exp(-radiusSquared * 1850);
      const inner = Math.exp(-radiusSquared * 105);
      const aura = Math.exp(-radiusSquared * 12.5) * Math.max(0, 1 - radius);
      const horizontalRay = Math.exp(-Math.abs(vertical) * 118) * Math.exp(-Math.abs(horizontal) * 4.2);
      const verticalRay = Math.exp(-Math.abs(horizontal) * 118) * Math.exp(-Math.abs(vertical) * 3.7);
      const diagonalRay = (
        Math.exp(-Math.abs(horizontal + vertical) * 86)
        + Math.exp(-Math.abs(horizontal - vertical) * 86)
      ) * Math.exp(-radius * 9) * 0.12;
      const ray = horizontalRay * 0.38 + verticalRay * 0.48 + diagonalRay;
      const energy = Math.min(1, core + inner * 0.78 + aura * 0.2 + ray * 0.5);
      const colorMix = Math.min(1, core * 1.8 + inner * 0.45);
      const index = (y * resolution + x) * 4;
      pixels[index] = Math.round(THREE.MathUtils.lerp(68, 255, colorMix));
      pixels[index + 1] = Math.round(THREE.MathUtils.lerp(98, 250, colorMix));
      pixels[index + 2] = 255;
      pixels[index + 3] = Math.round(energy * 255);
    }
  }

  const texture = new THREE.DataTexture(pixels, resolution, resolution, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function createLightColumnTexture() {
  const width = 128;
  const height = 512;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const outward = y / (height - 1);
    const lengthFade = Math.pow(1 - outward, 1.18);
    const tipFade = 1 - THREE.MathUtils.smoothstep(outward, 0.88, 1);
    for (let x = 0; x < width; x += 1) {
      const lateral = (x + 0.5) / width * 2 - 1;
      const softBeam = Math.exp(-lateral * lateral * 8.5);
      const brightSeam = Math.exp(-lateral * lateral * 68);
      const energy = Math.min(1, (softBeam * 0.52 + brightSeam * 0.96) * lengthFade * tipFade);
      const heat = Math.min(1, brightSeam * Math.pow(1 - outward, 2.8));
      const index = (y * width + x) * 4;
      pixels[index] = Math.round(THREE.MathUtils.lerp(48, 218, heat));
      pixels[index + 1] = Math.round(THREE.MathUtils.lerp(70, 232, heat));
      pixels[index + 2] = 255;
      pixels[index + 3] = Math.round(energy * 255);
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

type Props = {
  humans: GlobeHuman[];
  selectedHumanId: string | null;
  hoveredHumanId: string | null;
  discoveryManager: HumanDiscoveryManager;
  onHover: (hover: GlobeHover) => void;
  onSelect: (humanId: string) => void;
  debug: boolean;
};

/** Camera-facing Human flares with separate, generous interaction meshes. */
export function HumanBillboardLayer({
  humans,
  selectedHumanId,
  hoveredHumanId,
  discoveryManager,
  onHover,
  onSelect,
  debug,
}: Props) {
  const texture = useMemo(() => createFlareTexture(), []);
  const columnTexture = useMemo(() => createLightColumnTexture(), []);
  const columnGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(0.04, 0.28);
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, 0, 0.14);
    return geometry;
  }, []);
  const placements = useMemo(() => humans.map((human, index) => {
    const position = latLngToVector3(human.lat, human.lng, HUMAN_SURFACE_RADIUS);
    const orientation = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      position.clone().normalize(),
    );
    return {
      human,
      position,
      orientation,
      variation: 0.97 + (index % 7) * 0.01,
      flareMaterial: createFlareMaterial(texture, 0),
      columnMaterial: createColumnMaterial(columnTexture, 0),
    };
  }), [columnTexture, humans, texture]);
  const positionById = useMemo(() => new Map(placements.map(placement => [placement.human.id, placement.position])), [placements]);
  const indexById = useMemo(() => new Map(placements.map((placement, index) => [placement.human.id, index])), [placements]);
  const groupsRef = useRef(new Map<string, THREE.Group>());
  const spritesRef = useRef(new Map<string, THREE.Sprite>());
  const candidateSlots = useMemo(() => new Int16Array(humans.length).fill(-1), [humans.length]);

  const isActive = useCallback((humanId: string) => {
    const candidateIndex = indexById.get(humanId);
    if (candidateIndex === undefined) return false;
    return discoveryManager.slots.some(slot => (
      slot.candidateIndex === candidateIndex
      && slot.state !== "inactive"
      && slot.coreOpacity >= 0.34
    ));
  }, [discoveryManager, indexById]);

  useFrame(() => {
    candidateSlots.fill(-1);
    for (let slotIndex = 0; slotIndex < discoveryManager.slots.length; slotIndex += 1) {
      const candidateIndex = discoveryManager.slots[slotIndex].candidateIndex;
      if (candidateIndex >= 0 && candidateIndex < candidateSlots.length) candidateSlots[candidateIndex] = slotIndex;
    }

    for (let candidateIndex = 0; candidateIndex < placements.length; candidateIndex += 1) {
      const placement = placements[candidateIndex];
      const group = groupsRef.current.get(placement.human.id);
      const sprite = spritesRef.current.get(placement.human.id);
      const slotIndex = candidateSlots[candidateIndex];
      const slot = slotIndex >= 0 ? discoveryManager.slots[slotIndex] : null;
      if (!group || !sprite || !slot || slot.state === "inactive") {
        if (group) group.visible = false;
        continue;
      }

      group.visible = slot.coreOpacity > 0.005;
      const selected = placement.human.id === selectedHumanId;
      const hovered = placement.human.id === hoveredHumanId;
      const interactionIntensity = selected ? 1 : hovered ? 0.96 : 0.88;
      const opticalOpacity = Math.min(1, slot.coreOpacity * 0.52 + slot.innerOpacity * 0.3 + slot.haloOpacity * 0.18);
      placement.flareMaterial.opacity = opticalOpacity * interactionIntensity * slot.intensity;
      placement.columnMaterial.opacity = slot.innerOpacity * (selected ? 0.94 : hovered ? 0.82 : 0.68);
      const baseSize = selected ? 0.036 : hovered ? 0.032 : 0.029;
      const size = baseSize * placement.variation * slot.scale;
      sprite.scale.set(size, size, 1);
    }
  });

  useEffect(() => () => {
    texture.dispose();
    columnTexture.dispose();
    columnGeometry.dispose();
    placements.forEach(placement => {
      placement.flareMaterial.dispose();
      placement.columnMaterial.dispose();
    });
  }, [columnGeometry, columnTexture, placements, texture]);

  if (!humans.length) return null;

  return (
    <group name="human-billboard-layer">
      {placements.map(({ human, position, orientation, flareMaterial, columnMaterial }) => {
        return (
          <group
            key={human.id}
            ref={group => {
              if (group) groupsRef.current.set(human.id, group);
              else groupsRef.current.delete(human.id);
            }}
            name={`human-beacon-${human.id}`}
            position={position}
            quaternion={orientation}
            visible={false}
          >
            <mesh geometry={columnGeometry} material={columnMaterial} renderOrder={3} raycast={() => undefined} />
            <mesh geometry={columnGeometry} material={columnMaterial} rotation={[0, 0, Math.PI / 2]} renderOrder={3} raycast={() => undefined} />
            <sprite
              ref={sprite => {
                if (sprite) spritesRef.current.set(human.id, sprite);
                else spritesRef.current.delete(human.id);
              }}
              name={`human-flare-${human.id}`}
              scale={[0.001, 0.001, 1]}
              material={flareMaterial}
              renderOrder={4}
              raycast={() => undefined}
            />
          </group>
        );
      })}
      <HumanBeaconHitTargets
        humans={humans}
        positionFor={human => positionById.get(human.id) ?? new THREE.Vector3(100, 100, 100)}
        isActive={isActive}
        onHover={onHover}
        onHoverEnd={() => onHover(null)}
        onSelect={onSelect}
        debug={debug}
      />
    </group>
  );
}

function createFlareMaterial(texture: THREE.Texture, opacity: number) {
  return new THREE.SpriteMaterial({
    map: texture,
    color: "#ffffff",
    transparent: true,
    opacity,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function createColumnMaterial(texture: THREE.Texture, opacity: number) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    color: "#ffffff",
    transparent: true,
    opacity,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}
