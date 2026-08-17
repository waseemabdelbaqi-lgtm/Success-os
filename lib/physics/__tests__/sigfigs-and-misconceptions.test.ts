import assert from "node:assert/strict";
import test from "node:test";
import { countSignificantFigures, roundToSignificantFigures, propagatedSignificantFigures, percentageUncertainty } from "../significant-figures.ts";
import { detectProjectileMisconception, getMisconception, PROJECTILE_MISCONCEPTIONS } from "../misconception-engine.ts";
import { verifyConceptLinksResolve, getConcept } from "../knowledge-graph.ts";
import { checkEfficiencyPlausibility } from "../validation-engine.ts";

test("significant figures: trailing zeros after a decimal point count", () => {
  assert.equal(countSignificantFigures("20.0"), 3);
});

test("significant figures: leading zeros never count", () => {
  assert.equal(countSignificantFigures("0.0042"), 2);
});

test("significant figures: trailing zero with no decimal point is ambiguous, so it is not counted (standard convention)", () => {
  assert.equal(countSignificantFigures("20"), 1);
});

test("significant figures: a trailing zero explicitly fixed with a decimal point IS counted", () => {
  assert.equal(countSignificantFigures("20."), 2);
});

test("significant figures: non-ambiguous integer without trailing zero", () => {
  assert.equal(countSignificantFigures("23"), 2);
});

test("significant figures: rounds correctly to 3 sig figs", () => {
  assert.equal(roundToSignificantFigures(17.3205, 3), 17.3);
});

test("significant figures: propagated result uses the LEAST precise input", () => {
  assert.equal(propagatedSignificantFigures([2, 4, 3]), 2);
});

test("uncertainty: percentage uncertainty computed correctly", () => {
  assert.ok(Math.abs(percentageUncertainty(20, 0.5) - 2.5) < 1e-9);
});

test("uncertainty: zero measurement throws instead of returning Infinity silently", () => {
  assert.throws(() => percentageUncertainty(0, 0.5), /zero measurement/);
});

test("plausibility: efficiency above 100% is rejected", () => {
  const result = checkEfficiencyPlausibility(1.2, "Test engine");
  assert.equal(result.valid, false);
});

test("plausibility: efficiency of exactly 100% is accepted", () => {
  assert.equal(checkEfficiencyPlausibility(1.0, "Test engine").valid, true);
});

test("misconception engine: detects 'acceleration is zero at peak'", () => {
  const m = detectProjectileMisconception({ studentClaimedAccelerationZeroAtPeak: true });
  assert.ok(m);
  assert.equal(m!.id, "acceleration-zero-at-peak");
});

test("misconception engine: detects 'total velocity zero at peak'", () => {
  const m = detectProjectileMisconception({ studentClaimedTotalVelocityZeroAtPeak: true });
  assert.equal(m!.id, "total-velocity-zero-at-peak");
});

test("misconception engine: detects 'horizontal velocity decreases'", () => {
  const m = detectProjectileMisconception({ studentClaimedHorizontalVelocityDecreases: true });
  assert.equal(m!.id, "horizontal-velocity-decreases-during-fall");
});

test("misconception engine: returns null when no known pattern matches", () => {
  const m = detectProjectileMisconception({});
  assert.equal(m, null);
});

test("misconception engine: unknown id throws instead of returning undefined", () => {
  assert.throws(() => getMisconception("not-a-real-id"), /unknown misconception id/);
});

test("misconception engine: every catalog entry has a non-empty recovery hint", () => {
  for (const m of Object.values(PROJECTILE_MISCONCEPTIONS)) {
    assert.ok(m.recoveryHint && m.recoveryHint.length > 0, `${m.id} is missing a recovery hint`);
  }
});

test("knowledge graph: projectile-motion concept links all resolve to real registered objects", () => {
  assert.ok(verifyConceptLinksResolve("projectile-motion"));
});

test("knowledge graph: unknown concept id throws", () => {
  assert.throws(() => getConcept("not-a-real-concept"), /unknown concept id/);
});
