import assert from "node:assert/strict";
import test from "node:test";
import { launchVelocityComponents, timeAtMaxHeight, maxHeightAboveLaunch, timeOfFlight, summarize } from "../projectile-motion.ts";
import { CONSTANTS } from "../constants-registry.ts";

const G10 = CONSTANTS.textbookGravity.value;

test("REFERENCE CASE A — v0=20 m/s, angle=30°, y0=0, g=10", () => {
  const params = { speed: 20, angleDegrees: 30, initialHeight: 0, gravity: G10 };
  const { x: v0x, y: v0y } = launchVelocityComponents(params);

  assert.ok(Math.abs(v0x - 17.32) < 0.01, `v0x expected ~17.32, got ${v0x}`);
  assert.ok(Math.abs(v0y - 10) < 1e-9, `v0y expected 10, got ${v0y}`);

  const tPeak = timeAtMaxHeight(params);
  assert.ok(Math.abs(tPeak - 1) < 1e-9, `time to max height expected 1, got ${tPeak}`);

  const hMax = maxHeightAboveLaunch(params);
  assert.ok(Math.abs(hMax - 5) < 1e-9, `max height expected 5, got ${hMax}`);

  const flight = timeOfFlight(params);
  assert.ok(Math.abs(flight - 2) < 1e-9, `time of flight expected 2, got ${flight}`);

  const summary = summarize(params);
  assert.ok(Math.abs(summary.range - 34.64) < 0.01, `range expected ~34.64, got ${summary.range}`);
});

test("REFERENCE CASE B — horizontal launch, y0=20 m, v0x=20 m/s, g=10", () => {
  const params = { speed: 20, angleDegrees: 0, initialHeight: 20, gravity: G10 };
  const flight = timeOfFlight(params);
  assert.ok(Math.abs(flight - 2) < 1e-9, `time of flight expected 2, got ${flight}`);

  const summary = summarize(params);
  assert.ok(Math.abs(summary.range - 40) < 1e-6, `range expected 40, got ${summary.range}`);
});

test("REFERENCE CASE C — v0=0, y0=20 m, g=10 (straight drop)", () => {
  const params = { speed: 0, angleDegrees: 45, initialHeight: 20, gravity: G10 };
  // angle is irrelevant when speed = 0, but the model requires a value in [0,90]
  const flight = timeOfFlight(params);
  assert.ok(Math.abs(flight - 2) < 1e-9, `time of fall expected 2, got ${flight}`);

  const summary = summarize(params);
  assert.ok(Math.abs(summary.range - 0) < 1e-9, `range expected 0, got ${summary.range}`);
});
