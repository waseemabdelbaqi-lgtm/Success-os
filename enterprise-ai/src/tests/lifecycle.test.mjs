#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  CanonicalStatus,
  ProviderLifecycle,
  colorForLifecycle,
  deriveLifecycleStage,
  hasProductionCertificationEvidence,
  hasReadyEvidence,
  lifecycleProgress,
} from "../providers/status-model.js";
import { normalizeProviderRecord } from "../providers/health-store.js";

// Ladder order — no skipping
const slot = deriveLifecycleStage({ status: CanonicalStatus.SLOT });
assert.equal(slot, ProviderLifecycle.SLOT);

const configured = deriveLifecycleStage({
  status: CanonicalStatus.CREDENTIALS_DETECTED,
  credentialsDetected: true,
});
assert.equal(configured, ProviderLifecycle.CONFIGURED);
assert.equal(colorForLifecycle(configured), "yellow");

const live = deriveLifecycleStage({
  status: CanonicalStatus.READY,
  credentialsDetected: true,
  authenticated: true,
  liveProbeExecuted: true,
  liveProbe: "PASSED",
  result: "success",
  testedAt: "2026-07-30T00:00:00.000Z",
  latencyMs: 100,
  errorCode: "none",
});
// Without full ready evidence path through hasReadyEvidence — status READY + evidence → READY
assert.equal(live, ProviderLifecycle.READY);
assert.equal(colorForLifecycle(live), "green");

// Cannot certify from CONFIGURED alone
assert.equal(
  hasProductionCertificationEvidence({
    providerId: "openai",
    status: CanonicalStatus.CREDENTIALS_DETECTED,
    credentialsDetected: true,
    consecutiveSuccesses: 99,
  }),
  false,
);

const readyRec = normalizeProviderRecord({
  providerId: "ollama",
  status: CanonicalStatus.READY,
  authenticated: true,
  liveProbeExecuted: true,
  liveProbe: "PASSED",
  result: "success",
  testedAt: "2026-07-30T00:00:00.000Z",
  latencyMs: 990,
  model: "qwen3:8b",
  errorCode: "none",
  safeErrorMessage: "none",
  credentialsDetected: true,
});
assert.equal(readyRec.lifecycleStage, ProviderLifecycle.READY);
assert.equal(readyRec.displayColor, "green");
assert.equal(readyRec.productionCertified, false);

// Streak → PRODUCTION CERTIFIED
let rec = readyRec;
for (let i = 0; i < 3; i += 1) {
  rec = normalizeProviderRecord(
    {
      providerId: "ollama",
      status: CanonicalStatus.READY,
      authenticated: true,
      liveProbeExecuted: true,
      liveProbe: "PASSED",
      result: "success",
      testedAt: `2026-07-30T00:0${i}:00.000Z`,
      latencyMs: 900 + i,
      model: "qwen3:8b",
      errorCode: "none",
      safeErrorMessage: "none",
      credentialsDetected: true,
    },
    rec,
  );
}
assert.ok(rec.consecutiveSuccesses >= 3);
assert.equal(rec.lifecycleStage, ProviderLifecycle.PRODUCTION_CERTIFIED);
assert.equal(rec.status, CanonicalStatus.PRODUCTION_CERTIFIED);
assert.equal(rec.productionCertified, true);
assert.equal(rec.displayColor, "green");
assert.ok(rec.lifecycleProgress.some((s) => s.stage === "PRODUCTION_CERTIFIED" && s.current));

// Media cannot certify without generationVerified
const media = normalizeProviderRecord({
  providerId: "heygen",
  status: CanonicalStatus.READY,
  authenticated: true,
  liveProbeExecuted: true,
  liveProbe: "PASSED",
  result: "success",
  testedAt: "2026-07-30T00:00:00.000Z",
  latencyMs: 100,
  errorCode: "none",
  credentialsDetected: true,
  consecutiveSuccesses: 10,
  generationVerified: false,
});
assert.notEqual(media.lifecycleStage, ProviderLifecycle.PRODUCTION_CERTIFIED);

const progress = lifecycleProgress(ProviderLifecycle.LIVE_VERIFIED);
assert.equal(progress.filter((p) => p.reached).length, 3);
assert.ok(hasReadyEvidence({
  status: CanonicalStatus.READY,
  authenticated: true,
  liveProbeExecuted: true,
  result: "success",
  testedAt: "2026-07-30T00:00:00.000Z",
  latencyMs: 10,
  errorCode: null,
}));

console.log("lifecycle.test.mjs: OK");
