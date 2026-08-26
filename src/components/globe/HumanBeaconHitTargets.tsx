"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { GlobeHover, GlobeHuman } from "./types";

type Props = {
  humans: GlobeHuman[];
  positionFor: (human: GlobeHuman) => THREE.Vector3;
  onHover: (hover: NonNullable<GlobeHover>) => void;
  onHoverEnd: (humanId: string) => void;
  onSelect: (humanId: string) => void;
  debug: boolean;
};

/**
 * Interaction-only layer. The visual beacon remains GPU-rendered; these few
 * normal meshes provide generous, stable-ID pointer targets for active Humans.
 */
export function HumanBeaconHitTargets({ humans, positionFor, onHover, onHoverEnd, onSelect, debug }: Props) {
  const targetsRef = useRef(new Map<string, THREE.Mesh>());
  const pointerDownRef = useRef<{ humanId: string; pointerId: number; x: number; y: number } | null>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.034, 14, 10), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: debug ? "#ff335f" : "#000000",
    transparent: true,
    opacity: debug ? 0.28 : 0,
    wireframe: debug,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  }), [debug]);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const worldCenter = useMemo(() => new THREE.Vector3(), []);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const surfaceDirection = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame(({ camera }) => {
    for (const target of targetsRef.current.values()) {
      target.getWorldPosition(worldPosition);
      target.parent?.getWorldPosition(worldCenter);
      cameraDirection.copy(camera.position).sub(worldCenter).normalize();
      surfaceDirection.copy(worldPosition).sub(worldCenter).normalize();
      target.visible = surfaceDirection.dot(cameraDirection) > 0.035;
    }
  });

  const hover = (event: ThreeEvent<PointerEvent>, humanId: string) => {
    event.stopPropagation();
    event.nativeEvent.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    onHover({ humanId, x: event.nativeEvent.clientX, y: event.nativeEvent.clientY });
  };

  const clearHover = (event: ThreeEvent<PointerEvent>, humanId: string) => {
    event.stopPropagation();
    event.nativeEvent.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    onHoverEnd(humanId);
  };

  const beginSelection = (event: ThreeEvent<PointerEvent>, humanId: string) => {
    event.stopPropagation();
    event.nativeEvent.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    pointerDownRef.current = {
      humanId,
      pointerId: event.pointerId,
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
    };
  };

  const finishSelection = (event: ThreeEvent<PointerEvent>, humanId: string) => {
    event.stopPropagation();
    event.nativeEvent.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    const start = pointerDownRef.current;
    pointerDownRef.current = null;
    if (!start || start.humanId !== humanId || start.pointerId !== event.pointerId) return;
    const movement = Math.hypot(
      event.nativeEvent.clientX - start.x,
      event.nativeEvent.clientY - start.y,
    );
    if (movement <= 6) onSelect(humanId);
  };

  return (
    <group name="human-beacon-hit-targets">
      {humans.map(human => (
        <mesh
          key={human.id}
          ref={target => {
            if (target) targetsRef.current.set(human.id, target);
            else targetsRef.current.delete(human.id);
          }}
          name={`human-hit-${human.id}`}
          position={positionFor(human)}
          geometry={geometry}
          material={material}
          onPointerDown={event => beginSelection(event, human.id)}
          onPointerUp={event => finishSelection(event, human.id)}
          onPointerCancel={() => { pointerDownRef.current = null; }}
          onPointerOver={event => hover(event, human.id)}
          onPointerOut={event => clearHover(event, human.id)}
          onClick={event => {
            // Keep Canvas.onPointerMissed from treating the follow-up click as
            // a background dismissal after pointer-up selected this Human.
            event.stopPropagation();
            event.nativeEvent.stopPropagation();
            event.nativeEvent.stopImmediatePropagation();
            onSelect(human.id);
          }}
        />
      ))}
    </group>
  );
}
