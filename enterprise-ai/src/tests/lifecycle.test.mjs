#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CanonicalStatus,
  ProviderLifecycle,
  colorForLifecycle,
  deriveLifecycleStage,
  hasMissionCriticalEvidence,
  hasProductionCertificationEvidence,
  hasReadyEvidence,
  lifecycleProgress,
  normalizeLifecycleStage,
} from "../providers/status-model.js";
import { normalizeProviderRecord, saveHealthState } from "../providers/health-store.js";
import { certifyProviders, promoteMissionCritical } from "../providers/health-runner.js";

// Ladder order — no skipping
assert.equal(normalizeLifecycleStage("CONFIGURED"), ProviderLifecycle.CREDENTIALS_DETECTED);
assert.equal(normalizeLifecycleStage("LIVE_VERIFIED"), ProviderLifecycle.PROBE_RUNNING);

const slot = deriveLifecycleStage({ status: CanonicalStatus.SLOT, adapterAvailable: false });
assert.equal(slot, ProviderLifecycle.SLOT);

const notConfigured = deriveLifecycleStage({
  status: CanonicalStatus.NOT_CONFIGURED,
  adapterAvailable: true,
  credentialsDetected: false,
});
assert.equal(notConfigured, ProviderLifecycle.NOT_CONFIGURED);
assert.equal(colorForLifecycle(notConfigured), "grey");

const credentials = deriveLifecycleStage({
  status: CanonicalStatus.CREDENTIALS_DETECTED,
  credentialsDetected: true,
  adapterAvailable: true,
});
assert.equal(credentials, ProviderLifecycle.CREDENTIALS_DETECTED);
assert.equal(colorForLifecycle(credentials), "yellow");

const probing = deriveLifecycleStage({
  status: CanonicalStatus.PROBE_RUNNING,
  credentialsDetected: true,
  adapterAvailable: true,
  liveProbeExecuted: true,
  liveProbe: "RUNNING",
});
assert.equal(probing, ProviderLifecycle.PROBE_RUNNING);
assert.equal(colorForLifecycle(probing), "yellow");

const ready = deriveLifecycleStage({
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
assert.equal(ready, ProviderLifecycle.READY);
assert.equal(colorForLifecycle(ready), "green");

// Cannot certify from CREDENTIALS_DETECTED alone
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
assert.equal(readyRec.missionCritical, false);

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
assert.equal(hasMissionCriticalEvidence(media), false);

const progress = lifecycleProgress(ProviderLifecycle.PROBE_RUNNING);
assert.equal(progress.filter((p) => p.reached).length, 4);
assert.ok(
  hasReadyEvidence({
    status: CanonicalStatus.READY,
    authenticated: true,
    liveProbeExecuted: true,
    result: "success",
    testedAt: "2026-07-30T00:00:00.000Z",
    latencyMs: 10,
    errorCode: null,
  }),
);

// Explicit certify + mission-critical — no stage skipping
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aios-certify-"));
  const readyRow = normalizeProviderRecord({
    providerId: "playwright",
    status: CanonicalStatus.READY,
    authenticated: true,
    liveProbeExecuted: true,
    liveProbe: "PASSED",
    result: "success",
    testedAt: "2026-07-30T00:00:00.000Z",
    latencyMs: 120,
    model: "chromium",
    errorCode: "none",
    safeErrorMessage: "none",
    credentialsDetected: true,
    packageInstalled: true,
  });
  const configuredOnly = normalizeProviderRecord({
    providerId: "supabase",
    status: CanonicalStatus.CREDENTIALS_DETECTED,
    credentialsDetected: true,
    adapterAvailable: true,
  });
  saveHealthState(
    {
      checkedAt: new Date().toISOString(),
      mode: "test",
      providers: [readyRow, configuredOnly],
      factories: {},
      alerts: [],
      ready: ["playwright"],
      certified: [],
      missionCritical: [],
    },
    tmp,
  );

  const skipped = await certifyProviders({
    providerIds: ["supabase"],
    rootDir: tmp,
    persist: true,
  });
  assert.equal(skipped.ok, false);
  assert.equal(skipped.rejected[0]?.reason, "NOT_READY");

  const skipMc = await promoteMissionCritical({
    providerIds: ["playwright"],
    rootDir: tmp,
    persist: true,
  });
  assert.equal(skipMc.ok, false);
  assert.equal(skipMc.rejected[0]?.reason, "NOT_PRODUCTION_CERTIFIED");

  const ok = await certifyProviders({
    providerIds: ["playwright"],
    rootDir: tmp,
    persist: true,
  });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.certified, ["playwright"]);
  const certifiedRec = ok.providers.find((p) => p.providerId === "playwright");
  assert.equal(certifiedRec.lifecycleStage, ProviderLifecycle.PRODUCTION_CERTIFIED);
  assert.equal(certifiedRec.status, CanonicalStatus.PRODUCTION_CERTIFIED);
  assert.equal(certifiedRec.productionCertified, true);

  const mc = await promoteMissionCritical({
    providerIds: ["playwright"],
    rootDir: tmp,
    persist: true,
  });
  assert.equal(mc.ok, true);
  assert.deepEqual(mc.missionCritical, ["playwright"]);
  const mcRec = mc.providers.find((p) => p.providerId === "playwright");
  assert.equal(mcRec.lifecycleStage, ProviderLifecycle.MISSION_CRITICAL);
  assert.equal(mcRec.status, CanonicalStatus.MISSION_CRITICAL);
  assert.equal(mcRec.missionCritical, true);
  assert.equal(mcRec.productionCertified, true);
  assert.ok(mcRec.lifecycleProgress.some((s) => s.stage === "MISSION_CRITICAL" && s.current));
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("lifecycle.test.mjs: OK");
