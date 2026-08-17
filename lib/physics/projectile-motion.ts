/**
 * projectile-motion.ts
 *
 * The verified Phase 1 reference domain model. Everything here is built on
 * top of the scientific core (vector-engine, constants-registry,
 * equation-registry/solver, validation-engine) — no separate hardcoded
 * math is allowed to exist alongside it in the UI layer.
 *
 * Handles the GENERAL case (including a nonzero launch height y0), which
 * the closed-form "level launch" equations in equation-registry.ts cannot
 * cover on their own: time of flight is found from the positive root of
 * the quadratic vertical-position equation, y0 + v0y·t − ½gt² = 0.
 */

import { CONSTANTS, assertKnownGravityValue } from "./constants-registry.ts";
import { type Vector2D, fromMagnitudeAngle, vector } from "./vector-engine.ts";
import { checkPlausibility } from "./validation-engine.ts";
import { buildGraph, type PhysicsGraphDescriptor } from "./graph-engine.ts";

export interface ProjectileParams {
  /** Launch speed, m/s. */
  speed: number;
  /** Launch angle above the horizontal, degrees. */
  angleDegrees: number;
  /** Initial height above the landing plane, m. Defaults to 0 (level launch). */
  initialHeight?: number;
  /** Gravitational acceleration magnitude, m/s^2. Must be a registered constant value. */
  gravity?: number;
}

export interface ProjectileState {
  t: number;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  speed: number;
}

export interface ProjectileSummary {
  v0x: number;
  v0y: number;
  timeOfFlight: number;
  maxHeightAboveLaunch: number;
  maxHeightAboveGround: number;
  timeAtMaxHeight: number;
  range: number;
}

function normalizeParams(params: ProjectileParams): Required<ProjectileParams> {
  const gravity = params.gravity ?? CONSTANTS.standardGravity.value;
  assertKnownGravityValue(gravity);

  if (params.speed < 0) {
    throw new Error("Projectile model error: launch speed cannot be negative.");
  }
  if (params.angleDegrees < 0 || params.angleDegrees > 90) {
    throw new Error("Projectile model error: launch angle must be between 0° and 90° above the horizontal for this model.");
  }
  const initialHeight = params.initialHeight ?? 0;
  if (initialHeight < 0) {
    throw new Error("Projectile model error: initial height above the landing plane cannot be negative.");
  }

  return { speed: params.speed, angleDegrees: params.angleDegrees, initialHeight, gravity };
}

/** Resolves the launch velocity into its horizontal/vertical components (m/s). */
export function launchVelocityComponents(params: ProjectileParams): Vector2D {
  const p = normalizeParams(params);
  return fromMagnitudeAngle(p.speed, (p.angleDegrees * Math.PI) / 180);
}

/**
 * The constant downward acceleration vector for the ideal model. Always
 * (0, -g) regardless of the trajectory — acceleration never changes
 * direction or magnitude, including at the peak.
 */
export function accelerationVector(params: ProjectileParams): Vector2D {
  const p = normalizeParams(params);
  return vector(0, -p.gravity);
}

/**
 * Position and velocity at time t (measured from launch). Ground/landing
 * plane is y = 0; the launch point sits at y = initialHeight.
 */
export function stateAtTime(params: ProjectileParams, t: number): ProjectileState {
  const p = normalizeParams(params);
  if (t < 0) throw new Error("Projectile model error: elapsed time cannot be negative.");

  const { x: v0x, y: v0y } = launchVelocityComponents(p);
  const x = v0x * t;
  const y = p.initialHeight + v0y * t - 0.5 * p.gravity * t * t;
  const vx = v0x;
  const vy = v0y - p.gravity * t;

  const position = vector(x, y);
  const velocity = vector(vx, vy);
  const acceleration = accelerationVector(p);
  const speed = Math.hypot(vx, vy);

  const heightCheck = checkPlausibility({ quantityName: "Vertical position", symbol: "y", siValue: y, dimension: { L: 1, M: 0, T: 0, I: 0, Theta: 0, N: 0, J: 0 } });
  if (!heightCheck.valid) {
    // Position itself has no sign restriction (it can go below y=0 after
    // landing in an unclamped model), so this is intentionally not thrown —
    // callers that care about "before landing" should compare against
    // timeOfFlight() themselves. Kept here as a documented non-check.
  }

  return { t, position, velocity, acceleration, speed };
}

/**
 * General time of flight: the positive root of
 * initialHeight + v0y·t − ½gt² = 0 (landing at y = 0). Falls back to the
 * closed form 2·v0y/g when initialHeight = 0.
 */
export function timeOfFlight(params: ProjectileParams): number {
  const p = normalizeParams(params);
  const { y: v0y } = launchVelocityComponents(p);

  if (p.initialHeight === 0) {
    if (v0y <= 0) {
      throw new Error("Projectile model error: with zero initial height and non-positive vertical velocity, the projectile never leaves the ground.");
    }
    return (2 * v0y) / p.gravity;
  }

  // Quadratic: -½g t² + v0y t + initialHeight = 0  →  a t² + b t + c = 0
  const a = -0.5 * p.gravity;
  const b = v0y;
  const c = p.initialHeight;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    throw new Error("Projectile model error: no real landing time exists for these parameters (negative discriminant).");
  }
  const sqrtDisc = Math.sqrt(discriminant);
  const root1 = (-b + sqrtDisc) / (2 * a);
  const root2 = (-b - sqrtDisc) / (2 * a);
  const positiveRoots = [root1, root2].filter((r) => r > 0);
  if (!positiveRoots.length) {
    throw new Error("Projectile model error: no positive landing time exists for these parameters.");
  }
  return Math.max(...positiveRoots);
}

export function timeAtMaxHeight(params: ProjectileParams): number {
  const p = normalizeParams(params);
  const { y: v0y } = launchVelocityComponents(p);
  return v0y / p.gravity;
}

export function maxHeightAboveLaunch(params: ProjectileParams): number {
  const p = normalizeParams(params);
  const { y: v0y } = launchVelocityComponents(p);
  return (v0y * v0y) / (2 * p.gravity);
}

export function summarize(params: ProjectileParams): ProjectileSummary {
  const p = normalizeParams(params);
  const { x: v0x, y: v0y } = launchVelocityComponents(p);
  const flightTime = timeOfFlight(p);
  const peakTime = timeAtMaxHeight(p);
  const heightAboveLaunch = maxHeightAboveLaunch(p);
  const range = v0x * flightTime;

  return {
    v0x,
    v0y,
    timeOfFlight: flightTime,
    maxHeightAboveLaunch: heightAboveLaunch,
    maxHeightAboveGround: p.initialHeight + heightAboveLaunch,
    timeAtMaxHeight: peakTime,
    range,
  };
}

export type TrajectorySample = ProjectileState;

/** Samples the trajectory at N evenly spaced times across the flight, inclusive of landing. */
export function sampleTrajectory(params: ProjectileParams, steps = 40): TrajectorySample[] {
  const p = normalizeParams(params);
  const flight = timeOfFlight(p);
  const samples: TrajectorySample[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (flight * i) / steps;
    samples.push(stateAtTime(p, t));
  }
  return samples;
}

/**
 * Builds the four standard kinematics graphs (x-t, y-t, vx-t, vy-t) from
 * ONE shared set of trajectory samples, so the graphs, the animation, and
 * the numeric summary can never disagree with each other.
 */
export function buildProjectileGraphs(params: ProjectileParams, steps = 40): {
  positionX: PhysicsGraphDescriptor;
  positionY: PhysicsGraphDescriptor;
  velocityX: PhysicsGraphDescriptor;
  velocityY: PhysicsGraphDescriptor;
} {
  const samples = sampleTrajectory(params, steps);

  const positionX = buildGraph({
    id: "projectile-x-t",
    title: "Horizontal position vs. time",
    xAxis: { variableName: "t", unit: "s", label: "Time" },
    yAxis: { variableName: "x", unit: "m", label: "Horizontal position" },
    data: samples.map((s) => ({ x: s.t, y: s.position.x })),
    slopeMeaning: "velocity",
    areaMeaning: "none",
    dataSource: "projectile-motion.sampleTrajectory",
  });

  const positionY = buildGraph({
    id: "projectile-y-t",
    title: "Vertical position vs. time",
    xAxis: { variableName: "t", unit: "s", label: "Time" },
    yAxis: { variableName: "y", unit: "m", label: "Vertical position" },
    data: samples.map((s) => ({ x: s.t, y: s.position.y })),
    slopeMeaning: "velocity",
    areaMeaning: "none",
    dataSource: "projectile-motion.sampleTrajectory",
  });

  const velocityX = buildGraph({
    id: "projectile-vx-t",
    title: "Horizontal velocity vs. time",
    xAxis: { variableName: "t", unit: "s", label: "Time" },
    yAxis: { variableName: "vx", unit: "m/s", label: "Horizontal velocity" },
    data: samples.map((s) => ({ x: s.t, y: s.velocity.x })),
    slopeMeaning: "acceleration",
    areaMeaning: "displacement",
    dataSource: "projectile-motion.sampleTrajectory",
  });

  const velocityY = buildGraph({
    id: "projectile-vy-t",
    title: "Vertical velocity vs. time",
    xAxis: { variableName: "t", unit: "s", label: "Time" },
    yAxis: { variableName: "vy", unit: "m/s", label: "Vertical velocity" },
    data: samples.map((s) => ({ x: s.t, y: s.velocity.y })),
    slopeMeaning: "acceleration",
    areaMeaning: "displacement",
    dataSource: "projectile-motion.sampleTrajectory",
  });

  return { positionX, positionY, velocityX, velocityY };
}
