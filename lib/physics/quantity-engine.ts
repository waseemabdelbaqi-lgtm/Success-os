/**
 * quantity-engine.ts
 *
 * No physics value flows through the app as a bare number. Every value is
 * wrapped as a PhysicalQuantity carrying its unit, dimension, and (for
 * vectors) direction, so downstream engines can validate and explain it.
 */

import { type Dimension, dimensionLabel, dimensionsEqual } from "./dimension-engine.ts";
import { dimensionOf, toSIValue, unitMatchesDimension } from "./unit-engine.ts";
import { countSignificantFigures } from "./significant-figures.ts";

export type QuantityKind = "scalar" | "vector";

export interface PhysicalQuantity {
  id: string;
  name: string;
  symbol: string;
  value: number;
  unit: string;
  siValue: number;
  dimension: Dimension;
  kind: QuantityKind;
  /** Direction in degrees, counter-clockwise from +x axis. Only for vectors. */
  directionDegrees?: number;
  signConvention?: string;
  uncertainty?: number;
  significantFigures?: number;
  context?: string;
  referencedEquationId?: string;
  referencedLessonId?: string;
}

export interface CreateQuantityInput {
  id: string;
  name: string;
  symbol: string;
  value: number;
  unit: string;
  expectedDimension: Dimension;
  kind?: QuantityKind;
  directionDegrees?: number;
  signConvention?: string;
  uncertainty?: number;
  /** Raw text as entered by the source/student, used to infer sig figs. */
  rawValueText?: string;
  context?: string;
  referencedEquationId?: string;
  referencedLessonId?: string;
}

/**
 * Builds a validated PhysicalQuantity. Throws immediately if the supplied
 * unit does not match the quantity's expected dimension — this is the
 * "detect incorrect units" requirement.
 */
export function createQuantity(input: CreateQuantityInput): PhysicalQuantity {
  if (!unitMatchesDimension(input.unit, input.expectedDimension)) {
    throw new Error(
      `Quantity error: "${input.name}" (${input.symbol}) expects dimension [${dimensionLabel(input.expectedDimension)}] but was given unit "${input.unit}" with dimension [${dimensionLabel(dimensionOf(input.unit))}].`
    );
  }
  return {
    id: input.id,
    name: input.name,
    symbol: input.symbol,
    value: input.value,
    unit: input.unit,
    siValue: toSIValue(input.value, input.unit),
    dimension: input.expectedDimension,
    kind: input.kind ?? "scalar",
    directionDegrees: input.directionDegrees,
    signConvention: input.signConvention,
    uncertainty: input.uncertainty,
    significantFigures: input.rawValueText ? countSignificantFigures(input.rawValueText) : undefined,
    context: input.context,
    referencedEquationId: input.referencedEquationId,
    referencedLessonId: input.referencedLessonId,
  };
}

export function sameDimension(a: PhysicalQuantity, b: PhysicalQuantity): boolean {
  return dimensionsEqual(a.dimension, b.dimension);
}

export function describeQuantity(q: PhysicalQuantity): string {
  const dir = q.kind === "vector" && q.directionDegrees !== undefined ? ` at ${q.directionDegrees.toFixed(1)}°` : "";
  return `${q.name} (${q.symbol}) = ${q.value} ${q.unit}${dir}`;
}

/** True if a numeric answer is missing its required (non-dimensionless) unit. */
export function isMissingRequiredUnit(dimension: Dimension, unit: string | undefined | null): boolean {
  const requiresUnit = !dimensionsEqual(dimension, { L: 0, M: 0, T: 0, I: 0, Theta: 0, N: 0, J: 0 });
  return requiresUnit && (!unit || unit.trim() === "");
}
