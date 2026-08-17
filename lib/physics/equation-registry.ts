/**
 * equation-registry.ts
 *
 * A centralized, verified store of physics equations. Nothing in the UI or
 * lesson layer is allowed to hardcode an equation string and evaluate it
 * ad-hoc — every calculation must go through an EquationForm registered
 * here so its variables, units, dimensions, and assumptions stay attached
 * to the result.
 */

import { BASE_DIMENSIONS, type Dimension, DERIVED_DIMENSIONS, DIMENSIONLESS } from "./dimension-engine.ts";

export interface EquationVariable {
  symbol: string;
  name: string;
  dimension: Dimension;
  siUnit: string;
}

export interface EquationForm {
  /** The variable symbol this form solves for. */
  solvesFor: string;
  /** The variable symbols this form requires as inputs (SI values). */
  requires: string[];
  /** Evaluates the result in SI units given SI values of the required inputs. */
  evaluate: (known: Record<string, number>) => number;
  /** Human-readable rearranged form, for the step-by-step explanation. */
  displayRearrangement: string;
}

export interface Equation {
  id: string;
  name: string;
  displayForm: string;
  variables: EquationVariable[];
  forms: EquationForm[];
  assumptions: string[];
  conditions: string[];
  scalarOrVector: "scalar" | "vector";
  signConvention?: string;
  relatedLessonIds: string[];
  relatedMisconceptionIds: string[];
  knownMisuse: string[];
}

const registry = new Map<string, Equation>();

function register(equation: Equation): Equation {
  if (registry.has(equation.id)) {
    throw new Error(`Equation registry error: duplicate equation id "${equation.id}".`);
  }
  registry.set(equation.id, equation);
  return equation;
}

export function getEquation(id: string): Equation {
  const e = registry.get(id);
  if (!e) throw new Error(`Equation registry error: unknown equation id "${id}".`);
  return e;
}

export function listEquations(): Equation[] {
  return [...registry.values()];
}

// Shared variable definitions -------------------------------------------------
const v0: EquationVariable = { symbol: "v0", name: "Initial speed", dimension: DERIVED_DIMENSIONS.velocity, siUnit: "m/s" };
const theta: EquationVariable = { symbol: "theta", name: "Launch angle", dimension: DIMENSIONLESS, siUnit: "rad" };
const g: EquationVariable = { symbol: "g", name: "Gravitational acceleration", dimension: DERIVED_DIMENSIONS.acceleration, siUnit: "m/s^2" };
const t: EquationVariable = { symbol: "t", name: "Elapsed time", dimension: BASE_DIMENSIONS.time, siUnit: "s" };
const v0x: EquationVariable = { symbol: "v0x", name: "Horizontal velocity component", dimension: DERIVED_DIMENSIONS.velocity, siUnit: "m/s" };
const v0y: EquationVariable = { symbol: "v0y", name: "Initial vertical velocity component", dimension: DERIVED_DIMENSIONS.velocity, siUnit: "m/s" };
const y0: EquationVariable = { symbol: "y0", name: "Initial height", dimension: BASE_DIMENSIONS.length, siUnit: "m" };
const x: EquationVariable = { symbol: "x", name: "Horizontal position", dimension: BASE_DIMENSIONS.length, siUnit: "m" };
const y: EquationVariable = { symbol: "y", name: "Vertical position", dimension: BASE_DIMENSIONS.length, siUnit: "m" };
const vy: EquationVariable = { symbol: "vy", name: "Vertical velocity", dimension: DERIVED_DIMENSIONS.velocity, siUnit: "m/s" };
const tFlight: EquationVariable = { symbol: "tFlight", name: "Time of flight", dimension: BASE_DIMENSIONS.time, siUnit: "s" };
const hMax: EquationVariable = { symbol: "hMax", name: "Maximum height", dimension: BASE_DIMENSIONS.length, siUnit: "m" };
const range: EquationVariable = { symbol: "range", name: "Horizontal range", dimension: BASE_DIMENSIONS.length, siUnit: "m" };

// --- Velocity component resolution -------------------------------------------
export const HORIZONTAL_VELOCITY_COMPONENT = register({
  id: "horizontal-velocity-component",
  name: "Horizontal velocity component",
  displayForm: "v0x = v0 cos(theta)",
  variables: [v0x, v0, theta],
  forms: [
    // Non-null assertions below are safe: the equation-solver checks each
    // form's `requires` list against the supplied knowns before ever
    // calling evaluate(), so every required key is guaranteed present.
    { solvesFor: "v0x", requires: ["v0", "theta"], evaluate: (k) => k.v0! * Math.cos(k.theta!), displayRearrangement: "v0x = v0 · cos(θ)" },
  ],
  assumptions: ["Angle measured from the horizontal.", "No air resistance."],
  conditions: ["Valid for any launch angle 0° ≤ θ ≤ 90° measured from the horizontal."],
  scalarOrVector: "scalar",
  relatedLessonIds: ["motion-in-two-dimensions"],
  relatedMisconceptionIds: ["using-total-speed-instead-of-component"],
  knownMisuse: ["Using v0 directly as the horizontal component without multiplying by cos(θ)."],
});

export const VERTICAL_VELOCITY_COMPONENT = register({
  id: "vertical-velocity-component",
  name: "Initial vertical velocity component",
  displayForm: "v0y = v0 sin(theta)",
  variables: [v0y, v0, theta],
  forms: [
    { solvesFor: "v0y", requires: ["v0", "theta"], evaluate: (k) => k.v0! * Math.sin(k.theta!), displayRearrangement: "v0y = v0 · sin(θ)" },
  ],
  assumptions: ["Angle measured from the horizontal.", "No air resistance."],
  conditions: ["Valid for any launch angle 0° ≤ θ ≤ 90° measured from the horizontal."],
  scalarOrVector: "scalar",
  relatedLessonIds: ["motion-in-two-dimensions"],
  relatedMisconceptionIds: ["using-total-speed-instead-of-component"],
  knownMisuse: ["Using v0 directly as the vertical component without multiplying by sin(θ)."],
});

// --- Horizontal motion (uniform velocity) -------------------------------------
export const HORIZONTAL_POSITION = register({
  id: "horizontal-position",
  name: "Horizontal position (uniform motion)",
  displayForm: "x = x0 + v0x t",
  variables: [x, v0x, t],
  forms: [
    { solvesFor: "x", requires: ["v0x", "t"], evaluate: (k) => (k.x0 ?? 0) + k.v0x! * k.t!, displayRearrangement: "x = v0x · t" },
    { solvesFor: "v0x", requires: ["x", "t"], evaluate: (k) => (k.x! - (k.x0 ?? 0)) / k.t!, displayRearrangement: "v0x = x / t" },
    { solvesFor: "t", requires: ["x", "v0x"], evaluate: (k) => (k.x! - (k.x0 ?? 0)) / k.v0x!, displayRearrangement: "t = x / v0x" },
  ],
  assumptions: ["No horizontal acceleration (air resistance neglected).", "x0 defaults to 0 if not supplied."],
  conditions: ["Valid for the entire flight because horizontal velocity is constant in the ideal model."],
  scalarOrVector: "scalar",
  relatedLessonIds: ["motion-in-two-dimensions"],
  relatedMisconceptionIds: ["horizontal-velocity-decreases-during-fall"],
  knownMisuse: ["Applying a deceleration to horizontal velocity because the object is falling."],
});

// --- Vertical motion (constant acceleration) ----------------------------------
export const VERTICAL_POSITION = register({
  id: "vertical-position",
  name: "Vertical position under constant gravity",
  displayForm: "y = y0 + v0y t - (1/2) g t^2",
  variables: [y, y0, v0y, g, t],
  forms: [
    { solvesFor: "y", requires: ["v0y", "g", "t"], evaluate: (k) => (k.y0 ?? 0) + k.v0y! * k.t! - 0.5 * k.g! * k.t! * k.t!, displayRearrangement: "y = y0 + v0y·t − ½gt²" },
  ],
  assumptions: ["Constant gravitational field.", "Positive y is upward; g is entered as a positive magnitude and subtracted.", "No air resistance."],
  conditions: ["Valid while the projectile is in flight under ideal (drag-free) conditions."],
  scalarOrVector: "scalar",
  signConvention: "Up is positive; gravitational acceleration acts in the negative y direction.",
  relatedLessonIds: ["motion-in-two-dimensions"],
  relatedMisconceptionIds: ["acceleration-zero-at-peak"],
  knownMisuse: ["Using a horizontal-motion equation for the vertical direction.", "Forgetting the 1/2 factor.", "Mixing g = 9.81 and g = 10 within the same problem."],
});

export const VERTICAL_VELOCITY = register({
  id: "vertical-velocity",
  name: "Vertical velocity under constant gravity",
  displayForm: "vy = v0y - g t",
  variables: [vy, v0y, g, t],
  forms: [
    { solvesFor: "vy", requires: ["v0y", "g", "t"], evaluate: (k) => k.v0y! - k.g! * k.t!, displayRearrangement: "vy = v0y − g·t" },
    { solvesFor: "t", requires: ["v0y", "g", "vy"], evaluate: (k) => (k.v0y! - k.vy!) / k.g!, displayRearrangement: "t = (v0y − vy) / g" },
  ],
  assumptions: ["Constant gravitational field.", "Up is positive."],
  conditions: ["Valid while the projectile is in flight."],
  scalarOrVector: "scalar",
  signConvention: "Up is positive; gravitational acceleration acts in the negative y direction.",
  relatedLessonIds: ["motion-in-two-dimensions"],
  relatedMisconceptionIds: ["total-velocity-zero-at-peak", "acceleration-zero-at-peak"],
  knownMisuse: ["Assuming vy stays constant.", "Concluding total velocity is zero at the top (only vy is zero there)."],
});

// --- Level-launch, level-landing special cases (closed form) -------------------
export const TIME_OF_FLIGHT_LEVEL = register({
  id: "time-of-flight-level",
  name: "Time of flight (launch height equals landing height)",
  displayForm: "tFlight = 2 v0y / g",
  variables: [tFlight, v0y, g],
  forms: [
    { solvesFor: "tFlight", requires: ["v0y", "g"], evaluate: (k) => (2 * k.v0y!) / k.g!, displayRearrangement: "tFlight = 2·v0y / g" },
  ],
  assumptions: ["Launch height equals landing height (y0 = 0 relative to landing).", "Constant gravitational field.", "No air resistance."],
  conditions: ["Only valid when the projectile lands at the same height it was launched from. For a general y0 ≠ landing height, solve the quadratic vertical-position equation instead (see projectile-motion.ts)."],
  scalarOrVector: "scalar",
  relatedLessonIds: ["motion-in-two-dimensions"],
  relatedMisconceptionIds: [],
  knownMisuse: ["Applying this closed form when the launch point is elevated above the landing point (e.g. thrown horizontally from a building)."],
});

export const MAX_HEIGHT = register({
  id: "max-height",
  name: "Maximum height above launch point",
  displayForm: "hMax = v0y^2 / (2g)",
  variables: [hMax, v0y, g],
  forms: [
    { solvesFor: "hMax", requires: ["v0y", "g"], evaluate: (k) => (k.v0y! * k.v0y!) / (2 * k.g!), displayRearrangement: "hMax = v0y² / (2g)" },
  ],
  assumptions: ["Constant gravitational field.", "No air resistance.", "Result is measured above the launch point, not above the ground."],
  conditions: ["Valid whenever v0y ≥ 0."],
  scalarOrVector: "scalar",
  relatedLessonIds: ["motion-in-two-dimensions"],
  relatedMisconceptionIds: ["total-velocity-zero-at-peak"],
  knownMisuse: ["Reporting this value as the height above the ground when the launch point itself is elevated."],
});

export const RANGE_LEVEL = register({
  id: "range-level",
  name: "Horizontal range (launch height equals landing height)",
  displayForm: "range = v0x * tFlight",
  variables: [range, v0x, tFlight],
  forms: [
    { solvesFor: "range", requires: ["v0x", "tFlight"], evaluate: (k) => k.v0x! * k.tFlight!, displayRearrangement: "range = v0x · tFlight" },
  ],
  assumptions: ["Launch height equals landing height.", "No air resistance."],
  conditions: ["Only valid for level launch/landing; combine with the general time-of-flight solution otherwise."],
  scalarOrVector: "scalar",
  relatedLessonIds: ["motion-in-two-dimensions"],
  relatedMisconceptionIds: [],
  knownMisuse: ["Using this formula when launch and landing heights differ."],
});
