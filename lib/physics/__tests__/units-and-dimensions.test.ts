import assert from "node:assert/strict";
import test from "node:test";
import { convert, dimensionOf, unitMatchesDimension } from "../unit-engine.ts";
import { assertSameDimension, assertDimensionlessArgument, dim, DERIVED_DIMENSIONS, BASE_DIMENSIONS, dimensionsEqual } from "../dimension-engine.ts";
import { createQuantity } from "../quantity-engine.ts";

test("unit conversion: km/h to m/s", () => {
  const result = convert(36, "km/h", "m/s");
  assert.ok(Math.abs(result.value - 10) < 1e-9);
});

test("unit conversion: cm to m", () => {
  const result = convert(250, "cm", "m");
  assert.equal(result.value, 2.5);
});

test("unit conversion rejects incompatible dimensions (seconds to meters)", () => {
  assert.throws(() => convert(5, "s", "m"), /not compatible dimensions/);
});

test("dimensional analysis: force = mass * acceleration matches N", () => {
  assert.ok(dimensionsEqual(dimensionOf("N"), DERIVED_DIMENSIONS.force));
});

test("dimensional analysis: distance cannot be added to time", () => {
  assert.throws(() => assertSameDimension(BASE_DIMENSIONS.length, BASE_DIMENSIONS.time, "test addition"), /Dimensional error/);
});

test("dimensional analysis: velocity is not the same dimension as acceleration", () => {
  assert.throws(() => assertSameDimension(DERIVED_DIMENSIONS.velocity, DERIVED_DIMENSIONS.acceleration, "test"), /Dimensional error/);
});

test("energy expressed in newtons is dimensionally invalid", () => {
  assert.ok(!dimensionsEqual(DERIVED_DIMENSIONS.energy, DERIVED_DIMENSIONS.force));
});

test("trigonometric functions reject a non-dimensionless argument", () => {
  assert.throws(() => assertDimensionlessArgument(BASE_DIMENSIONS.length, "sin"), /requires a dimensionless argument/);
  assert.doesNotThrow(() => assertDimensionlessArgument(dim({}), "sin"));
});

test("quantity engine rejects a unit whose dimension does not match the quantity", () => {
  assert.throws(
    () =>
      createQuantity({
        id: "bad", name: "Bad quantity", symbol: "x", value: 5, unit: "s", expectedDimension: BASE_DIMENSIONS.length,
      }),
    /expects dimension/
  );
});

test("unitMatchesDimension is true for compatible unit, false otherwise", () => {
  assert.equal(unitMatchesDimension("m/s", DERIVED_DIMENSIONS.velocity), true);
  assert.equal(unitMatchesDimension("kg", DERIVED_DIMENSIONS.velocity), false);
});

test("unknown unit throws a clear error rather than silently succeeding", () => {
  assert.throws(() => convert(1, "furlong", "m"), /unknown unit/);
});
