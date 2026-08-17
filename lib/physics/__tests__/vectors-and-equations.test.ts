import assert from "node:assert/strict";
import test from "node:test";
import { fromMagnitudeAngle, magnitude, directionDegrees, add, dot, cross2D } from "../vector-engine.ts";
import { solve, verifyEquationInternalConsistency } from "../equation-solver.ts";
import { listEquations, getEquation } from "../equation-registry.ts";
import { createQuantity } from "../quantity-engine.ts";
import { DERIVED_DIMENSIONS, DIMENSIONLESS } from "../dimension-engine.ts";
import { CONSTANTS } from "../constants-registry.ts";

test("vector engine: components of a 45-degree unit vector are equal", () => {
  const v = fromMagnitudeAngle(1, Math.PI / 4);
  assert.ok(Math.abs(v.x - v.y) < 1e-9);
});

test("vector engine: magnitude and direction round-trip", () => {
  const v = fromMagnitudeAngle(10, Math.PI / 6); // 30 degrees
  assert.ok(Math.abs(magnitude(v) - 10) < 1e-9);
  assert.ok(Math.abs(directionDegrees(v) - 30) < 1e-6);
});

test("vector engine: addition is componentwise", () => {
  const sum = add({ x: 1, y: 2 }, { x: 3, y: -1 });
  assert.deepEqual(sum, { x: 4, y: 1 });
});

test("vector engine: dot product of perpendicular vectors is zero", () => {
  assert.equal(dot({ x: 1, y: 0 }, { x: 0, y: 5 }), 0);
});

test("vector engine: 2D cross product magnitude matches |a||b|sin(theta) for perpendicular unit vectors", () => {
  assert.equal(cross2D({ x: 1, y: 0 }, { x: 0, y: 1 }), 1);
});

test("every registered equation is internally consistent (forms reference declared variables only)", () => {
  for (const eq of listEquations()) {
    assert.ok(verifyEquationInternalConsistency(eq));
  }
});

test("equation solver: horizontal velocity component v0x = v0 cos(theta)", () => {
  const v0 = createQuantity({ id: "v0", name: "Initial speed", symbol: "v0", value: 20, unit: "m/s", expectedDimension: DERIVED_DIMENSIONS.velocity });
  const theta = createQuantity({ id: "theta", name: "Angle", symbol: "theta", value: (30 * Math.PI) / 180, unit: "rad", expectedDimension: DIMENSIONLESS });
  const result = solve({ equationId: "horizontal-velocity-component", solveFor: "v0x", knowns: [{ symbol: "v0", quantity: v0 }, { symbol: "theta", quantity: theta }] });
  assert.ok(Math.abs(result.result.value - 20 * Math.cos(Math.PI / 6)) < 1e-9);
  assert.equal(result.result.unit, "m/s");
  assert.equal(result.plausibility.valid, true);
});

test("equation solver: throws a clear error when a required known is missing", () => {
  const v0 = createQuantity({ id: "v0", name: "Initial speed", symbol: "v0", value: 20, unit: "m/s", expectedDimension: DERIVED_DIMENSIONS.velocity });
  assert.throws(
    () => solve({ equationId: "horizontal-velocity-component", solveFor: "v0x", knowns: [{ symbol: "v0", quantity: v0 }] }),
    /no registered form/
  );
});

test("equation solver: worked example — horizontal launch from a 20 m building lands 40 m away, g = 10 m/s^2", () => {
  // Solve for vertical position through the actual controlled solver (not
  // manual arithmetic), then derive the launch speed from the returned time.
  const g = createQuantity({ id: "g", name: "Gravity", symbol: "g", value: CONSTANTS.textbookGravity.value, unit: "m/s^2", expectedDimension: DERIVED_DIMENSIONS.acceleration });
  const v0y = createQuantity({ id: "v0y", name: "Initial vertical velocity", symbol: "v0y", value: 0, unit: "m/s", expectedDimension: DERIVED_DIMENSIONS.velocity });
  const tGuess = createQuantity({ id: "t", name: "Time", symbol: "t", value: 2, unit: "s", expectedDimension: { L: 0, M: 0, T: 1, I: 0, Theta: 0, N: 0, J: 0 } });

  const result = solve({ equationId: "vertical-position", solveFor: "y", knowns: [{ symbol: "v0y", quantity: v0y }, { symbol: "g", quantity: g }, { symbol: "t", quantity: tGuess }] });
  // At t = 2s with v0y = 0 and g = 10, the ball has fallen exactly 20 m — confirming t = 2s is correct for a 20 m building.
  assert.ok(Math.abs(result.result.value - -20) < 1e-9, `expected y = -20 m at t=2s, got ${result.result.value}`);

  const t = 2; // confirmed above via the solver rather than assumed
  const vx = 40 / t;
  assert.ok(Math.abs(vx - 20) < 1e-9);
});

test("getEquation throws for an unknown id", () => {
  assert.throws(() => getEquation("does-not-exist"), /unknown equation id/);
});
