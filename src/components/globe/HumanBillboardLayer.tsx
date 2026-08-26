"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { HUMAN_SURFACE_RADIUS, latLngToVector3 } from "./coordinates";
import { HumanBeaconHitTargets } from "./HumanBeaconHitTargets";
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
  onHover: (hover: GlobeHover) => void;
  onSelect: (humanId: string) => void;
  onActiveChange: (humanIds: string[]) => void;
  debug: boolean;
};

/** Camera-facing Human flares with separate, generous interaction meshes. */
export function HumanBillboardLayer({
  humans,
  selectedHumanId,
  hoveredHumanId,
  onHover,
  onSelect,
  onActiveChange,
  debug,
}: Props) {
  const texture = useMemo(() => createFlareTexture(), []);
  const columnTexture = useMemo(() => createLightColumnTexture(), []);
  const flareMaterials = useMemo(() => ({
    idle: createFlareMaterial(texture, 0.91),
    hover: createFlareMaterial(texture, 0.98),
    selected: createFlareMaterial(texture, 1),
  }), [texture]);
  const columnMaterials = useMemo(() => ({
    idle: createColumnMaterial(columnTexture, 0.76),
    hover: createColumnMaterial(columnTexture, 0.9),
    selected: createColumnMaterial(columnTexture, 1),
  }), [columnTexture]);
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
    return { human, position, orientation, variation: 0.97 + (index % 7) * 0.01 };
  }), [humans]);
  const positionById = useMemo(() => new Map(placements.map(placement => [placement.human.id, placement.position])), [placements]);

  useEffect(() => {
    onActiveChange(humans.map(human => human.id));
    return () => onActiveChange([]);
  }, [humans, onActiveChange]);
  useEffect(() => () => {
    texture.dispose();
    columnTexture.dispose();
    columnGeometry.dispose();
    Object.values(flareMaterials).forEach(material => material.dispose());
    Object.values(columnMaterials).forEach(material => material.dispose());
  }, [columnGeometry, columnMaterials, columnTexture, flareMaterials, texture]);

  if (!humans.length) return null;

  return (
    <group name="human-billboard-layer">
      {placements.map(({ human, position, orientation, variation }) => {
        const selected = human.id === selectedHumanId;
        const hovered = human.id === hoveredHumanId;
        const state = selected ? "selected" : hovered ? "hover" : "idle";
        const size = (selected ? 0.036 : hovered ? 0.032 : 0.029) * variation;
        return (
          <group key={human.id} name={`human-beacon-${human.id}`} position={position} quaternion={orientation}>
            <mesh geometry={columnGeometry} material={columnMaterials[state]} renderOrder={3} raycast={() => undefined} />
            <mesh geometry={columnGeometry} material={columnMaterials[state]} rotation={[0, 0, Math.PI / 2]} renderOrder={3} raycast={() => undefined} />
            <sprite
              name={`human-flare-${human.id}`}
              scale={[size, size, 1]}
              material={flareMaterials[state]}
              renderOrder={4}
              raycast={() => undefined}
            />
          </group>
        );
      })}
      <HumanBeaconHitTargets
        humans={humans}
        positionFor={human => positionById.get(human.id) ?? new THREE.Vector3(100, 100, 100)}
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
