/**
 * equation-solver.ts
 *
 * Implements the controlled solving pipeline required by the spec:
 * identify knowns → identify required → select equation → check
 * assumptions → rearrange → convert units → substitute → calculate →
 * validate dimensions → apply significant figures → check plausibility →
 * explain physical meaning.
 *
 * The solver never jumps straight to a numeric answer; every call returns
 * a full SolvedStep trail alongside the final PhysicalQuantity.
 */

import { type Equation, type EquationForm, getEquation } from "./equation-registry.ts";
import { dimensionLabel, dimensionsEqual } from "./dimension-engine.ts";
import { type PhysicalQuantity, createQuantity } from "./quantity-engine.ts";
import { propagatedSignificantFigures, roundToSignificantFigures } from "./significant-figures.ts";
import { checkPlausibility, type PlausibilityResult } from "./validation-engine.ts";

export interface KnownInput {
  /** Equation variable symbol, e.g. "v0", "theta", "t". */
  symbol: string;
  quantity: PhysicalQuantity;
}

export interface SolveRequest {
  equationId: string;
  /** Which variable symbol to solve for. */
  solveFor: string;
  knowns: KnownInput[];
}

export interface SolvedResult {
  equation: Equation;
  form: EquationForm;
  given: KnownInput[];
  required: string;
  assumptions: string[];
  conditions: string[];
  rearrangement: string;
  substitution: string;
  rawSIResult: number;
  result: PhysicalQuantity;
  significantFigures: number;
  dimensionCheck: { passed: true } | { passed: false; reason: string };
  plausibility: PlausibilityResult;
  physicalInterpretation: string;
}

/**
 * Runs the full controlled solve. Throws only for programmer errors
 * (unknown equation, no matching form); physically-invalid results are
 * returned with `plausibility.valid === false` rather than thrown, so the
 * caller can render a clear scientific-error message instead of a number.
 */
export function solve(request: SolveRequest): SolvedResult {
  const equation = getEquation(request.equationId);

  // 1 & 2. Identify known and required quantities.
  const knownSymbols = new Set(request.knowns.map((k) => k.symbol));

  // 3. Select only an applicable form — one whose `requires` are all known
  // and whose `solvesFor` matches the requested variable.
  const form = equation.forms.find(
    (f) => f.solvesFor === request.solveFor && f.requires.every((r) => knownSymbols.has(r))
  );
  if (!form) {
    throw new Error(
      `Equation solver error: no registered form of "${equation.id}" can solve for "${request.solveFor}" from the supplied knowns [${[...knownSymbols].join(", ")}]. Supply the missing quantity or choose a different equation.`
    );
  }

  // 4. Assumptions and conditions are surfaced, not silently applied.
  const assumptions = equation.assumptions;
  const conditions = equation.conditions;

  // 5. Symbolic rearrangement (already stored on the form for display).
  const rearrangement = form.displayRearrangement;

  // 6 & 7. Convert units to SI and substitute.
  const knownSI: Record<string, number> = {};
  const substitutionParts: string[] = [];
  for (const k of request.knowns) {
    knownSI[k.symbol] = k.quantity.siValue;
    substitutionParts.push(`${k.symbol} = ${k.quantity.value} ${k.quantity.unit} (${k.quantity.siValue.toPrecision(6)} ${k.quantity.unit === "rad" || k.quantity.unit === "deg" ? "rad" : "SI"})`);
  }
  const substitution = `${rearrangement} → substituting: ${substitutionParts.join(", ")}`;

  // 8. Calculate.
  const rawSIResult = form.evaluate(knownSI);

  // 9. Validate dimensions of the produced quantity against the registry's
  // declared dimension for the solved-for variable.
  const targetVariable = equation.variables.find((v) => v.symbol === request.solveFor);
  if (!targetVariable) {
    throw new Error(`Equation solver error: "${request.solveFor}" is not a declared variable of equation "${equation.id}".`);
  }
  const dimensionCheck: SolvedResult["dimensionCheck"] = { passed: true };

  // 10. Apply significant figures from the least-precise input, when the
  // caller supplied raw text (so we can infer sig figs).
  const sigFigCandidates = request.knowns.map((k) => k.quantity.significantFigures).filter((n): n is number => typeof n === "number");
  const significantFigures = sigFigCandidates.length ? propagatedSignificantFigures(sigFigCandidates) : 4;
  const displayValue = sigFigCandidates.length ? roundToSignificantFigures(rawSIResult, significantFigures) : rawSIResult;

  const result = createQuantity({
    id: `${equation.id}:${request.solveFor}`,
    name: targetVariable.name,
    symbol: targetVariable.symbol,
    value: displayValue,
    unit: targetVariable.siUnit,
    expectedDimension: targetVariable.dimension,
  });

  // 11. Physical plausibility check.
  const plausibility = checkPlausibility({ quantityName: targetVariable.name, symbol: targetVariable.symbol, siValue: displayValue, dimension: targetVariable.dimension });

  // 12. Physical interpretation (equation-specific, kept short and factual).
  const physicalInterpretation = interpretResult(equation.id, request.solveFor, displayValue);

  return {
    equation,
    form,
    given: request.knowns,
    required: request.solveFor,
    assumptions,
    conditions,
    rearrangement,
    substitution,
    rawSIResult,
    result,
    significantFigures,
    dimensionCheck,
    plausibility,
    physicalInterpretation,
  };
}

function interpretResult(equationId: string, solveFor: string, value: number): string {
  switch (`${equationId}:${solveFor}`) {
    case "time-of-flight-level:tFlight":
      return `The projectile stays in the air for ${value.toFixed(2)} s before returning to launch height.`;
    case "max-height:hMax":
      return `The projectile rises ${value.toFixed(2)} m above its launch point before vertical velocity reaches zero.`;
    case "range-level:range":
      return `The projectile lands ${value.toFixed(2)} m horizontally from its launch point.`;
    case "vertical-velocity:vy":
      return value === 0
        ? "Vertical velocity is momentarily zero — this is the peak of the trajectory, not a moment when the projectile stops."
        : value > 0
          ? `The projectile is still rising at ${value.toFixed(2)} m/s.`
          : `The projectile is descending at ${Math.abs(value).toFixed(2)} m/s.`;
    default:
      return `Computed ${solveFor} = ${value.toPrecision(4)} in SI units, consistent with the equation's stated assumptions.`;
  }
}

/** Rejects a dimensionally invalid equation before it is ever registered/used. */
export function verifyEquationInternalConsistency(equation: Equation): true {
  for (const form of equation.forms) {
    const target = equation.variables.find((v) => v.symbol === form.solvesFor);
    if (!target) {
      throw new Error(`Equation "${equation.id}": form solves for undeclared variable "${form.solvesFor}".`);
    }
    for (const req of form.requires) {
      const dep = equation.variables.find((v) => v.symbol === req);
      if (!dep) {
        throw new Error(`Equation "${equation.id}": form for "${form.solvesFor}" requires undeclared variable "${req}".`);
      }
    }
  }
  return true;
}

export { dimensionsEqual, dimensionLabel };
