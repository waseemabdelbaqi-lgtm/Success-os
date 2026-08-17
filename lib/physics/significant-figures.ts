/**
 * significant-figures.ts
 *
 * Rounding and precision rules so the engine never reports false precision
 * (e.g. printing 8 digits from a two-sig-fig input).
 */

export function countSignificantFigures(rawInput: string): number {
  const trimmed = rawInput.trim();
  if (!trimmed) return 0;
  const scientific = trimmed.match(/^[-+]?(\d*\.?\d*)e[-+]?\d+$/i);
  const mantissa = scientific ? (scientific[1] ?? "") : trimmed.replace(/^[-+]/, "");
  // Accepts "20", "20.", "20.0", "0.0042" — but not garbage like "20.0.1".
  if (!/^\d*\.?\d*$/.test(mantissa) || mantissa === "" || mantissa === ".") return 0;

  if (mantissa.includes(".")) {
    // A decimal point makes even trailing zeros significant, and an
    // explicit trailing point ("20.") signals the trailing zero(s) before
    // it are significant too — this is the standard disambiguation
    // convention taught alongside "trailing zeros without a decimal are
    // ambiguous."
    const digits = mantissa.replace(".", "");
    const stripped = digits.replace(/^0+/, "");
    return stripped.length || (digits.length ? 1 : 0);
  }
  // No decimal point: trailing zeros are ambiguous and are NOT counted by
  // this convention (e.g. "20" -> 1 significant figure, "23" -> 2).
  const stripped = mantissa.replace(/^0+/, "").replace(/0+$/, "");
  return stripped.length || 1;
}

/** Rounds a value to a given number of significant figures. */
export function roundToSignificantFigures(value: number, sigFigs: number): number {
  if (value === 0 || sigFigs <= 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const factor = Math.pow(10, sigFigs - 1 - magnitude);
  return Math.round(value * factor) / factor;
}

/**
 * The smallest significant-figure count among a set of inputs governs the
 * significant figures of a multiplication/division result (the standard
 * classroom rule).
 */
export function propagatedSignificantFigures(inputSigFigs: number[]): number {
  if (!inputSigFigs.length) return 0;
  return Math.min(...inputSigFigs);
}

export interface Uncertainty {
  absolute: number;
  unit: string;
}

export function percentageUncertainty(value: number, absoluteUncertainty: number): number {
  if (value === 0) throw new Error("Uncertainty error: cannot compute percentage uncertainty of a zero measurement.");
  return (Math.abs(absoluteUncertainty) / Math.abs(value)) * 100;
}

export function absoluteFromPercentage(value: number, percent: number): number {
  return Math.abs(value) * (percent / 100);
}

/**
 * Simple propagation for a product/quotient of two measured quantities:
 * relative uncertainties add in quadrature is the rigorous rule, but the
 * classroom-level rule (sum of relative uncertainties) is used here since
 * that is what the source curriculum teaches at this level.
 */
export function propagateUncertaintyMultiplicative(
  a: { value: number; uncertainty: number },
  b: { value: number; uncertainty: number }
): { value: number; uncertainty: number; relativeUncertainty: number } {
  const value = a.value * b.value;
  const relA = percentageUncertainty(a.value, a.uncertainty) / 100;
  const relB = percentageUncertainty(b.value, b.uncertainty) / 100;
  const relativeUncertainty = relA + relB;
  return { value, uncertainty: Math.abs(value) * relativeUncertainty, relativeUncertainty: relativeUncertainty * 100 };
}

export function propagateUncertaintyAdditive(
  a: { value: number; uncertainty: number },
  b: { value: number; uncertainty: number },
  operation: "add" | "subtract"
): { value: number; uncertainty: number } {
  const value = operation === "add" ? a.value + b.value : a.value - b.value;
  return { value, uncertainty: a.uncertainty + b.uncertainty };
}
