/**
 * constants-registry.ts
 *
 * One verified source of physical constants. The lesson layer must import
 * gravity (or any other constant) from here — never hardcode a bare number
 * like `9.81` or `10` inside a component or the equation registry.
 */

import { DERIVED_DIMENSIONS, type Dimension } from "./dimension-engine.ts";

export interface PhysicsConstant {
  id: string;
  name: string;
  symbol: string;
  value: number;
  unit: string;
  dimension: Dimension;
  precisionNote: string;
  context: string;
  sourceVerification: "CODATA" | "textbook-approximation";
}

export const CONSTANTS = {
  standardGravity: {
    id: "standardGravity",
    name: "Standard gravitational acceleration",
    symbol: "g",
    value: 9.81,
    unit: "m/s^2",
    dimension: DERIVED_DIMENSIONS.acceleration,
    precisionNote: "CODATA standard value is 9.80665 m/s^2, rounded to 3 significant figures for classroom use.",
    context: "Near-Earth-surface free-fall acceleration.",
    sourceVerification: "CODATA",
  },
  textbookGravity: {
    id: "textbookGravity",
    name: "Textbook-approximated gravitational acceleration",
    symbol: "g",
    value: 10,
    unit: "m/s^2",
    dimension: DERIVED_DIMENSIONS.acceleration,
    precisionNote:
      "Rounded approximation used ONLY when a specific verified worked example explicitly states g = 10 m/s^2. Must never be silently mixed with g = 9.81 m/s^2 in the same calculation.",
    context: "Simplified textbook worked examples.",
    sourceVerification: "textbook-approximation",
  },
  speedOfLight: {
    id: "speedOfLight",
    name: "Speed of light in vacuum",
    symbol: "c",
    value: 299792458,
    unit: "m/s",
    dimension: DERIVED_DIMENSIONS.velocity,
    precisionNote: "Exact by SI definition.",
    context: "Electromagnetic radiation / relativity.",
    sourceVerification: "CODATA",
  },
  elementaryCharge: {
    id: "elementaryCharge",
    name: "Elementary charge",
    symbol: "e",
    value: 1.602176634e-19,
    unit: "C",
    dimension: DERIVED_DIMENSIONS.charge,
    precisionNote: "Exact by SI definition (2019 redefinition).",
    context: "Charge of a single proton.",
    sourceVerification: "CODATA",
  },
  planckConstant: {
    id: "planckConstant",
    name: "Planck constant",
    symbol: "h",
    value: 6.62607015e-34,
    unit: "J*s",
    dimension: { ...DERIVED_DIMENSIONS.energy, T: DERIVED_DIMENSIONS.energy.T + 1 },
    precisionNote: "Exact by SI definition (2019 redefinition).",
    context: "Quantum mechanics.",
    sourceVerification: "CODATA",
  },
  gravitationalConstant: {
    id: "gravitationalConstant",
    name: "Newtonian gravitational constant",
    symbol: "G",
    value: 6.6743e-11,
    unit: "m^3/(kg*s^2)",
    dimension: { L: 3, M: -1, T: -2, I: 0, Theta: 0, N: 0, J: 0 },
    precisionNote: "CODATA 2018 recommended value; known to relatively low precision (~2.2e-5 relative uncertainty).",
    context: "Universal gravitation between masses.",
    sourceVerification: "CODATA",
  },
  coulombConstant: {
    id: "coulombConstant",
    name: "Coulomb constant",
    symbol: "k",
    value: 8.9875517923e9,
    unit: "N*m^2/C^2",
    dimension: { L: 3, M: 1, T: -4, I: -2, Theta: 0, N: 0, J: 0 },
    precisionNote: "Derived from vacuum permittivity; treated as exact for classroom precision.",
    context: "Electrostatics (Coulomb's law).",
    sourceVerification: "CODATA",
  },
  vacuumPermittivity: {
    id: "vacuumPermittivity",
    name: "Vacuum electric permittivity",
    symbol: "ε₀",
    value: 8.8541878128e-12,
    unit: "F/m",
    dimension: { L: -3, M: -1, T: 4, I: 2, Theta: 0, N: 0, J: 0 },
    precisionNote: "CODATA 2018 recommended value.",
    context: "Electrostatics.",
    sourceVerification: "CODATA",
  },
  vacuumPermeability: {
    id: "vacuumPermeability",
    name: "Vacuum magnetic permeability",
    symbol: "μ₀",
    value: 1.25663706212e-6,
    unit: "N/A^2",
    dimension: { L: 1, M: 1, T: -2, I: -2, Theta: 0, N: 0, J: 0 },
    precisionNote: "CODATA 2018 recommended value.",
    context: "Magnetism.",
    sourceVerification: "CODATA",
  },
} satisfies Record<string, PhysicsConstant>;

export function getConstant(id: keyof typeof CONSTANTS): PhysicsConstant {
  const c = CONSTANTS[id];
  if (!c) throw new Error(`Constants registry error: unknown constant "${String(id)}".`);
  return c;
}

/**
 * Guards against the exact bug the spec calls out by name: mixing
 * g = 9.81 with g = 10 inside one calculation. Pass the gravity value a
 * calculation is about to use; it must match one registered constant
 * exactly, or this throws.
 */
export function assertKnownGravityValue(value: number): PhysicsConstant {
  const match = Object.values(CONSTANTS).find((c) => c.symbol === "g" && c.value === value);
  if (!match) {
    throw new Error(
      `Constants registry error: g = ${value} m/s^2 is not a registered gravity value. Use CONSTANTS.standardGravity (9.81) or CONSTANTS.textbookGravity (10), never an ad-hoc literal.`
    );
  }
  return match;
}
