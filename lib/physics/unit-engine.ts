/**
 * unit-engine.ts
 *
 * A scientifically reliable unit system: every unit is tied to a dimension
 * (see dimension-engine.ts) and a linear conversion factor to its SI unit.
 * Conversions between incompatible dimensions are rejected with a clear
 * error rather than silently returning a wrong number.
 */

import { BASE_DIMENSIONS, DERIVED_DIMENSIONS, type Dimension, dimensionsEqual, dimensionLabel, DIMENSIONLESS } from "./dimension-engine.ts";

export interface UnitDefinition {
  symbol: string;
  name: string;
  dimension: Dimension;
  /** Multiply a value in this unit by this factor to get the SI value. */
  toSI: number;
  /** Optional additive offset applied AFTER scaling (only temperature needs this). */
  offsetToSI?: number;
}

const registry = new Map<string, UnitDefinition>();

function register(u: UnitDefinition) {
  if (registry.has(u.symbol)) {
    throw new Error(`Unit engine error: duplicate unit symbol "${u.symbol}" registered twice.`);
  }
  registry.set(u.symbol, u);
  return u;
}

// --- SI base units -------------------------------------------------------
register({ symbol: "m", name: "meter", dimension: BASE_DIMENSIONS.length, toSI: 1 });
register({ symbol: "kg", name: "kilogram", dimension: BASE_DIMENSIONS.mass, toSI: 1 });
register({ symbol: "s", name: "second", dimension: BASE_DIMENSIONS.time, toSI: 1 });
register({ symbol: "A", name: "ampere", dimension: BASE_DIMENSIONS.current, toSI: 1 });
register({ symbol: "K", name: "kelvin", dimension: BASE_DIMENSIONS.temperature, toSI: 1 });
register({ symbol: "mol", name: "mole", dimension: BASE_DIMENSIONS.amount, toSI: 1 });
register({ symbol: "cd", name: "candela", dimension: BASE_DIMENSIONS.luminousIntensity, toSI: 1 });
register({ symbol: "rad", name: "radian", dimension: DIMENSIONLESS, toSI: 1 });
register({ symbol: "deg", name: "degree", dimension: DIMENSIONLESS, toSI: Math.PI / 180 });

// --- Common length units --------------------------------------------------
register({ symbol: "km", name: "kilometer", dimension: BASE_DIMENSIONS.length, toSI: 1000 });
register({ symbol: "cm", name: "centimeter", dimension: BASE_DIMENSIONS.length, toSI: 0.01 });
register({ symbol: "mm", name: "millimeter", dimension: BASE_DIMENSIONS.length, toSI: 0.001 });

// --- Common mass units -----------------------------------------------------
register({ symbol: "g", name: "gram", dimension: BASE_DIMENSIONS.mass, toSI: 0.001 });

// --- Common time units ------------------------------------------------------
register({ symbol: "min", name: "minute", dimension: BASE_DIMENSIONS.time, toSI: 60 });
register({ symbol: "h", name: "hour", dimension: BASE_DIMENSIONS.time, toSI: 3600 });

// --- Derived units -----------------------------------------------------------
register({ symbol: "m/s", name: "meter per second", dimension: DERIVED_DIMENSIONS.velocity, toSI: 1 });
register({ symbol: "km/h", name: "kilometer per hour", dimension: DERIVED_DIMENSIONS.velocity, toSI: 1000 / 3600 });
register({ symbol: "m/s^2", name: "meter per second squared", dimension: DERIVED_DIMENSIONS.acceleration, toSI: 1 });
register({ symbol: "N", name: "newton", dimension: DERIVED_DIMENSIONS.force, toSI: 1 });
register({ symbol: "J", name: "joule", dimension: DERIVED_DIMENSIONS.energy, toSI: 1 });
register({ symbol: "W", name: "watt", dimension: DERIVED_DIMENSIONS.power, toSI: 1 });
register({ symbol: "Pa", name: "pascal", dimension: DERIVED_DIMENSIONS.pressure, toSI: 1 });
register({ symbol: "kg*m/s", name: "kilogram meter per second", dimension: DERIVED_DIMENSIONS.momentum, toSI: 1 });
register({ symbol: "C", name: "coulomb", dimension: DERIVED_DIMENSIONS.charge, toSI: 1 });
register({ symbol: "m^2", name: "square meter", dimension: DERIVED_DIMENSIONS.area, toSI: 1 });
register({ symbol: "m^3", name: "cubic meter", dimension: DERIVED_DIMENSIONS.volume, toSI: 1 });

// --- Temperature needs an offset, not just a scale ---------------------------
register({ symbol: "degC", name: "degree Celsius", dimension: BASE_DIMENSIONS.temperature, toSI: 1, offsetToSI: 273.15 });

export function getUnit(symbol: string): UnitDefinition {
  const u = registry.get(symbol);
  if (!u) {
    throw new Error(`Unit engine error: unknown unit "${symbol}". Register it in unit-engine.ts before use.`);
  }
  return u;
}

export function unitExists(symbol: string): boolean {
  return registry.has(symbol);
}

export interface ConversionResult {
  value: number;
  fromUnit: string;
  toUnit: string;
}

/**
 * Converts a value between two units. Throws a dimensional error if the
 * units are not compatible — this is the "reject incompatible conversions"
 * requirement from the unit engine spec (e.g. converting seconds to meters).
 */
export function convert(value: number, fromUnit: string, toUnit: string): ConversionResult {
  const from = getUnit(fromUnit);
  const to = getUnit(toUnit);
  if (!dimensionsEqual(from.dimension, to.dimension)) {
    throw new Error(
      `Unit conversion error: "${fromUnit}" [${dimensionLabel(from.dimension)}] and "${toUnit}" [${dimensionLabel(to.dimension)}] are not compatible dimensions.`
    );
  }
  const siValue = value * from.toSI + (from.offsetToSI ?? 0);
  const result = (siValue - (to.offsetToSI ?? 0)) / to.toSI;
  return { value: result, fromUnit, toUnit };
}

/** Converts a value in the given unit to its SI-coherent equivalent. */
export function toSIValue(value: number, unit: string): number {
  const u = getUnit(unit);
  return value * u.toSI + (u.offsetToSI ?? 0);
}

export function dimensionOf(unit: string): Dimension {
  return getUnit(unit).dimension;
}

/** True only if the unit's dimension matches the quantity's expected dimension. */
export function unitMatchesDimension(unit: string, expected: Dimension): boolean {
  return dimensionsEqual(dimensionOf(unit), expected);
}
