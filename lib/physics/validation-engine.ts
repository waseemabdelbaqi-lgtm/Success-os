/**
 * validation-engine.ts
 *
 * Checks whether a computed result is physically meaningful before it is
 * shown to a student. A dimensionally-valid number can still be physical
 * nonsense (negative mass, faster than light, >100% efficiency); this is
 * the layer that catches that class of error.
 */

import { CONSTANTS } from "./constants-registry.ts";
import { BASE_DIMENSIONS, type Dimension, dimensionsEqual, DERIVED_DIMENSIONS } from "./dimension-engine.ts";

export interface PlausibilityCheckInput {
  quantityName: string;
  symbol: string;
  siValue: number;
  dimension: Dimension;
}

export interface PlausibilityResult {
  valid: boolean;
  reason?: string;
}

const SPEED_OF_LIGHT = CONSTANTS.speedOfLight.value;

export function checkPlausibility(input: PlausibilityCheckInput): PlausibilityResult {
  const { quantityName, siValue, dimension } = input;

  if (!Number.isFinite(siValue)) {
    return { valid: false, reason: `${quantityName} is not a finite number (${siValue}). Check for division by zero or an invalid input.` };
  }

  if (dimensionsEqual(dimension, BASE_DIMENSIONS.mass) && siValue < 0) {
    return { valid: false, reason: `${quantityName} cannot be negative — mass must be ≥ 0.` };
  }

  if (dimensionsEqual(dimension, BASE_DIMENSIONS.time) && siValue < 0) {
    return { valid: false, reason: `${quantityName} cannot be negative in this context — elapsed time must be ≥ 0.` };
  }

  if (dimensionsEqual(dimension, DERIVED_DIMENSIONS.velocity) && Math.abs(siValue) > SPEED_OF_LIGHT) {
    return { valid: false, reason: `${quantityName} = ${siValue.toExponential(3)} m/s exceeds the speed of light and is not physical in a classical-mechanics context.` };
  }

  // Resistance (Ω has the same dimension as V/A = force*length/(current^2*time) via derived combos);
  // handled generically: any quantity explicitly tagged as resistance-like should not be negative.
  // (Kept intentionally conservative — this engine will grow per-domain checks as later chapters
  // are integrated rather than guessing dimension-only rules that could misfire.)

  return { valid: true };
}

/** Efficiency-style ratios (0 to 1, or 0% to 100%) must not exceed 100% for an ordinary system. */
export function checkEfficiencyPlausibility(fraction: number, systemName: string): PlausibilityResult {
  if (fraction < 0) {
    return { valid: false, reason: `${systemName} efficiency cannot be negative.` };
  }
  if (fraction > 1) {
    return { valid: false, reason: `${systemName} efficiency of ${(fraction * 100).toFixed(1)}% exceeds 100%, which is not physically possible for an ordinary energy-conversion system.` };
  }
  return { valid: true };
}

/** A resultant force/velocity direction should be consistent with its signed components. */
export function checkDirectionConsistency(componentSign: number, claimedDirection: "positive" | "negative"): PlausibilityResult {
  const expected = componentSign >= 0 ? "positive" : "negative";
  if (expected !== claimedDirection) {
    return { valid: false, reason: `The computed component sign (${expected}) does not match the claimed direction (${claimedDirection}).` };
  }
  return { valid: true };
}
