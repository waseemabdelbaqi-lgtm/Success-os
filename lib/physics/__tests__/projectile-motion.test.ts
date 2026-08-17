import assert from "node:assert/strict";
import test from "node:test";
import {
  launchVelocityComponents,
  accelerationVector,
  stateAtTime,
  timeOfFlight,
  timeAtMaxHeight,
  summarize,
  sampleTrajectory,
  buildProjectileGraphs,
} from "../projectile-motion.ts";
import { createProjectileSimulation } from "../simulation-engine.ts";
import { CONSTANTS } from "../constants-registry.ts";

const G10 = CONSTANTS.textbookGravity.value; // 10 m/s^2, matches the source worked example

test("worked example: horizontal launch (angle 0) from 20 m building lands 40 m away -> v0 = 20 m/s", () => {
  // angle = 0 means the whole launch speed is horizontal (v0x = v0, v0y = 0)
  const t = timeOfFlight({ speed: 0, angleDegrees: 0, initialHeight: 20, gravity: G10 });
  assert.ok(Math.abs(t - 2) < 1e-9);
});

test("horizontal-launch range for the same building example equals 20 m/s given range = 40 m", () => {
  const params = { speed: 20, angleDegrees: 0, initialHeight: 20, gravity: G10 };
  const summary = summarize(params);
  assert.ok(Math.abs(summary.range - 40) < 1e-6, `expected range ~40, got ${summary.range}`);
  assert.ok(Math.abs(summary.timeOfFlight - 2) < 1e-9);
});

test("cliff example: 4 s horizontal flight from height h = 1/2 g t^2 = 80 m (g = 10)", () => {
  const params = { speed: 15, angleDegrees: 0, initialHeight: 80, gravity: G10 };
  const t = timeOfFlight(params);
  assert.ok(Math.abs(t - 4) < 1e-6, `expected 4s, got ${t}`);
});

test("30-degree launch at 20 m/s: time to peak = v0 sin(30)/g = 1.0 s (g = 10)", () => {
  const t = timeAtMaxHeight({ speed: 20, angleDegrees: 30, gravity: G10 });
  assert.ok(Math.abs(t - 1) < 1e-9, `expected 1.0s, got ${t}`);
});

test("at maximum height, vertical velocity is zero but horizontal velocity is unchanged (not total velocity zero)", () => {
  const params = { speed: 20, angleDegrees: 30, gravity: G10 };
  const peakTime = timeAtMaxHeight(params);
  const state = stateAtTime(params, peakTime);
  assert.ok(Math.abs(state.velocity.y) < 1e-9, "vertical velocity should be ~0 at peak");
  const { x: v0x } = launchVelocityComponents(params);
  assert.ok(Math.abs(state.velocity.x - v0x) < 1e-9, "horizontal velocity must be unchanged at peak");
  assert.ok(state.speed > 0, "total speed at peak must NOT be zero (misconception check)");
});

test("acceleration remains constant (0, -g) throughout flight, including at the peak (misconception check)", () => {
  const params = { speed: 20, angleDegrees: 30, gravity: G10 };
  const early = stateAtTime(params, 0.1);
  const peak = stateAtTime(params, timeAtMaxHeight(params));
  const late = stateAtTime(params, timeOfFlight(params) * 0.9);
  for (const s of [early, peak, late]) {
    assert.equal(s.acceleration.x, 0);
    assert.equal(s.acceleration.y, -G10);
  }
  assert.deepEqual(accelerationVector(params), { x: 0, y: -G10 });
});

test("horizontal velocity is constant across the entire flight (misconception check: it does not decrease while falling)", () => {
  const params = { speed: 25, angleDegrees: 40, initialHeight: 5, gravity: CONSTANTS.standardGravity.value };
  const samples = sampleTrajectory(params, 20);
  const vxValues = samples.map((s) => s.velocity.x);
  const first = vxValues[0];
  assert.ok(first !== undefined, "samples must not be empty");
  for (const v of vxValues) {
    assert.ok(Math.abs(v - first!) < 1e-9, "horizontal velocity must stay constant");
  }
});

test("edge case: zero launch angle (angle = 0) — purely horizontal launch, v0y = 0", () => {
  const { x, y } = launchVelocityComponents({ speed: 12, angleDegrees: 0 });
  assert.ok(Math.abs(x - 12) < 1e-9);
  assert.ok(Math.abs(y) < 1e-9);
});

test("edge case: vertical launch (angle = 90) — purely vertical, v0x = 0", () => {
  const { x, y } = launchVelocityComponents({ speed: 12, angleDegrees: 90 });
  assert.ok(Math.abs(x) < 1e-9);
  assert.ok(Math.abs(y - 12) < 1e-9);
});

test("edge case: nonzero initial height changes time of flight vs. level launch", () => {
  const level = timeOfFlight({ speed: 20, angleDegrees: 30, initialHeight: 0, gravity: G10 });
  const elevated = timeOfFlight({ speed: 20, angleDegrees: 30, initialHeight: 15, gravity: G10 });
  assert.ok(elevated > level, "launching from a height should keep the projectile aloft longer");
});

test("edge case: zero launch speed with zero height never leaves the ground", () => {
  assert.throws(() => timeOfFlight({ speed: 0, angleDegrees: 45, initialHeight: 0 }), /never leaves the ground/);
});

test("edge case: invalid negative mass is rejected by validation engine", async () => {
  const { checkPlausibility } = await import("../validation-engine.ts");
  const result = checkPlausibility({ quantityName: "Mass", symbol: "m", siValue: -2, dimension: { L: 0, M: 1, T: 0, I: 0, Theta: 0, N: 0, J: 0 } });
  assert.equal(result.valid, false);
});

test("edge case: invalid unit is rejected instead of silently accepted", async () => {
  const { convert } = await import("../unit-engine.ts");
  assert.throws(() => convert(5, "banana", "m"));
});

test("edge case: extreme but valid values do not throw (e.g. cannon-like speed)", () => {
  assert.doesNotThrow(() => summarize({ speed: 900, angleDegrees: 45, gravity: G10 }));
});

test("edge case: negative launch angle is rejected", () => {
  assert.throws(() => launchVelocityComponents({ speed: 10, angleDegrees: -5 }), /between 0° and 90°/);
});

test("edge case: negative launch speed is rejected", () => {
  assert.throws(() => launchVelocityComponents({ speed: -10, angleDegrees: 45 }), /cannot be negative/);
});

test("edge case: an unregistered gravity value (mixing g=9.81 and g=10 style bug) is rejected", () => {
  assert.throws(() => summarize({ speed: 10, angleDegrees: 45, gravity: 9.8 }), /not a registered gravity value/);
});

test("graphs: x-t, y-t, vx-t, vy-t are built from ONE shared trajectory sample set and agree with the summary", () => {
  const params = { speed: 20, angleDegrees: 35, gravity: G10 };
  const graphs = buildProjectileGraphs(params, 50);
  const summary = summarize(params);
  // Each GraphSeriesPoint is {x: time, y: plotted quantity} — chart x-axis is
  // always time here, so the physical value being checked is always .y.
  const lastPositionYPoint = graphs.positionY.data[graphs.positionY.data.length - 1];
  assert.ok(lastPositionYPoint, "positionY graph must have data points");
  const lastY = lastPositionYPoint!.y;
  assert.ok(Math.abs(lastY) < 1e-6, "trajectory must land back at y = 0");
  const lastPositionXPoint = graphs.positionX.data[graphs.positionX.data.length - 1];
  assert.ok(lastPositionXPoint, "positionX graph must have data points");
  const lastPhysicalX = lastPositionXPoint!.y;
  assert.ok(Math.abs(lastPhysicalX - summary.range) < 1e-6, "graph range must match summarize() range");
  assert.equal(graphs.positionY.slopeMeaning, "velocity");
  assert.equal(graphs.velocityY.slopeMeaning, "acceleration");
  assert.equal(graphs.velocityX.areaMeaning, "displacement");
});

test("graph engine rejects a graph missing axis labels/units", async () => {
  const { buildGraph } = await import("../graph-engine.ts");
  assert.throws(() =>
    buildGraph({
      id: "bad", title: "bad", xAxis: { variableName: "t", unit: "", label: "" }, yAxis: { variableName: "y", unit: "m", label: "Height" },
      data: [{ x: 0, y: 0 }, { x: 1, y: 1 }], slopeMeaning: "none", areaMeaning: "none", dataSource: "test",
    })
  );
});

test("simulation engine: reset returns to t = 0 and matches a fresh stateAtTime(0)", () => {
  const params = { speed: 20, angleDegrees: 30, gravity: G10 };
  const sim = createProjectileSimulation(params);
  sim.step(1);
  assert.ok(sim.getElapsedTime() > 0);
  sim.reset();
  assert.equal(sim.getElapsedTime(), 0);
  const fresh = stateAtTime(params, 0);
  assert.deepEqual(sim.getState().position, fresh.position);
});

test("simulation engine: changing a parameter updates all dependent outputs consistently (duration recalculated)", () => {
  const sim = createProjectileSimulation({ speed: 10, angleDegrees: 30, gravity: G10 });
  const originalDuration = sim.getDuration();
  sim.setParams({ speed: 40 });
  const newDuration = sim.getDuration();
  assert.notEqual(newDuration, originalDuration);
  assert.ok(Math.abs(newDuration - timeOfFlight({ speed: 40, angleDegrees: 30, gravity: G10 })) < 1e-9);
});

test("simulation engine: play/pause state toggles and stepping past duration marks isComplete", () => {
  const sim = createProjectileSimulation({ speed: 10, angleDegrees: 45, gravity: G10 });
  sim.play();
  assert.equal(sim.isPlaying(), true);
  const duration = sim.getDuration();
  const finalState = sim.step(duration + 5);
  assert.equal(finalState.isComplete, true);
  assert.equal(sim.isPlaying(), false, "simulation should auto-pause once flight completes");
});

test("edge case: missing required value in equation solver produces a clear error, not a silent NaN", async () => {
  const { solve } = await import("../equation-solver.ts");
  assert.throws(() => solve({ equationId: "max-height", solveFor: "hMax", knowns: [] }), /no registered form/);
});
