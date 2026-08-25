import { readFile, writeFile } from "node:fs/promises";

// Source input: Natural Earth-derived world GeoJSON distributed by the
// D3 Graph Gallery. This script reduces the polygons to a compact, deterministic
// land-point mask; no geographic source data ships to the browser.
const sourcePath = process.argv[2] ?? "/tmp/humanhere-world.geojson";
const outputPath = new URL("../src/components/globe/land-points.json", import.meta.url);
const source = JSON.parse(await readFile(sourcePath, "utf8"));

function ringBounds(ring) {
  return ring.reduce((bounds, [lng, lat]) => ({
    minLng: Math.min(bounds.minLng, lng), maxLng: Math.max(bounds.maxLng, lng),
    minLat: Math.min(bounds.minLat, lat), maxLat: Math.max(bounds.maxLat, lat),
  }), { minLng: 180, maxLng: -180, minLat: 90, maxLat: -90 });
}

function contains(ring, lng, lat) {
  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [currentLng, currentLat] = ring[current];
    const [previousLng, previousLat] = ring[previous];
    if ((currentLat > lat) !== (previousLat > lat) && lng < (previousLng - currentLng) * (lat - currentLat) / (previousLat - currentLat) + currentLng) inside = !inside;
  }
  return inside;
}

const polygons = source.features.flatMap(feature => {
  const coordinates = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  return coordinates.map(polygon => ({ outer: polygon[0], holes: polygon.slice(1), bounds: ringBounds(polygon[0]) }));
});

function isLand(lng, lat) {
  return polygons.some(({ outer, holes, bounds }) => {
    if (lng < bounds.minLng || lng > bounds.maxLng || lat < bounds.minLat || lat > bounds.maxLat) return false;
    return contains(outer, lng, lat) && !holes.some(hole => contains(hole, lng, lat));
  });
}

const count = 64000;
const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const points = [];
for (let index = 0; index < count; index += 1) {
  const y = 1 - (index / (count - 1)) * 2;
  const radius = Math.sqrt(1 - y * y);
  const angle = goldenAngle * index;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const lat = Math.asin(y) * 180 / Math.PI;
  const lng = Math.atan2(z, x) * 180 / Math.PI;
  if (isLand(lng, lat)) {
    // A tiny deterministic tangent jitter removes visible Fibonacci bands while
    // preserving the even, GPU-friendly point distribution.
    const jitterLat = (Math.sin(index * 91.731) * 0.5) * 0.24;
    const jitterLng = (Math.sin(index * 47.193 + 1.7) * 0.5) * 0.24;
    points.push([Math.round((lat + jitterLat) * 100), Math.round((lng + jitterLng) * 100), index % 17]);
  }
}

await writeFile(outputPath, `${JSON.stringify(points)}\n`);
console.log(`Wrote ${points.length} deterministic land points to ${outputPath.pathname}`);
