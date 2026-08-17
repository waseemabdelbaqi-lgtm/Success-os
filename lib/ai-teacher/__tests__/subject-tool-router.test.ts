import assert from "node:assert/strict";
import test from "node:test";
import { registerSubjectTool, getSubjectTool, callSubjectTool, isSubjectRegistered, _clearRegistryForTests } from "../subject-tool-router.ts";
import { registerPhysicsSubjectTool } from "../physics-subject-tool.ts";
import { summarize } from "../../physics/index.ts";

test("unregistered subject is rejected with the standard NOT FOUND phrase", () => {
  _clearRegistryForTests();
  assert.equal(isSubjectRegistered("music"), false);
  assert.throws(() => getSubjectTool("music"), /NOT FOUND IN VERIFIED CONTENT/);
});

test("physics subject tool registers under \"physics\"", () => {
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
  assert.equal(isSubjectRegistered("physics"), true);
});

test("calling an unsupported action on a registered tool throws a clear error", () => {
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
  assert.throws(() => callSubjectTool("physics", "doesNotExist", {}), /does not support action/);
});

test("solveProjectile returns the SAME numbers as calling the Physics Engine directly (no duplicate calculation)", () => {
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
  const params = { speed: 20, angleDegrees: 30, gravity: 10 };
  const result = callSubjectTool("physics", "solveProjectile", params);
  const direct = summarize(params);
  const routed = (result.data as { summary: typeof direct }).summary;
  assert.deepEqual(routed, direct, "subject tool result must exactly match calling the Physics Engine directly");
});

test("solveProjectile evidence cites real registered equation ids, not invented ones", () => {
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
  const result = callSubjectTool("physics", "solveProjectile", { speed: 10, angleDegrees: 45, gravity: 10 });
  assert.ok(result.evidence.length > 0);
  assert.ok(result.evidence.includes("time-of-flight-level"));
});

test("checkMisconception routes straight to the Physics Engine's misconception detector", () => {
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
  const result = callSubjectTool("physics", "checkMisconception", { studentClaimedAccelerationZeroAtPeak: true });
  assert.equal((result.data as { id: string }).id, "acceleration-zero-at-peak");
  assert.deepEqual(result.evidence, ["acceleration-zero-at-peak"]);
});

test("checkMisconception returns null data and no evidence when no known pattern matches", () => {
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
  const result = callSubjectTool("physics", "checkMisconception", {});
  assert.equal(result.data, null);
  assert.deepEqual(result.evidence, []);
});

test("registerSubjectTool + getSubjectTool round-trip for an arbitrary test tool", () => {
  _clearRegistryForTests();
  registerSubjectTool({ subject: "mathematics", actions: ["add"], call: (action, params) => ({ action, data: (params.a as number) + (params.b as number), evidence: [] }) });
  const result = callSubjectTool("mathematics", "add", { a: 2, b: 3 });
  assert.equal(result.data, 5);
});

test("PhysicsAdapter: gravity model propagates through unchanged — 9.81 and 10 both produce internally consistent, distinct results", () => {
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
  const withStandardG = callSubjectTool("physics", "solveProjectile", { speed: 20, angleDegrees: 30, gravity: 9.81 });
  const withTextbookG = callSubjectTool("physics", "solveProjectile", { speed: 20, angleDegrees: 30, gravity: 10 });
  const a = (withStandardG.data as { summary: { range: number } }).summary.range;
  const b = (withTextbookG.data as { summary: { range: number } }).summary.range;
  assert.notEqual(a, b, "different gravity values must propagate to a different verified result, not a cached/duplicated one");
});

test("PhysicsAdapter: invalid input (unregistered gravity value) is rejected, not silently miscalculated", () => {
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
  assert.throws(() => callSubjectTool("physics", "solveProjectile", { speed: 20, angleDegrees: 30, gravity: 9.8 }));
});

test("PhysicsAdapter: unavailable/unsupported operation returns a structured error rather than crashing the caller unexpectedly", () => {
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
  assert.throws(() => callSubjectTool("physics", "predictWeather", {}), /does not support action/);
});

test("Adapter is a pure bridge: it does not define its own gravity or equation constants", () => {
  // The adapter must always require gravity explicitly (or rely on the Physics Engine's own default) —
  // it should never silently substitute a value the Physics Engine itself doesn't recognize.
  _clearRegistryForTests();
  registerPhysicsSubjectTool();
  const result = callSubjectTool("physics", "solveProjectile", { speed: 15, angleDegrees: 20 }); // no gravity given -> engine default (9.81)
  const direct = summarize({ speed: 15, angleDegrees: 20 });
  assert.deepEqual((result.data as { summary: typeof direct }).summary, direct);
});
