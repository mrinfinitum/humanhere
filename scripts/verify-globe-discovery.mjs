import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { HumanDiscoveryManager } from "../src/components/globe/HumanDiscoveryManager.ts";
import { GLOBE_MOCK_ENTRIES, shouldShowGlobeMocks } from "../src/lib/archive/globe-mocks.ts";

assert.equal(GLOBE_MOCK_ENTRIES.length, 25, "the removable globe demo must contain exactly 25 Humans");
assert.equal(new Set(GLOBE_MOCK_ENTRIES.map(entry => entry.id)).size, 25, "demo Human IDs must be unique");
assert.equal(new Set(GLOBE_MOCK_ENTRIES.map(entry => entry.slug)).size, 25, "demo Human slugs must be unique");
assert.ok(GLOBE_MOCK_ENTRIES.every(entry => entry.fixture && !entry.published && !entry.consentVerified), "demo Humans must remain unpublished code-only fixtures");
assert.ok(GLOBE_MOCK_ENTRIES.every(entry => entry.person?.coordinates?.precision === "city"), "demo globe locations must remain city-level");
assert.equal(shouldShowGlobeMocks("production", "true"), false, "demo Humans must fail closed in production");
assert.equal(shouldShowGlobeMocks("development", undefined), true, "demo Humans should remain available for local development");
assert.equal(shouldShowGlobeMocks("development", "false"), false, "demo Humans may be explicitly disabled during development");

function candidateSphere(count) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (index / Math.max(1, count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * index;
    return new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius).multiplyScalar(1.017);
  });
}

function simulate(mobile) {
  const candidates = candidateSphere(120);
  const visibleBudget = mobile ? 6 : 10;
  const manager = new HumanDiscoveryManager(candidates, {
    poolSize: mobile ? 10 : 18,
    visibleBudget,
    initialBudget: mobile ? 3 : 4,
    recentlySeenLimit: 80,
    seed: mobile ? 4812 : 1729,
  });
  let maximumActive = 0;
  let observedArrivalRipple = false;
  let observedOpticalStaging = false;
  let observedPhysicalFade = false;
  let selectedIndex = null;
  let selectedAt = 0;
  const encounteredCandidates = new Set();

  for (let frame = 0; frame < 60 * 150; frame += 1) {
    const now = frame / 60;
    const longitude = now * Math.PI * 2 / 240;
    const cameraDirection = new THREE.Vector3(0, 0, 1);
    const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.47, longitude - 0.085, -0.025));
    manager.update({
      now,
      selectedIndex,
      hoveredIndex: null,
      activelyExploring: now > 18 && now < 28,
      reducedMotion: false,
      visibilityFor: candidateIndex => candidates[candidateIndex].clone().normalize().applyQuaternion(rotation).dot(cameraDirection),
    });

    const active = manager.activeCandidateIndices();
    active.forEach(candidateIndex => encounteredCandidates.add(candidateIndex));
    observedArrivalRipple ||= manager.slots.some(slot => (
      slot.state === "present"
      && slot.arrivalRippleProgress > 0
      && slot.arrivalRippleProgress < 1
    ));
    observedOpticalStaging ||= manager.slots.some(slot => (
      slot.state === "emerging"
      && slot.coreOpacity > 0.7
      && slot.innerOpacity > slot.haloOpacity
      && slot.contactOpacity < slot.coreOpacity
    ));
    observedPhysicalFade ||= manager.slots.some(slot => (
      slot.state === "fading"
      && slot.contactOpacity < slot.coreOpacity
      && slot.haloOpacity <= slot.innerOpacity
    ));
    assert.equal(new Set(active).size, active.length, "active pool must never duplicate a Human");
    maximumActive = Math.max(maximumActive, active.length);
    assert.ok(active.length <= visibleBudget, "active visual budget must remain bounded");

    if (now > 48 && selectedIndex === null && active.length) {
      selectedIndex = active[0];
      selectedAt = now;
    }
    if (selectedIndex !== null && now - selectedAt < 24) {
      assert.ok(active.includes(selectedIndex), "selected Human must remain in the active pool");
    }
    if (selectedIndex !== null && now - selectedAt >= 24) selectedIndex = null;
  }

  assert.ok(maximumActive >= (mobile ? 3 : 4), "the first-load sequence should populate gradually");
  assert.ok(encounteredCandidates.size > visibleBudget, "the active set should turn over and reveal new Humans over time");
  assert.ok(observedArrivalRipple, "an emerged Human should receive one bounded arrival ripple");
  assert.ok(observedOpticalStaging, "the warm core should resolve before bloom, aura, and contact light");
  assert.ok(observedPhysicalFade, "contact light and aura should leave before the Human core");
}

simulate(false);
simulate(true);

const globeSceneSource = await readFile(new URL("../src/components/globe/GlobeScene.tsx", import.meta.url), "utf8");
const billboardSource = await readFile(new URL("../src/components/globe/HumanBillboardLayer.tsx", import.meta.url), "utf8");
assert.match(globeSceneSource, /discoveryManager\.update\(/, "the live globe scene must drive the discovery manager");
assert.match(billboardSource, /slot\.coreOpacity/, "the live Human renderer must consume lifecycle opacity");
console.log("Globe discovery pool verified: bounded, unique, and selection-safe.");
