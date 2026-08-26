import * as THREE from "three";

export const EARTH_RADIUS = 1;
export const HUMAN_SURFACE_RADIUS = 1.0065;

/** The single tested Earth coordinate conversion used by visuals, hits and callouts. */
export function latLngToVector3(lat: number, lng: number, radius = EARTH_RADIUS) {
  const latitude = THREE.MathUtils.degToRad(lat);
  const longitude = THREE.MathUtils.degToRad(lng);
  const latitudeRadius = Math.cos(latitude) * radius;
  return new THREE.Vector3(
    latitudeRadius * Math.cos(longitude),
    Math.sin(latitude) * radius,
    -latitudeRadius * Math.sin(longitude),
  );
}
