import assert from "node:assert/strict";
import test from "node:test";
import { evaluateFinalAcceptance } from "../quality-gate.ts";
import { buildRecoveryPlan } from "../recovery-engine.ts";

test("final acceptance rejects missing evidence without inventing scores", () => {
  const result = evaluateFinalAcceptance("sara", {});
  assert.equal(result.status, "REJECTED");
  assert.equal(result.failures.length, 5);
  assert.deepEqual(result.scores, {});
});

test("final acceptance rejects any score below 95 and a short showcase", () => {
  const common = { score: 99, evidenceUrl: "https://evidence.invalid/item", verifiedAt: "2026-08-17T00:00:00Z" };
  const result = evaluateFinalAcceptance("sara", {
    photorealism: { ...common, score: 94 }, lipsync: common, animation: common, teaching: common,
    showcase: { ...common, durationSeconds: 14 },
  });
  assert.equal(result.accepted, false);
  assert.ok(result.failures.some((x) => x.startsWith("photorealism:")));
  assert.ok(result.failures.some((x) => x.startsWith("showcase:")));
});

test("final acceptance passes only complete verified evidence", () => {
  const common = { score: 95, evidenceUrl: "https://evidence.invalid/item", verifiedAt: "2026-08-17T00:00:00Z" };
  const result = evaluateFinalAcceptance("ali", {
    photorealism: common, lipsync: common, animation: common, teaching: common,
    showcase: { ...common, durationSeconds: 15 },
  });
  assert.equal(result.status, "ACCEPTED");
});

test("recovery plan is sequential and blocks later work", () => {
  const decision = evaluateFinalAcceptance("sara", {});
  const plan = buildRecoveryPlan("sara", decision);
  assert.equal(plan.tasks[0]?.status, "pending");
  assert.ok(plan.tasks.slice(1).every((task) => task.status === "blocked"));
});

