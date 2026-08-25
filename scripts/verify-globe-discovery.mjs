import assert from "node:assert/strict";
import * as THREE from "three";
import { HumanDiscoveryManager } from "../src/components/globe/HumanDiscoveryManager.ts";

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
  let selectedIndex = null;
  let selectedAt = 0;

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
    observedArrivalRipple ||= manager.slots.some(slot => (
      slot.state === "present"
      && slot.arrivalRippleProgress > 0
      && slot.arrivalRippleProgress < 1
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
  assert.ok(observedArrivalRipple, "an emerged Human should receive one bounded arrival ripple");
}

simulate(false);
simulate(true);
console.log("Globe discovery pool verified: bounded, unique, and selection-safe.");
