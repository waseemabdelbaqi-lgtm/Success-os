/**
 * misconception-engine.ts
 *
 * A verified catalog of common physics misconceptions, keyed by id, plus a
 * lightweight detector for the projectile-motion domain. The detector is
 * intentionally rule-based (not an AI guess) so it is deterministic and
 * testable; the AI tutor layer can add richer detection on top of this.
 */

export interface Misconception {
  id: string;
  concept: string;
  statement: string;
  whyItIsWrong: string;
  recoveryHint: string;
  relatedEquationIds: string[];
}

export const PROJECTILE_MISCONCEPTIONS: Record<string, Misconception> = {
  "horizontal-velocity-decreases-during-fall": {
    id: "horizontal-velocity-decreases-during-fall",
    concept: "Projectile motion",
    statement: "Horizontal velocity decreases because the projectile is falling.",
    whyItIsWrong: "With air resistance neglected there is no horizontal force, so horizontal velocity stays constant for the entire flight — falling only changes the vertical component.",
    recoveryHint: "Ask: is there any horizontal force acting on the projectile? If not, horizontal velocity cannot change.",
    relatedEquationIds: ["horizontal-position"],
  },
  "acceleration-zero-at-peak": {
    id: "acceleration-zero-at-peak",
    concept: "Projectile motion",
    statement: "Acceleration becomes zero at the highest point of the trajectory.",
    whyItIsWrong: "Gravity acts on the projectile throughout the entire flight, including at the peak. Only the vertical velocity is momentarily zero there — acceleration remains -g.",
    recoveryHint: "Ask: what force is still acting on the projectile at the top of its path? Gravity does not turn off.",
    relatedEquationIds: ["vertical-velocity", "vertical-position"],
  },
  "total-velocity-zero-at-peak": {
    id: "total-velocity-zero-at-peak",
    concept: "Projectile motion",
    statement: "The projectile's total velocity is zero at the highest point.",
    whyItIsWrong: "Only the vertical component vy is zero at the peak. The horizontal component vx is unchanged, so the total velocity there equals vx, not zero.",
    recoveryHint: "Ask: which component is zero at the top — the vertical or the horizontal? Then recompute the total velocity from both components.",
    relatedEquationIds: ["vertical-velocity", "horizontal-velocity-component"],
  },
  "using-total-speed-instead-of-component": {
    id: "using-total-speed-instead-of-component",
    concept: "Projectile motion",
    statement: "Using the full launch speed v0 in a horizontal or vertical equation instead of its resolved component.",
    whyItIsWrong: "v0 is the magnitude of the launch velocity; the horizontal and vertical directions each need their own component (v0 cos θ or v0 sin θ), not the full v0.",
    recoveryHint: "Ask: have you resolved v0 into its horizontal and vertical components using the launch angle before substituting into the equation?",
    relatedEquationIds: ["horizontal-velocity-component", "vertical-velocity-component"],
  },
  "using-different-times-for-each-direction": {
    id: "using-different-times-for-each-direction",
    concept: "Projectile motion",
    statement: "Using a different elapsed time for the horizontal calculation than for the vertical calculation.",
    whyItIsWrong: "Horizontal and vertical motion happen simultaneously and share exactly the same clock. The same value of t must be used in both equations.",
    recoveryHint: "Ask: did you find t from one direction and then reuse that exact same t in the other direction's equation?",
    relatedEquationIds: ["horizontal-position", "vertical-position"],
  },
  "ignoring-sign-convention": {
    id: "ignoring-sign-convention",
    concept: "Projectile motion",
    statement: "Mixing positive and negative signs inconsistently for height, velocity, or gravity.",
    whyItIsWrong: "Once 'up' is chosen as positive, gravitational acceleration must be entered as negative (or subtracted) consistently throughout the whole calculation.",
    recoveryHint: "Ask: which direction did you define as positive, and is g applied with the opposite sign throughout?",
    relatedEquationIds: ["vertical-position", "vertical-velocity"],
  },
  "mixing-incompatible-units": {
    id: "mixing-incompatible-units",
    concept: "Projectile motion",
    statement: "Substituting a value in km/h or cm directly into an equation that expects m/s or m.",
    whyItIsWrong: "Physics equations require consistent SI units; mixing unit systems produces a numerically wrong answer even though the equation itself is correct.",
    recoveryHint: "Ask: are every one of your given values already converted to SI units (m, s, m/s, m/s²) before you substitute?",
    relatedEquationIds: [],
  },
  "confusing-path-length-with-displacement": {
    id: "confusing-path-length-with-displacement",
    concept: "Projectile motion",
    statement: "Treating the curved path length as if it were the straight-line displacement.",
    whyItIsWrong: "Range and height equations give straight-line displacements along an axis, not the length of the curved trajectory the projectile actually travels.",
    recoveryHint: "Ask: is the question asking for the straight-line distance between two points, or the actual curved distance traveled?",
    relatedEquationIds: ["horizontal-position", "vertical-position"],
  },
};

export interface MisconceptionDetectionInput {
  studentUsedTotalSpeedAsComponent?: boolean;
  studentClaimedAccelerationZeroAtPeak?: boolean;
  studentClaimedTotalVelocityZeroAtPeak?: boolean;
  studentUsedDifferentTimes?: boolean;
  studentClaimedHorizontalVelocityDecreases?: boolean;
}

/**
 * Deterministic rule-based detector for the projectile-motion domain.
 * Returns the first matching misconception (there is usually one dominant
 * error per attempt); returns null when no known pattern is flagged.
 */
export function detectProjectileMisconception(input: MisconceptionDetectionInput): Misconception | null {
  if (input.studentClaimedHorizontalVelocityDecreases) return PROJECTILE_MISCONCEPTIONS["horizontal-velocity-decreases-during-fall"]!;
  if (input.studentClaimedAccelerationZeroAtPeak) return PROJECTILE_MISCONCEPTIONS["acceleration-zero-at-peak"]!;
  if (input.studentClaimedTotalVelocityZeroAtPeak) return PROJECTILE_MISCONCEPTIONS["total-velocity-zero-at-peak"]!;
  if (input.studentUsedTotalSpeedAsComponent) return PROJECTILE_MISCONCEPTIONS["using-total-speed-instead-of-component"]!;
  if (input.studentUsedDifferentTimes) return PROJECTILE_MISCONCEPTIONS["using-different-times-for-each-direction"]!;
  return null;
}

export function getMisconception(id: string): Misconception {
  const m = PROJECTILE_MISCONCEPTIONS[id];
  if (!m) throw new Error(`Misconception engine error: unknown misconception id "${id}".`);
  return m;
}
