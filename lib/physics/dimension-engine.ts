/**
 * dimension-engine.ts
 *
 * Represents every physical dimension as a vector over the seven SI base
 * dimensions: Length (L), Mass (M), Time (T), Electric Current (I),
 * Temperature (Θ), Amount of substance (N), Luminous intensity (J).
 *
 * This is the layer that lets the rest of the engine reject dimensionally
 * invalid equations, substitutions, and results before anything is ever
 * displayed to a student.
 */

export interface Dimension {
  L: number; // length
  M: number; // mass
  T: number; // time
  I: number; // electric current
  Theta: number; // thermodynamic temperature
  N: number; // amount of substance
  J: number; // luminous intensity
}

const ZERO: Dimension = { L: 0, M: 0, T: 0, I: 0, Theta: 0, N: 0, J: 0 };

export function dim(partial: Partial<Dimension>): Dimension {
  return { ...ZERO, ...partial };
}

export const DIMENSIONLESS = dim({});

export const BASE_DIMENSIONS = {
  length: dim({ L: 1 }),
  mass: dim({ M: 1 }),
  time: dim({ T: 1 }),
  current: dim({ I: 1 }),
  temperature: dim({ Theta: 1 }),
  amount: dim({ N: 1 }),
  luminousIntensity: dim({ J: 1 }),
} as const;

// Common derived dimensions used across the projectile-motion domain and
// beyond. Kept intentionally small for Phase 1; extend as new chapters are
// integrated with the engine.
export const DERIVED_DIMENSIONS = {
  area: multiplyDim(BASE_DIMENSIONS.length, BASE_DIMENSIONS.length),
  volume: multiplyDim(multiplyDim(BASE_DIMENSIONS.length, BASE_DIMENSIONS.length), BASE_DIMENSIONS.length),
  velocity: divideDim(BASE_DIMENSIONS.length, BASE_DIMENSIONS.time),
  acceleration: divideDim(divideDim(BASE_DIMENSIONS.length, BASE_DIMENSIONS.time), BASE_DIMENSIONS.time),
  force: undefined as unknown as Dimension, // assigned below (needs mass * acceleration)
  energy: undefined as unknown as Dimension,
  power: undefined as unknown as Dimension,
  pressure: undefined as unknown as Dimension,
  momentum: undefined as unknown as Dimension,
  charge: undefined as unknown as Dimension,
  angle: DIMENSIONLESS, // radians are dimensionless in SI
};

function assignDerived() {
  DERIVED_DIMENSIONS.force = multiplyDim(BASE_DIMENSIONS.mass, DERIVED_DIMENSIONS.acceleration);
  DERIVED_DIMENSIONS.energy = multiplyDim(DERIVED_DIMENSIONS.force, BASE_DIMENSIONS.length);
  DERIVED_DIMENSIONS.power = divideDim(DERIVED_DIMENSIONS.energy, BASE_DIMENSIONS.time);
  DERIVED_DIMENSIONS.pressure = divideDim(DERIVED_DIMENSIONS.force, DERIVED_DIMENSIONS.area);
  DERIVED_DIMENSIONS.momentum = multiplyDim(BASE_DIMENSIONS.mass, DERIVED_DIMENSIONS.velocity);
  DERIVED_DIMENSIONS.charge = multiplyDim(BASE_DIMENSIONS.current, BASE_DIMENSIONS.time);
}

export function multiplyDim(a: Dimension, b: Dimension): Dimension {
  return {
    L: a.L + b.L,
    M: a.M + b.M,
    T: a.T + b.T,
    I: a.I + b.I,
    Theta: a.Theta + b.Theta,
    N: a.N + b.N,
    J: a.J + b.J,
  };
}

export function divideDim(a: Dimension, b: Dimension): Dimension {
  return {
    L: a.L - b.L,
    M: a.M - b.M,
    T: a.T - b.T,
    I: a.I - b.I,
    Theta: a.Theta - b.Theta,
    N: a.N - b.N,
    J: a.J - b.J,
  };
}

export function powDim(a: Dimension, power: number): Dimension {
  return {
    L: a.L * power,
    M: a.M * power,
    T: a.T * power,
    I: a.I * power,
    Theta: a.Theta * power,
    N: a.N * power,
    J: a.J * power,
  };
}

export function dimensionsEqual(a: Dimension, b: Dimension): boolean {
  return a.L === b.L && a.M === b.M && a.T === b.T && a.I === b.I && a.Theta === b.Theta && a.N === b.N && a.J === b.J;
}

export function isDimensionless(a: Dimension): boolean {
  return dimensionsEqual(a, DIMENSIONLESS);
}

export function dimensionLabel(d: Dimension): string {
  const parts: string[] = [];
  const push = (symbol: string, power: number) => {
    if (power === 0) return;
    parts.push(power === 1 ? symbol : `${symbol}^${power}`);
  };
  push("L", d.L);
  push("M", d.M);
  push("T", d.T);
  push("I", d.I);
  push("Θ", d.Theta);
  push("N", d.N);
  push("J", d.J);
  return parts.length ? parts.join("·") : "dimensionless";
}

assignDerived();

/**
 * Trigonometric and other transcendental functions only accept a
 * dimensionless argument (an angle in radians is dimensionless in SI).
 * Call this before evaluating sin/cos/tan on any physics quantity.
 */
export function assertDimensionlessArgument(d: Dimension, functionName: string): void {
  if (!isDimensionless(d)) {
    throw new Error(
      `Dimensional error: ${functionName}() requires a dimensionless argument (e.g. an angle in radians), but received dimension [${dimensionLabel(d)}].`
    );
  }
}

/**
 * Validates that two dimensions are addable/comparable (same physical
 * quantity type). Throws a descriptive dimensional error otherwise —
 * this is the check that stops "distance + time" style mistakes.
 */
export function assertSameDimension(a: Dimension, b: Dimension, context: string): void {
  if (!dimensionsEqual(a, b)) {
    throw new Error(
      `Dimensional error in ${context}: cannot combine quantities with dimension [${dimensionLabel(a)}] and [${dimensionLabel(b)}]. Only quantities of the same physical dimension may be added, subtracted, or set equal.`
    );
  }
}
