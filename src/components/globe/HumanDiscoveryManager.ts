import * as THREE from "three";

export type HumanOrbLifecycle = "inactive" | "emerging" | "present" | "resting" | "fading";

export type HumanOrbSlot = {
  candidateIndex: number;
  state: HumanOrbLifecycle;
  position: THREE.Vector3;
  phase: number;
  stateStartedAt: number;
  emergenceDuration: number;
  restAt: number;
  retireAt: number;
  fadeDuration: number;
  arrivalRippleDuration: number;
  arrivalRippleProgress: number;
  coreOpacity: number;
  haloOpacity: number;
  scale: number;
  intensity: number;
};

export type HumanDiscoveryFrame = {
  now: number;
  selectedIndex: number | null;
  hoveredIndex: number | null;
  activelyExploring: boolean;
  reducedMotion: boolean;
  visibilityFor: (candidateIndex: number) => number;
};

type HumanDiscoveryOptions = {
  poolSize: number;
  visibleBudget: number;
  initialBudget: number;
  recentlySeenLimit: number;
  timingScale?: number;
  seed?: number;
};

const FAR_AWAY = new THREE.Vector3(100, 100, 100);

function easeInOut(value: number) {
  const bounded = THREE.MathUtils.clamp(value, 0, 1);
  return bounded * bounded * (3 - 2 * bounded);
}

function hashSeed(value: number) {
  let seed = value >>> 0;
  if (!seed) seed = 0x48554d41;
  return seed;
}

/**
 * Owns the bounded, session-only discovery state. Rendering reads these slots,
 * but the manager never creates Three.js scene objects or React components.
 */
export class HumanDiscoveryManager {
  readonly slots: HumanOrbSlot[];

  private readonly candidatePositions: readonly THREE.Vector3[];
  private readonly visibleBudget: number;
  private readonly initialBudget: number;
  private readonly recentlySeenLimit: number;
  private readonly timingScale: number;
  private readonly recentlySeen = new Set<number>();
  private readonly recentlySeenOrder: number[] = [];
  private randomState: number;
  private nextDiscoveryAt = 0;
  private pauseUntil = 0;
  private previousSelectedIndex: number | null = null;
  private hasStarted = false;

  constructor(candidatePositions: readonly THREE.Vector3[], options: HumanDiscoveryOptions) {
    this.candidatePositions = candidatePositions;
    this.visibleBudget = Math.min(options.visibleBudget, options.poolSize, candidatePositions.length);
    this.initialBudget = Math.min(options.initialBudget, this.visibleBudget);
    this.recentlySeenLimit = Math.max(1, options.recentlySeenLimit);
    this.timingScale = Math.max(0.5, options.timingScale ?? 1);
    this.randomState = hashSeed(options.seed ?? 0x48554d41);
    this.slots = Array.from({ length: options.poolSize }, (_, slotIndex): HumanOrbSlot => ({
      candidateIndex: -1,
      state: "inactive",
      position: FAR_AWAY.clone(),
      phase: (slotIndex * 2.399963) % (Math.PI * 2),
      stateStartedAt: 0,
      emergenceDuration: 1,
      restAt: 0,
      retireAt: 0,
      fadeDuration: 1,
      arrivalRippleDuration: 1.6,
      arrivalRippleProgress: 1,
      coreOpacity: 0,
      haloOpacity: 0,
      scale: 0.65,
      intensity: 1,
    }));
  }

  update(frame: HumanDiscoveryFrame) {
    let membershipChanged = false;

    if (!this.hasStarted) {
      this.hasStarted = true;
      this.nextDiscoveryAt = frame.now + (frame.reducedMotion ? 0.18 : this.between(0.8, 1.35) * this.timingScale);
    }

    if (this.previousSelectedIndex !== frame.selectedIndex) {
      if (this.previousSelectedIndex !== null && frame.selectedIndex === null) {
        this.pauseUntil = frame.now + this.between(1, 3) * this.timingScale;
      }
      this.previousSelectedIndex = frame.selectedIndex;
    }

    for (const slot of this.slots) {
      if (slot.state === "inactive") continue;
      const protectedHuman = slot.candidateIndex === frame.selectedIndex || slot.candidateIndex === frame.hoveredIndex;
      const stateAge = frame.now - slot.stateStartedAt;

      if (slot.state === "emerging") {
        const progress = frame.reducedMotion ? Math.min(1, stateAge / 0.34) : Math.min(1, stateAge / slot.emergenceDuration);
        const eased = easeInOut(progress);
        slot.coreOpacity = eased;
        slot.haloOpacity = easeInOut(Math.max(0, progress - 0.12) / 0.88);
        slot.scale = frame.reducedMotion ? 1 : THREE.MathUtils.lerp(0.65, 1, eased);
        slot.intensity = 1 + Math.sin(progress * Math.PI) * (frame.reducedMotion ? 0 : 0.075);
        if (progress >= 1) {
          slot.state = "present";
          slot.stateStartedAt = frame.now;
          slot.coreOpacity = 1;
          slot.haloOpacity = 1;
          slot.scale = 1;
          slot.intensity = 1;
        }
        continue;
      }

      if (slot.state === "present" && frame.now >= slot.restAt) {
        slot.state = "resting";
        slot.stateStartedAt = frame.now;
      }

      if (slot.state === "present") {
        slot.arrivalRippleProgress = frame.reducedMotion
          ? 1
          : Math.min(1, stateAge / slot.arrivalRippleDuration);
      } else if (slot.state === "resting") {
        slot.arrivalRippleProgress = 1;
      }

      if (
        (slot.state === "present" || slot.state === "resting")
        && !protectedHuman
        && (frame.now >= slot.retireAt || (frame.now - slot.stateStartedAt > 9 && frame.visibilityFor(slot.candidateIndex) < -0.12))
      ) {
        slot.state = "fading";
        slot.stateStartedAt = frame.now;
        slot.fadeDuration = frame.reducedMotion ? 0.34 : this.between(0.8, 1.4);
      }

      if (slot.state === "fading") {
        if (protectedHuman) {
          slot.state = "resting";
          slot.stateStartedAt = frame.now;
          slot.retireAt = frame.now + this.between(16, 28);
          slot.coreOpacity = 1;
          slot.haloOpacity = 1;
          slot.scale = 1;
          continue;
        }
        const progress = Math.min(1, (frame.now - slot.stateStartedAt) / slot.fadeDuration);
        slot.haloOpacity = 1 - easeInOut(Math.min(1, progress / 0.68));
        slot.coreOpacity = 1 - easeInOut(Math.max(0, progress - 0.16) / 0.84);
        slot.scale = frame.reducedMotion ? 1 : THREE.MathUtils.lerp(1, 0.78, easeInOut(progress));
        slot.intensity = 1;
        if (progress >= 1) {
          this.release(slot);
          this.nextDiscoveryAt = Math.max(this.nextDiscoveryAt, frame.now + this.between(0.9, 2.4) * this.timingScale);
          membershipChanged = true;
        }
      }
    }

    const selectionQuiet = frame.selectedIndex !== null || frame.hoveredIndex !== null;
    const activeCount = this.activeCount();
    if (!selectionQuiet && frame.now >= this.pauseUntil && frame.now >= this.nextDiscoveryAt && activeCount < this.visibleBudget) {
      const candidateIndex = this.chooseCandidate(frame);
      const slot = candidateIndex === null ? null : this.slots.find(candidate => candidate.state === "inactive");
      if (slot && candidateIndex !== null) {
        this.activate(slot, candidateIndex, frame.now, frame.reducedMotion);
        membershipChanged = true;
      }
      const fillingFirstFrame = this.activeCount() < this.initialBudget;
      this.nextDiscoveryAt = frame.now + (fillingFirstFrame
        ? this.between(1.25, 2.35)
        : frame.activelyExploring
          ? this.between(2.5, 4.6)
          : this.between(3.6, 6.9)) * this.timingScale;
    }

    return membershipChanged;
  }

  candidateForSlot(slotIndex: number) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.state === "inactive" || slot.coreOpacity < 0.34) return null;
    return slot.candidateIndex;
  }

  activeCandidateIndices() {
    return this.slots
      .filter(slot => slot.state !== "inactive")
      .map(slot => slot.candidateIndex);
  }

  private chooseCandidate(frame: HumanDiscoveryFrame) {
    const active = new Set(this.slots.filter(slot => slot.state !== "inactive").map(slot => slot.candidateIndex));
    const activePositions = this.slots
      .filter(slot => slot.state !== "inactive")
      .map(slot => slot.position.clone().normalize());

    const score = (candidateIndex: number, respectHistory: boolean, minimumSpacing: number) => {
      if (active.has(candidateIndex) || (respectHistory && this.recentlySeen.has(candidateIndex))) return Number.NEGATIVE_INFINITY;
      const visibility = frame.visibilityFor(candidateIndex);
      if (visibility < 0.035) return Number.NEGATIVE_INFINITY;
      const normal = this.candidatePositions[candidateIndex].clone().normalize();
      let nearestAngle = Math.PI;
      for (const activePosition of activePositions) {
        nearestAngle = Math.min(nearestAngle, Math.acos(THREE.MathUtils.clamp(normal.dot(activePosition), -1, 1)));
      }
      if (nearestAngle < minimumSpacing) return Number.NEGATIVE_INFINITY;
      const limbBonus = visibility < 0.32 ? 0.24 * (1 - Math.abs(visibility - 0.17) / 0.15) : 0;
      const diversity = Math.min(nearestAngle / 0.72, 1) * 0.26;
      return visibility * 0.44 + Math.max(0, limbBonus) + diversity + this.nextRandom() * 0.18;
    };

    const findBest = (respectHistory: boolean, minimumSpacing: number) => {
      let bestIndex: number | null = null;
      let bestScore = Number.NEGATIVE_INFINITY;
      for (let candidateIndex = 0; candidateIndex < this.candidatePositions.length; candidateIndex += 1) {
        const candidateScore = score(candidateIndex, respectHistory, minimumSpacing);
        if (candidateScore > bestScore) {
          bestScore = candidateScore;
          bestIndex = candidateIndex;
        }
      }
      return bestIndex;
    };

    let result = findBest(true, 0.16);
    if (result === null) result = findBest(true, 0.08);
    if (result === null) {
      this.relaxHistory();
      result = findBest(false, 0.08);
    }
    return result;
  }

  private activate(slot: HumanOrbSlot, candidateIndex: number, now: number, reducedMotion: boolean) {
    slot.candidateIndex = candidateIndex;
    slot.state = "emerging";
    slot.position.copy(this.candidatePositions[candidateIndex]);
    slot.phase = this.nextRandom() * Math.PI * 2;
    slot.stateStartedAt = now;
    slot.emergenceDuration = reducedMotion ? 0.34 : this.between(0.8, 1.6);
    slot.restAt = now + slot.emergenceDuration + this.between(3.8, 6.5);
    slot.retireAt = now + this.between(28, 52);
    slot.fadeDuration = this.between(0.8, 1.4);
    slot.arrivalRippleDuration = this.between(1.45, 1.9);
    slot.arrivalRippleProgress = reducedMotion ? 1 : 0;
    slot.coreOpacity = 0;
    slot.haloOpacity = 0;
    slot.scale = reducedMotion ? 1 : 0.65;
    slot.intensity = 1;
    this.remember(candidateIndex);
  }

  private release(slot: HumanOrbSlot) {
    slot.candidateIndex = -1;
    slot.state = "inactive";
    slot.position.copy(FAR_AWAY);
    slot.coreOpacity = 0;
    slot.haloOpacity = 0;
    slot.scale = 0.65;
    slot.intensity = 1;
    slot.arrivalRippleProgress = 1;
  }

  private remember(candidateIndex: number) {
    if (this.recentlySeen.has(candidateIndex)) return;
    this.recentlySeen.add(candidateIndex);
    this.recentlySeenOrder.push(candidateIndex);
    while (this.recentlySeenOrder.length > this.recentlySeenLimit) {
      const oldest = this.recentlySeenOrder.shift();
      if (oldest !== undefined) this.recentlySeen.delete(oldest);
    }
  }

  private relaxHistory() {
    const releaseCount = Math.max(1, Math.floor(this.recentlySeenOrder.length / 2));
    for (let index = 0; index < releaseCount; index += 1) {
      const oldest = this.recentlySeenOrder.shift();
      if (oldest !== undefined) this.recentlySeen.delete(oldest);
    }
  }

  private activeCount() {
    return this.slots.reduce((total, slot) => total + (slot.state === "inactive" ? 0 : 1), 0);
  }

  private between(minimum: number, maximum: number) {
    return THREE.MathUtils.lerp(minimum, maximum, this.nextRandom());
  }

  private nextRandom() {
    let value = this.randomState;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.randomState = value >>> 0;
    return this.randomState / 4294967296;
  }
}
