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

/** The single Tulsa proof marker: one camera-facing sprite and one hit mesh. */
export function HumanBillboardLayer({
  humans,
  selectedHumanId,
  hoveredHumanId,
  onHover,
  onSelect,
  onActiveChange,
  debug,
}: Props) {
  const human = humans[0];
  const texture = useMemo(() => createFlareTexture(), []);
  const columnTexture = useMemo(() => createLightColumnTexture(), []);
  const material = useMemo(() => new THREE.SpriteMaterial({
    map: texture,
    color: "#ffffff",
    transparent: true,
    opacity: 0.96,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), [texture]);
  const columnMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    map: columnTexture,
    color: "#ffffff",
    transparent: true,
    opacity: selectedHumanId === human?.id ? 1 : hoveredHumanId === human?.id ? 0.96 : 0.88,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), [columnTexture, hoveredHumanId, human?.id, selectedHumanId]);
  const columnGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(0.04, 0.28);
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, 0, 0.14);
    return geometry;
  }, []);
  const position = useMemo(() => human
    ? latLngToVector3(human.lat, human.lng, HUMAN_SURFACE_RADIUS)
    : new THREE.Vector3(100, 100, 100), [human]);
  const orientation = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    position.clone().normalize(),
  ), [position]);
  const selected = human?.id === selectedHumanId;
  const hovered = human?.id === hoveredHumanId;
  // Parent world scale is 1.5, yielding ~28px idle and ~35px selected at the
  // art-directed desktop camera distance.
  const size = selected ? 0.035 : hovered ? 0.031 : 0.028;

  useEffect(() => {
    onActiveChange(human ? [human.id] : []);
    return () => onActiveChange([]);
  }, [human, onActiveChange]);
  useEffect(() => () => {
    material.dispose();
    texture.dispose();
    columnTexture.dispose();
    columnGeometry.dispose();
  }, [columnGeometry, columnTexture, material, texture]);
  useEffect(() => () => columnMaterial.dispose(), [columnMaterial]);

  if (!human) return null;

  return (
    <group name="human-billboard-layer">
      <group name="tulsa-gcat-marker" position={position} quaternion={orientation}>
        <mesh geometry={columnGeometry} material={columnMaterial} renderOrder={3} raycast={() => undefined} />
        <mesh geometry={columnGeometry} material={columnMaterial} rotation={[0, 0, Math.PI / 2]} renderOrder={3} raycast={() => undefined} />
        <sprite
          name="tulsa-human-sprite"
          scale={[size, size, 1]}
          material={material}
          renderOrder={4}
          raycast={() => undefined}
        />
      </group>
      <HumanBeaconHitTargets
        humans={[human]}
        positionFor={() => position}
        onHover={onHover}
        onHoverEnd={() => onHover(null)}
        onSelect={onSelect}
        debug={debug}
      />
    </group>
  );
}
