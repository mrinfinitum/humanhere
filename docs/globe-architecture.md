# HUMAN:HERE globe architecture

The globe is a public discovery surface, not a second source of story data.
The homepage server reads the existing `human_entries_public` projection and
converts each eligible record to a bounded `GlobeHuman` DTO before crossing the
server/client boundary.

## Privacy boundary

- Only published, consent-verified public entries can become globe markers.
- Coordinates are accepted only at city, region, or country precision.
- The current projection exposes approved display location text, so known
  locations are resolved to public city centroids with a small deterministic
  visual offset. The offset is not a submitted GPS coordinate.
- Entries without an approved public location remain available in the archive
  and do not appear on the globe.
- Private submissions, addresses, consent records, notes, and user identities
  never enter the globe payload.

## Rendering boundary

- The Earth topology is one `THREE.Points` draw call backed by a deterministic
  Natural Earth-derived land mask.
- Human lights are one `THREE.Points` draw call with custom point-sprite
  shading, randomized pulse phase, and index-based hover/selection state.
- The graphite sphere supplies real depth occlusion, so lights on the far side
  are not visible through Earth.
- Atmosphere is a custom Fresnel shader. Glow is generated in the human-point
  shader rather than as a full-scene blur, keeping the brand and HUD crisp.
- Animation mutates Three.js refs and uniforms directly; React state is not
  updated per frame.

## Scale and LOD path

The initial page payload remains deliberately bounded. The renderer can ingest
large buffers, but the browser should never receive the full national archive
on first load.

The next scale tier should add a server-side spatial-cell projection:

1. Planetary distance returns coarse cells containing several low-intensity
   presence particles, not conventional numbered clusters.
2. Regional distance requests finer cells for the visible hemisphere.
3. Close distance resolves those cells into individual public `GlobeHuman`
   records that can be raycast and opened.
4. Cell and individual buffers swap at controlled camera thresholds and are
   cached independently.

This supports 100 to 100,000+ archive entries without shipping or drawing every
individual at planetary distance. Love count never affects marker scale,
ranking, loading priority, or editorial placement.

## Interaction state

Rotation, camera distance, engagement, and inactivity timing live in a mutable
controller ref. Drag pauses idle rotation. Selection damps the world toward the
chosen city and preserves the canonical story destination at `/humans/[slug]`.
Reduced-motion users receive an interactive but stationary globe.
